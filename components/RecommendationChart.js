'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { getRecommendation } from '@/lib/calc';

ChartJS.register(ArcElement, Tooltip, Legend);

const LABELS = ['Automate', 'Viable', 'Low Priority', 'High Risk', 'Keep Manual'];
const COLORS = [
  'rgba(16, 185, 129, 0.85)',
  'rgba(99, 102, 241, 0.85)',
  'rgba(251, 191, 36, 0.85)',
  'rgba(244, 63, 94, 0.85)',
  'rgba(148, 163, 184, 0.85)',
];

export default function RecommendationChart({ scenarios }) {
  const counts = LABELS.map(
    (label) => scenarios.filter((s) => getRecommendation(s).text === label).length
  );

  const total = scenarios.length || 1;

  const data = {
    labels: LABELS,
    datasets: [
      {
        data: counts,
        backgroundColor: COLORS,
        borderColor: COLORS.map((c) => c.replace('0.85', '1')),
        borderWidth: 1,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 11, family: 'Inter' },
          filter: (item) => item.raw > 0,
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: '#1e293b',
        cornerRadius: 8,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / total) * 100)}%)`,
        },
      },
    },
  };

  const automateCount = counts[0];
  const viableCount = counts[1];

  return (
    <div className="relative h-full flex flex-col">
      <div className="grow relative min-h-0">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-slate-900">
            {automateCount + viableCount}
          </span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            viable
          </span>
        </div>
      </div>
    </div>
  );
}
