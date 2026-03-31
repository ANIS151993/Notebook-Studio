"use client";

import type { VisualizationAnalysis } from '@/lib/visualizationAnalysis';

export default function AnalysisPanel({ analysis }: { analysis: VisualizationAnalysis }) {
  return (
    <div className="mt-4 rounded-lg border border-[#d4af37]/30 bg-[#2a2416] p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#f4d03f]">
        Visualization Analysis
      </h4>
      <div className="space-y-2.5 text-xs leading-relaxed text-[#c9a961]">
        <p>
          <span className="font-semibold text-[#d4af37]">Dataset: </span>
          {analysis.dataset} — {analysis.datasetDescription}
        </p>
        <p>
          <span className="font-semibold text-[#d4af37]">Why this dataset: </span>
          {analysis.suitability}
        </p>
        <div>
          <span className="font-semibold text-[#d4af37]">Key Findings:</span>
          <ul className="mt-1.5 list-inside list-disc space-y-1">
            {analysis.findings.map((finding, i) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
