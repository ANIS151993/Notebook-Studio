// Analysis generation for all visualization types
// Produces data-driven text summaries for each chart

import type { DistPlotData, ViolinGroupData, HeatMapData, PairPlotData, JointPlotData } from './advancedDataProcessors';
import { calculateStats, pearsonCorrelation } from './advancedDataProcessors';

export type VisualizationAnalysis = {
  dataset: string;
  datasetDescription: string;
  suitability: string;
  findings: string[];
};

// =========================================================================
// New visualization analysis generators
// =========================================================================

export function generateDistPlotAnalysis(
  data: DistPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const { stats } = data;
  const totalCount = data.histogram.reduce((sum, b) => sum + b.count, 0);
  const findings: string[] = [];

  if (stats.skewness > 0.5) {
    findings.push(`The distribution is right-skewed (skewness: ${stats.skewness}), with a concentration of lower values and a tail extending toward higher values`);
  } else if (stats.skewness < -0.5) {
    findings.push(`The distribution is left-skewed (skewness: ${stats.skewness}), with a concentration of higher values and a tail toward lower values`);
  } else {
    findings.push(`The distribution is approximately symmetric (skewness: ${stats.skewness}), suggesting a balanced spread around the center`);
  }

  findings.push(`Central tendency: mean = ${stats.mean}, median = ${stats.median}. ${Math.abs(stats.mean - stats.median) > stats.std * 0.3 ? 'The gap between mean and median confirms the skew' : 'Mean and median are close, indicating symmetry'}`);
  findings.push(`Data spans from ${stats.min} to ${stats.max} (range: ${Math.round((stats.max - stats.min) * 100) / 100}) with std dev = ${stats.std}. IQR: [${stats.q1}, ${stats.q3}]`);
  findings.push(`The KDE curve overlaid on the histogram (${totalCount} observations) smooths the frequency distribution, revealing the underlying probability density shape`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `The ${data.columnName} column provides continuous numeric data with ${totalCount} observations and meaningful variation, ideal for distribution analysis`,
    findings,
  };
}

