import React from 'react';

const Home = () => {
  return (
    <div className="row justify-content-center justifyText" id="readmeInfo">
      <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6" style={{ textAlign: 'left' }}>
        <h1 id="stm32wba-web-bluetooth-app-interfaces">
          <strong>STM32WBA Web Bluetooth® App Interfaces</strong>
        </h1>
        <h2>A Revolutionary STMicroelectronics Demonstration!</h2>
        <p>
          Welcome to a unique showcase that pushes the boundaries of wireless connectivity and embedded performance. 
          This project combines three cutting-edge ST technologies to deliver an immersive, ultra-fast, and innovative 
          experience, all in real-time!
        </p>
        <hr />

        <h3>Objective:</h3>
        <ul>
          <li>Instant data transfer & ultra-low latency with ST60</li>
          <li>Intelligent processing with STM32MP25</li>
          <li>Live display via BLE with Nucleo-WBA55CG</li>
        </ul>
        <p>A technological showcase designed to captivate every visitor in the showroom!</p>
        <hr />

        <h3>Why is this demonstration so impressive?</h3>
        <ul>
          <li>No more cables! ST60 transmits data wirelessly at 60 GHz, replacing traditional wired connections with blazing speed!</li>
          <li>Ultra-low latency (&lt;1ms): Everything happens in real-time with zero lag.</li>
          <li>Live Web BLE Interface: A simple QR code lets visitors view real-time performance directly on their smartphones!</li>
          <li>ST technology powering Industry 4.0 & IoT: A breakthrough paving the way for smart factories and next-gen automation.</li>
        </ul>
        <hr />

        <h3>Technology Presentation: An Unprecedented Synergy</h3>
        <p>We've integrated three groundbreaking STMicroelectronics components into an unparalleled demonstration:</p>
        <ul>
          <li>
            <strong>ST60: The Cable Killer!</strong>
            <ul>
              <li>Ultra-fast data rate: Up to 6 Gbps</li>
              <li>Imperceptible latency: &lt;1ms</li>
              <li>Minimal power consumption, instant communication</li>
              <li>Exclusive ST technology, perfect for industrial and IoT applications</li>
            </ul>
          </li>
          <li>
            <strong>Project Role:</strong>
            <ul>
              <li>Wireless data transfer to STM32MP25</li>
              <li>Performance measurement (data rate & latency)</li>
            </ul>
          </li>
        </ul>
        <hr />

        <h3>STM32MP25: The Brain of the System</h3>
        <ul>
          <li>Advanced processing with Cortex-A35 & Cortex-M33</li>
          <li>Supports Linux & embedded AI</li>
          <li>Ultra-fast connectivity: PCIe, USB 3.0, Ethernet</li>
          <li>
            <strong>Project Role:</strong>
            <ul>
              <li>Receives & analyzes ST60 performance data</li>
              <li>Transmits results via BLE to Nucleo-WBA55CG</li>
            </ul>
          </li>
        </ul>
        <hr />

        <h3>Nucleo-WBA55CG: The Reinvented BLE</h3>
        <ul>
          <li>BLE 5.3 native: Seamless, optimized transmission</li>
          <li>Ultra-low power consumption for continuous connection</li>
          <li>Enhanced BLE data security</li>
          <li>
            <strong>Project Role:</strong>
            <ul>
              <li>BLE connection to mobile & web applications</li>
              <li>Real-time transmission of data rate & latency</li>
            </ul>
          </li>
        </ul>
        <hr />

        <h3>A Captivating Visual Interface</h3>
        <ul>
          <li>Web Bluetooth Interface, accessible via a simple QR Code</li>
          <li>Dynamic graphs & real-time animations powered by React & Node.js</li>
          <li>Zero-installation access: A 100% immersive experience</li>
        </ul>
        <hr />

        <h3>The Showroom Experience: A Journey into the Future</h3>
        <p>Imagine a visitor stepping into the showroom…</p>
        <ul>
          <li>They scan a QR code and instantly see ST's technology in action on their smartphone.</li>
          <li>They watch the real-time transmission speed of the ST60 through animated graphs.</li>
          <li>They immediately understand how ST is revolutionizing Industry 4.0, 5G, IoT, and embedded systems.</li>
        </ul>
        <p>A unique experience, an extraordinary technological showcase!</p>
        <hr />

        <h3>STMicroelectronics isn't just presenting a product… THIS IS THE FUTURE OF CONNECTIVITY UNFOLDING!</h3>

        <div className="mt-5 text-center">
          <div className="alert alert-info">
            <h4>🔗 Ready to Connect?</h4>
            <p>Click the "Connect" button in the header to start your wireless performance journey!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
