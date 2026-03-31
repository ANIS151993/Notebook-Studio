"use client";

import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, Filler } from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { DEFAULT_CHART_OPTIONS, CHART_COLORS } from '@/lib/chartConfig';
import type { DistPlotData } from '@/lib/advancedDataProcessors';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

ChartJS.register(Filler);

type Props = {
  title: string;
  description: string;
  data: DistPlotData;
  analysis?: VisualizationAnalysis;
};

export default function UniversalDistPlot({ title, description, data, analysis }: Props) {
  if (!data.histogram.length) return null;

  const totalCount = data.histogram.reduce((sum, d) => sum + d.count, 0);
  const binWidth = data.histogram.length > 1
    ? data.histogram[1].binMin - data.histogram[0].binMin
    : 1;

  // Map KDE curve to histogram bin centers, scaled to match histogram frequency
  const kdeAtBins = data.histogram.map(bin => {
    const center = (bin.binMin + bin.binMax) / 2;
    let best = data.kde[0]?.density || 0;
    for (let i = 1; i < data.kde.length; i++) {
      if (data.kde[i].x >= center) {
        const p0 = data.kde[i - 1];
        const p1 = data.kde[i];
        const t = (center - p0.x) / (p1.x - p0.x || 1);
        best = p0.density + t * (p1.density - p0.density);
        break;
      }
    }
    return best * totalCount * binWidth;
  });

  const chartData = {
    labels: data.histogram.map(d => d.range),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Frequency',
        data: data.histogram.map(d => d.count),
        backgroundColor: CHART_COLORS.primary + '50',
        borderColor: CHART_COLORS.secondary,
        borderWidth: 1,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Density (KDE)',
        data: kdeAtBins,
        borderColor: '#ff6b6b',
        backgroundColor: '#ff6b6b20',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        order: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: {
        ...DEFAULT_CHART_OPTIONS.plugins?.legend,
        display: true,
      },
    },
    scales: {
      ...DEFAULT_CHART_OPTIONS.scales,
      x: {
        ...DEFAULT_CHART_OPTIONS.scales?.x,
        ticks: {
          ...DEFAULT_CHART_OPTIONS.scales?.x?.ticks,
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">{title}</h3>
        <p className="mt-1 text-xs text-[#c9a961]">{description}</p>
      </div>
      <div style={{ height: '400px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Chart type="bar" data={chartData as any} options={options} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#c9a961]">
        <span>Mean: <strong className="text-[#f4d03f]">{data.stats.mean}</strong></span>
        <span>Median: <strong className="text-[#f4d03f]">{data.stats.median}</strong></span>
        <span>Std: <strong className="text-[#f4d03f]">{data.stats.std}</strong></span>
        <span>Skew: <strong className="text-[#f4d03f]">{data.stats.skewness}</strong></span>
      </div>
      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
