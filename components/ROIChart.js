'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ROIChart({ scenarios }) {
  const data = {
    labels: scenarios.map(s => s.name || 'Unnamed'),
    datasets: [
      {
        label: 'Manual Effort (Hrs/Mo)',
        data: scenarios.map(s => ((s.manual_mins * s.frequency) / 60).toFixed(1)),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Maintenance Tax (Hrs/Mo)',
        data: scenarios.map(s => s.maint_hours || 0),
        backgroundColor: 'rgba(203, 213, 225, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter' }
        }
      },
      tooltip: {
        padding: 12,
        backgroundColor: '#1e293b',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } }
      }
    }
  };

  return <Bar data={data} options={options} />;
}