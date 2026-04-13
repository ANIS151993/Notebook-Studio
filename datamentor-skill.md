---
name: DataMentor
description: Build a complete scientific CSV intelligence and notebook automation web app from scratch using Next.js 16, React 19, TypeScript, Chart.js, Pyodide, and Firebase.
---

# DataMentor — Claude Skill

> Build a complete scientific CSV intelligence and notebook automation web app from scratch.

Use this skill with Claude Code or any Claude-powered tool. It provides the full blueprint to recreate **DataMentor** — a production-grade, serverless analytics platform built with Next.js 16, React 19, TypeScript, Chart.js, Pyodide, and Firebase.

---

## Project Overview

DataMentor is an in-browser CSV analysis platform that provides:

- **Deterministic CSV cleaning** — header normalization, whitespace trimming, duplicate removal, null handling
- **10 universal visualization types** — DistPlot, Pie, Violin, HeatMap, PairPlot, JointPlot, Bar, Histogram, Scatter, Line — each with dynamic column selectors
- **Domain-aware analysis** — a knowledge-base engine that generates data-driven insights based on recognized column names (e.g., medical, financial)
- **Interactive Python notebook** — in-browser Pyodide execution with 14 guided code cells including matplotlib visualizations rendered inline as base64 images
- **AI runtime repair** — rule-based error detection with model-assisted fallback for notebook execution failures
- **Firebase authentication** — Google sign-in with Firestore cloud persistence and localStorage offline fallback
- **Account workspace** — save, load, and delete uploaded CSV works across sessions

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | App framework with Turbopack |
| React | 19 | UI components |
| TypeScript | 5 | Type safety |
| Chart.js | 4.5.1 | Chart rendering engine |
| react-chartjs-2 | 5.3.1 | React bindings for Chart.js |
| chartjs-chart-matrix | 3.0.0 | Heatmap matrix support |
| Papa Parse | 5.4.1 | CSV parsing |
| Pyodide | 0.25.0 (CDN) | In-browser Python runtime |
| Firebase | 10.12.5 | Auth + Firestore |
| react-syntax-highlighter | 16.1.0 | Code cell syntax highlighting |
| @dnd-kit | 6.3.1 | Drag-and-drop notebook cell reordering |
| Tailwind CSS | 4 | Utility-first styling |

---

## Project Structure

```
notebook-studio/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Landing page
│   ├── template.tsx            # View transitions
│   ├── globals.css             # Global Tailwind styles
│   ├── dashboard/              # Main CSV workspace
│   ├── login/                  # Auth page
│   ├── admin/                  # Admin panel
│   ├── live/                   # Live demo route
│   ├── finish/                 # Post-upload completion
│   ├── ipynb/                  # Notebook viewer route
│   └── api/                    # API routes
├── components/
│   ├── CsvNotebookBuilder.tsx  # Main orchestrator: upload, clean, notebook, visualize, account
│   ├── CsvVisualizations.tsx   # STANDARD + CUSTOM visualization modes with column selectors
│   ├── NotebookViewer.tsx      # 14 guided Python cells with explanations
│   ├── CodeCell.tsx            # Individual executable cell with base64 image rendering
│   ├── AIAssistant.tsx         # AI-powered error repair assistant
│   ├── UniversalChartGenerator.tsx  # Chart spec → rendered chart
│   ├── charts/
│   │   ├── AnalysisPanel.tsx        # Domain-aware data analysis display
│   │   ├── UniversalDistPlot.tsx    # Distribution plot with KDE
│   │   ├── UniversalPieChart.tsx    # Pie/Doughnut chart
│   │   ├── UniversalViolinPlot.tsx  # Violin plot
│   │   ├── UniversalHeatMap.tsx     # Correlation heatmap
│   │   ├── UniversalPairPlot.tsx    # NxN pair grid (responsive scaling)
│   │   ├── UniversalJointPlot.tsx   # Joint plot with marginal distributions
│   │   ├── UniversalBarChart.tsx    # Bar chart
│   │   ├── UniversalHistogram.tsx   # Histogram
│   │   ├── UniversalScatterChart.tsx # Scatter plot
│   │   ├── UniversalLineChart.tsx   # Line chart
│   │   └── UniversalChart.tsx       # Chart type router
│   └── visualization/
│       ├── ChartTypeGallery.tsx     # CUSTOM mode chart type picker
│       └── ColumnSelector.tsx       # Column picker for CUSTOM mode
├── lib/
│   ├── chartDataProcessor.ts        # CSV → chart-ready data pipeline
│   ├── chartTypes.ts                # Chart type definitions and specs
│   ├── chartRegistry.ts             # Chart component registry
│   ├── chartConfig.ts               # Shared Chart.js configuration
│   ├── chartSuggestions.ts          # Auto-suggest best chart for data
│   ├── visualizationAnalysis.ts     # Domain-aware analysis engine + knowledge base
│   ├── visualizationStorage.ts      # Save/load visualization state
│   ├── advancedDataProcessors.ts    # Statistical helpers (correlation, KDE, etc.)
│   ├── sampleDatasets.ts            # Built-in sample data
│   ├── firebase.ts                  # Firebase config and initialization
│   ├── validators.ts                # Input validation utilities
│   ├── pythonAssistant.ts           # AI code repair logic
│   └── localPythonLlm.ts           # Local model fallback for repair
├── hooks/
│   └── usePyodide.ts               # Pyodide loader + executor hook
├── docs/                            # GitHub Pages portal
│   ├── index.html
│   ├── styles.css
│   └── main.js
└── package.json
```

