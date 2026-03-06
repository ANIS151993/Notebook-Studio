"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { label: string; count: number }[];
};

export default function GeographicDistributionChart({ data }: Props) {
  if (data.length === 0) return null;

  // Take top 15
  const topData = data.slice(0, 15);

  const chartData = {
    labels: topData.map(d => d.label),
    datasets: [{
      label: 'Count',
      data: topData.map(d => d.count),
      backgroundColor: CHART_COLORS.tertiary,
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
    }],
  };

  const options: ChartOptions<'bar'> = {
    ...DEFAULT_CHART_OPTIONS,
    indexAxis: 'y', // Horizontal bar
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
          Geographic Distribution
        </h3>
        <span className="text-xs text-[#c9a961]">
          Top {topData.length}
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
