"use client";

import { Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { label: string; count: number }[];
};

export default function FraudDistributionChart({ data }: Props) {
  if (data.length === 0) return null;

  // Find fraudulent and legitimate counts
  const fraudulent = data.find(d =>
    ['t', 'true', '1', 'yes'].includes(d.label.toLowerCase())
  )?.count || 0;

  const legitimate = data.find(d =>
    ['f', 'false', '0', 'no'].includes(d.label.toLowerCase())
  )?.count || 0;

  const total = fraudulent + legitimate;
  if (total === 0) return null;

  const fraudPercentage = ((fraudulent / total) * 100).toFixed(1);
  const legitPercentage = ((legitimate / total) * 100).toFixed(1);

  const chartData = {
    labels: ['Fraudulent', 'Legitimate'],
    datasets: [{
      label: 'Count',
      data: [fraudulent, legitimate],
      backgroundColor: [CHART_COLORS.fraud, CHART_COLORS.legitimate],
      borderColor: CHART_COLORS.secondary,
      borderWidth: 2,
    }],
  };

  const options: ChartOptions<'doughnut'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      tooltip: {
        ...DEFAULT_CHART_OPTIONS.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          Fraud Distribution
        </h3>
        <span className="text-xs text-[#c9a961]">
          {total} total
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="mt-4 flex justify-around text-sm">
        <div className="text-center">
          <div className="text-[#ff6b6b]">Fraudulent</div>
          <div className="text-[#c9a961]">{fraudPercentage}%</div>
        </div>
        <div className="text-center">
          <div className="text-[#51cf66]">Legitimate</div>
          <div className="text-[#c9a961]">{legitPercentage}%</div>
        </div>
      </div>
    </div>
  );
}
