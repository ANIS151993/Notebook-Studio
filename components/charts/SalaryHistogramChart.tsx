"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { range: string; count: number }[];
};

export default function SalaryHistogramChart({ data }: Props) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.range),
    datasets: [{
      label: 'Frequency',
      data: data.map(d => d.count),
      backgroundColor: CHART_COLORS.tertiary,
      borderColor: CHART_COLORS.secondary,
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
      tooltip: {
        ...DEFAULT_CHART_OPTIONS.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            return `Frequency: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      ...DEFAULT_CHART_OPTIONS.scales,
      x: {
        ...DEFAULT_CHART_OPTIONS.scales?.x,
        title: {
          display: true,
          text: 'Salary Range ($)',
          color: CHART_COLORS.text,
        },
      },
      y: {
        ...DEFAULT_CHART_OPTIONS.scales?.y,
        title: {
          display: true,
          text: 'Frequency',
          color: CHART_COLORS.text,
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          Salary Distribution
        </h3>
        <span className="text-xs text-[#c9a961]">
          {data.reduce((sum, d) => sum + d.count, 0)} records
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
