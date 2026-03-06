"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLOR_PALETTE } from '@/lib/chartConfig';

type Props = {
  data: { label: string; count: number }[];
};

export default function ExperienceDistributionChart({ data }: Props) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Count',
      data: data.map(d => d.count),
      backgroundColor: CHART_COLOR_PALETTE.slice(0, data.length),
      borderColor: '#d4af37',
      borderWidth: 1,
    }],
  };

  const options: ChartOptions<'bar'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          Required Experience Distribution
        </h3>
        <span className="text-xs text-[#c9a961]">
          {data.length} levels
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
