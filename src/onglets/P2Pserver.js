import React, { useEffect, useState, useRef } from 'react';
import ChartCard from '../components/ChartCard';
import { createLogElement } from "../components/Header";

/* Stop notifications safely even if GATT is gone */
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

const P2Pserver = ({ allCharacteristics }) => {
  const [notifyChar, setNotifyChar] = useState(null);
  const [readWriteChar, setReadWriteChar] = useState(null);
  const [notifyOn, setNotifyOn] = useState(false);

  const [timeLabels, setTimeLabels] = useState([]);
  const [throughputValues, setThroughputValues] = useState([]);
  const [latencyValues, setLatencyValues] = useState([]);

  const lastThroughputRef = useRef(0.0);
  const lastLatencyRef   = useRef(null);

  const samplerRef = useRef(null);

  // test state
  const [testRemaining, setTestRemaining] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | starting | running
  const phaseRef = useRef('idle');            // to use inside timeouts
  const testTimerRef = useRef(null);
  const startWatchdogRef = useRef(null);
  const safetyUnlockRef = useRef(null);

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

    // reset screen
    stopSampler();
    setNotifyOn(false);
    finishTest();
    setTimeLabels([]);
    setThroughputValues([]);
    setLatencyValues([]);
    lastThroughputRef.current = 0.0;
    lastLatencyRef.current = null;

    return () => {
      stopSampler();
      safeStopNotifications(notify?.characteristic, notifHandler);
      cleanupTestTimers();
      finishTest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCharacteristics]);

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
    setPhaseSafe('idle'); // <- re-enable button
  };

  // BLE notifications
  const notifHandler = (event) => {
    const dv   = event.target.value;
    const type = String.fromCharCode(dv.getUint8(0));
    const val  = dv.getFloat32(1, true);

    if (type === 'D' || type === 'd') {
      lastThroughputRef.current = parseFloat(val.toFixed(0));

      // start countdown on first throughput
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
    }
  };

  // 1 Hz sampler for both charts
  const startSampler = () => {
    if (samplerRef.current) return;
    samplerRef.current = setInterval(() => {
      const label = nowHHMMSS();

      setTimeLabels(prev => {
        const next = [...prev, label];
        return next.length > GRAPH_MAX_LABELS ? next.slice(1) : next;
      });

      setThroughputValues(prev => {
        const v = lastThroughputRef.current;
        const next = [...prev, v];
        return next.length > GRAPH_MAX_LABELS ? next.slice(1) : next;
      });

      setLatencyValues(prev => {
        const v = (lastLatencyRef.current === null) ? null : lastLatencyRef.current;
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

  // Toggle notifications
  const toggleNotifications = async () => {
    if (!notifyChar) return;
    try {
      if (!notifyOn) {
        await notifyChar.startNotifications();
        notifyChar.addEventListener('characteristicvaluechanged', notifHandler);
        setNotifyOn(true);
        startSampler();
        createLogElement(notifyChar, 3, "P2Pserver ENABLE NOTIFICATION");
      } else {
        await safeStopNotifications(notifyChar, notifHandler);
        setNotifyOn(false);
        stopSampler();
        finishTest(); // make sure button is re-enabled
        createLogElement(notifyChar, 3, "P2Pserver DISABLE NOTIFICATION");
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
      // fail-safe
      finishTest();
    }
  };

  // Launch 10 s throughput measurement – countdown starts on first 'D'
  const onStartThroughputClick = async () => {
    if (!readWriteChar || phaseRef.current !== 'idle') return;
    try {
      const goWord = new Uint8Array([0x01, 0x01]);
      await readWriteChar.writeValue(goWord);
      createLogElement(goWord, 1, "P2Pserver GO command sent");

      cleanupTestTimers();
      setPhaseSafe('starting');
      setTestRemaining(0);
      lastThroughputRef.current = 0;

      // 1) if no first 'D' in 5 s -> unlock
      startWatchdogRef.current = setTimeout(() => {
        if (phaseRef.current === 'starting') finishTest();
      }, 5000);

      // 2) hard safety unlock after 15 s (whatever happens)
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
