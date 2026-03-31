"use client";

import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

type Props = {
  title: string;
  description: string;
  data: { date: string; value: number }[];
  xLabel: string;
  yLabel: string;
  analysis?: VisualizationAnalysis;
};

export default function UniversalLineChart({ title, description, data, xLabel, yLabel, analysis }: Props) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: yLabel,
      data: data.map(d => d.value),
      borderColor: CHART_COLORS.primary,
      backgroundColor: CHART_COLORS.tertiary + '40', // Add transparency
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };

  const options: ChartOptions<'line'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ...DEFAULT_CHART_OPTIONS.scales?.x,
        title: {
          display: true,
          text: xLabel,
          color: CHART_COLORS.text,
        },
      },
      y: {
        ...DEFAULT_CHART_OPTIONS.scales?.y,
        title: {
          display: true,
          text: yLabel,
          color: CHART_COLORS.text,
        },
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
        <Line data={chartData} options={options} />
      </div>
      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
