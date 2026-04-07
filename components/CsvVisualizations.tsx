"use client";

import { Component, useCallback, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
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
    console.error("Chart render failed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-6">
          <p className="text-sm text-[#c9a961]">
            This chart could not be rendered.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// All chart types
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

// =========================================================================
// Column Selector Dropdown for individual standard charts
// =========================================================================

function ColumnDropdown({
  label,
  value,
  onChange,
  columns,
  columnAnalysis,
  filterType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  columns: string[];
  columnAnalysis: ColumnAnalysis[];
  filterType?: 'numeric' | 'categorical' | 'boolean' | 'all';
}) {
  const filtered = filterType && filterType !== 'all'
    ? columns.filter(c => {
        const analysis = columnAnalysis.find(a => a.name === c);
        return analysis?.type === filterType;
      })
    : columns;

  return (
    <div className="flex items-center gap-2">
      <label className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#c9a961]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-[#d4af37]/50 bg-[#1a1a1a] px-2 py-1 text-xs text-[#c9a961] focus:border-[#f4d03f] focus:outline-none"
      >
        {filtered.map(col => (
          <option key={col} value={col}>
            {col} ({columnAnalysis.find(c => c.name === col)?.type})
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiColumnSelector({
  label,
  selected,
  onChange,
  columns,
  columnAnalysis,
}: {
  label: string;
  selected: string[];
  onChange: (cols: string[]) => void;
  columns: string[];
  columnAnalysis: ColumnAnalysis[];
}) {
  const numericCols = columns.filter(c => columnAnalysis.find(a => a.name === c)?.type === 'numeric');

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#c9a961]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {numericCols.map(col => (
          <label
            key={col}
            className={`flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] transition ${
              selected.includes(col)
                ? 'bg-[#d4af37]/30 text-[#f4d03f]'
                : 'bg-[#1a1a1a] text-[#c9a961] hover:bg-[#3a3420]'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(col)}
              onChange={(e) => {
                onChange(
                  e.target.checked
                    ? [...selected, col]
                    : selected.filter(c => c !== col)
                );
              }}
              className="sr-only"
            />
            <div className={`h-2.5 w-2.5 rounded border ${
              selected.includes(col)
                ? 'border-[#f4d03f] bg-[#f4d03f]'
                : 'border-[#c9a961]'
            }`} />
            {col}
          </label>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// Chart builder function — shared between STANDARD and CUSTOM modes
// =========================================================================

function buildChartSpec(
  chartType: AllChartTypes,
  parsedData: Record<string, string>[],
  col1: string,
  col2: string,
  multiCols: string[],
  categoryCol: string,
  dsName: string,
  dsDesc: string,
  idPrefix: string,
): ChartSpec | null {
  const chartId = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  switch (chartType) {
    case 'histogram': {
      const histogramData = chartProcessor.createHistogramBins(parsedData, col1, 15);
      if (histogramData.length > 0) {
        return {
          id: chartId, type: 'histogram',
          title: `Distribution of ${col1}`,
          description: `Histogram showing frequency distribution`,
          columns: [col1], data: histogramData,
          analysis: generateHistogramAnalysis(histogramData, dsName, dsDesc, col1),
        };
      }
      break;
    }
    case 'bar': {
      const barData = chartProcessor.getTopN(
        chartProcessor.countOccurrences(parsedData, col1), 15
      );
      if (barData.length > 0) {
        return {
          id: chartId, type: 'bar',
          title: `Top ${Math.min(15, barData.length)} ${col1}`,
          description: `Distribution of values`,
          columns: [col1], data: barData,
          analysis: generateBarAnalysis(barData, dsName, dsDesc, col1),
        };
      }
      break;
    }
    case 'pie': {
      const pieData = chartProcessor.countOccurrences(parsedData, col1);
      if (pieData.length > 0) {
        return {
          id: chartId, type: 'pie',
          title: `${col1} Distribution`,
          description: `Breakdown of values`,
          columns: [col1], data: pieData,
          analysis: generatePieChartAnalysis(pieData, dsName, dsDesc, col1),
        };
      }
      break;
    }
    case 'scatter': {
      const scatterData = chartProcessor.createScatterData(parsedData, col1, col2);
      if (scatterData.length > 0) {
        return {
          id: chartId, type: 'scatter',
          title: `${col2} vs ${col1}`,
          description: `Relationship between columns`,
          columns: [col1, col2], data: scatterData,
          analysis: generateScatterAnalysis(scatterData, dsName, dsDesc, col1, col2),
        };
      }
      break;
    }
    case 'line': {
      const lineData = chartProcessor.createTimeSeriesData(parsedData, col1, col2);
      if (lineData.length > 0) {
        return {
          id: chartId, type: 'line',
          title: `${col2} over ${col1}`,
          description: `Time series trend`,
          columns: [col1, col2], data: lineData,
          analysis: generateLineAnalysis(lineData, dsName, dsDesc, col1, col2),
        };
      }
      break;
    }
    case 'distplot': {
      const distData = generateDistPlotData(parsedData, col1, 20);
      if (distData.histogram.length > 0) {
        return {
          id: chartId, type: 'distplot',
          title: `Distribution of ${col1}`,
          description: `Histogram with KDE density curve`,
          columns: [col1], data: distData,
          analysis: generateDistPlotAnalysis(distData, dsName, dsDesc),
        };
      }
      break;
    }
    case 'violin': {
      const vData = generateViolinData(parsedData, col1, categoryCol);
      if (vData.length > 0) {
        return {
          id: chartId, type: 'violin',
          title: `${col1} by ${categoryCol}`,
          description: `Distribution comparison across categories`,
          columns: [col1, categoryCol], data: vData,
          analysis: generateViolinAnalysis(vData, dsName, dsDesc, col1, categoryCol),
        };
      }
      break;
    }
    case 'heatmap': {
      const hmData = generateHeatMapData(parsedData, multiCols);
      return {
        id: chartId, type: 'heatmap',
        title: 'Correlation Heatmap',
        description: `Pairwise correlations across ${multiCols.length} features`,
        columns: [...multiCols], data: hmData,
        analysis: generateHeatMapAnalysis(hmData, dsName, dsDesc),
      };
    }
    case 'pairplot': {
      const ppData = generatePairPlotData(parsedData, multiCols, categoryCol || undefined);
      return {
        id: chartId, type: 'pairplot',
        title: 'Pair Plot',
        description: `Pairwise analysis of ${multiCols.length} features${categoryCol ? ` grouped by ${categoryCol}` : ''}`,
        columns: [...multiCols], data: ppData,
        analysis: generatePairPlotAnalysis(ppData, dsName, dsDesc),
      };
    }
    case 'jointplot': {
      const jpData = generateJointPlotData(parsedData, col1, col2);
      if (jpData.scatter.length > 0) {
        return {
          id: chartId, type: 'jointplot',
          title: `${col2} vs ${col1}`,
          description: `Joint distribution analysis`,
          columns: [col1, col2], data: jpData,
          analysis: generateJointPlotAnalysis(jpData, dsName, dsDesc),
        };
      }
      break;
    }
  }
  return null;
}

// =========================================================================
// Standard chart panel with column selectors built-in
// =========================================================================

type StandardChartPanelProps = {
  chartType: AllChartTypes;
  parsedData: Record<string, string>[];
  columns: string[];
  columnAnalysis: ColumnAnalysis[];
  defaultCol1: string;
  defaultCol2?: string;
  defaultMultiCols?: string[];
  defaultCategoryCol?: string;
  dsName: string;
  dsDesc: string;
};

function StandardChartPanel({
  chartType,
  parsedData,
  columns,
  columnAnalysis,
  defaultCol1,
  defaultCol2,
  defaultMultiCols,
  defaultCategoryCol,
  dsName,
  dsDesc,
}: StandardChartPanelProps) {
  const [col1, setCol1] = useState(defaultCol1);
  const [col2, setCol2] = useState(defaultCol2 || '');
  const [multiCols, setMultiCols] = useState<string[]>(defaultMultiCols || []);
  const [categoryCol, setCategoryCol] = useState(defaultCategoryCol || '');

  const needsTwoCols = TWO_COLUMN_TYPES.includes(chartType);
  const needsMultiCols = MULTI_COLUMN_TYPES.includes(chartType);
  const needsCategoryCol = CATEGORY_COLUMN_TYPES.includes(chartType);

  const spec = useMemo(() => {
    if (needsMultiCols && multiCols.length < 2) return null;
    if (!needsMultiCols && !col1) return null;
    if (needsTwoCols && !col2) return null;
    if (chartType === 'violin' && !categoryCol) return null;

    return buildChartSpec(
      chartType, parsedData, col1, col2, multiCols, categoryCol,
      dsName, dsDesc, 'std',
    );
  }, [chartType, parsedData, col1, col2, multiCols, categoryCol, dsName, dsDesc, needsMultiCols, needsTwoCols]);

  const renderChart = useCallback((s: ChartSpec) => {
    switch (s.type) {
      case 'histogram':
        return <UniversalHistogram title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'bar':
        return <UniversalBarChart title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'pie':
        return <UniversalPieChart title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'scatter':
        return <UniversalScatterChart title={s.title} description={s.description} data={s.data} xLabel={s.columns[0]} yLabel={s.columns[1]} analysis={s.analysis} />;
      case 'line':
        return <UniversalLineChart title={s.title} description={s.description} data={s.data} xLabel={s.columns[0]} yLabel={s.columns[1]} analysis={s.analysis} />;
      case 'distplot':
        return <UniversalDistPlot title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'violin':
        return <UniversalViolinPlot title={s.title} description={s.description} violinData={s.data} analysis={s.analysis} />;
      case 'heatmap':
        return <UniversalHeatMap title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'pairplot':
        return <UniversalPairPlot title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      case 'jointplot':
        return <UniversalJointPlot title={s.title} description={s.description} data={s.data} analysis={s.analysis} />;
      default:
        return null;
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Column selector bar */}
      <div className="rounded-lg border border-[#d4af37]/30 bg-[#2a2416] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f4d03f]">
            {CHART_TYPE_LABELS[chartType]}
          </span>
          <span className="text-[10px] text-[#c9a961]">Select columns for this visualization</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {!needsMultiCols && (
            <ColumnDropdown
              label={needsTwoCols ? 'X-Axis' : chartType === 'violin' ? 'Numeric' : 'Column'}
              value={col1}
              onChange={setCol1}
              columns={columns}
              columnAnalysis={columnAnalysis}
              filterType={['distplot', 'histogram', 'violin', 'scatter', 'jointplot'].includes(chartType) ? 'numeric' : 'all'}
            />
          )}
          {needsTwoCols && (
            <ColumnDropdown
              label="Y-Axis"
              value={col2}
              onChange={setCol2}
              columns={columns.filter(c => c !== col1)}
              columnAnalysis={columnAnalysis}
              filterType="numeric"
            />
          )}
          {needsCategoryCol && (
            <ColumnDropdown
              label={chartType === 'violin' ? 'Category' : 'Group By'}
              value={categoryCol}
              onChange={setCategoryCol}
              columns={columns}
              columnAnalysis={columnAnalysis}
              filterType="all"
            />
          )}
        </div>
        {needsMultiCols && (
          <div className="mt-2">
            <MultiColumnSelector
              label="Select Numeric Columns (at least 2)"
              selected={multiCols}
              onChange={setMultiCols}
              columns={columns}
              columnAnalysis={columnAnalysis}
            />
          </div>
        )}
      </div>

      {/* Rendered chart */}
      {spec ? (
        <ChartErrorBoundary>{renderChart(spec)}</ChartErrorBoundary>
      ) : (
        <div className="rounded-xl border border-[#d4af37]/30 bg-[#1a1a1a] p-6 text-center text-xs text-[#c9a961]">
          Select valid columns above to generate this visualization
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Main Component
// =========================================================================

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

  // Column analysis
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

  const numericColumns = useMemo(() =>
    columnAnalysis.filter(c => c.type === 'numeric').map(c => c.name),
    [columnAnalysis],
  );

  const categoricalColumns = useMemo(() =>
    columnAnalysis.filter(c => (c.type === 'categorical' || c.type === 'boolean') && c.uniqueCount >= 2 && c.uniqueCount <= 20).map(c => c.name),
    [columnAnalysis],
  );

  const dsName = 'Uploaded CSV';
  const dsDesc = `Your uploaded dataset (${parsedData.length} rows, ${stats.columns.length} columns)`;

  // ========== STANDARD MODE DEFAULTS ==========
  // Smart defaults for each chart type based on column analysis
  const standardDefaults = useMemo(() => {
    const nc = numericColumns;
    const cc = categoricalColumns;
    const defaults: {
      type: AllChartTypes;
      col1: string;
      col2?: string;
      multiCols?: string[];
      categoryCol?: string;
      wide?: boolean;
    }[] = [];

    // 1. DistPlot — best numeric column
    if (nc.length >= 1) {
      defaults.push({ type: 'distplot', col1: nc[0] });
    }
    // 2. Pie Chart — best categorical/boolean
    if (cc.length >= 1) {
      defaults.push({ type: 'pie', col1: cc[0] });
    }
    // 3. Violin Plot — numeric by category
    if (nc.length >= 1 && cc.length >= 1) {
      defaults.push({ type: 'violin', col1: nc[0], categoryCol: cc[0] });
    }
    // 4. HeatMap — all numeric columns (up to 8)
    if (nc.length >= 2) {
      defaults.push({ type: 'heatmap', col1: '', multiCols: nc.slice(0, 8), wide: true });
    }
    // 5. PairPlot — top 4 numeric + group by categorical
    if (nc.length >= 2) {
      defaults.push({
        type: 'pairplot', col1: '',
        multiCols: nc.slice(0, 4),
        categoryCol: cc[0] || '',
        wide: true,
      });
    }
    // 6. JointPlot — two best numeric columns
    if (nc.length >= 2) {
      defaults.push({ type: 'jointplot', col1: nc[0], col2: nc[1], wide: true });
    }
    // 7. Bar Chart — if there's a categorical col
    if (cc.length >= 1) {
      const barCol = cc.length > 1 ? cc[1] : cc[0];
      defaults.push({ type: 'bar', col1: barCol });
    }
    // 8. Histogram — second numeric col
    if (nc.length >= 2) {
      defaults.push({ type: 'histogram', col1: nc[1] });
    }
    // 9. Scatter — two numeric
    if (nc.length >= 2) {
      defaults.push({ type: 'scatter', col1: nc[0], col2: nc[1] });
    }

    return defaults;
  }, [numericColumns, categoricalColumns]);

  // ========== CUSTOM MODE LOGIC ==========

  const chartSuggestion = useMemo(() => {
    if (!columnAnalysis.length) return null;
    return suggestColumnsForChartType(selectedChartType, columnAnalysis);
  }, [selectedChartType, columnAnalysis]);

  const handleAddChart = () => {
    if (!parsedData.length) return;

    // Validate
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

    if (selectedChartType === 'violin' && !selectedCategoryColumn) {
      alert('Please select a category column for violin plot');
      return;
    }

    const newChart = buildChartSpec(
      selectedChartType, parsedData,
      selectedColumn, selectedColumn2,
      selectedMultiColumns, selectedCategoryColumn,
      dsName, dsDesc, 'custom',
    );

    if (newChart) {
      setSelectedCharts(prev => [...prev, newChart]);
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

  // Custom mode helpers
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
                ? 'All chart types with column selectors — change columns to explore your data'
                : 'Build custom charts by selecting columns and chart types'} • {parsedData.length} rows analyzed
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
          {standardDefaults.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {standardDefaults.map((def, idx) => {
                const isWide = def.wide || def.type === 'heatmap' || def.type === 'pairplot' || def.type === 'jointplot';
                return (
                  <div key={`std-${def.type}-${idx}`} className={isWide ? 'md:col-span-2' : ''}>
                    <StandardChartPanel
                      chartType={def.type}
                      parsedData={parsedData}
                      columns={stats.columns}
                      columnAnalysis={columnAnalysis}
                      defaultCol1={def.col1}
                      defaultCol2={def.col2}
                      defaultMultiCols={def.multiCols}
                      defaultCategoryCol={def.categoryCol}
                      dsName={dsName}
                      dsDesc={dsDesc}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-8 text-center">
              <p className="text-[#c9a961]">
                No suitable columns detected for standard visualizations.
                Try switching to Custom mode to manually select columns.
              </p>
            </div>
          )}
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
