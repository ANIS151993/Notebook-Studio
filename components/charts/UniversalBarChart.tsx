"use client";

import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

type Props = {
  title: string;
  description: string;
  data: { label: string; count: number }[];
  analysis?: VisualizationAnalysis;
};

export default function UniversalBarChart({ title, description, data, analysis }: Props) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Count',
      data: data.map(d => d.count),
      backgroundColor: CHART_COLORS.primary,
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[#c9a961]">
          {description}
        </p>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
