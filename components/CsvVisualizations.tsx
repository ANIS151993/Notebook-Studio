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
  Filler,
} from 'chart.js';
import * as chartProcessor from '@/lib/chartDataProcessor';
import {
  generateDistPlotData,
  generateViolinData,
  generateHeatMapData,
  generatePairPlotData,
  generateJointPlotData,
  type DistPlotData,
  type ViolinGroupData,
  type HeatMapData,
  type PairPlotData,
  type JointPlotData,
} from '@/lib/advancedDataProcessors';
import {
  generateDistPlotAnalysis,
  generatePieChartAnalysis,
  generateViolinAnalysis,
  generateHeatMapAnalysis,
  generatePairPlotAnalysis,
  generateJointPlotAnalysis,
  generateBarAnalysis,
  generateHistogramAnalysis,
  generateScatterAnalysis,
  generateLineAnalysis,
  suggestColumnsForChartType,
  type VisualizationAnalysis,
} from '@/lib/visualizationAnalysis';

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
import UniversalDistPlot from './charts/UniversalDistPlot';
import UniversalViolinPlot from './charts/UniversalViolinPlot';
import UniversalHeatMap from './charts/UniversalHeatMap';
import UniversalPairPlot from './charts/UniversalPairPlot';
import UniversalJointPlot from './charts/UniversalJointPlot';
import AdvancedStandardVisualizations from './AdvancedStandardVisualizations';

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
  Legend,
  Filler
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
  analysis?: VisualizationAnalysis;
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
    })
  | (ChartSpecBase & { type: 'distplot'; data: DistPlotData })
  | (ChartSpecBase & { type: 'violin'; data: ViolinGroupData[] })
  | (ChartSpecBase & { type: 'heatmap'; data: HeatMapData })
  | (ChartSpecBase & { type: 'pairplot'; data: PairPlotData })
  | (ChartSpecBase & { type: 'jointplot'; data: JointPlotData });

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

// All chart types for CUSTOM mode
type AllChartTypes = 'bar' | 'histogram' | 'pie' | 'scatter' | 'line' | 'distplot' | 'violin' | 'heatmap' | 'pairplot' | 'jointplot';

const CHART_TYPE_LABELS: Record<AllChartTypes, string> = {
  bar: 'Bar',
  histogram: 'Histogram',
  pie: 'Pie',
  scatter: 'Scatter',
  line: 'Line',
  distplot: 'DistPlot',
  violin: 'Violin',
  heatmap: 'HeatMap',
  pairplot: 'PairPlot',
  jointplot: 'JointPlot',
};

// Chart types needing 2 columns (X + Y)
const TWO_COLUMN_TYPES: AllChartTypes[] = ['scatter', 'line', 'jointplot'];
// Chart types needing multiple columns (checkbox)
const MULTI_COLUMN_TYPES: AllChartTypes[] = ['heatmap', 'pairplot'];
// Chart types needing a category column
const CATEGORY_COLUMN_TYPES: AllChartTypes[] = ['violin', 'pairplot'];

