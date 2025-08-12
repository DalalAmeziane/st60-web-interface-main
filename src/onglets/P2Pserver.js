// P2Pserver.jsx
import React, { useEffect, useState, useRef } from 'react';
import ChartCard from '../components/ChartCard';
import { createLogElement } from "../components/Header";

/* Utils */
async function safeStopNotifications(char, handler) {
  try {
    if (!char) return;
    try { if (handler) char.removeEventListener('characteristicvaluechanged', handler); } catch {}
    const connected = !!char.service?.device?.gatt?.connected;
    if (connected && char.properties?.notify) {
      await char.stopNotifications().catch(() => {});
    }
  } catch {}
}

const GRAPH_MAX_LABELS = 50;
const STALE_MS_D = 1500;
const STALE_MS_L = 1500;

// Nouveau: santé des notifs
const HEALTH_CHECK_MS = 2000;  // période de vérif
const NOTIF_STUCK_MS  = 4000;  // si pas de notif depuis >4s => resubscribe
const RECONNECT_MS    = 10000; // si pas de notif depuis >10s => tentative reconnect

const P2Pserver = ({ allCharacteristics }) => {
  const [notifyChar, setNotifyChar] = useState(null);
  const [readWriteChar, setReadWriteChar] = useState(null);
  const [notifyOn, setNotifyOn] = useState(false);

  const [timeLabels, setTimeLabels] = useState([]);
  const [throughputValues, setThroughputValues] = useState([]);
  const [latencyValues, setLatencyValues] = useState([]);

  const lastThroughputRef = useRef(0.0);
  const lastLatencyRef   = useRef(null);

  const lastDtsRef = useRef(0);
  const lastLtsRef = useRef(0);

  const samplerRef = useRef(null);

  // état test
  const [phase, setPhase] = useState('idle');
  const [testRemaining, setTestRemaining] = useState(0);
  const phaseRef = useRef('idle');
  const testTimerRef = useRef(null);
  const startWatchdogRef = useRef(null);
  const safetyUnlockRef = useRef(null);

  // Nouveau: watchdog notifs
  const lastAnyNotifTsRef = useRef(0);
  const healthTimerRef = useRef(null);
  const deviceRef = useRef(null); // pour écouter 'gattserverdisconnected'

  const setPhaseSafe = (p) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => {
    const notify = allCharacteristics.find(
      (c) => c.characteristic.uuid.toLowerCase() === '0000fe42-8e22-4541-9d4c-21edae82ed19'
    );
    const rw = allCharacteristics.find(
      (c) => c.characteristic.uuid.toLowerCase() === '0000fe41-8e22-4541-9d4c-21edae82ed19'
    );

    setNotifyChar(notify ? notify.characteristic : null);
    setReadWriteChar(rw ? rw.characteristic : null);
    deviceRef.current = notify?.characteristic?.service?.device || null;

    // reset
    stopSampler();
    clearHealthTimer();
    setNotifyOn(false);
    finishTest();
    setTimeLabels([]);
    setThroughputValues([]);
    setLatencyValues([]);
    lastThroughputRef.current = 0.0;
    lastLatencyRef.current = null;
    lastDtsRef.current = 0;
    lastLtsRef.current = 0;
    lastAnyNotifTsRef.current = 0;

    // écoute déconnexion GATT (pour MAJ bouton)
    try {
      if (deviceRef.current) {
        deviceRef.current.addEventListener('gattserverdisconnected', onGattDisconnected);
      }
    } catch {}

    return () => {
      stopSampler();
      clearHealthTimer();
      safeStopNotifications(notify?.characteristic, notifHandler);
      cleanupTestTimers();
      finishTest();
      try {
        if (deviceRef.current) {
          deviceRef.current.removeEventListener('gattserverdisconnected', onGattDisconnected);
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCharacteristics]);

  const onGattDisconnected = () => {
    // remet l'UI en OFF, arrête timers
    setNotifyOn(false);
    clearHealthTimer();
    stopSampler();
    finishTest();
  };

  const nowHHMMSS = () =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const cleanupTestTimers = () => {
    if (testTimerRef.current) { clearInterval(testTimerRef.current); testTimerRef.current = null; }
    if (startWatchdogRef.current) { clearTimeout(startWatchdogRef.current); startWatchdogRef.current = null; }
    if (safetyUnlockRef.current) { clearTimeout(safetyUnlockRef.current); safetyUnlockRef.current = null; }
  };

  const finishTest = () => {
    cleanupTestTimers();
    setTestRemaining(0);
    setPhaseSafe('idle');
  };

  // BLE notifications
  const notifHandler = (event) => {
    const dv   = event.target.value;
    const type = String.fromCharCode(dv.getUint8(0));
    const val  = dv.getFloat32(1, true);

    const now = Date.now();
    lastAnyNotifTsRef.current = now;

    if (type === 'D' || type === 'd') {
      lastThroughputRef.current = parseFloat(val.toFixed(0));
      lastDtsRef.current = now;

      if (phaseRef.current === 'starting') {
        if (startWatchdogRef.current) { clearTimeout(startWatchdogRef.current); startWatchdogRef.current = null; }
        setPhaseSafe('running');
        setTestRemaining(10);
        if (testTimerRef.current) clearInterval(testTimerRef.current);
        testTimerRef.current = setInterval(() => {
          setTestRemaining((sec) => {
            if (sec <= 1) { finishTest(); return 0; }
            return sec - 1;
          });
        }, 1000);
      }
    } else if (type === 'L' || type === 'l') {
      lastLatencyRef.current = parseFloat(val.toFixed(2));
      lastLtsRef.current = now;
    }
  };

  // sampler 1 Hz
  const startSampler = () => {
    if (samplerRef.current) return;
    samplerRef.current = setInterval(() => {
      const label = nowHHMMSS();
      const now = Date.now();

      setTimeLabels(prev => {
        const next = [...prev, label];
        return next.length > GRAPH_MAX_LABELS ? next.slice(1) : next;
      });

      setThroughputValues(prev => {
        let v = lastThroughputRef.current;
        if (!lastDtsRef.current || (now - lastDtsRef.current) > STALE_MS_D) v = 0.0;
        const next = [...prev, v];
        return next.length > GRAPH_MAX_LABELS ? next.slice(1) : next;
      });

      setLatencyValues(prev => {
        let v = lastLatencyRef.current;
        if (!lastLtsRef.current || (now - lastLtsRef.current) > STALE_MS_L) v = 0.0;
        const next = [...prev, v];
        return next.length > GRAPH_MAX_LABELS ? next.slice(1) : next;
      });
    }, 1000);
  };

  const stopSampler = () => {
    if (samplerRef.current) {
      clearInterval(samplerRef.current);
      samplerRef.current = null;
    }
  };

  // ===== Watchdog notifs =====
  const clearHealthTimer = () => {
    if (healthTimerRef.current) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
  };

  const tryResubscribe = async () => {
    if (!notifyChar) return;
    try {
      // stop->start + re-bind
      await notifyChar.stopNotifications().catch(() => {});
      try { notifyChar.removeEventListener('characteristicvaluechanged', notifHandler); } catch {}
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', notifHandler);
      // petit log
      createLogElement(notifyChar, 3, "Auto re-subscribed to notifications");
    } catch (e) {
      console.warn("Resubscribe failed:", e);
    }
  };

  const tryReconnect = async () => {
    const dev = deviceRef.current;
    if (!dev) return;
    try {
      dev.gatt.disconnect();
      setNotifyOn(false);
      clearHealthTimer();
      stopSampler();
      finishTest();
      // L’utilisateur cliquera à nouveau sur "Notify ON"
      createLogElement(dev, 3, "BLE link restarted, please toggle Notify ON again");
    } catch (e) {
      console.warn("Reconnect failed:", e);
    }
  };

  const startHealthTimer = () => {
    if (healthTimerRef.current) return;
    lastAnyNotifTsRef.current = Date.now(); // reset
    healthTimerRef.current = setInterval(async () => {
      const now = Date.now();
      const delta = now - lastAnyNotifTsRef.current;
      const connected = !!notifyChar?.service?.device?.gatt?.connected;

      if (!connected) return; // le listener gattserverdisconnected gère l'UI

      if (delta > RECONNECT_MS) {
        await tryReconnect();
      } else if (delta > NOTIF_STUCK_MS) {
        await tryResubscribe();
      }
    }, HEALTH_CHECK_MS);
  };
  // ===========================

  // Toggle notifications
  const toggleNotifications = async () => {
    if (!notifyChar) return;
    try {
      if (!notifyOn) {
        await notifyChar.startNotifications();
        notifyChar.addEventListener('characteristicvaluechanged', notifHandler);
        setNotifyOn(true);

        lastThroughputRef.current = 0.0;
        lastLatencyRef.current = null;
        lastDtsRef.current = 0;
        lastLtsRef.current = 0;
        lastAnyNotifTsRef.current = Date.now();

        startSampler();
        startHealthTimer();

        createLogElement(notifyChar, 3, "P2Pserver ENABLE NOTIFICATION");
      } else {
        await safeStopNotifications(notifyChar, notifHandler);
        setNotifyOn(false);
        clearHealthTimer();
        stopSampler();
        finishTest();
        createLogElement(notifyChar, 3, "P2Pserver DISABLE NOTIFICATION");
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
      finishTest();
    }
  };

  // GO 10 s
  const onStartThroughputClick = async () => {
    if (!readWriteChar || phaseRef.current !== 'idle') return;
    try {
      const goWord = new Uint8Array([0x01, 0x01]);
      await readWriteChar.writeValue(goWord);
      createLogElement(goWord, 1, "P2Pserver GO command sent");

      cleanupTestTimers();
      setPhaseSafe('starting');
      setTestRemaining(0);
      lastThroughputRef.current = 0.0;
      lastDtsRef.current = 0;

      startWatchdogRef.current = setTimeout(() => {
        if (phaseRef.current === 'starting') finishTest();
      }, 5000);

      safetyUnlockRef.current = setTimeout(() => {
        if (phaseRef.current !== 'idle') finishTest();
      }, 15000);
    } catch (error) {
      console.log('Start throughput test error:', error);
      finishTest();
    }
  };

  const btnLabel =
    phase === 'starting' ? 'Starting throughput…' :
    phase === 'running'  ? `Measuring throughput... (${testRemaining}s)` :
                           'Measure throughput (10 s)';

  return (
    <div className="container mt-4">
      <h3 className="text-center">P2P Server BLE Visualizer</h3>

      <div className="d-flex gap-3 justify-content-center mb-4">
        <button className="defaultButton" onClick={toggleNotifications}>
          {notifyOn ? "Notify ON" : "Notify OFF"}
        </button>
        <button
          className="defaultButton"
          onClick={onStartThroughputClick}
          disabled={!notifyOn || phase !== 'idle'}
          aria-label="Start a 10-second throughput measurement"
          title="Start a 10-second throughput measurement"
        >
          {btnLabel}
        </button>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-12 mb-4 pb-5">
            <ChartCard title="Throughput (Mbps)" labels={timeLabels} values={throughputValues} />
          </div>
          <div className="col-12 mb-4 pb-5">
            <ChartCard title="Latency (ms)" labels={timeLabels} values={latencyValues} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2Pserver;