export function generatePieChartAnalysis(
  data: { label: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const findings: string[] = [];

  const dominant = data[0];
  findings.push(`"${dominant.label}" is the dominant category at ${((dominant.count / total) * 100).toFixed(1)}% (${dominant.count} of ${total} records)`);

  const evenShare = 100 / data.length;
  const maxDeviation = Math.max(...data.map(d => Math.abs((d.count / total) * 100 - evenShare)));
  findings.push(maxDeviation > 20
    ? `The distribution is notably imbalanced — some categories significantly outweigh others`
    : `The distribution is relatively balanced across categories`);

  const breakdown = data.slice(0, 5).map(d => `${d.label}: ${((d.count / total) * 100).toFixed(1)}%`).join(', ');
  findings.push(`Breakdown: ${breakdown}${data.length > 5 ? ` (+${data.length - 5} more)` : ''}`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `The ${columnName} column has ${data.length} distinct categories, well-suited for proportional analysis via pie chart`,
    findings,
  };
}

export function generateViolinAnalysis(
  violinData: ViolinGroupData[],
  datasetName: string,
  datasetDescription: string,
  numericColumn: string,
  categoryColumn: string
): VisualizationAnalysis {
  const findings: string[] = [];

  const sortedByMedian = [...violinData].sort((a, b) => b.median - a.median);
  findings.push(`Comparing ${categoryColumn} groups by ${numericColumn}: "${sortedByMedian[0].category}" has the highest median (${sortedByMedian[0].median}) while "${sortedByMedian[sortedByMedian.length - 1].category}" has the lowest (${sortedByMedian[sortedByMedian.length - 1].median})`);

  violinData.forEach(v => {
    const iqr = v.q3 - v.q1;
    const range = v.max - v.min;
    const ratio = range > 0 ? (iqr / range).toFixed(2) : '0';
    findings.push(`"${v.category}" (n=${v.count}): range [${v.min}, ${v.max}], IQR [${v.q1}, ${v.q3}] — ${parseFloat(ratio) > 0.5 ? 'tightly concentrated' : 'widely spread'}`);
  });

  findings.push(`The violin shapes reveal distribution density per group — wider sections indicate higher data concentration at that value`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `Pairing numeric (${numericColumn}) with categorical (${categoryColumn}) data enables violin plots to reveal within-group distribution shapes that summary statistics alone would miss`,
    findings,
  };
}

export function generateHeatMapAnalysis(
  heatMapData: HeatMapData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const { columns, matrix } = heatMapData;
  const findings: string[] = [];

  let strongestPos = { r: 0, pair: '' };
  let strongestNeg = { r: 0, pair: '' };
  let weakest = { r: 1, pair: '' };

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const r = matrix[i][j];
      if (r > strongestPos.r) strongestPos = { r, pair: `${columns[i]} & ${columns[j]}` };
      if (r < strongestNeg.r) strongestNeg = { r, pair: `${columns[i]} & ${columns[j]}` };
      if (Math.abs(r) < Math.abs(weakest.r)) weakest = { r, pair: `${columns[i]} & ${columns[j]}` };
    }
  }

  if (strongestPos.r > 0.3) {
    findings.push(`Strongest positive correlation: ${strongestPos.pair} (r = ${strongestPos.r}) — these features increase together`);
  }
  if (strongestNeg.r < -0.2) {
    findings.push(`Strongest negative correlation: ${strongestNeg.pair} (r = ${strongestNeg.r}) — inverse relationship`);
  }
  findings.push(`Weakest correlation: ${weakest.pair} (r = ${weakest.r}) — largely independent features`);

  const offDiag = matrix.flatMap((row, i) => row.filter((_, j) => i !== j).map(Math.abs));
  const avgAbsCorr = offDiag.reduce((a, b) => a + b, 0) / offDiag.length;
  findings.push(`Average |r| across all pairs: ${avgAbsCorr.toFixed(2)} — ${avgAbsCorr > 0.5 ? 'substantial interdependence' : avgAbsCorr > 0.3 ? 'moderate relationships' : 'mostly independent features'}`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${columns.length} continuous numeric features produce a ${columns.length}x${columns.length} correlation matrix revealing pairwise linear relationships through color intensity`,
    findings,
  };
}

export function generatePairPlotAnalysis(
  pairData: PairPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const findings: string[] = [];
  const numPairs = pairData.columns.length * (pairData.columns.length - 1) / 2;

  findings.push(`Visualizing ${numPairs} pairwise scatter relationships and ${pairData.columns.length} univariate distributions across: ${pairData.columns.join(', ')}`);

  if (pairData.groups.length > 1 && pairData.groups[0] !== 'all') {
    findings.push(`Color-coded by ${pairData.groupColumn} (${pairData.groups.join(', ')}) — revealing which feature combinations best separate the groups`);
  }

  findings.push(`Diagonal histograms show each feature's marginal distribution; off-diagonal scatter plots expose correlations, clusters, and non-linear relationships`);

  if (pairData.groups.length > 1 && pairData.groups[0] !== 'all') {
    findings.push(`Scatter cells with clearly separated color clusters indicate highly discriminative features for distinguishing ${pairData.groupColumn} categories`);
  }

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${pairData.columns.length} numeric features ${pairData.groupColumn ? `with categorical ${pairData.groupColumn} grouping ` : ''}enable comprehensive pairwise exploration in a single visualization`,
    findings,
  };
}

export function generateJointPlotAnalysis(
  jointData: JointPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const findings: string[] = [];
  const r = jointData.correlation;
  const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no';

  findings.push(`Pearson correlation r = ${r} — a ${strength} ${direction} linear relationship between ${jointData.xColumn} and ${jointData.yColumn}`);
  findings.push(`${jointData.xColumn}: mean = ${jointData.xStats.mean}, std = ${jointData.xStats.std}, range [${jointData.xStats.min}, ${jointData.xStats.max}]`);
  findings.push(`${jointData.yColumn}: mean = ${jointData.yStats.mean}, std = ${jointData.yStats.std}, range [${jointData.yStats.min}, ${jointData.yStats.max}]`);
  findings.push(`The marginal histograms along each axis reveal individual distributions, while the central scatter plot shows their joint behavior — together communicating more than either view alone`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `Two continuous numeric variables (${jointData.xColumn}, ${jointData.yColumn}) provide an ideal pair for joint plot analysis combining scatter, marginal, and density views`,
    findings,
  };
}

// =========================================================================
// Basic chart analysis generators (for existing chart types in CUSTOM mode)
// =========================================================================

export function generateBarAnalysis(
  data: { label: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `The ${columnName} column contains ${data.length} distinct categorical values suitable for bar chart comparison`,
    findings: [
      `Most frequent: "${data[0]?.label}" with ${data[0]?.count} occurrences (${((data[0]?.count / total) * 100).toFixed(1)}%)`,
      `Least frequent shown: "${data[data.length - 1]?.label}" with ${data[data.length - 1]?.count} occurrences (${((data[data.length - 1]?.count / total) * 100).toFixed(1)}%)`,
      `${total} total records across ${data.length} categories${data.length > 15 ? ' (showing top 15)' : ''}`,
    ],
  };
}

export function generateHistogramAnalysis(
  data: { range: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peakBin = data.reduce((best, d) => d.count > best.count ? d : best, data[0]);
  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `The ${columnName} column provides continuous numeric data across ${data.length} bins for frequency distribution analysis`,
    findings: [
      `Peak frequency at bin ${peakBin.range} with ${peakBin.count} observations (${((peakBin.count / total) * 100).toFixed(1)}% of total)`,
      `${total} total data points distributed across ${data.length} bins`,
      `The shape of the histogram reveals the underlying distribution pattern of ${columnName}`,
    ],
  };
}

export function generateScatterAnalysis(
  data: { x: number; y: number }[],
  datasetName: string,
  datasetDescription: string,
  xCol: string,
  yCol: string
): VisualizationAnalysis {
  const xVals = data.map(d => d.x);
  const yVals = data.map(d => d.y);
  const r = pearsonCorrelation(xVals, yVals);
  const xStats = calculateStats(xVals);
  const yStats = calculateStats(yVals);
  const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `Two numeric columns (${xCol}, ${yCol}) plotted against each other to reveal their relationship pattern`,
    findings: [
      `Correlation: r = ${r} (${strength} ${r >= 0 ? 'positive' : 'negative'} relationship)`,
      `${xCol} range: [${xStats.min}, ${xStats.max}], mean = ${xStats.mean}`,
      `${yCol} range: [${yStats.min}, ${yStats.max}], mean = ${yStats.mean}`,
      `${data.length} data points plotted — look for clusters, outliers, and non-linear patterns`,
    ],
  };
}

export function generateLineAnalysis(
  data: { date: string; value: number }[],
  datasetName: string,
  datasetDescription: string,
  dateCol: string,
  valueCol: string
): VisualizationAnalysis {
  const values = data.map(d => d.value);
  const stats = calculateStats(values);
  const trend = values.length > 1 ? (values[values.length - 1] > values[0] ? 'upward' : 'downward') : 'flat';

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `Time series data (${dateCol} vs ${valueCol}) with ${data.length} data points enables temporal trend analysis`,
    findings: [
      `Overall ${trend} trend from ${data[0]?.date} to ${data[data.length - 1]?.date}`,
      `${valueCol}: mean = ${stats.mean}, range [${stats.min}, ${stats.max}]`,
      `${data.length} time points plotted showing the evolution of ${valueCol} over ${dateCol}`,
    ],
  };
}

// =========================================================================
// Column suggestion for CUSTOM mode
// =========================================================================

type ColumnInfo = {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'datetime';
  uniqueCount: number;
};

export function suggestColumnsForChartType(
  chartType: string,
  columns: ColumnInfo[]
): {
  suggestion: string;
  recommendedColumns: string[];
  recommendedCategoryColumn?: string;
  reason: string;
} {
  const numericCols = columns.filter(c => c.type === 'numeric');
  const categoricalCols = columns.filter(c => c.type === 'categorical' && c.uniqueCount > 1 && c.uniqueCount <= 20);
  const booleanCols = columns.filter(c => c.type === 'boolean');

  switch (chartType) {
    case 'distplot': {
      const best = [...numericCols].sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      return {
        suggestion: best
          ? `Recommended: "${best.name}" (${best.uniqueCount} unique values) — high variation ideal for distribution analysis`
          : 'No suitable numeric columns found',
        recommendedColumns: best ? [best.name] : [],
        reason: 'Distribution plots need continuous numeric data with meaningful variation to reveal shape',
      };
    }
    case 'pie': {
      const best = [...categoricalCols, ...booleanCols]
        .filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 8)
        .sort((a, b) => a.uniqueCount - b.uniqueCount)[0];
      return {
        suggestion: best
          ? `Recommended: "${best.name}" (${best.uniqueCount} categories) — clean proportional breakdown`
          : 'No suitable columns with 2-8 categories found',
        recommendedColumns: best ? [best.name] : [],
        reason: 'Pie charts work best with 2-8 distinct categorical values for clear slices',
      };
    }
    case 'violin': {
      const bestNum = [...numericCols].sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      const bestCat = categoricalCols.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 10)
        .sort((a, b) => a.uniqueCount - b.uniqueCount)[0];
      return {
        suggestion: bestNum && bestCat
          ? `Recommended: "${bestNum.name}" grouped by "${bestCat.name}" (${bestCat.uniqueCount} groups)`
          : 'Need both a numeric and categorical column',
        recommendedColumns: bestNum ? [bestNum.name] : [],
        recommendedCategoryColumn: bestCat?.name,
        reason: 'Violin plots show distribution shape of a numeric variable across categories',
      };
    }
    case 'heatmap': {
      const recommended = numericCols.slice(0, 6).map(c => c.name);
      return {
        suggestion: recommended.length >= 2
          ? `Recommended: ${recommended.map(c => `"${c}"`).join(', ')} for correlation analysis`
          : 'Need at least 2 numeric columns',
        recommendedColumns: recommended,
        reason: 'Heatmaps visualize pairwise Pearson correlations between numeric features',
      };
    }
    case 'pairplot': {
      const recommended = numericCols.slice(0, 4).map(c => c.name);
      const groupCol = categoricalCols.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 6)[0];
      return {
        suggestion: recommended.length >= 2
          ? `Recommended: ${recommended.map(c => `"${c}"`).join(', ')}${groupCol ? ` colored by "${groupCol.name}"` : ''}`
          : 'Need at least 2 numeric columns',
        recommendedColumns: recommended,
        recommendedCategoryColumn: groupCol?.name,
        reason: 'Pair plots show all pairwise scatter plots and histograms, optionally colored by group',
      };
    }
    case 'jointplot': {
      const cols = numericCols.slice(0, 2);
      return {
        suggestion: cols.length >= 2
          ? `Recommended: "${cols[0].name}" vs "${cols[1].name}" for bivariate analysis`
          : 'Need at least 2 numeric columns',
        recommendedColumns: cols.map(c => c.name),
        reason: 'Joint plots combine scatter with marginal distributions for two numeric variables',
      };
    }
    default:
      return { suggestion: '', recommendedColumns: [], reason: '' };
  }
}