---

## Step-by-Step Build Instructions

### Step 1: Initialize the Project

```bash
npx create-next-app@latest notebook-studio --typescript --tailwind --app --turbopack
cd notebook-studio
```

Install dependencies:

```bash
npm install chart.js react-chartjs-2 chartjs-chart-matrix papaparse firebase react-syntax-highlighter @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D @types/papaparse @types/react-syntax-highlighter
```

### Step 2: Firebase Setup

Create `lib/firebase.ts`:
- Initialize Firebase app with your project config
- Export `auth` (getAuth) and `db` (getFirestore)
- Use Google Auth provider for sign-in

Required Firebase services:
- **Authentication**: Enable Google sign-in provider
- **Firestore**: Create database with collection `userWorks` storing:
  - `userId`: string (Firebase UID)
  - `fileName`: string
  - `csvData`: string (raw CSV content)
  - `timestamp`: Firestore server timestamp

### Step 3: CSV Ingestion and Cleaning Pipeline

Create `CsvNotebookBuilder.tsx` as the main orchestrator with these workspace tabs:
1. **Upload** — drag-and-drop or file picker for CSV, parse with Papa Parse
2. **Data Cleaning** — deterministic pipeline: trim whitespace, normalize headers (lowercase + underscore), remove exact-duplicate rows, detect and handle null/missing values
3. **Notebook** — auto-generated Python cells
4. **Visualizations** — STANDARD and CUSTOM chart modes
5. **Account** — auth, save/load/delete works

The CSV parser should:
- Use `Papa.parse(file, { header: true, skipEmptyLines: true })`
- Detect column types: numeric, categorical, boolean (0/1 only), datetime
- Important: when detecting dates, skip values that match `/^-?\d+(\.\d+)?$/` (pure numbers) to avoid `new Date("63")` being treated as a valid date

### Step 4: Column Type Detection (`lib/chartDataProcessor.ts`)

Implement `detectColumnType(values)` that classifies each column:
- **numeric**: majority of values are finite numbers
- **boolean**: only contains 0 and 1
- **datetime**: values parse as valid dates (excluding pure numbers)
- **categorical**: everything else

Implement `isDateColumn(values)` with the critical fix:
```typescript
// Skip pure numeric strings — new Date("63") is valid but misleading
if (/^-?\d+(\.\d+)?$/.test(strVal)) continue;
```

### Step 5: Universal Visualization System

#### 5a: Chart Type Definitions (`lib/chartTypes.ts`)

Define 10 chart types with metadata:
```
DistPlot, PieChart, ViolinPlot, HeatMap, PairPlot, JointPlot, BarChart, Histogram, ScatterPlot, LineChart
```

Each type specifies: `id`, `label`, `description`, `requiredColumns` (numeric/categorical count), `filterType`.

#### 5b: STANDARD Mode (`CsvVisualizations.tsx`)

Create `StandardChartPanel` component for each chart type:
- Each panel has column dropdown selectors (single or multi-select depending on chart type)
- `ColumnDropdown` component filters columns by type (numeric, categorical, boolean)
- `MultiColumnSelector` component for checkbox-based multi-column selection (HeatMap, PairPlot)
- Smart defaults via `useMemo`: auto-select first numeric column for DistPlot, first categorical for Pie, etc.
- Shared `buildChartSpec()` function generates chart spec from selected columns + parsed data

