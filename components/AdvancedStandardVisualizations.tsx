"use client";

import { useMemo } from 'react';
import { getIrisDataset, getTipsDataset, DATASET_INFO } from '@/lib/sampleDatasets';
import {
  generateDistPlotData,
  generateViolinData,
  generateHeatMapData,
  generatePairPlotData,
  generateJointPlotData,
} from '@/lib/advancedDataProcessors';
import { countOccurrences } from '@/lib/chartDataProcessor';
import {
  generateDistPlotAnalysis,
  generatePieChartAnalysis,
  generateViolinAnalysis,
  generateHeatMapAnalysis,
  generatePairPlotAnalysis,
  generateJointPlotAnalysis,
} from '@/lib/visualizationAnalysis';
import UniversalDistPlot from './charts/UniversalDistPlot';
import UniversalPieChart from './charts/UniversalPieChart';
import UniversalViolinPlot from './charts/UniversalViolinPlot';
import UniversalHeatMap from './charts/UniversalHeatMap';
import UniversalPairPlot from './charts/UniversalPairPlot';
import UniversalJointPlot from './charts/UniversalJointPlot';
import AnalysisPanel from './charts/AnalysisPanel';

type DataRow = Record<string, unknown>;

export default function AdvancedStandardVisualizations() {
  const iris = useMemo(() => getIrisDataset() as DataRow[], []);
  const tips = useMemo(() => getTipsDataset() as DataRow[], []);

  // DistPlot: Tips total_bill — right-skewed spending distribution
  const distPlotData = useMemo(() =>
    generateDistPlotData(tips, 'total_bill', 20), [tips]);
  const distPlotAnalysis = useMemo(() =>
    generateDistPlotAnalysis(distPlotData, DATASET_INFO.tips.fullName, DATASET_INFO.tips.description), [distPlotData]);

  // Pie Chart: Tips day — dining day proportions
  const pieData = useMemo(() =>
    countOccurrences(tips, 'day'), [tips]);
  const pieAnalysis = useMemo(() =>
    generatePieChartAnalysis(pieData, DATASET_INFO.tips.fullName, DATASET_INFO.tips.description, 'day'), [pieData]);

  // Violin: Iris petal_length by species — distribution shape comparison
  const violinData = useMemo(() =>
    generateViolinData(iris, 'petal_length', 'species'), [iris]);
  const violinAnalysis = useMemo(() =>
    generateViolinAnalysis(violinData, DATASET_INFO.iris.fullName, DATASET_INFO.iris.description, 'petal_length', 'species'), [violinData]);

  // HeatMap: Iris feature correlations
  const heatMapData = useMemo(() =>
    generateHeatMapData(iris, ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']), [iris]);
  const heatMapAnalysis = useMemo(() =>
    generateHeatMapAnalysis(heatMapData, DATASET_INFO.iris.fullName, DATASET_INFO.iris.description), [heatMapData]);

  // Pair Plot: Iris all features colored by species
  const pairPlotData = useMemo(() =>
    generatePairPlotData(iris, ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'], 'species'), [iris]);
  const pairPlotAnalysis = useMemo(() =>
    generatePairPlotAnalysis(pairPlotData, DATASET_INFO.iris.fullName, DATASET_INFO.iris.description), [pairPlotData]);

  // Joint Plot: Tips total_bill vs tip — bivariate spending relationship
  const jointPlotData = useMemo(() =>
    generateJointPlotData(tips, 'total_bill', 'tip'), [tips]);
  const jointPlotAnalysis = useMemo(() =>
    generateJointPlotAnalysis(jointPlotData, DATASET_INFO.tips.fullName, DATASET_INFO.tips.description), [jointPlotData]);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="rounded-xl border border-[#d4af37]/50 bg-[#2a2416] p-5">
        <h4 className="text-base font-semibold text-[#f4d03f]">
          Advanced Visualizations
        </h4>
        <p className="mt-1 text-xs text-[#c9a961]">
          Each visualization is paired with the built-in dataset that best demonstrates its analytical capabilities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. DistPlot — Tips total_bill */}
        <UniversalDistPlot
          title="DistPlot — Total Bill Distribution"
          description={`${DATASET_INFO.tips.name} Dataset | total_bill with KDE overlay`}
          data={distPlotData}
          analysis={distPlotAnalysis}
        />

        {/* 2. Pie Chart — Tips day */}
        <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a]">
          <UniversalPieChart
            title="Pie Chart — Dining Day Proportions"
            description={`${DATASET_INFO.tips.name} Dataset | Visit distribution by day of week`}
            data={pieData}
          />
          <div className="px-6 pb-6">
            <AnalysisPanel analysis={pieAnalysis} />
          </div>
        </div>

        {/* 3. Violin Plot — Iris petal_length by species */}
        <UniversalViolinPlot
          title="Violin Plot — Petal Length by Species"
          description={`${DATASET_INFO.iris.name} Dataset | Distribution shape comparison across species`}
          violinData={violinData}
          analysis={violinAnalysis}
        />

        {/* 4. HeatMap — Iris correlations */}
        <UniversalHeatMap
          title="Correlation Heatmap — Iris Features"
          description={`${DATASET_INFO.iris.name} Dataset | Pairwise Pearson correlation coefficients`}
          data={heatMapData}
          analysis={heatMapAnalysis}
        />

        {/* 5. Pair Plot — full width */}
        <div className="md:col-span-2">
          <UniversalPairPlot
            title="Pair Plot — Iris Feature Relationships"
            description={`${DATASET_INFO.iris.name} Dataset | All pairwise scatter plots colored by species`}
            data={pairPlotData}
            analysis={pairPlotAnalysis}
          />
        </div>

        {/* 6. Joint Plot — full width */}
        <div className="md:col-span-2">
          <UniversalJointPlot
            title="Joint Plot — Total Bill vs Tip"
            description={`${DATASET_INFO.tips.name} Dataset | Bivariate relationship with marginal distributions`}
            data={jointPlotData}
            analysis={jointPlotAnalysis}
          />
        </div>
      </div>
    </div>
  );
}
