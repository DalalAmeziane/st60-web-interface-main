import React, { useEffect, useState, useRef } from 'react';
import ChartCard from '../components/ChartCard';
import { createLogElement } from "../components/Header";

const P2Pserver = ({ allCharacteristics }) => {

  const [notifyChar, setNotifyChar] = useState(null);
  const [readWriteChar, setReadWriteChar] = useState(null);
  const [notifyOn, setNotifyOn] = useState(false);

  // États pour tracer débit et latence
  const [throughputData, setThroughputData] = useState([]);
  const [latencyData, setLatencyData] = useState([]);

  // 👉 Ajout : état et timer pour activer/désactiver le graphe de débit
  const [throughputActive, setThroughputActive] = useState(false);
  const throughputTimer = useRef(null);

  useEffect(() => {
    const notify = allCharacteristics.find(c =>
      c.characteristic.uuid.toLowerCase() === '0000fe42-8e22-4541-9d4c-21edae82ed19'
    );
    const rw = allCharacteristics.find(c =>
      c.characteristic.uuid.toLowerCase() === '0000fe41-8e22-4541-9d4c-21edae82ed19'
    );

    if (notify) {
      notify.characteristic.stopNotifications();
      setNotifyChar(notify.characteristic);
    }
    if (rw) {
      setReadWriteChar(rw.characteristic);
    }
  }, [allCharacteristics]);

  // Réception des notifications
  const notifHandler = (event) => {
    const buf = new Uint8Array(event.target.value.buffer);
    const type = String.fromCharCode(buf[0]);
    const value = new DataView(buf.buffer).getFloat32(1, true);
    createLogElement(buf, 1, "P2Pserver NOTIFICATION RECEIVED");

    const timestamp = new Date().toLocaleTimeString();

    if (type === 'D' || type === 'd') {
      // 👉 Ajout : on ne trace le débit que si throughputActive est true
      if (throughputActive) {
        setThroughputData(prev => [
          ...prev.slice(-29),
          { label: timestamp, value: parseFloat(value.toFixed(0)) }
        ]);
      }
    }

    if (type === 'L' || type === 'l') {
      // Latence toujours tracée
      setLatencyData(prev => [
        ...prev.slice(-29),
        { label: timestamp, value: parseFloat(value.toFixed(2)) }
      ]);
    }
  };

  const toggleNotifications = async () => {
    if (!notifyChar) return;
    try {
      if (!notifyOn) {
        await notifyChar.startNotifications();
        notifyChar.oncharacteristicvaluechanged = notifHandler;
        setNotifyOn(true);
        createLogElement(notifyChar, 3, "P2Pserver ENABLE NOTIFICATION");
      } else {
        await notifyChar.stopNotifications();
        setNotifyOn(false);
        createLogElement(notifyChar, 3, "P2Pserver DISABLE NOTIFICATION");
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
    }
  };

  // 👉 Ajout : Bouton GO pour activer le débit pendant 10s
  const onGoButtonClick = async () => {
    if (!readWriteChar) {
      console.error("ReadWriteCharacteristic not found");
      return;
    }
    try {
      let goWord = new Uint8Array([0x01, 0x01]);
      await readWriteChar.writeValue(goWord);
      createLogElement(goWord, 1, "P2Pserver GO command sent");
      console.log("GO command sent via BLE");

      // Active la collecte du débit pour 10s
      setThroughputData([]); // reset du graphe débit
      setThroughputActive(true);
      if (throughputTimer.current) clearTimeout(throughputTimer.current);
      throughputTimer.current = setTimeout(() => {
        setThroughputActive(false);
      }, 10000);

    } catch (error) {
      console.log('GO : Argh! ' + error);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center">P2P Server BLE Visualizer</h3>

      {/* Boutons de contrôle */}
      <div className="d-flex gap-3 justify-content-center mb-4">
        <button className="defaultButton" onClick={toggleNotifications}>
          {notifyOn ? "Notify ON" : "Notify OFF"}
        </button>
        <button className="defaultButton" onClick={onGoButtonClick}>
          GO
        </button>
      </div>

      {/* Graphiques */}
      <div className="container">
        <div className="row">
          <div className="col-12 mb-4 pb-5">
            <ChartCard title="Throughput (Mbps)" data={throughputData} />
          </div>
          <div className="col-12 mb-4 pb-5">
            <ChartCard title="Latency (ms)" data={latencyData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2Pserver;
