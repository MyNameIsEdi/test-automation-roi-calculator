'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { calcNetSavings, calcManualHoursPerMonth } from '@/lib/calc';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend
);

export default function ROIChart({ scenarios }) {
  const labels = scenarios.map((s) => s.name || 'Unnamed');

  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Manual Effort (hrs/mo)',
        data: scenarios.map((s) => +calcManualHoursPerMonth(s).toFixed(1)),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'bar',
        label: 'Maintenance (hrs/mo)',
        data: scenarios.map((s) => s.maint_hours || 0),
        backgroundColor: 'rgba(203, 213, 225, 0.75)',
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line',
        label: 'Net Savings (hrs/mo)',
        data: scenarios.map((s) => Math.max(0, calcNetSavings(s))),
        borderColor: 'rgba(16, 185, 129, 0.9)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 11, family: 'Inter' },
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: '#1e293b',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} hrs`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 30 },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 10 },
          callback: (v) => `${v}h`,
        },
      },
    },
  };

  return <Chart type="bar" data={data} options={options} />;
}
