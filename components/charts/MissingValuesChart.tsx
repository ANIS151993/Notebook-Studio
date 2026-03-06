"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { column: string; count: number; percentage: number }[];
};

export default function MissingValuesChart({ data }: Props) {
  // Sort by count descending, limit to top 15
  const sortedData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  if (sortedData.length === 0) return null;

  const chartData = {
    labels: sortedData.map(d => d.column),
    datasets: [{
      label: 'Missing Values',
      data: sortedData.map(d => d.count),
      backgroundColor: sortedData.map(d =>
        d.percentage > 50 ? CHART_COLORS.fraud : CHART_COLORS.primary
      ),
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
    }],
  };

  const options: ChartOptions<'bar'> = {
    ...DEFAULT_CHART_OPTIONS,
    indexAxis: 'y', // Horizontal bar
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      tooltip: {
        ...DEFAULT_CHART_OPTIONS.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const item = sortedData[context.dataIndex];
            return `${context.parsed.x} missing (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          Missing Values by Column
        </h3>
        <span className="text-xs text-[#c9a961]">
          {sortedData.length} columns
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
