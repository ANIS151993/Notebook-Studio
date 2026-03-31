"use client";

import { Scatter, Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { CHART_COLORS, DEFAULT_CHART_OPTIONS } from '@/lib/chartConfig';
import type { JointPlotData } from '@/lib/advancedDataProcessors';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

type Props = {
  title: string;
  description: string;
  data: JointPlotData;
  analysis?: VisualizationAnalysis;
};

export default function UniversalJointPlot({ title, description, data, analysis }: Props) {
  if (!data.scatter.length) return null;

  // X marginal histogram
  const xHistData = {
    labels: data.xHistogram.map(d => d.range),
    datasets: [{
      data: data.xHistogram.map(d => d.count),
      backgroundColor: CHART_COLORS.primary + '60',
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
    }],
  };

  const xHistOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: false,
  };

  // Y marginal histogram (horizontal)
  const yHistData = {
    labels: data.yHistogram.map(d => d.range),
    datasets: [{
      data: data.yHistogram.map(d => d.count),
      backgroundColor: CHART_COLORS.primary + '60',
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
    }],
  };

  const yHistOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: false,
  };

  // Main scatter plot
  const scatterData = {
    datasets: [{
      label: `${data.yColumn} vs ${data.xColumn}`,
      data: data.scatter,
      backgroundColor: CHART_COLORS.tertiary + '50',
      borderColor: CHART_COLORS.secondary,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        ...DEFAULT_CHART_OPTIONS.scales?.x,
        title: { display: true, text: data.xColumn, color: CHART_COLORS.text },
      },
      y: {
        ...DEFAULT_CHART_OPTIONS.scales?.y,
        title: { display: true, text: data.yColumn, color: CHART_COLORS.text },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">{title}</h3>
        <p className="mt-1 text-xs text-[#c9a961]">
          {description}
          <span className="ml-2 inline-block rounded bg-[#2a2416] px-2 py-0.5 font-semibold text-[#d4af37]">
            r = {data.correlation}
          </span>
        </p>
      </div>

      {/* Joint plot layout */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: '1fr 100px',
          gridTemplateRows: '80px 320px',
          gap: '4px',
        }}
      >
        {/* X marginal histogram */}
        <div className="rounded bg-[#2a2416] p-1">
          <Bar data={xHistData} options={xHistOptions} />
        </div>

        {/* Empty corner */}
        <div />

        {/* Main scatter */}
        <div>
          <Scatter data={scatterData} options={scatterOptions} />
        </div>

        {/* Y marginal histogram */}
        <div className="rounded bg-[#2a2416] p-1">
          <Bar data={yHistData} options={yHistOptions} />
        </div>
      </div>

      {/* Stats summary */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#c9a961]">
        <span>{data.xColumn}: <strong className="text-[#f4d03f]">{data.xStats.mean}</strong> avg</span>
        <span>{data.yColumn}: <strong className="text-[#f4d03f]">{data.yStats.mean}</strong> avg</span>
        <span>Correlation: <strong className="text-[#f4d03f]">{data.correlation}</strong></span>
        <span>Points: <strong className="text-[#f4d03f]">{data.scatter.length}</strong></span>
      </div>

      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