Column selector filter rules:
| Chart | Column 1 | Column 2 | Multi-select |
|---|---|---|---|
| DistPlot | numeric | — | — |
| Pie | categorical/boolean | — | — |
| Violin | numeric | categorical | — |
| HeatMap | — | — | numeric (up to 8) |
| PairPlot | — | — | numeric (up to 10) + optional group |
| JointPlot | numeric | numeric | — |
| Bar | categorical | numeric | — |
| Histogram | numeric | — | — |
| Scatter | numeric | numeric | — |
| Line | numeric/datetime | numeric | — |

#### 5c: CUSTOM Mode

Reuse the same `buildChartSpec()` function. Provide a chart type gallery for manual selection and column picker.

#### 5d: Chart Components (`components/charts/Universal*.tsx`)

Each chart component receives a `spec` object containing:
- `type`: chart type identifier
- `data`: processed chart data
- `columns`: selected column names
- `parsedData`: raw parsed rows for custom rendering

**PairPlot responsive scaling** — critical implementation:
- Use CSS Grid with `gridTemplateColumns: ${labelWidth}px repeat(${n}, minmax(0, 1fr))`
- Cell aspect ratio: `1` with `maxHeight` that scales by column count:
  - 2 columns: 320px
  - 3 columns: 240px
  - 4 columns: 180px
  - 5-6 columns: 130px
  - 7+ columns: 90px
- Font sizes and label widths also scale down with column count

### Step 6: Domain-Aware Analysis Engine (`lib/visualizationAnalysis.ts`)

Build a knowledge base system that generates contextual insights:

1. Define `COLUMN_KNOWLEDGE` — a record mapping known column names to:
   - `label`: human-readable name
   - `description`: what the column measures
   - `insight(stats)`: function returning statistical insight text
   - `pairInsight(otherCol)`: function returning pair-relationship insight

2. For each chart type, create an analysis generator:
   - `generateDistPlotAnalysis(columns, stats)` — distribution shape, skewness, outlier potential
   - `generatePieChartAnalysis(columns, stats)` — category proportions, dominance
   - `generateHeatMapAnalysis(columns, stats)` — correlation strength, multicollinearity
   - etc.

3. Each generator checks `COLUMN_KNOWLEDGE[columnName.toLowerCase()]` and if found, enriches the analysis with domain-specific medical/financial/scientific context.

4. The `AnalysisPanel` component displays:
   - Dataset name (auto-generated from selected columns)
   - Context description
   - "Insights from your data" section
   - Column suitability assessment

5. Analysis recomputes via `useMemo` whenever column selections change.

### Step 7: Interactive Python Notebook (`NotebookViewer.tsx`)

Create 14 guided code cells:

| Cell | Title | Purpose |
|---|---|---|
| 1 | Load CSV | `import pandas as pd; df = pd.read_csv(...)` |
| 2 | Shape & Info | `df.shape`, `df.dtypes`, `df.info()` |
| 3 | Descriptive Stats | `df.describe()` |
| 4 | Missing Values | `df.isnull().sum()` |
| 5 | Duplicates | `df.duplicated().sum()` + removal |
| 6 | Correlation | `df.corr()` for numeric columns |
| 7 | Value Counts | `df[col].value_counts()` for categorical |
| 8 | DistPlot | matplotlib KDE + histogram |
| 9 | Pie Chart | `plt.pie()` with auto-detected low-cardinality column |
| 10 | Violin Plot | `plt.violinplot()` grouped by categorical |
| 11 | HeatMap | Correlation matrix with annotated values |
| 12 | PairPlot | NxN scatter/histogram grid |
| 13 | JointPlot | GridSpec layout with regression + marginal histograms |
| 14 | Custom Code | Empty cell for user experimentation |

Each cell includes:
- Pre-written Python code
- Detailed line-by-line explanation
- Run button that executes via Pyodide

#### Matplotlib in Pyodide — Critical Pattern

Pyodide runs in the browser with no filesystem. All matplotlib rendering must use:

```python
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64

fig, ax = plt.subplots(figsize=(10, 6))
# ... plot code ...

buf = BytesIO()
plt.savefig(buf, format='png', dpi=100, bbox_inches='tight',
            facecolor='#1a1a2e', edgecolor='none')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close()
print(f'__IMG_BASE64__:{img_base64}')
```

