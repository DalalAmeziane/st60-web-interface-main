// *******************************************************************************
// * @file    App.js
// * @author  MCD Application Team
// *
// *******************************************************************************
// * @attention
// *
// * Copyright (c) 2022-2023 STMicroelectronics.
// * All rights reserved.
// *
// * This software is licensed under terms that can be found in the LICENSE file
// * in the root directory of this software component.
// * If no LICENSE file comes with this software, it is provided AS-IS.
// *
// ******************************************************************************

import React, { useState } from 'react';
import Header from './components/Header';
import P2Pserver from './onglets/P2Pserver';
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';
import './styles/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [allServices, setAllServices] = useState([]);
  const [allCharacteristics, setAllCharacteristics] = useState([]);
  const [isDisconnected, setIsDisconnected] = useState(true);

  const listItems = allServices.map((service, index) => {
    if (service.service.uuid === '0000fe40-cc7a-482a-984a-7f2ed5b3e58f') {
      return (
        <li className="liProfile" key={service.service.uuid || index}>
          <Link to="/P2P">ST60 Performance</Link>
        </li>
      );
    }
    return null;
  });

  return (
    <BrowserRouter>
      <div>
        <Header
          setIsDisconnected={setIsDisconnected}
          setAllServices={setAllServices}
          setAllCharacteristics={setAllCharacteristics}
        />
        <ul className="ulProfile">{listItems}</ul>

        <div className="main-route-place">
          <Routes>
            <Route
              path="/"
              element={
                isDisconnected ? (
                  <div style={{ padding: '1rem' }}>
                    Please connect a device to view the performance interface.
                  </div>
                ) : null
              }
            />
            <Route
              path="/P2P"
              element={
                isDisconnected ? null : (
                  <P2Pserver allCharacteristics={allCharacteristics} />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;