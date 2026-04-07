"use client";

import { Bar, Scatter } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { CHART_COLOR_PALETTE, CHART_COLORS } from '@/lib/chartConfig';
import type { PairPlotData } from '@/lib/advancedDataProcessors';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

type Props = {
  title: string;
  description: string;
  data: PairPlotData;
  analysis?: VisualizationAnalysis;
};

export default function UniversalPairPlot({ title, description, data, analysis }: Props) {
  if (!data.columns.length) return null;

  const n = data.columns.length;
  const hasGroups = data.groups.length > 1 && data.groups[0] !== 'all';
  const groupColors: Record<string, string> = {};
  data.groups.forEach((g, i) => {
    groupColors[g] = CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length];
  });

  const miniBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: false,
  };

  const miniScatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: false,
  };

  const renderCell = (row: number, col: number) => {
    if (row === col) {
      // Diagonal: histogram
      const hist = data.histograms.find(h => h.col === data.columns[row]);
      if (!hist) return null;

      const allValues = hist.byGroup.flatMap(g => g.values);
      if (allValues.length === 0) return null;

      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const binCount = 12;
      const binSize = (max - min) / binCount || 1;

      if (hasGroups) {
        const datasets = data.groups.map(group => {
          const values = hist.byGroup.find(g => g.group === group)?.values || [];
          const bins = Array(binCount).fill(0);
          values.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
            bins[idx]++;
          });
          return {
            label: group,
            data: bins,
            backgroundColor: groupColors[group] + '80',
            borderWidth: 0,
          };
        });

        return (
          <Bar
            data={{ labels: Array(binCount).fill(''), datasets }}
            options={{
              ...miniBarOptions,
              scales: {
                x: { stacked: true, display: false },
                y: { stacked: true, display: false },
              },
            }}
          />
        );
      } else {
        const bins = Array(binCount).fill(0);
        allValues.forEach(v => {
          const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
          bins[idx]++;
        });

        return (
          <Bar
            data={{
              labels: Array(binCount).fill(''),
              datasets: [{
                data: bins,
                backgroundColor: CHART_COLORS.primary + '80',
                borderWidth: 0,
              }],
            }}
            options={miniBarOptions}
          />
        );
      }
    } else {
      // Off-diagonal: scatter
      const pair = data.scatterPairs.find(
        p => p.xCol === data.columns[col] && p.yCol === data.columns[row]
      );
      if (!pair) return null;

      if (hasGroups) {
        const datasets = data.groups.map(group => ({
          label: group,
          data: pair.points
            .filter(p => p.group === group)
            .map(p => ({ x: p.x, y: p.y })),
          backgroundColor: groupColors[group] + '60',
          borderColor: groupColors[group],
          pointRadius: 1.5,
        }));

        return <Scatter data={{ datasets }} options={miniScatterOptions} />;
      } else {
        return (
          <Scatter
            data={{
              datasets: [{
                data: pair.points.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: CHART_COLORS.primary + '60',
                pointRadius: 1.5,
              }],
            }}
            options={miniScatterOptions}
          />
        );
      }
    }
  };

  // Scale cell size based on number of columns to keep grid contained
  // 2-3 cols: 140px, 4-5: 110px, 6-7: 85px, 8+: 65px
  const cellSize = n <= 3 ? 140 : n <= 5 ? 110 : n <= 7 ? 85 : 65;
  const labelWidth = n <= 5 ? 40 : 30;
  const fontSize = n <= 5 ? 'text-xs' : 'text-[10px]';

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">{title}</h3>
        <p className="mt-1 text-xs text-[#c9a961]">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="mx-auto grid gap-0.5"
          style={{
            gridTemplateColumns: `${labelWidth}px repeat(${n}, minmax(0, 1fr))`,
            maxWidth: `${labelWidth + n * (cellSize + 4)}px`,
          }}
        >
          {/* Empty corner */}
          <div />

          {/* Column headers */}
          {data.columns.map(col => (
            <div key={`header-${col}`} className="flex items-end justify-center pb-1">
              <span className={`truncate ${fontSize} text-[#c9a961]`}>{col}</span>
            </div>
          ))}

          {/* Grid cells */}
          {data.columns.flatMap((_, rowIdx) => [
            <div key={`row-label-${rowIdx}`} className="flex items-center justify-center">
              <span
                className={`${fontSize} text-[#c9a961]`}
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {data.columns[rowIdx]}
              </span>
            </div>,
            ...data.columns.map((_, colIdx) => (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                className="rounded bg-[#2a2416] p-0.5"
                style={{ aspectRatio: '1', maxHeight: `${cellSize}px` }}
              >
                {renderCell(rowIdx, colIdx)}
              </div>
            )),
          ])}
        </div>
      </div>

      {/* Legend */}
      {hasGroups && (
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {data.groups.map((group, i) => (
            <div key={group} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
              />
              <span className="text-xs text-[#c9a961]">{group}</span>
            </div>
          ))}
        </div>
      )}

      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