#### CodeCell Image Rendering (`CodeCell.tsx`)

In the output section, split output by newlines. For lines starting with `__IMG_BASE64__:`:
```tsx
<img src={`data:image/png;base64,${line.replace('__IMG_BASE64__:', '')}`} />
```

### Step 8: Pyodide Hook (`hooks/usePyodide.ts`)

```typescript
// Load ALL required packages including matplotlib and scipy
await pyodide.loadPackage(["pandas", "numpy", "matplotlib", "scipy"]);
```

The hook should:
- Load Pyodide from CDN (`https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js`)
- Pre-load pandas, numpy, matplotlib, scipy packages
- Provide `runCode(code: string)` that injects CSV data via `pyodide.globals.set()`
- Capture stdout/stderr and return as string output
- Handle errors gracefully with traceback

### Step 9: AI Runtime Repair (`AIAssistant.tsx`)

When a notebook cell throws an error:
1. Parse the traceback to identify error type (ModuleNotFoundError, NameError, TypeError, etc.)
2. Apply rule-based fixes first:
   - Missing import → add import statement
   - Undefined variable → check for typos, suggest definition
   - Type mismatch → suggest cast
3. If rules don't match, fall back to a local model assistant that rewrites the code
4. Present the fix as a suggestion the user can accept or reject

### Step 10: Account Workspace (`CsvNotebookBuilder.tsx`)

Implement the Account tab with:

**Authentication:**
- Firebase Google sign-in
- Display user profile (name, email, avatar)
- Sign-out button

**Save/Load/Delete Grid (4-column layout):**
- Column 1: Radio button for selection
- Column 2: Load button — loads selected work into the workspace
- Column 3: Delete button (red) — confirmation dialog before deletion
- Column 4: Save button — saves current workspace

**Delete implementation:**
```typescript
async function deleteSelectedWork() {
  if (!confirm('Are you sure you want to delete this work?')) return;
  
  if (isCloudWork) {
    await deleteDoc(doc(db, 'userWorks', workId));
  } else {
    const works = JSON.parse(localStorage.getItem('savedWorks') || '[]');
    const filtered = works.filter(w => w.id !== workId);
    localStorage.setItem('savedWorks', JSON.stringify(filtered));
  }
  
  // Clear workspace if deleted work was active
  // Refresh saved works list
}
```

### Step 11: GitHub Pages Portal (`docs/`)

Create a single-page technical documentation site with:
- Sticky navigation with section-aware highlighting
- Hero section with KPI counters (animated on scroll)
- Scientific basis cards
- Interactive development step explorer with progress bar
- Interactive architecture module explorer
- Evaluation charts (6 Chart.js charts with profile switching: Academic/SME/Enterprise)
- Video overview with lazy YouTube embed
- Research paper preview with encrypted download gate
- Professional profile and collaboration request builder
- Claude Skill download section

---

## Key Implementation Patterns

### Chart Spec Builder (shared between STANDARD and CUSTOM modes)

```typescript
function buildChartSpec(chartType, columns, parsedData, rowCount) {
  return {
    type: chartType,
    dsName: columns.join(', '),           // e.g., "age, chol, trtbps"
    dsDesc: `${rowCount} rows analyzed`,
    columns,
    parsedData,
    // ... processed data specific to chart type
  };
}
```

### Responsive Design Patterns

- PairPlot: fluid grid with `minmax(0, 1fr)` columns, aspect-ratio cells, maxHeight scaling
- All charts: container-aware with Chart.js `maintainAspectRatio: false`
- Mobile: single-column layouts below 920px breakpoint

### Data Flow

```
CSV Upload → Papa Parse → Column Detection → Type Classification
                                                    ↓
                                    ┌───────────────┼───────────────┐
                                    ↓               ↓               ↓
                              Cleaning         Notebook          Visualizations
                              Pipeline         Generation        (STANDARD/CUSTOM)
                                    ↓               ↓               ↓
                              Cleaned Data     Pyodide Cells    Chart Components
                                                    ↓               ↓
                                              Matplotlib →     Analysis Engine
                                              base64 imgs      (Domain-Aware)
```

---

## Environment Variables

Create `.env.local` with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## Run the App

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## License

This skill is provided for educational and personal use. Credit the original project:

**DataMentor** by Md Anisur Rahman Chowdhury  
Repository: https://github.com/ANIS151993/Notebook-Studio  
Live App: https://datamentor.marcbd.site
