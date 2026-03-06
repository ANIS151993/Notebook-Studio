import type { ChartOptions } from 'chart.js';

// Color palette matching app theme
export const CHART_COLORS = {
  primary: '#f4d03f',      // Gold
  secondary: '#d4af37',    // Gold dark
  tertiary: '#ffd700',     // Gold light
  background: '#2a2416',   // Accent soft
  text: '#c9a961',         // Muted
  grid: 'rgba(212, 175, 55, 0.1)',
  fraud: '#ff6b6b',        // Red for fraud
  legitimate: '#51cf66',   // Green for legitimate
};

// Chart colors array for multiple series
export const CHART_COLOR_PALETTE = [
  '#f4d03f', '#d4af37', '#ffd700', '#c9a961',
  '#ff6b6b', '#51cf66', '#4dabf7', '#845ef7',
  '#fab005', '#20c997', '#ff8787', '#748ffc',
];

// Default options for all charts
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: CHART_COLORS.text,
        font: { size: 12 },
        padding: 15,
      },
    },
    tooltip: {
      backgroundColor: CHART_COLORS.background,
      titleColor: CHART_COLORS.primary,
      bodyColor: CHART_COLORS.text,
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
      padding: 12,
      displayColors: true,
    },
  },
  scales: {
    x: {
      ticks: { color: CHART_COLORS.text },
      grid: { color: CHART_COLORS.grid },
    },
    y: {
      ticks: { color: CHART_COLORS.text },
      grid: { color: CHART_COLORS.grid },
    },
  },
} satisfies ChartOptions;
