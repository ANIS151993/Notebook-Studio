// Advanced data processing functions for new visualization types:
// KDE, correlation matrix, violin data, pair plot data, joint plot data

type DataRow = Record<string, unknown>;

// Gaussian kernel for KDE
function gaussianKernel(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Calculate basic statistics for a numeric array
export function calculateStats(values: number[]): {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  skewness: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0, skewness: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];

  const skewness = std > 0
    ? values.reduce((sum, v) => sum + ((v - mean) / std) ** 3, 0) / n
    : 0;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    std: Math.round(std * 100) / 100,
    min: sorted[0],
    max: sorted[n - 1],
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
  };
}

// Kernel Density Estimation
export function calculateKDE(
  values: number[],
  numPoints: number = 50,
  bandwidth?: number
): { x: number; density: number }[] {
  if (values.length === 0) return [];

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min || 1;

  // Silverman's rule of thumb
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n) || 1;
  const h = bandwidth || 1.06 * std * Math.pow(n, -0.2);

  const padding = range * 0.1;
  const step = (range + 2 * padding) / (numPoints - 1);
  const points: { x: number; density: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = min - padding + i * step;
    const density = values.reduce((sum, xi) => sum + gaussianKernel((x - xi) / h), 0) / (n * h);
    points.push({ x: Math.round(x * 100) / 100, density });
  }

  return points;
}

// Pearson correlation coefficient
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

// Extract numeric values from a column
export function extractNumericValues(data: DataRow[], column: string): number[] {
  return data
    .map(row => parseFloat(String(row[column])))
    .filter(v => !isNaN(v));
}

// =========================================================================
// Distribution Plot data
// =========================================================================
export type DistPlotData = {
  histogram: { range: string; count: number; binMin: number; binMax: number }[];
  kde: { x: number; density: number }[];
  stats: ReturnType<typeof calculateStats>;
  columnName: string;
};

export function generateDistPlotData(
  data: DataRow[],
  column: string,
  binCount: number = 20
): DistPlotData {
  const values = extractNumericValues(data, column);
  if (values.length === 0) {
    return { histogram: [], kde: [], stats: calculateStats([]), columnName: column };
  }

  const stats = calculateStats(values);
  const kde = calculateKDE(values, 60);

  const min = stats.min;
  const max = stats.max;
  const binSize = (max - min) / binCount || 1;
  const histogram: DistPlotData['histogram'] = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    const count = values.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
    histogram.push({
      range: `${Math.round(binMin * 10) / 10}`,
      count,
      binMin,
      binMax,
    });
  }

  return { histogram, kde, stats, columnName: column };
}

// =========================================================================
// Violin Plot data
// =========================================================================
export type ViolinGroupData = {
  category: string;
  kde: { value: number; density: number }[];
  maxDensity: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  count: number;
};

export function generateViolinData(
  data: DataRow[],
  numericColumn: string,
  categoryColumn: string
): ViolinGroupData[] {
  const groups = new Map<string, number[]>();

  data.forEach(row => {
    const cat = String(row[categoryColumn] ?? '').trim();
    const val = parseFloat(String(row[numericColumn]));
    if (cat && !isNaN(val)) {
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(val);
    }
  });

  const result: ViolinGroupData[] = [];

  groups.forEach((values, category) => {
    if (values.length < 3) return;

    const stats = calculateStats(values);
    const kdePoints = calculateKDE(values, 40);
    const kde = kdePoints.map(p => ({ value: p.x, density: p.density }));
    const maxDensity = Math.max(...kde.map(p => p.density));

    result.push({
      category,
      kde,
      maxDensity: maxDensity || 1,
      median: stats.median,
      q1: stats.q1,
      q3: stats.q3,
      min: stats.min,
      max: stats.max,
      count: values.length,
    });
  });

  return result.sort((a, b) => a.category.localeCompare(b.category));
}

// =========================================================================
// Heatmap data (correlation matrix)
// =========================================================================
export type HeatMapData = {
  columns: string[];
  matrix: number[][];
};

