"use client";

import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';

export default function AnalysisPanel({ analysis }: { analysis: VisualizationAnalysis }) {
  return (
    <div className="mt-4 rounded-lg border border-[#d4af37]/30 bg-[#2a2416] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#f4d03f] animate-pulse" />
        <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f4d03f]">
          Data-Driven Analysis
        </h4>
      </div>
      <div className="space-y-2.5 text-xs leading-relaxed text-[#c9a961]">
        <p>
          <span className="font-semibold text-[#d4af37]">Analyzing: </span>
          {analysis.dataset}
          {analysis.datasetDescription && (
            <span className="text-[#c9a961]/70"> — {analysis.datasetDescription}</span>
          )}
        </p>
        <p>
          <span className="font-semibold text-[#d4af37]">Context: </span>
          {analysis.suitability}
        </p>
        <div>
          <span className="font-semibold text-[#d4af37]">Insights from your data:</span>
          <ul className="mt-1.5 list-inside list-disc space-y-1.5">
            {analysis.findings.map((finding, i) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
