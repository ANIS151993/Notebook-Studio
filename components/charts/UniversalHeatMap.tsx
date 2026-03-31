"use client";

import type { HeatMapData } from '@/lib/advancedDataProcessors';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';

type Props = {
  title: string;
  description: string;
  data: HeatMapData;
  analysis?: VisualizationAnalysis;
};

function getCorrelationColor(value: number): string {
  const intensity = Math.abs(value);
  if (value >= 0) {
    // Dark → Gold
    const r = Math.round(26 + intensity * (244 - 26));
    const g = Math.round(26 + intensity * (208 - 26));
    const b = Math.round(26 + intensity * (63 - 26));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Dark → Blue
    const r = Math.round(26 + intensity * (79 - 26));
    const g = Math.round(26 + intensity * (130 - 26));
    const b = Math.round(26 + intensity * (189 - 26));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function getTextColor(value: number): string {
  return Math.abs(value) > 0.5 ? '#0a0a0a' : '#c9a961';
}

export default function UniversalHeatMap({ title, description, data, analysis }: Props) {
  if (!data.columns.length) return null;

  const n = data.columns.length;

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">{title}</h3>
        <p className="mt-1 text-xs text-[#c9a961]">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="mx-auto inline-grid gap-px"
          style={{
            gridTemplateColumns: `80px repeat(${n}, 1fr)`,
            minWidth: `${80 + n * 64}px`,
          }}
        >
          {/* Header row */}
          <div />
          {data.columns.map(col => (
            <div
              key={`header-${col}`}
              className="flex items-end justify-center pb-1 text-center"
              style={{ minHeight: '60px' }}
            >
              <span
                className="text-xs font-medium text-[#c9a961]"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  maxHeight: '60px',
                  overflow: 'hidden',
                }}
              >
                {col}
              </span>
            </div>
          ))}

          {/* Data rows */}
          {data.matrix.flatMap((row, i) => [
            <div
              key={`label-${data.columns[i]}`}
              className="flex items-center justify-end pr-2"
            >
              <span className="truncate text-xs font-medium text-[#c9a961]">
                {data.columns[i]}
              </span>
            </div>,
            ...row.map((value, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="flex items-center justify-center rounded-sm transition-transform hover:scale-105"
                style={{
                  backgroundColor: getCorrelationColor(value),
                  minHeight: '48px',
                  minWidth: '48px',
                }}
                title={`${data.columns[i]} x ${data.columns[j]}: ${value.toFixed(3)}`}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: getTextColor(value) }}
                >
                  {value.toFixed(2)}
                </span>
              </div>
            )),
          ])}
        </div>
      </div>

      {/* Color scale legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-[#c9a961]">-1.0</span>
        <div className="flex h-3 w-48 overflow-hidden rounded-full">
          {Array.from({ length: 20 }, (_, i) => {
            const value = -1 + (i / 19) * 2;
            return (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: getCorrelationColor(value) }}
              />
            );
          })}
        </div>
        <span className="text-xs text-[#c9a961]">+1.0</span>
      </div>

      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
