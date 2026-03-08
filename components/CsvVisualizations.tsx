"use client";

import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as chartProcessor from '@/lib/chartDataProcessor';
import MissingValuesChart from './charts/MissingValuesChart';
import FraudDistributionChart from './charts/FraudDistributionChart';
import TopIndustriesChart from './charts/TopIndustriesChart';
import GeographicDistributionChart from './charts/GeographicDistributionChart';
import ExperienceDistributionChart from './charts/ExperienceDistributionChart';
import SalaryHistogramChart from './charts/SalaryHistogramChart';
import TelecommutingChart from './charts/TelecommutingChart';
import FraudRateByTypeChart from './charts/FraudRateByTypeChart';
import UniversalBarChart from './charts/UniversalBarChart';
import UniversalHistogram from './charts/UniversalHistogram';
import UniversalPieChart from './charts/UniversalPieChart';
import UniversalScatterChart from './charts/UniversalScatterChart';
import UniversalLineChart from './charts/UniversalLineChart';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  cleanedCsv: string;
  stats: { rows: number; columns: string[] };
};

type ColumnAnalysis = {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'datetime';
  uniqueCount: number;
  missingCount: number;
  sampleValues: unknown[];
};

type ChartSpecBase = {
  id: string;
  title: string;
  description: string;
  columns: string[];
};

type ChartSpec =
  | (ChartSpecBase & {
      type: 'bar' | 'pie';
      data: ReturnType<typeof chartProcessor.countOccurrences>;
    })
  | (ChartSpecBase & {
      type: 'histogram';
      data: ReturnType<typeof chartProcessor.createHistogramBins>;
    })
  | (ChartSpecBase & {
      type: 'scatter';
      data: ReturnType<typeof chartProcessor.createScatterData>;
    })
  | (ChartSpecBase & {
      type: 'line';
      data: ReturnType<typeof chartProcessor.createTimeSeriesData>;
    });

type StandardChartData = {
  missingValues?: ReturnType<typeof chartProcessor.calculateMissingValues>;
  fraudDistribution?: ReturnType<typeof chartProcessor.countOccurrences>;
  topIndustries?: ReturnType<typeof chartProcessor.getTopN>;
  geographic?: ReturnType<typeof chartProcessor.getTopN>;
  experience?: ReturnType<typeof chartProcessor.countOccurrences>;
  salary?: ReturnType<typeof chartProcessor.createHistogramBins>;
  telecommuting?: ReturnType<typeof chartProcessor.countOccurrences>;
  fraudRateByType?: ReturnType<typeof chartProcessor.calculateFraudRateByCategory>;
};

type ChartErrorBoundaryProps = {
  children: ReactNode;
};

type ChartErrorBoundaryState = {
  hasError: boolean;
};

