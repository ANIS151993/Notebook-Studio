"use client";

import { useRef, useEffect, useMemo } from 'react';
import type { ViolinGroupData } from '@/lib/advancedDataProcessors';
import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';
import AnalysisPanel from './AnalysisPanel';
import { CHART_COLOR_PALETTE, CHART_COLORS } from '@/lib/chartConfig';

type Props = {
  title: string;
  description: string;
  violinData: ViolinGroupData[];
  analysis?: VisualizationAnalysis;
};

export default function UniversalViolinPlot({ title, description, violinData, analysis }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { globalMin, globalMax } = useMemo(() => {
    if (!violinData.length) return { globalMin: 0, globalMax: 1 };
    const mins = violinData.map(v => v.kde[0]?.value ?? 0);
    const maxs = violinData.map(v => v.kde[v.kde.length - 1]?.value ?? 0);
    return {
      globalMin: Math.min(...mins),
      globalMax: Math.max(...maxs),
    };
  }, [violinData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !violinData.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = 400;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 30, bottom: 45, left: 65 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const yRange = globalMax - globalMin || 1;

    ctx.clearRect(0, 0, w, h);

    // Grid lines and Y-axis labels
    const yTicks = 6;
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const val = globalMin + (yRange * i) / yTicks;
      const y = pad.top + plotH - (plotH * i) / yTicks;

      ctx.strokeStyle = CHART_COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = CHART_COLORS.text;
      ctx.fillText(val.toFixed(1), pad.left - 8, y + 4);
    }

    // Draw violins
    const categoryWidth = plotW / violinData.length;
    const toY = (val: number) => pad.top + plotH - ((val - globalMin) / yRange) * plotH;

    violinData.forEach((violin, i) => {
      const centerX = pad.left + categoryWidth * (i + 0.5);
      const maxHalfWidth = categoryWidth * 0.35;
      const color = CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length];

      // Violin shape
      ctx.beginPath();
      violin.kde.forEach((point, j) => {
        const y = toY(point.value);
        const halfW = (point.density / violin.maxDensity) * maxHalfWidth;
        if (j === 0) ctx.moveTo(centerX + halfW, y);
        else ctx.lineTo(centerX + halfW, y);
      });
      for (let j = violin.kde.length - 1; j >= 0; j--) {
        const y = toY(violin.kde[j].value);
        const halfW = (violin.kde[j].density / violin.maxDensity) * maxHalfWidth;
        ctx.lineTo(centerX - halfW, y);
      }
      ctx.closePath();
      ctx.fillStyle = color + '45';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // IQR box
      const q1Y = toY(violin.q1);
      const q3Y = toY(violin.q3);
      const boxHW = maxHalfWidth * 0.12;
      ctx.fillStyle = color + '70';
      ctx.fillRect(centerX - boxHW, q3Y, boxHW * 2, q1Y - q3Y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - boxHW, q3Y, boxHW * 2, q1Y - q3Y);

      // Median line
      const medY = toY(violin.median);
      ctx.beginPath();
      ctx.moveTo(centerX - boxHW * 2, medY);
      ctx.lineTo(centerX + boxHW * 2, medY);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Category label
      ctx.fillStyle = CHART_COLORS.text;
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(violin.category, centerX, h - pad.bottom + 20);
    });

    // Axes
    ctx.strokeStyle = CHART_COLORS.secondary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();
  }, [violinData, globalMin, globalMax]);

  if (!violinData.length) return null;

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f4d03f]">{title}</h3>
        <p className="mt-1 text-xs text-[#c9a961]">{description}</p>
      </div>
      <div ref={containerRef} style={{ height: '400px' }}>
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {violinData.map((v, i) => (
          <div key={v.category} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] + '80' }}
            />
            <span className="text-xs text-[#c9a961]">
              {v.category} (n={v.count}, median={v.median})
            </span>
          </div>
        ))}
      </div>
      {analysis && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
