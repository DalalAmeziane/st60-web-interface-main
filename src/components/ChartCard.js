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
  'Throughput (Mbps)': 'rgba(75, 192, 192, 1)', // bleu/vert
  'Latency (ms)': 'rgba(255, 99, 132, 1)',      // rouge
};

const ChartCard = ({ title, data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h5 className="text-center">{title}</h5>
        <p className="text-muted text-center">No data available</p>
      </div>
    );
  }

  const color = colorMap[title] || 'rgba(54, 162, 235, 1)';

  const chartData = {
    labels: data.map(point => point.label),
    datasets: [{
      label: title,
      data: data.map(point => point.value),
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderColor: color,
      backgroundColor: color,
    }]
  };

  // Ajuste l’axe Y en fonction du titre
  let yTicks = { beginAtZero: true };
  if (title.includes('Throughput')) {
    yTicks = { beginAtZero: true, stepSize: 300, max: 1200 };
  }
  if (title.includes('Latency')) {
    yTicks = { beginAtZero: true, stepSize: 10, max: 100 };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuart',
    },
    scales: {
      y: {
        ticks: yTicks,
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="chart-card" style={{ height: "300px" }}>
      <h5 className="text-center">{title}</h5>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ChartCard;
