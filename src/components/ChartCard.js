import React, { useState, useRef, useEffect } from 'react';
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
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, zoomPlugin);

const colorMap = {
  'Throughput (Mbps)': 'rgba(75, 192, 192, 1)', // bleu/vert
  'Latency (ms)': 'rgba(255, 99, 132, 1)',      // rouge
};

const ChartCard = ({ title, data, unit = '', color = '' }) => {
  const chartRef = useRef(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const interactionTimeoutRef = useRef(null);
  const maxVisiblePoints = 50; // Show last 50 points in scrolling window

  // Handle user interaction detection
  const handleUserInteraction = () => {
    setUserInteracting(true);
    
    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Reset after 3 seconds of no interaction
    interactionTimeoutRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, 3000);
  };

  // Auto-follow newest data when not interacting
  useEffect(() => {
    if (!userInteracting && data && data.length > 0 && chartRef.current) {
      const chart = chartRef.current;
      
      // Calculate the visible range for scrolling
      if (data.length > maxVisiblePoints) {
        const latestDataPoint = data[data.length - 1].label;
        const earliestVisible = latestDataPoint - maxVisiblePoints + 1;
        
        // Update x-axis to show latest data
        chart.options.scales.x.min = earliestVisible;
        chart.options.scales.x.max = latestDataPoint;
        chart.update('none'); // Update without animation for smooth scrolling
      }
    }
  }, [data, userInteracting, maxVisiblePoints]);
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h5 className="text-center">{title}</h5>
        <p className="text-muted text-center">No data available</p>
      </div>
    );
  }

  const defaultColor = colorMap[title] || color || 'rgba(54, 162, 235, 1)';

  const chartData = {
    labels: data.map(point => point.label),
    datasets: [{
      label: title,
      data: data.map(point => point.value),
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderColor: defaultColor,
      backgroundColor: defaultColor,
    }]
  };

  // Ajuste l’axe Y en fonction du titre
  let yOptions = {};
if (title.includes('Throughput')) {
  yOptions = {
    min: 900,
    max: 960,
    ticks: {
      stepSize: 10,
    }
  };
}
if (title.includes('Latency')) {
  yOptions = {
    min: 0,
    max: 1,
    ticks: {
      stepSize: 0.1,
    }
  };
}

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 200,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      y: yOptions,
      x: {
        type: 'linear',
        position: 'bottom',
        min: data.length > maxVisiblePoints ? data[data.length - maxVisiblePoints].label : undefined,
        max: data.length > 0 ? data[data.length - 1].label : undefined,
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: 10,
        }
      }
    },
    plugins: {
      legend: { display: false },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          onPanStart: handleUserInteraction,
          onPan: handleUserInteraction,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
          onZoomStart: handleUserInteraction,
          onZoom: handleUserInteraction,
        }
      },
    },
    onHover: handleUserInteraction,
    onClick: handleUserInteraction,
  };


  return (
    <div className="chart-card" style={{ height: "300px", position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h5 className="text-center" style={{ margin: 0 }}>{title}</h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {unit && <span style={{ fontSize: '12px', color: '#666' }}>{unit}</span>}
          <div style={{ 
            fontSize: '10px', 
            padding: '2px 8px', 
            borderRadius: '12px',
            backgroundColor: userInteracting ? '#ff6b6b' : '#4ecdc4',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {userInteracting ? '🎮 Manual' : '🎯 Auto-follow'}
          </div>
        </div>
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: '#666', 
        marginBottom: '5px',
        textAlign: 'center'
      }}>
        {userInteracting ? 'Double-click chart to resume auto-follow' : `Showing last ${Math.min(data.length, maxVisiblePoints)} points • Scroll to explore`}
      </div>
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options}
        onDoubleClick={() => setUserInteracting(false)}
      />
    </div>
  );
};

export default ChartCard;