export default function CsvVisualizations({ cleanedCsv, stats }: Props) {
  const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');

  // Custom chart builder state
  const [selectedCharts, setSelectedCharts] = useState<ChartSpec[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedColumn2, setSelectedColumn2] = useState<string>('');
  const [selectedChartType, setSelectedChartType] = useState<AllChartTypes>('bar');
  const [selectedMultiColumns, setSelectedMultiColumns] = useState<string[]>([]);
  const [selectedCategoryColumn, setSelectedCategoryColumn] = useState<string>('');

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

  // Process data for standard charts
  const chartData = useMemo<StandardChartData>(() => {
    if (!parsedData.length) return {};

    const data: StandardChartData = {};

    data.missingValues = chartProcessor.calculateMissingValues(parsedData);

    if (detectedColumns.fraud) {
      data.fraudDistribution = chartProcessor.countOccurrences(parsedData, detectedColumns.fraud);
    }

    if (detectedColumns.industry) {
      data.topIndustries = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, detectedColumns.industry), 10
      );
    }

    const geoColumn = detectedColumns.country || detectedColumns.state;
    if (geoColumn) {
      data.geographic = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, geoColumn), 15
      );
    }

    if (detectedColumns.experience) {
      data.experience = chartProcessor.countOccurrences(parsedData, detectedColumns.experience);
    }

    if (detectedColumns.salary) {
      data.salary = chartProcessor.createHistogramBins(parsedData, detectedColumns.salary, 10);
    }

    if (detectedColumns.telecommuting) {
      data.telecommuting = chartProcessor.countOccurrences(parsedData, detectedColumns.telecommuting);
    }

    if (detectedColumns.fraud && detectedColumns.employmentType) {
      data.fraudRateByType = chartProcessor.calculateFraudRateByCategory(
        parsedData, detectedColumns.employmentType, detectedColumns.fraud
      );
    }

    return data;
  }, [parsedData, detectedColumns]);

  const hasCharts = Object.values(chartData).some((value) => Boolean(value?.length));

  // ========== CUSTOM CHARTS LOGIC ==========

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

  // Dataset suggestion for current chart type
  const chartSuggestion = useMemo(() => {
    if (!columnAnalysis.length) return null;
    return suggestColumnsForChartType(selectedChartType, columnAnalysis);
  }, [selectedChartType, columnAnalysis]);

  // Auto-generated chart specs (for standard fallback)
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

    numericColumns.forEach(col => {
      const histogramData = chartProcessor.createHistogramBins(parsedData, col.name, 15);
      if (histogramData.length > 0) {
        specs.push({
          id: `hist-${col.name}`, type: 'histogram',
          title: `Distribution of ${col.name}`,
          description: `Histogram showing the frequency distribution`,
          columns: [col.name], data: histogramData,
        });
      }
    });

    categoricalColumns.forEach(col => {
      const barData = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, col.name), 15
      );
      if (barData.length > 0) {
        specs.push({
          id: `bar-${col.name}`, type: 'bar',
          title: `Top ${Math.min(15, barData.length)} ${col.name}`,
          description: `Distribution of values in ${col.name}`,
          columns: [col.name], data: barData,
        });
      }
    });

    booleanColumns.forEach(col => {
      const pieData = chartProcessor.countOccurrences(parsedData, col.name);
      if (pieData.length > 0) {
        specs.push({
          id: `pie-${col.name}`, type: 'pie',
          title: `${col.name} Distribution`,
          description: `Breakdown of ${col.name} values`,
          columns: [col.name], data: pieData,
        });
      }
    });

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length && specs.filter(s => s.type === 'scatter').length < 3; j++) {
        const xCol = numericColumns[i].name;
        const yCol = numericColumns[j].name;
        const scatterData = chartProcessor.createScatterData(parsedData, xCol, yCol);
        if (scatterData.length > 0) {
          specs.push({
            id: `scatter-${xCol}-${yCol}`, type: 'scatter',
            title: `${yCol} vs ${xCol}`,
            description: `Relationship between ${xCol} and ${yCol}`,
            columns: [xCol, yCol], data: scatterData,
          });
        }
      }
    }

    dateColumns.forEach(dateCol => {
      if (numericColumns.length > 0) {
        const numCol = numericColumns[0];
        const lineData = chartProcessor.createTimeSeriesData(parsedData, dateCol.name, numCol.name);
        if (lineData.length > 0) {
          specs.push({
            id: `line-${dateCol.name}-${numCol.name}`, type: 'line',
            title: `${numCol.name} over ${dateCol.name}`,
            description: `Time series showing ${numCol.name} trends`,
            columns: [dateCol.name, numCol.name], data: lineData,
          });
        }
      }
    });

    return specs;
  }, [parsedData, columnAnalysis]);

  // ========== HANDLERS ==========

  const handleAddChart = () => {
    if (!parsedData.length) return;
    const chartId = `custom-${Date.now()}`;
    let newChart: ChartSpec | null = null;
    const dsName = 'Uploaded CSV';
    const dsDesc = `Your uploaded dataset (${parsedData.length} rows)`;

    // Validate column selection
    if (MULTI_COLUMN_TYPES.includes(selectedChartType)) {
      if (selectedMultiColumns.length < 2) {
        alert('Please select at least 2 columns');
        return;
      }
    } else if (!selectedColumn) {
      alert('Please select a column');
      return;
    }

    if (TWO_COLUMN_TYPES.includes(selectedChartType) && !selectedColumn2) {
      alert('Please select a second column');
      return;
    }

    if (CATEGORY_COLUMN_TYPES.includes(selectedChartType) && selectedChartType === 'violin' && !selectedCategoryColumn) {
      alert('Please select a category column for violin plot');
      return;
    }

    switch (selectedChartType) {
      case 'histogram': {
        const histogramData = chartProcessor.createHistogramBins(parsedData, selectedColumn, 15);
        if (histogramData.length > 0) {
          newChart = {
            id: chartId, type: 'histogram',
            title: `Distribution of ${selectedColumn}`,
            description: `Histogram showing frequency distribution`,
            columns: [selectedColumn], data: histogramData,
            analysis: generateHistogramAnalysis(histogramData, dsName, dsDesc, selectedColumn),
          };
        }
        break;
      }
      case 'bar': {
        const barData = chartProcessor.getTopN(
          chartProcessor.countOccurrences(parsedData, selectedColumn), 15
        );
        if (barData.length > 0) {
          newChart = {
            id: chartId, type: 'bar',
            title: `Top ${Math.min(15, barData.length)} ${selectedColumn}`,
            description: `Distribution of values`,
            columns: [selectedColumn], data: barData,
            analysis: generateBarAnalysis(barData, dsName, dsDesc, selectedColumn),
          };
        }
        break;
      }
      case 'pie': {
        const pieData = chartProcessor.countOccurrences(parsedData, selectedColumn);
        if (pieData.length > 0) {
          newChart = {
            id: chartId, type: 'pie',
            title: `${selectedColumn} Distribution`,
            description: `Breakdown of values`,
            columns: [selectedColumn], data: pieData,
            analysis: generatePieChartAnalysis(pieData, dsName, dsDesc, selectedColumn),
          };
        }
        break;
      }
      case 'scatter': {
        const scatterData = chartProcessor.createScatterData(parsedData, selectedColumn, selectedColumn2);
        if (scatterData.length > 0) {
          newChart = {
            id: chartId, type: 'scatter',
            title: `${selectedColumn2} vs ${selectedColumn}`,
            description: `Relationship between columns`,
            columns: [selectedColumn, selectedColumn2], data: scatterData,
            analysis: generateScatterAnalysis(scatterData, dsName, dsDesc, selectedColumn, selectedColumn2),
          };
        }
        break;
      }
      case 'line': {
        const lineData = chartProcessor.createTimeSeriesData(parsedData, selectedColumn, selectedColumn2);
        if (lineData.length > 0) {
          newChart = {
            id: chartId, type: 'line',
            title: `${selectedColumn2} over ${selectedColumn}`,
            description: `Time series trend`,
            columns: [selectedColumn, selectedColumn2], data: lineData,
            analysis: generateLineAnalysis(lineData, dsName, dsDesc, selectedColumn, selectedColumn2),
          };
        }
        break;
      }
      case 'distplot': {
        const distData = generateDistPlotData(parsedData, selectedColumn, 20);
        if (distData.histogram.length > 0) {
          newChart = {
            id: chartId, type: 'distplot',
            title: `Distribution of ${selectedColumn}`,
            description: `Histogram with KDE density curve`,
            columns: [selectedColumn], data: distData,
            analysis: generateDistPlotAnalysis(distData, dsName, dsDesc),
          };
        }
        break;
      }
      case 'violin': {
        const vData = generateViolinData(parsedData, selectedColumn, selectedCategoryColumn);
        if (vData.length > 0) {
          newChart = {
            id: chartId, type: 'violin',
            title: `${selectedColumn} by ${selectedCategoryColumn}`,
            description: `Distribution comparison across categories`,
            columns: [selectedColumn, selectedCategoryColumn], data: vData,
            analysis: generateViolinAnalysis(vData, dsName, dsDesc, selectedColumn, selectedCategoryColumn),
          };
        }
        break;
      }
      case 'heatmap': {
        const hmData = generateHeatMapData(parsedData, selectedMultiColumns);
        newChart = {
          id: chartId, type: 'heatmap',
          title: 'Correlation Heatmap',
          description: `Pairwise correlations across ${selectedMultiColumns.length} features`,
          columns: [...selectedMultiColumns], data: hmData,
          analysis: generateHeatMapAnalysis(hmData, dsName, dsDesc),
        };
        break;
      }
      case 'pairplot': {
        const ppData = generatePairPlotData(parsedData, selectedMultiColumns, selectedCategoryColumn || undefined);
        newChart = {
          id: chartId, type: 'pairplot',
          title: 'Pair Plot',
          description: `Pairwise analysis of ${selectedMultiColumns.length} features${selectedCategoryColumn ? ` grouped by ${selectedCategoryColumn}` : ''}`,
          columns: [...selectedMultiColumns], data: ppData,
          analysis: generatePairPlotAnalysis(ppData, dsName, dsDesc),
        };
        break;
      }
      case 'jointplot': {
        const jpData = generateJointPlotData(parsedData, selectedColumn, selectedColumn2);
        if (jpData.scatter.length > 0) {
          newChart = {
            id: chartId, type: 'jointplot',
            title: `${selectedColumn2} vs ${selectedColumn}`,
            description: `Joint distribution analysis`,
            columns: [selectedColumn, selectedColumn2], data: jpData,
            analysis: generateJointPlotAnalysis(jpData, dsName, dsDesc),
          };
        }
        break;
      }
    }

    if (newChart) {
      setSelectedCharts(prev => [...prev, newChart!]);
      setSelectedColumn('');
      setSelectedColumn2('');
      setSelectedMultiColumns([]);
      setSelectedCategoryColumn('');
    } else {
      alert('Could not generate chart with selected options');
    }
  };

  const handleRemoveChart = (chartId: string) => {
    setSelectedCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const renderUniversalChart = (spec: ChartSpec) => {
    switch (spec.type) {
      case 'histogram':
        return <UniversalHistogram title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'bar':
        return <UniversalBarChart title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'pie':
        return <UniversalPieChart title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'scatter':
        return <UniversalScatterChart title={spec.title} description={spec.description} data={spec.data} xLabel={spec.columns[0]} yLabel={spec.columns[1]} analysis={spec.analysis} />;
      case 'line':
        return <UniversalLineChart title={spec.title} description={spec.description} data={spec.data} xLabel={spec.columns[0]} yLabel={spec.columns[1]} analysis={spec.analysis} />;
      case 'distplot':
        return <UniversalDistPlot title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'violin':
        return <UniversalViolinPlot title={spec.title} description={spec.description} violinData={spec.data} analysis={spec.analysis} />;
      case 'heatmap':
        return <UniversalHeatMap title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'pairplot':
        return <UniversalPairPlot title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      case 'jointplot':
        return <UniversalJointPlot title={spec.title} description={spec.description} data={spec.data} analysis={spec.analysis} />;
      default:
        return null;
    }
  };

  // Check if current chart type needs multi-column, two-column, or category selector
  const needsMultiColumn = MULTI_COLUMN_TYPES.includes(selectedChartType);
  const needsTwoColumns = TWO_COLUMN_TYPES.includes(selectedChartType);
  const needsCategoryColumn = CATEGORY_COLUMN_TYPES.includes(selectedChartType);
  const needsSingleColumn = !needsMultiColumn;

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
                ? 'Predefined charts for your data + advanced visualizations with built-in datasets'
                : 'Build custom charts by selecting columns and chart types — with dataset suggestions and analysis'} • {parsedData.length} rows analyzed
            </p>
          </div>

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

      {/* ==================== STANDARD MODE ==================== */}
      {viewMode === 'standard' && (
        <>
          {hasCharts ? (
            <div className="grid gap-6 md:grid-cols-2">
              {chartData.missingValues && chartData.missingValues.length > 0 && (
                <ChartErrorBoundary><MissingValuesChart data={chartData.missingValues} /></ChartErrorBoundary>
              )}
              {chartData.fraudDistribution && chartData.fraudDistribution.length > 0 && (
                <ChartErrorBoundary><FraudDistributionChart data={chartData.fraudDistribution} /></ChartErrorBoundary>
              )}
              {chartData.topIndustries && chartData.topIndustries.length > 0 && (
                <ChartErrorBoundary><TopIndustriesChart data={chartData.topIndustries} /></ChartErrorBoundary>
              )}
              {chartData.geographic && chartData.geographic.length > 0 && (
                <ChartErrorBoundary><GeographicDistributionChart data={chartData.geographic} /></ChartErrorBoundary>
              )}
              {chartData.experience && chartData.experience.length > 0 && (
                <ChartErrorBoundary><ExperienceDistributionChart data={chartData.experience} /></ChartErrorBoundary>
              )}
              {chartData.salary && chartData.salary.length > 0 && (
                <ChartErrorBoundary><SalaryHistogramChart data={chartData.salary} /></ChartErrorBoundary>
              )}
              {chartData.telecommuting && chartData.telecommuting.length > 0 && (
                <ChartErrorBoundary><TelecommutingChart data={chartData.telecommuting} /></ChartErrorBoundary>
              )}
              {chartData.fraudRateByType && chartData.fraudRateByType.length > 0 && (
                <ChartErrorBoundary><FraudRateByTypeChart data={chartData.fraudRateByType} /></ChartErrorBoundary>
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

          {/* Advanced Visualizations (built-in datasets) */}
          <AdvancedStandardVisualizations />
        </>
      )}

      {/* ==================== CUSTOM MODE ==================== */}
      {viewMode === 'custom' && (
        <>
          {/* Chart Builder Interface */}
          <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-6">
            <h4 className="mb-4 text-base font-semibold text-[#f4d03f]">
              Build Custom Chart
            </h4>

            {/* Chart Type Selector */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                Select Chart Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CHART_TYPE_LABELS) as AllChartTypes[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedChartType(type);
                      setSelectedColumn('');
                      setSelectedColumn2('');
                      setSelectedMultiColumns([]);
                      setSelectedCategoryColumn('');
                    }}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      selectedChartType === type
                        ? 'bg-[#f4d03f] text-[#0a0a0a]'
                        : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#3a3420]'
                    }`}
                  >
                    {CHART_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Dataset Suggestion */}
            {chartSuggestion && chartSuggestion.suggestion && (
              <div className="mb-4 rounded-lg border border-[#d4af37]/30 bg-[#1a1a1a] p-3">
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-[#d4af37]">Dataset Suggestion:</span>
                    <span className="text-xs text-[#c9a961]">{chartSuggestion.suggestion}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-[#d4af37]">Relationship:</span>
                    <span className="text-xs italic text-[#c9a961]">{chartSuggestion.reason}</span>
                  </div>
                  {chartSuggestion.recommendedColumns.length > 0 && (
                    <button
                      onClick={() => {
                        if (needsMultiColumn) {
                          setSelectedMultiColumns(chartSuggestion.recommendedColumns);
                        } else {
                          setSelectedColumn(chartSuggestion.recommendedColumns[0] || '');
                          if (chartSuggestion.recommendedColumns[1]) {
                            setSelectedColumn2(chartSuggestion.recommendedColumns[1]);
                          }
                        }
                        if (chartSuggestion.recommendedCategoryColumn) {
                          setSelectedCategoryColumn(chartSuggestion.recommendedCategoryColumn);
                        }
                      }}
                      className="mt-1 rounded bg-[#d4af37]/20 px-3 py-1 text-xs font-semibold text-[#f4d03f] transition hover:bg-[#d4af37]/30"
                    >
                      Apply Suggestion
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Column Selectors */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Single column selector */}
              {needsSingleColumn && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                    {needsTwoColumns ? 'Select X-Axis Column' : selectedChartType === 'violin' ? 'Select Numeric Column' : 'Select Column'}
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
              )}

              {/* Second column for two-column types */}
              {needsTwoColumns && (
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

              {/* Category column for violin/pairplot */}
              {needsCategoryColumn && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                    {selectedChartType === 'violin' ? 'Select Category Column' : 'Group By (Optional)'}
                  </label>
                  <select
                    value={selectedCategoryColumn}
                    onChange={(e) => setSelectedCategoryColumn(e.target.value)}
                    className="w-full rounded-lg border border-[#d4af37] bg-[#1a1a1a] px-4 py-2 text-sm text-[#c9a961] focus:border-[#f4d03f] focus:outline-none"
                  >
                    <option value="">-- Choose Column --</option>
                    {columnAnalysis
                      .filter(c => c.type === 'categorical' || c.type === 'boolean')
                      .map(col => (
                        <option key={col.name} value={col.name}>
                          {col.name} ({col.uniqueCount} categories)
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Multi-column checkbox selector for heatmap/pairplot */}
            {needsMultiColumn && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                  Select Numeric Columns (at least 2)
                </label>
                <div className="flex flex-wrap gap-2">
                  {columnAnalysis
                    .filter(c => c.type === 'numeric')
                    .map(col => (
                      <label
                        key={col.name}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                          selectedMultiColumns.includes(col.name)
                            ? 'bg-[#d4af37]/30 text-[#f4d03f]'
                            : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#3a3420]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMultiColumns.includes(col.name)}
                          onChange={(e) => {
                            setSelectedMultiColumns(prev =>
                              e.target.checked
                                ? [...prev, col.name]
                                : prev.filter(c => c !== col.name)
                            );
                          }}
                          className="sr-only"
                        />
                        <div className={`h-3 w-3 rounded border ${
                          selectedMultiColumns.includes(col.name)
                            ? 'border-[#f4d03f] bg-[#f4d03f]'
                            : 'border-[#c9a961]'
                        }`}>
                          {selectedMultiColumns.includes(col.name) && (
                            <svg className="h-3 w-3 text-[#0a0a0a]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {col.name}
                      </label>
                    ))}
                </div>
                {selectedMultiColumns.length > 0 && (
                  <p className="mt-2 text-xs text-[#c9a961]">
                    {selectedMultiColumns.length} column{selectedMultiColumns.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {/* Add Chart Button */}
            <button
              onClick={handleAddChart}
              disabled={
                (needsMultiColumn && selectedMultiColumns.length < 2) ||
                (needsSingleColumn && !selectedColumn) ||
                (needsTwoColumns && !selectedColumn2) ||
                (selectedChartType === 'violin' && !selectedCategoryColumn)
              }
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
            >
              + Add Chart
            </button>
          </div>

          {/* Display Selected Charts */}
          {selectedCharts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {selectedCharts.map(spec => {
                const isWide = spec.type === 'pairplot' || spec.type === 'jointplot' || spec.type === 'heatmap';
                return (
                  <div key={spec.id} className={`relative ${isWide ? 'md:col-span-2' : ''}`}>
                    {renderUniversalChart(spec)}
                    <button
                      onClick={() => handleRemoveChart(spec.id)}
                      className="absolute right-2 top-2 rounded-lg bg-[#2a2416] p-2 text-xs text-[#ff6b6b] transition hover:bg-[#3a3420]"
                      title="Remove chart"
                    >
                      Remove
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
