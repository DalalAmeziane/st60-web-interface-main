import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const colorMap = {
  'Throughput (Mbps)': 'rgba(75, 192, 192, 1)', // teal (garde tes couleurs)
  'Latency (ms)':      'rgba(255, 99, 132, 1)',  // red
};

const ChartCard = ({ title, labels = [], values = [] }) => {
  const color = colorMap[title] || 'rgba(54, 162, 235, 1)';

  // aligne labels/values (on comble le début avec null)
  const pad = Math.max(0, labels.length - values.length);
  const paddedValues = [...Array(pad).fill(null), ...values].slice(-labels.length);

  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: paddedValues,
        showLine: true,
        fill: false,                    // pas d'aire remplie
        // STYLE « 2e image » :
        tension: 0.35,                  // lissage doux
        cubicInterpolationMode: 'monotone',
        borderColor: color,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',   // point blanc au centre
        pointBorderColor: color,        // anneau de la couleur de la courbe
        pointBorderWidth: 2,
        spanGaps: true,                 // relie à travers les null
      },
    ],
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
    animation: { duration: 300 },
    scales: {
      x: {
        type: 'category',
        ticks: {
          autoSkip: true,        // espace les labels comme sur l’exemple
          maxTicksLimit: 12,
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(0,0,0,0.06)',
          drawBorder: false,
        },
      },
      y: {
        ...yOptions,
        grid: {
          color: 'rgba(0,0,0,0.06)',
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: { display: true, position: 'bottom' }, // affiche la légende
      tooltip: { mode: 'nearest', intersect: false },
    },
    elements: {
      point: { hitRadius: 10 },
      line: { capBezierPoints: true },
    },
  };

  return (
    <div className="chart-card" style={{ height: '300px' }}>
      <h5 className="text-center">{title}</h5>
      <Line data={data} options={options} />
      {labels.length === 0 && (
        <p className="text-muted text-center mt-2">No data available</p>
      )}
    </div>
  );
};

export default ChartCard;
