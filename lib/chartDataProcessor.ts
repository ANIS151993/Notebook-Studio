// Utility functions for processing CSV data for chart generation

type DataRow = Record<string, unknown>;

/**
 * Detect if a value is missing (null, undefined, empty string, or whitespace)
 */
function isMissing(value: unknown): boolean {
  return value === null || value === undefined ||
         (typeof value === 'string' && value.trim() === '');
}

/**
 * Case-insensitive column search
 * Returns the actual column name if found, null otherwise
 */
export function hasColumn(columns: string[], searchTerm: string): string | null {
  const lowerSearch = searchTerm.toLowerCase();
  const found = columns.find(col => col.toLowerCase() === lowerSearch);
  return found || null;
}

/**
 * Detect column type based on data
 */
export function detectColumnType(
  data: DataRow[],
  columnName: string
): 'numeric' | 'categorical' | 'boolean' {
  if (data.length === 0) return 'categorical';

  const nonMissingValues = data
    .map(row => row[columnName])
    .filter(v => !isMissing(v));

  if (nonMissingValues.length === 0) return 'categorical';

  // Check if boolean (t/f, true/false, yes/no, 0/1, etc.)
  const uniqueValues = [...new Set(nonMissingValues.map(v => String(v).toLowerCase()))];
  if (uniqueValues.length <= 2 &&
      uniqueValues.every(v => ['t', 'f', 'true', 'false', 'yes', 'no', '0', '1'].includes(v))) {
    return 'boolean';
  }

  // Check if numeric (at least 80% of values can be parsed as numbers)
  const numericCount = nonMissingValues.filter(v => !isNaN(parseFloat(String(v)))).length;
  if (numericCount / nonMissingValues.length >= 0.8) {
    return 'numeric';
  }

  return 'categorical';
}

/**
 * Calculate missing values per column
 */
export function calculateMissingValues(data: DataRow[]): {
  column: string;
  count: number;
  percentage: number;
}[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0] || {});
  const result = columns.map(column => {
    const missingCount = data.filter(row => isMissing(row[column])).length;
    const percentage = (missingCount / data.length) * 100;

    return {
      column,
      count: missingCount,
      percentage,
    };
  });

  // Only return columns that actually have missing values
  return result.filter(r => r.count > 0);
}

/**
 * Count occurrences for categorical data
 */
export function countOccurrences(
  data: DataRow[],
  columnName: string
): { label: string; count: number }[] {
  if (!columnName || data.length === 0) return [];

  const counts = new Map<string, number>();

  data.forEach(row => {
    const value = row[columnName];
    if (!isMissing(value)) {
      const key = String(value).trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Create histogram bins for numeric data
 */
export function createHistogramBins(
  data: DataRow[],
  columnName: string,
  binCount: number = 10
): { range: string; count: number }[] {
  if (!columnName || data.length === 0) return [];

  // Extract and parse numeric values
  const values = data
    .map(row => parseFloat(String(row[columnName])))
    .filter(v => !isNaN(v));

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ range: String(min), count: values.length }];
  }

  const binSize = (max - min) / binCount;
  const bins: { range: string; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    const count = values.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;

    // Format range nicely
    const range = `${Math.round(binMin)}-${Math.round(binMax)}`;
    bins.push({ range, count });
  }

  return bins;
}

/**
 * Calculate fraud rate by category
 */
export function calculateFraudRateByCategory(
  data: DataRow[],
  categoryColumn: string,
  fraudColumn: string
): { category: string; fraudulent: number; legitimate: number }[] {
  if (!categoryColumn || !fraudColumn || data.length === 0) return [];

  const categoryMap = new Map<string, { fraudulent: number; legitimate: number }>();

  data.forEach(row => {
    const category = String(row[categoryColumn] || 'Unknown').trim();
    const fraudValue = String(row[fraudColumn]).toLowerCase().trim();

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { fraudulent: 0, legitimate: 0 });
    }

    const counts = categoryMap.get(category)!;

    // Check if fraudulent (t, true, 1, yes)
    if (['t', 'true', '1', 'yes'].includes(fraudValue)) {
      counts.fraudulent++;
    } else if (['f', 'false', '0', 'no'].includes(fraudValue)) {
      counts.legitimate++;
    }
  });

  return Array.from(categoryMap.entries())
    .map(([category, counts]) => ({
      category,
      fraudulent: counts.fraudulent,
      legitimate: counts.legitimate,
    }))
    .sort((a, b) => (b.fraudulent + b.legitimate) - (a.fraudulent + a.legitimate));
}

/**
 * Get top N items from count data
 */
export function getTopN(
  data: { label: string; count: number }[],
  n: number = 10,
  sortDescending: boolean = true
): { label: string; count: number }[] {
  const sorted = sortDescending
    ? [...data].sort((a, b) => b.count - a.count)
    : [...data].sort((a, b) => a.count - b.count);

  return sorted.slice(0, n);
}

/**
 * Check if a column contains datetime values
 */
export function isDateColumn(data: DataRow[], columnName: string): boolean {
  if (!columnName || data.length === 0) return false;

  const nonMissingValues = data
    .map(row => row[columnName])
    .filter(v => !isMissing(v))
    .slice(0, 100); // Sample first 100 rows

  if (nonMissingValues.length === 0) return false;

  // Check if at least 70% of values can be parsed as dates
  let validDates = 0;
  for (const value of nonMissingValues) {
    const dateValue = new Date(String(value));
    if (!isNaN(dateValue.getTime())) {
      validDates++;
    }
  }

  return validDates / nonMissingValues.length >= 0.7;
}

/**
 * Create scatter plot data from two numeric columns
 */
export function createScatterData(
  data: DataRow[],
  xColumn: string,
  yColumn: string
): { x: number; y: number }[] {
  if (!xColumn || !yColumn || data.length === 0) return [];

  const scatterPoints = data
    .map(row => {
      const x = parseFloat(String(row[xColumn]));
      const y = parseFloat(String(row[yColumn]));
      return { x, y };
    })
    .filter(point => !isNaN(point.x) && !isNaN(point.y));

  // Limit to 1000 points for performance
  return scatterPoints.slice(0, 1000);
}

/**
 * Create time series data for line charts
 */
export function createTimeSeriesData(
  data: DataRow[],
  dateColumn: string,
  valueColumn: string
): { date: string; value: number }[] {
  if (!dateColumn || !valueColumn || data.length === 0) return [];

  const timeSeriesData = data
    .map(row => {
      const dateValue = new Date(String(row[dateColumn]));
      const value = parseFloat(String(row[valueColumn]));

      if (isNaN(dateValue.getTime()) || isNaN(value)) return null;

      return {
        date: dateValue.toISOString().split('T')[0], // Format as YYYY-MM-DD
        value,
      };
    })
    .filter((item): item is { date: string; value: number } => item !== null);

  // Sort by date
  timeSeriesData.sort((a, b) => a.date.localeCompare(b.date));

  // Group by date and average values if multiple entries per date
  const dateMap = new Map<string, number[]>();
  timeSeriesData.forEach(({ date, value }) => {
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(value);
  });

  return Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    value: values.reduce((sum, v) => sum + v, 0) / values.length,
  }));
}
