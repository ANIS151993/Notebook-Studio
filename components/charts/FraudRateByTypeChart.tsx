"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  data: { category: string; fraudulent: number; legitimate: number }[];
};

export default function FraudRateByTypeChart({ data }: Props) {
  if (data.length === 0) return null;

  // Take top 10 categories
  const topData = data.slice(0, 10);

  const chartData = {
    labels: topData.map(d => d.category),
    datasets: [
      {
        label: 'Fraudulent',
        data: topData.map(d => d.fraudulent),
        backgroundColor: CHART_COLORS.fraud,
        borderColor: CHART_COLORS.secondary,
        borderWidth: 1,
      },
      {
        label: 'Legitimate',
        data: topData.map(d => d.legitimate),
        backgroundColor: CHART_COLORS.legitimate,
        borderColor: CHART_COLORS.secondary,
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      tooltip: {
        ...DEFAULT_CHART_OPTIONS.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || value === undefined) return label;
            const dataIndex = context.dataIndex;
            const item = topData[dataIndex];
            const total = item.fraudulent + item.legitimate;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      ...DEFAULT_CHART_OPTIONS.scales,
      x: {
        ...DEFAULT_CHART_OPTIONS.scales?.x,
        stacked: true,
      },
      y: {
        ...DEFAULT_CHART_OPTIONS.scales?.y,
        stacked: true,
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          Fraud Rate by Employment Type
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