export function generateHeatMapData(
  data: DataRow[],
  columns: string[]
): HeatMapData {
  const numericArrays: Record<string, number[]> = {};
  columns.forEach(col => {
    numericArrays[col] = extractNumericValues(data, col);
  });

  const matrix = columns.map(colA =>
    columns.map(colB => pearsonCorrelation(numericArrays[colA], numericArrays[colB]))
  );

  return { columns, matrix };
}

// =========================================================================
// Pair Plot data
// =========================================================================
export type PairPlotData = {
  columns: string[];
  groupColumn?: string;
  groups: string[];
  scatterPairs: {
    xCol: string;
    yCol: string;
    points: { x: number; y: number; group: string }[];
  }[];
  histograms: {
    col: string;
    byGroup: { group: string; values: number[] }[];
  }[];
};

export function generatePairPlotData(
  data: DataRow[],
  columns: string[],
  groupColumn?: string
): PairPlotData {
  const groups = groupColumn
    ? [...new Set(data.map(row => String(row[groupColumn] ?? '').trim()).filter(Boolean))]
    : ['all'];

  const scatterPairs: PairPlotData['scatterPairs'] = [];
  const histograms: PairPlotData['histograms'] = [];

  for (let i = 0; i < columns.length; i++) {
    for (let j = 0; j < columns.length; j++) {
      if (i === j) continue;
      scatterPairs.push({
        xCol: columns[j],
        yCol: columns[i],
        points: data
          .map(row => ({
            x: parseFloat(String(row[columns[j]])),
            y: parseFloat(String(row[columns[i]])),
            group: groupColumn ? String(row[groupColumn] ?? '') : 'all',
          }))
          .filter(p => !isNaN(p.x) && !isNaN(p.y))
          .slice(0, 500),
      });
    }

    histograms.push({
      col: columns[i],
      byGroup: groups.map(group => ({
        group,
        values: data
          .filter(row => !groupColumn || String(row[groupColumn]) === group)
          .map(row => parseFloat(String(row[columns[i]])))
          .filter(v => !isNaN(v)),
      })),
    });
  }

  return { columns, groupColumn, groups, scatterPairs, histograms };
}

// =========================================================================
// Joint Plot data
// =========================================================================
export type JointPlotData = {
  scatter: { x: number; y: number }[];
  xHistogram: { range: string; count: number }[];
  yHistogram: { range: string; count: number }[];
  xKde: { x: number; density: number }[];
  yKde: { x: number; density: number }[];
  correlation: number;
  xColumn: string;
  yColumn: string;
  xStats: ReturnType<typeof calculateStats>;
  yStats: ReturnType<typeof calculateStats>;
};

export function generateJointPlotData(
  data: DataRow[],
  xColumn: string,
  yColumn: string,
  maxPoints: number = 500
): JointPlotData {
  const points = data
    .map(row => ({
      x: parseFloat(String(row[xColumn])),
      y: parseFloat(String(row[yColumn])),
    }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y))
    .slice(0, maxPoints);

  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);

  const xStats = calculateStats(xValues);
  const yStats = calculateStats(yValues);
  const correlation = pearsonCorrelation(xValues, yValues);

  const buildHistogram = (values: number[], stats: ReturnType<typeof calculateStats>, binCount: number = 15) => {
    const binSize = (stats.max - stats.min) / binCount || 1;
    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const binMin = stats.min + i * binSize;
      const binMax = stats.min + (i + 1) * binSize;
      bins.push({
        range: `${Math.round(binMin * 10) / 10}`,
        count: values.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length,
      });
    }
    return bins;
  };

  return {
    scatter: points,
    xHistogram: buildHistogram(xValues, xStats),
    yHistogram: buildHistogram(yValues, yStats),
    xKde: calculateKDE(xValues, 40),
    yKde: calculateKDE(yValues, 40),
    correlation,
    xColumn,
    yColumn,
    xStats,
    yStats,
  };
}
