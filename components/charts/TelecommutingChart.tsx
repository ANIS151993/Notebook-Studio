"use client";

import { Pie } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { label: string; count: number }[];
};

export default function TelecommutingChart({ data }: Props) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Count',
      data: data.map(d => d.count),
      backgroundColor: [
        CHART_COLORS.primary,
        CHART_COLORS.secondary,
        CHART_COLORS.tertiary,
        CHART_COLORS.text,
      ].slice(0, data.length),
      borderColor: CHART_COLORS.secondary,
      borderWidth: 2,
    }],
  };

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const options: ChartOptions<'pie'> = {
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
          Telecommuting vs On-site
        </h3>
        <span className="text-xs text-[#c9a961]">
          {total} total
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
