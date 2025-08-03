import React from "react";
import logoST from "../images/st-logo.svg";

var myDevice;
let showAllDevices = false;

const Header = (props) => {
  async function connection() {
    console.log("Requesting Bluetooth Device...");
    try {
      let options = showAllDevices
        ? { acceptAllDevices: true }
        : {
            filters: [
              { namePrefix: "HT_" },
              { namePrefix: "HR_" },
              { namePrefix: "p2pS_" },
              { namePrefix: "P2PS_" },
              { namePrefix: "p2pR_" },
              { namePrefix: "p2pSext_" },
              { namePrefix: "DT" },
            ],
            optionalServices: [
              "0000fe40-cc7a-482a-984a-7f2ed5b3e58f",
              "0000180d-0000-1000-8000-00805f9b34fb",
              "0000fe80-cc7a-482a-984a-7f2ed5b3e58f",
              "0000fe80-8e22-4541-9d4c-21edae82fe80",
              "0000fe20-cc7a-482a-984a-7f2ed5b3e58f",
              "0000feb0-cc7a-482a-984a-7f2ed5b3e58f",
              "00001809-0000-1000-8000-00805f9b34fb",
            ],
          };

      myDevice = await navigator.bluetooth.requestDevice(options);
      myDevice.addEventListener?.("gattserverdisconnected", onDisconnected);

      const server = await myDevice.gatt.connect();
      const services = await server.getPrimaryServices();

      console.log("HEADER - Getting Characteristics...");
      let queue = Promise.resolve();

      for (const service of services) {
        console.log(service);
        createLogElement(service, 3, "SERVICE");
        props.setAllServices((prev) => [...prev, { service }]);

        queue = queue.then(async () => {
          const characteristics = await service.getCharacteristics();
          console.log(characteristics);
          console.log(
            `HEADER -> Service: ${service.device.name} - ${service.uuid}`
          );

          for (const characteristic of characteristics) {
            props.setAllCharacteristics((prev) => [
              ...prev,
              { characteristic },
            ]);
            console.log(
              `HEADER >> Characteristic: ${characteristic.uuid} ${getSupportedProperties(
                characteristic
              )}`
            );
            createLogElement(characteristic, 4, "CHARACTERISTIC");
          }
        });
      }

      await queue;

      const buttonConnect = document.getElementById("connectButton");
      if (buttonConnect) {
        buttonConnect.innerHTML = "Connected";
        buttonConnect.disabled = true;
      }
      props.setIsDisconnected(false);
    } catch (error) {
      console.error(error);
      createLogElement(error.toString(), 1, "CONNECTION ERROR");
      if (error.name === "NotFoundError") {
        alert("Bluetooth device selection was cancelled.");
      }
    }
  }

  function getSupportedProperties(characteristic) {
    return Object.entries(characteristic.properties)
      .filter(([, enabled]) => enabled)
      .map(([prop]) => prop.toUpperCase())
      .join(", ");
  }

  function disconnection() {
    console.log("HEADER - Disconnecting from Bluetooth Device...");
    if (myDevice?.gatt?.connected) {
      myDevice.gatt.disconnect();
    }
    const buttonConnect = document.getElementById("connectButton");
    if (buttonConnect) {
      buttonConnect.disabled = false;
      buttonConnect.innerHTML = "Connect";
    }
    props.setIsDisconnected(true);
    props.setAllServices([]);
    props.setAllCharacteristics([]);
    // Clear data and redirect to home page
    window.location.hash = "/";
  }

  function onDisconnected() {
    console.log("HEADER - > Bluetooth Device disconnected");
    const buttonConnect = document.getElementById("connectButton");
    if (buttonConnect) {
      buttonConnect.disabled = false;
      buttonConnect.innerHTML = "Connect";
    }
    props.setIsDisconnected(true);
    props.setAllServices([]);
    props.setAllCharacteristics([]);
    // Clear data and redirect to home page
    window.location.hash = "/";
  }

  return (
    <div className="container-fluid" id="header">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <img className="logoST" src={logoST} alt="logo st" />
          </div>
        </div>
        <div className="textTitle">WBA</div>
        <div className="row mt-3">
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button
              className="defaultButton"
              type="button"
              onClick={connection}
              id="connectButton"
            >
              Connect
            </button>
          </div>
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button className="defaultButton" type="button" onClick={disconnection}>
              Disconnect
            </button>
          </div>
          <div className="d-grid col-xs-12 col-sm-4 col-md-4 col-lg-4 p-2">
            <button
              className="defaultButton"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasLogPanel"
              aria-controls="offcanvasLogPanel"
            >
              Info
            </button>
          </div>

          <div
            className="offcanvas offcanvas-start"
            data-bs-scroll="true"
            tabIndex="-1"
            id="offcanvasLogPanel"
            aria-labelledby="offcanvasLogPanelLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasLogPanelLabel">
                Application log panel
              </h5>
              <button
                type="button"
                className="btn-close text-reset"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <div id="logPanel"></div>
            </div>
          </div>

          <div className="input-group mb-3">
            <label> Disable STM32 WBA Devices Filter &nbsp;</label>
            <label className="containerCheckBox" onClick={checkBoxDeviceFilter}>
              <input type="checkbox" id="checkboxFilter" />
              <span className="checkmark"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

function checkBoxDeviceFilter() {
  const checkBox = document.getElementById("checkboxFilter");
  showAllDevices = checkBox?.checked;
  console.log(
    `Turn ${showAllDevices ? "Off" : "On"} the Bluetooth device Filter for the connection`
  );
}

export function createLogElement(logText, maxLevel, description) {
  function formatInterface(object, maxLevel, currentLevel = 0) {
    let str = "";
    let levelStr = " ".repeat(currentLevel * 4);
    if (currentLevel === 0) str = "<pre>";

    if (maxLevel !== 0 && currentLevel >= maxLevel) {
      str += levelStr + "...</br>";
      return str;
    }

    for (let property in object) {
      if (typeof object[property] === "function") continue;
      if (typeof object[property] === "object" && object[property] !== null) {
        str +=
          levelStr +
          property +
          ": {</br>" +
          formatInterface(object[property], maxLevel, currentLevel + 1) +
          levelStr +
          "}</br>";
      } else {
        str += levelStr + property + ": " + object[property] + "</br>";
      }
    }

    if (currentLevel === 0) str += "</pre>";
    return str;
  }

  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formatted = formatInterface(logText, maxLevel);
  const logPanel = document.getElementById("logPanel");
  const entry = document.createElement("div");
  entry.className = "logElememt";
  entry.innerHTML = `${time} : ${description}</br>${formatted}`;
  logPanel.appendChild(entry);
}

export default Header;