class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Standard chart render failed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
          <p className="text-sm text-[#c9a961]">
            This standard chart could not be rendered. Use Custom mode for this dataset.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CsvVisualizations({ cleanedCsv, stats }: Props) {
  // State for switching between standard and custom views
  const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');

  // State for custom chart builder
  const [selectedCharts, setSelectedCharts] = useState<ChartSpec[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedColumn2, setSelectedColumn2] = useState<string>('');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'histogram' | 'pie' | 'scatter' | 'line'>('bar');

  // Parse CSV data
  const parsedData = useMemo(() => {
    if (!cleanedCsv) return [];
    const result = Papa.parse<Record<string, string>>(cleanedCsv, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data;
  }, [cleanedCsv]);

  // Detect available columns (case-insensitive)
  const detectedColumns = useMemo(() => ({
    fraud: chartProcessor.hasColumn(stats.columns, 'fraudulent'),
    employmentType: chartProcessor.hasColumn(stats.columns, 'employment_type'),
    industry: chartProcessor.hasColumn(stats.columns, 'industry'),
    experience: chartProcessor.hasColumn(stats.columns, 'required_experience'),
    salary: chartProcessor.hasColumn(stats.columns, 'salary_min'),
    telecommuting: chartProcessor.hasColumn(stats.columns, 'telecommuting'),
    country: chartProcessor.hasColumn(stats.columns, 'country'),
    state: chartProcessor.hasColumn(stats.columns, 'state'),
  }), [stats.columns]);

  // Process data for each chart type
  const chartData = useMemo<StandardChartData>(() => {
    if (!parsedData.length) return {};

    const data: StandardChartData = {};

    // Missing values chart (always calculate)
    data.missingValues = chartProcessor.calculateMissingValues(parsedData);

    // Fraud distribution chart
    if (detectedColumns.fraud) {
      data.fraudDistribution = chartProcessor.countOccurrences(parsedData, detectedColumns.fraud);
    }

    // Top industries chart
    if (detectedColumns.industry) {
      data.topIndustries = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, detectedColumns.industry),
        10
      );
    }

    // Geographic distribution chart (prefer country, fallback to state)
    const geoColumn = detectedColumns.country || detectedColumns.state;
    if (geoColumn) {
      data.geographic = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, geoColumn),
        15
      );
    }

    // Experience distribution chart
    if (detectedColumns.experience) {
      data.experience = chartProcessor.countOccurrences(parsedData, detectedColumns.experience);
    }

    // Salary histogram chart
    if (detectedColumns.salary) {
      data.salary = chartProcessor.createHistogramBins(parsedData, detectedColumns.salary, 10);
    }

    // Telecommuting chart
    if (detectedColumns.telecommuting) {
      data.telecommuting = chartProcessor.countOccurrences(parsedData, detectedColumns.telecommuting);
    }

    // Fraud rate by type chart
    if (detectedColumns.fraud && detectedColumns.employmentType) {
      data.fraudRateByType = chartProcessor.calculateFraudRateByCategory(
        parsedData,
        detectedColumns.employmentType,
        detectedColumns.fraud
      );
    }

    return data;
  }, [parsedData, detectedColumns]);

  // Check if any charts have data
  const hasCharts = Object.values(chartData).some((value) => Boolean(value?.length));

  // ========== CUSTOM CHARTS LOGIC ==========
  // Analyze all columns for custom charts
  const columnAnalysis = useMemo((): ColumnAnalysis[] => {
    if (!parsedData.length) return [];

    return stats.columns.map(columnName => {
      const type = chartProcessor.detectColumnType(parsedData, columnName);
      const values = parsedData.map(row => row[columnName]);
      const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
      const missingCount = values.filter(v => v === null || v === undefined || v === '').length;

      return {
        name: columnName,
        type: chartProcessor.isDateColumn(parsedData, columnName) ? 'datetime' : type,
        uniqueCount: uniqueValues.size,
        missingCount,
        sampleValues: Array.from(uniqueValues).slice(0, 5),
      };
    });
  }, [parsedData, stats.columns]);

  // Generate custom chart specifications
  const customChartSpecs = useMemo((): ChartSpec[] => {
    if (!parsedData.length || !columnAnalysis.length) return [];

    const specs: ChartSpec[] = [];
    const numericColumns = columnAnalysis
      .filter((column) => column.type === "numeric")
      .slice(0, 6);
    const categoricalColumns = columnAnalysis
      .filter((column) => column.type === "categorical" && column.uniqueCount > 1)
      .slice(0, 8);
    const booleanColumns = columnAnalysis
      .filter((column) => column.type === "boolean")
      .slice(0, 4);
    const dateColumns = columnAnalysis
      .filter((column) => column.type === "datetime")
      .slice(0, 3);

    // 1. Histograms for numeric columns
    numericColumns.forEach(col => {
      const histogramData = chartProcessor.createHistogramBins(parsedData, col.name, 15);
      if (histogramData.length > 0) {
        specs.push({
          id: `hist-${col.name}`,
          type: 'histogram',
          title: `Distribution of ${col.name}`,
          description: `Histogram showing the frequency distribution`,
          columns: [col.name],
          data: histogramData,
        });
      }
    });

    // 2. Bar charts for categorical columns
    categoricalColumns.forEach(col => {
      const barData = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, col.name),
        15
      );
      if (barData.length > 0) {
        specs.push({
          id: `bar-${col.name}`,
          type: 'bar',
          title: `Top ${Math.min(15, barData.length)} ${col.name}`,
          description: `Distribution of values in ${col.name}`,
          columns: [col.name],
          data: barData,
        });
      }
    });

    // 3. Pie charts for boolean columns
    booleanColumns.forEach(col => {
      const pieData = chartProcessor.countOccurrences(parsedData, col.name);
      if (pieData.length > 0) {
        specs.push({
          id: `pie-${col.name}`,
          type: 'pie',
          title: `${col.name} Distribution`,
          description: `Breakdown of ${col.name} values`,
          columns: [col.name],
          data: pieData,
        });
      }
    });

    // 4. Scatter plots for pairs of numeric columns
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length && specs.filter(s => s.type === 'scatter').length < 3; j++) {
        const xCol = numericColumns[i].name;
        const yCol = numericColumns[j].name;
        const scatterData = chartProcessor.createScatterData(parsedData, xCol, yCol);

        if (scatterData.length > 0) {
          specs.push({
            id: `scatter-${xCol}-${yCol}`,
            type: 'scatter',
            title: `${yCol} vs ${xCol}`,
            description: `Relationship between ${xCol} and ${yCol}`,
            columns: [xCol, yCol],
            data: scatterData,
          });
        }
      }
    }

    // 5. Line charts for datetime series
    dateColumns.forEach(dateCol => {
      if (numericColumns.length > 0) {
        const numCol = numericColumns[0];
        const lineData = chartProcessor.createTimeSeriesData(parsedData, dateCol.name, numCol.name);

        if (lineData.length > 0) {
          specs.push({
            id: `line-${dateCol.name}-${numCol.name}`,
            type: 'line',
            title: `${numCol.name} over ${dateCol.name}`,
            description: `Time series showing ${numCol.name} trends`,
            columns: [dateCol.name, numCol.name],
            data: lineData,
          });
        }
      }
    });

    return specs;
  }, [parsedData, columnAnalysis]);

  // Function to add a custom chart based on user selection
  const handleAddChart = () => {
    if (!selectedColumn || !parsedData.length) return;

    const chartId = `custom-${Date.now()}`;
    let newChart: ChartSpec | null = null;

    switch (selectedChartType) {
      case 'histogram': {
        const histogramData = chartProcessor.createHistogramBins(parsedData, selectedColumn, 15);
        if (histogramData.length > 0) {
          newChart = {
            id: chartId,
            type: 'histogram',
            title: `Distribution of ${selectedColumn}`,
            description: `Histogram showing frequency distribution`,
            columns: [selectedColumn],
            data: histogramData,
          };
        }
        break;
      }
      case 'bar': {
        const barData = chartProcessor.getTopN(
          chartProcessor.countOccurrences(parsedData, selectedColumn),
          15
        );
        if (barData.length > 0) {
          newChart = {
            id: chartId,
            type: 'bar',
            title: `Top ${Math.min(15, barData.length)} ${selectedColumn}`,
            description: `Distribution of values`,
            columns: [selectedColumn],
            data: barData,
          };
        }
        break;
      }
      case 'pie': {
        const pieData = chartProcessor.countOccurrences(parsedData, selectedColumn);
        if (pieData.length > 0) {
          newChart = {
            id: chartId,
            type: 'pie',
            title: `${selectedColumn} Distribution`,
            description: `Breakdown of values`,
            columns: [selectedColumn],
            data: pieData,
          };
        }
        break;
      }
      case 'scatter': {
        if (!selectedColumn2) {
          alert('Please select a second column for scatter plot');
          return;
        }
        const scatterData = chartProcessor.createScatterData(parsedData, selectedColumn, selectedColumn2);
        if (scatterData.length > 0) {
          newChart = {
            id: chartId,
            type: 'scatter',
            title: `${selectedColumn2} vs ${selectedColumn}`,
            description: `Relationship between columns`,
            columns: [selectedColumn, selectedColumn2],
            data: scatterData,
          };
        }
        break;
      }
      case 'line': {
        if (!selectedColumn2) {
          alert('Please select a second column for line chart');
          return;
        }
        const lineData = chartProcessor.createTimeSeriesData(parsedData, selectedColumn, selectedColumn2);
        if (lineData.length > 0) {
          newChart = {
            id: chartId,
            type: 'line',
            title: `${selectedColumn2} over ${selectedColumn}`,
            description: `Time series trend`,
            columns: [selectedColumn, selectedColumn2],
            data: lineData,
          };
        }
        break;
      }
    }

    if (newChart) {
      setSelectedCharts(prev => [...prev, newChart!]);
      setSelectedColumn('');
      setSelectedColumn2('');
    } else {
      alert('Could not generate chart with selected options');
    }
  };

  // Function to remove a chart
  const handleRemoveChart = (chartId: string) => {
    setSelectedCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const renderUniversalChart = (spec: ChartSpec) => {
    switch (spec.type) {
      case 'histogram':
        return (
          <UniversalHistogram
            title={spec.title}
            description={spec.description}
            data={spec.data}
          />
        );
      case 'bar':
        return (
          <UniversalBarChart
            title={spec.title}
            description={spec.description}
            data={spec.data}
          />
        );
      case 'pie':
        return (
          <UniversalPieChart
            title={spec.title}
            description={spec.description}
            data={spec.data}
          />
        );
      case 'scatter':
        return (
          <UniversalScatterChart
            title={spec.title}
            description={spec.description}
            data={spec.data}
            xLabel={spec.columns[0]}
            yLabel={spec.columns[1]}
          />
        );
      case 'line':
        return (
          <UniversalLineChart
            title={spec.title}
            description={spec.description}
            data={spec.data}
            xLabel={spec.columns[0]}
            yLabel={spec.columns[1]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section with view toggle */}
      <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#f4d03f]">
              Data Visualizations
            </h3>
            <p className="mt-2 text-sm text-[#c9a961]">
              {viewMode === 'standard'
                ? 'Predefined charts for job posting data'
                : 'Build custom charts by selecting columns and chart types'} • {parsedData.length} rows analyzed
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('standard')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                viewMode === 'standard'
                  ? 'bg-[#f4d03f] text-[#0a0a0a]'
                  : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#2a2416]'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                viewMode === 'custom'
                  ? 'bg-[#f4d03f] text-[#0a0a0a]'
                  : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#2a2416]'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

	      {/* Standard Charts View */}
      {viewMode === 'standard' && (
        <>
          {hasCharts ? (
            <div className="grid gap-6 md:grid-cols-2">
              {chartData.missingValues && chartData.missingValues.length > 0 && (
                <ChartErrorBoundary>
                  <MissingValuesChart data={chartData.missingValues} />
                </ChartErrorBoundary>
              )}

              {chartData.fraudDistribution && chartData.fraudDistribution.length > 0 && (
                <ChartErrorBoundary>
                  <FraudDistributionChart data={chartData.fraudDistribution} />
                </ChartErrorBoundary>
              )}

              {chartData.topIndustries && chartData.topIndustries.length > 0 && (
                <ChartErrorBoundary>
                  <TopIndustriesChart data={chartData.topIndustries} />
                </ChartErrorBoundary>
              )}

              {chartData.geographic && chartData.geographic.length > 0 && (
                <ChartErrorBoundary>
                  <GeographicDistributionChart data={chartData.geographic} />
                </ChartErrorBoundary>
              )}

              {chartData.experience && chartData.experience.length > 0 && (
                <ChartErrorBoundary>
                  <ExperienceDistributionChart data={chartData.experience} />
                </ChartErrorBoundary>
              )}

              {chartData.salary && chartData.salary.length > 0 && (
                <ChartErrorBoundary>
                  <SalaryHistogramChart data={chartData.salary} />
                </ChartErrorBoundary>
              )}

              {chartData.telecommuting && chartData.telecommuting.length > 0 && (
                <ChartErrorBoundary>
                  <TelecommutingChart data={chartData.telecommuting} />
                </ChartErrorBoundary>
              )}

	              {chartData.fraudRateByType && chartData.fraudRateByType.length > 0 && (
                <ChartErrorBoundary>
                  <FraudRateByTypeChart data={chartData.fraudRateByType} />
                </ChartErrorBoundary>
              )}
            </div>
          ) : customChartSpecs.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-4 text-sm text-[#c9a961]">
                Standard preset charts were not detected for this dataset. Showing smart
                standard charts generated from your columns.
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {customChartSpecs.slice(0, 4).map((spec) => (
                  <div key={spec.id}>{renderUniversalChart(spec)}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-8 text-center">
              <p className="text-[#c9a961]">
                No standard visualizations available for this dataset.
                Try switching to Custom mode for auto-generated charts.
              </p>
            </div>
          )}
        </>
      )}

      {/* Custom Charts View */}
      {viewMode === 'custom' && (
        <>
          {/* Chart Builder Interface */}
	          <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-6">
	            <h4 className="mb-4 text-base font-semibold text-[#f4d03f]">
	              Build Custom Chart
	            </h4>
	            {customChartSpecs.length > 0 && (
	              <p className="mb-4 text-xs text-[#c9a961]">
	                Auto-analysis found {customChartSpecs.length} suggested chart patterns for this dataset.
	              </p>
	            )}

            {/* Chart Type Selector */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                Select Chart Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(['bar', 'histogram', 'pie', 'scatter', 'line'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedChartType(type)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      selectedChartType === type
                        ? 'bg-[#f4d03f] text-[#0a0a0a]'
                        : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#3a3420]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Selectors */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                  {selectedChartType === 'scatter' || selectedChartType === 'line'
                    ? 'Select X-Axis Column'
                    : 'Select Column'}
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full rounded-lg border border-[#d4af37] bg-[#1a1a1a] px-4 py-2 text-sm text-[#c9a961] focus:border-[#f4d03f] focus:outline-none"
                >
                  <option value="">-- Choose Column --</option>
                  {stats.columns.map(col => (
                    <option key={col} value={col}>
                      {col} ({columnAnalysis.find(c => c.name === col)?.type})
                    </option>
                  ))}
                </select>
              </div>

              {(selectedChartType === 'scatter' || selectedChartType === 'line') && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                    Select Y-Axis Column
                  </label>
                  <select
                    value={selectedColumn2}
                    onChange={(e) => setSelectedColumn2(e.target.value)}
                    className="w-full rounded-lg border border-[#d4af37] bg-[#1a1a1a] px-4 py-2 text-sm text-[#c9a961] focus:border-[#f4d03f] focus:outline-none"
                  >
                    <option value="">-- Choose Column --</option>
                    {stats.columns
                      .filter(col => col !== selectedColumn)
                      .map(col => (
                        <option key={col} value={col}>
                          {col} ({columnAnalysis.find(c => c.name === col)?.type})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Add Chart Button */}
            <button
              onClick={handleAddChart}
              disabled={!selectedColumn}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
            >
              + Add Chart
            </button>
          </div>

          {/* Display Selected Charts */}
          {selectedCharts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {selectedCharts.map(spec => {
                return (
                  <div key={spec.id} className="relative">
                    {renderUniversalChart(spec)}
                    <button
                      onClick={() => handleRemoveChart(spec.id)}
                      className="absolute right-2 top-2 rounded-lg bg-[#2a2416] p-2 text-xs text-[#ff6b6b] transition hover:bg-[#3a3420]"
                      title="Remove chart"
                    >
                      ✕ Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-8 text-center">
              <p className="text-[#c9a961]">
                No charts added yet. Use the chart builder above to create custom visualizations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
