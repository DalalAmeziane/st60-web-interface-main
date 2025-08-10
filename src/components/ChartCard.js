import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const colorMap = {
  'Throughput (Mbps)': 'rgba(75, 192, 192, 1)',   // teal
  'Latency (ms)':      'rgba(255, 99, 132, 1)',   // red
};

const ChartCard = ({ title, labels = [], values = [] }) => {
  const color = colorMap[title] || 'rgba(54, 162, 235, 1)';

  // keep labels/values aligned
  const pad = Math.max(0, labels.length - values.length);
  const paddedValues = [...Array(pad).fill(null), ...values].slice(-labels.length);

  const data = {
    labels,
    datasets: [{
      label: title,
      data: paddedValues,
      showLine: true,
      fill: false,                 // ⬅️ no area fill
      tension: 0,                  // ⬅️ sharp/“pointy” corners
      borderColor: color,
      borderWidth: 2,
      spanGaps: true,              // ignore nulls
      pointRadius: 4,              // ⬅️ visible dots (peaks)
      pointHoverRadius: 6,
      pointBackgroundColor: color, // dot color
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointHitRadius: 8,
    }],
  };

  let yOptions = { beginAtZero: true };
  if (title.includes('Throughput')) {
    yOptions = { beginAtZero: true, min: 0, suggestedMax: 1000, ticks: { stepSize: 100 } };
  } else if (title.includes('Latency')) {
    yOptions = { beginAtZero: true, min: 0, suggestedMax: 1, ticks: { stepSize: 0.1 } };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        type: 'category',
        ticks: { autoSkip: false, maxRotation: 60, minRotation: 60 },
      },
      y: yOptions,
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="chart-card" style={{ height: '300px' }}>
      <h5 className="text-center">{title}</h5>
      <Line data={data} options={options} />
      {labels.length === 0 && <p className="text-muted text-center mt-2">No data available</p>}
    </div>
  );
};

export default ChartCard;
