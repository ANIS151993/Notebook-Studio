"use client";

import { useEffect, useState } from "react";
import CodeCell from "./CodeCell";
import { usePyodide } from "@/hooks/usePyodide";

type NotebookViewerProps = {
  csvContent: string;
  fileName: string;
};

export default function NotebookViewer({ csvContent, fileName }: NotebookViewerProps) {
  const { pyodide, loading, error: pyodideError, runCode, loadCSVData } = usePyodide();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (pyodide && csvContent && !dataLoaded) {
      loadCSVData(csvContent, "df_original").then(() => {
        setDataLoaded(true);
      });
    }
  }, [pyodide, csvContent, dataLoaded, loadCSVData]);

  if (loading) {
    return (
      <div className="glass-card panel-enter rounded-xl p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f4d03f] border-t-transparent" />
          <p className="text-sm text-[#c9a961]">
            Loading Python runtime... This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (pyodideError) {
    return (
      <div className="glass-card panel-enter rounded-xl bg-[#2a2416]/88 p-6 text-sm text-[#ffd700]">
        <strong>Error:</strong> {pyodideError}
      </div>
    );
  }

  const cells = [
    {
      id: "import",
      title: "1. Import Libraries",
      description: "Import pandas for data manipulation",
      code: `import pandas as pd
import numpy as np

print("✓ Libraries imported successfully")`,
      editable: false,
      autoRun: true,
      explanation: `Line 1: import pandas as pd
  • Imports the pandas library and gives it a shorter name 'pd'
  • Pandas is used for working with tables of data (DataFrames)
  • Why: Makes data manipulation easier and more efficient

Line 2: import numpy as np
  • Imports NumPy library as 'np'
  • NumPy handles numerical operations and arrays
  • Why: Pandas uses NumPy internally for calculations

Line 4: print("✓ Libraries imported successfully")
  • Displays a success message to confirm imports worked
  • Why: Helps verify the environment is set up correctly`,
    },
    {
      id: "load",
      title: "2. Load CSV Data",
      description: "Load the uploaded CSV file into a DataFrame",
      code: `# Original CSV data is loaded as 'df_original'
df = df_original.copy()

print(f"Loaded {len(df)} rows and {len(df.columns)} columns")
print(f"\\nColumn names: {list(df.columns)}")
df.head()`,
      editable: false,
      autoRun: false,
      explanation: `Line 1: # Original CSV data is loaded as 'df_original'
  • This is a comment (starts with #) explaining where data comes from
  • Comments are ignored by Python but help humans understand code
  • Why: Documentation makes code easier to understand

Line 2: df = df_original.copy()
  • Creates a copy of the original data and stores it in 'df'
  • .copy() creates a separate copy, not just a reference
  • Why: Preserves original data in case we need it later

Line 4: print(f"Loaded {len(df)} rows and {len(df.columns)} columns")
  • f-string (f"...") allows inserting variables into text
  • len(df) counts the number of rows
  • len(df.columns) counts the number of columns
  • Why: Shows us the size of our dataset

Line 5: print(f"\\nColumn names: {list(df.columns)}")
  • \\n creates a new line for better formatting
  • list(df.columns) gets all column names as a list
  • Why: Helps us see what data fields we have

Line 6: df.head()
  • Shows the first 5 rows of the DataFrame
  • Why: Quick preview to see what our data looks like`,
    },
    {
      id: "normalize",
      title: "3. Normalize Column Names",
      description: "Convert headers to lowercase and replace spaces with underscores",
      code: `# Normalize column names
df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

print(f"Normalized columns: {list(df.columns)}")
df.head()`,
      editable: true,
      autoRun: false,
      explanation: `Line 2: df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
  • This is a list comprehension - a compact way to transform data
  • for c in df.columns: loops through each column name
  • c.strip(): removes spaces from start and end
  • .lower(): converts text to lowercase
  • .replace(" ", "_"): replaces spaces with underscores
  • Why: Creates consistent, code-friendly column names
    - "First Name" becomes "first_name"
    - "  Age  " becomes "age"
    - "EMAIL" becomes "email"

Line 4: print(f"Normalized columns: {list(df.columns)}")
  • Shows the new column names after transformation
  • Why: Verifies the normalization worked correctly

Line 5: df.head()
  • Displays first 5 rows with new column names
  • Why: Visual confirmation of the changes`,
    },
    {
      id: "trim",
      title: "4. Trim Whitespace",
      description: "Remove leading/trailing whitespace from all string values",
      code: `# Trim whitespace from string columns
df = df.apply(lambda col: col.map(lambda x: x.strip() if isinstance(x, str) else x))

print("✓ Whitespace trimmed from all cells")
df.head()`,
      editable: true,
      autoRun: false,
      explanation: `Line 2: df = df.apply(lambda col: col.map(lambda x: x.strip() if isinstance(x, str) else x))
  • This is a complex line that processes every cell in the DataFrame
  • Let's break it down:

  df.apply(...): applies a function to each column
  lambda col: defines an anonymous function that receives a column
  col.map(...): applies another function to each value in the column
  lambda x: defines a function that receives each cell value
  isinstance(x, str): checks if value is a string
  x.strip() if ... else x: if string, remove spaces; otherwise keep as-is

  • Why: Cleans up data like "  John  " → "John"
    - Only affects string values
    - Leaves numbers and dates unchanged
    - Removes invisible characters that cause problems

Line 4: print("✓ Whitespace trimmed from all cells")
  • Confirms the operation completed
  • Why: Provides feedback that cleaning happened

Line 5: df.head()
  • Shows the cleaned data
  • Why: Visual verification of whitespace removal`,
    },
    {
      id: "empty",
      title: "5. Remove Empty Rows",
      description: "Drop rows where all values are missing",
      code: `# Count before
before = len(df)

# Remove empty rows
df = df.dropna(how="all")

# Count after
after = len(df)
print(f"Removed {before - after} empty rows")
print(f"Remaining rows: {after}")`,
      editable: true,
      autoRun: false,
      explanation: `Line 2: before = len(df)
  • Stores the current number of rows in variable 'before'
  • len(df) counts total rows
  • Why: Lets us calculate how many rows were removed

Line 5: df = df.dropna(how="all")
  • .dropna() removes rows with missing values
  • how="all": only remove rows where ALL values are missing
  • Alternative: how="any" would remove rows with ANY missing value
  • Why: Completely empty rows don't provide useful information
    - Keeps rows with partial data
    - Only removes truly empty rows

Line 8: after = len(df)
  • Counts rows after removal
  • Why: Used to calculate the difference

Line 9: print(f"Removed {before - after} empty rows")
  • before - after calculates how many were deleted
  • Why: Shows the impact of the cleaning operation

Line 10: print(f"Remaining rows: {after}")
  • Shows final row count
  • Why: Confirms how much data remains`,
    },
    {
      id: "duplicates",
      title: "6. Remove Duplicates",
      description: "Remove duplicate rows based on all columns",
      code: `# Count before
before = len(df)

# Remove duplicates
df = df.drop_duplicates()

# Count after
after = len(df)
print(f"Removed {before - after} duplicate rows")
print(f"Remaining rows: {after}")
df.head()`,
      editable: true,
      autoRun: false,
      explanation: `Line 2: before = len(df)
  • Stores current row count before removing duplicates
  • Why: Lets us measure the cleaning impact

Line 5: df = df.drop_duplicates()
  • Removes rows that are exact copies of other rows
  • Compares ALL columns by default
  • Keeps the first occurrence, removes the rest
  • Why: Duplicate data can skew analysis results
    - Example: If "John, 25" appears 3 times, keep only 1

  Optional parameters (not used here):
  • subset=['column1', 'column2']: only check specific columns
  • keep='last': keep last occurrence instead of first
  • keep=False: remove all duplicates including first

Line 8: after = len(df)
  • Counts remaining rows
  • Why: Used to calculate difference

Line 9: print(f"Removed {before - after} duplicate rows")
  • Shows how many duplicates were found and removed
  • If output is 0, data had no duplicates (good!)
  • Why: Validates data quality

Line 10: print(f"Remaining rows: {after}")
  • Shows final dataset size
  • Why: Confirms how much unique data we have

Line 11: df.head()
  • Displays first 5 rows of cleaned data
  • Why: Final visual check of the cleaned dataset`,
    },
    {
      id: "summary",
      title: "7. Data Summary",
      description: "View the final cleaned data statistics",
      code: `print("=== Cleaned Data Summary ===")
print(f"\\nRows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print(f"\\nColumn names: {list(df.columns)}")
print(f"\\nData types:")
print(df.dtypes)
print(f"\\nMissing values:")
print(df.isnull().sum())
print(f"\\nFirst 5 rows:")
df.head()`,
      editable: false,
      autoRun: false,
      explanation: `Line 1: print("=== Cleaned Data Summary ===")
  • Prints a header to organize output
  • Why: Makes output easier to read and scan

Line 2: print(f"\\nRows: {len(df)}")
  • \\n adds a blank line for spacing
  • Shows total number of rows remaining
  • Why: Quick view of dataset size

Line 3: print(f"Columns: {len(df.columns)}")
  • Shows total number of columns
  • Why: Confirms no columns were accidentally removed

Line 4: print(f"\\nColumn names: {list(df.columns)}")
  • Lists all column names
  • Why: Verifies column names are clean and normalized

Line 5-6: print(f"\\nData types:") and print(df.dtypes)
  • df.dtypes shows what type of data is in each column
  • Types include: int64 (numbers), float64 (decimals), object (text)
  • Why: Helps identify if columns need type conversion
    - Numbers stored as text need fixing
    - Dates might need parsing

Line 7-8: print(f"\\nMissing values:") and print(df.isnull().sum())
  • df.isnull() finds missing values (NaN, None)
  • .sum() counts missing values per column
  • Why: Identifies data quality issues
    - High missing values might indicate problems
    - Helps decide if imputation is needed

Line 9-10: print(f"\\nFirst 5 rows:") and df.head()
  • df.head() shows first 5 rows
  • Default is 5, can specify: df.head(10) for 10 rows
  • Why: Final visual inspection of cleaned data
    - Spot any remaining issues
    - Verify all cleaning steps worked`,
    },
    // ====================================================================
    // Visualization Cells — complete code + detailed explanations
    // ====================================================================
    {
      id: "viz-distplot",
      title: "8. DistPlot — Distribution with KDE",
      description: "Histogram overlaid with a Kernel Density Estimate curve to visualize value distribution and probability density.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import numpy as np

# --- Pick the first numeric column automatically ---
numeric_cols = df.select_dtypes(include='number').columns.tolist()
col = numeric_cols[0] if numeric_cols else None

if col is None:
    print("No numeric columns found for DistPlot.")
else:
    data = df[col].dropna().astype(float)

    fig, ax = plt.subplots(figsize=(9, 5))

    # Histogram
    counts, bin_edges, _ = ax.hist(
        data, bins=20, density=True,
        color='#d4af37', alpha=0.55, edgecolor='#c9a961', label='Histogram'
    )

    # KDE curve (Gaussian kernel)
    from scipy.stats import gaussian_kde
    kde = gaussian_kde(data, bw_method='scott')
    x_range = np.linspace(data.min(), data.max(), 300)
    ax.plot(x_range, kde(x_range), color='#ff6b6b', linewidth=2.5, label='KDE')
    ax.fill_between(x_range, kde(x_range), alpha=0.12, color='#ff6b6b')

    ax.set_title(f'DistPlot — {col}', color='#f4d03f', fontsize=14, fontweight='bold')
    ax.set_xlabel(col, color='#c9a961')
    ax.set_ylabel('Density', color='#c9a961')
    ax.legend()
    ax.tick_params(colors='#c9a961')
    fig.patch.set_facecolor('#1a1a1a')
    ax.set_facecolor('#1a1a1a')
    for spine in ax.spines.values():
        spine.set_color('#d4af37')

    plt.tight_layout()
    plt.savefig('/tmp/distplot.png', dpi=120, facecolor='#1a1a1a')
    plt.close()

    # Stats summary
    print(f"Column: {col}")
    print(f"  Mean:   {data.mean():.2f}")
    print(f"  Median: {data.median():.2f}")
    print(f"  Std:    {data.std():.2f}")
    print(f"  Min:    {data.min():.2f}  |  Max: {data.max():.2f}")
    print(f"  Skew:   {data.skew():.2f}")
    print("\\nPlot saved to /tmp/distplot.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a DistPlot — a histogram overlaid with a Kernel Density Estimate (KDE) curve.

Line 1-3: import matplotlib; matplotlib.use('AGG'); import matplotlib.pyplot as plt
  • Imports matplotlib with the non-interactive AGG backend
  • AGG renders to PNG files (no GUI window needed)
  • Why: Pyodide/server environments have no display — AGG writes to file

Line 6-7: numeric_cols = df.select_dtypes(include='number').columns.tolist()
  • Finds all columns containing numeric data (int, float)
  • .tolist() converts the Index to a Python list
  • Why: DistPlots require continuous numeric data

Line 13: data = df[col].dropna().astype(float)
  • Selects the column values and drops any NaN/missing entries
  • .astype(float) ensures all values are floating-point
  • Why: Missing values would break the histogram and KDE calculation

Line 17: counts, bin_edges, _ = ax.hist(data, bins=20, density=True, ...)
  • Creates a 20-bin histogram normalized to density (area = 1)
  • density=True makes the y-axis show probability density, not raw counts
  • Why: Density normalization lets the KDE curve overlay at the same scale

Line 22: from scipy.stats import gaussian_kde
  • Imports the Gaussian KDE estimator from SciPy
  • Why: KDE smooths the histogram into a continuous probability curve

Line 23-25: kde = gaussian_kde(data, bw_method='scott')
  • Creates the KDE estimator using Scott's rule for bandwidth
  • x_range generates 300 evenly spaced points for a smooth curve
  • ax.plot draws the KDE line; fill_between adds a translucent fill
  • Why: The smooth curve reveals the underlying distribution shape
    that discrete histogram bins can miss

Line 27-37: Styling and labels
  • Sets dark background (#1a1a1a) and gold accent colors
  • Why: Matches the application's visual theme

Line 41-47: Statistical summary
  • Prints mean, median, std, min, max, and skewness
  • Skewness > 0 means right-skewed (tail toward higher values)
  • Skewness < 0 means left-skewed (tail toward lower values)
  • Why: Numeric summaries complement the visual distribution`,
    },
    {
      id: "viz-pie",
      title: "9. Pie Chart — Category Proportions",
      description: "Proportional breakdown of a categorical or boolean column, showing the relative size of each category.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt

# --- Pick first low-cardinality column (<=10 unique) ---
cat_col = None
for c in df.columns:
    nunique = df[c].nunique()
    if 2 <= nunique <= 10:
        cat_col = c
        break

if cat_col is None:
    print("No suitable categorical column found (need 2-10 unique values).")
else:
    counts = df[cat_col].value_counts()

    colors = ['#d4af37', '#ff6b6b', '#6bc5ff', '#7ddf7d',
              '#c9a961', '#e8a87c', '#9b59b6', '#3498db',
              '#e74c3c', '#2ecc71']

    fig, ax = plt.subplots(figsize=(8, 6))
    wedges, texts, autotexts = ax.pie(
        counts.values,
        labels=counts.index,
        autopct='%1.1f%%',
        colors=colors[:len(counts)],
        startangle=140,
        textprops={'color': '#c9a961', 'fontsize': 10},
        wedgeprops={'edgecolor': '#1a1a1a', 'linewidth': 1.5}
    )
    for t in autotexts:
        t.set_color('#0a0a0a')
        t.set_fontweight('bold')

    ax.set_title(f'Pie Chart — {cat_col}', color='#f4d03f', fontsize=14, fontweight='bold')
    fig.patch.set_facecolor('#1a1a1a')

    plt.tight_layout()
    plt.savefig('/tmp/piechart.png', dpi=120, facecolor='#1a1a1a')
    plt.close()

    total = counts.sum()
    print(f"Column: {cat_col}  |  Total: {total}")
    for label, count in counts.items():
        pct = count / total * 100
        print(f"  {label}: {count} ({pct:.1f}%)")
    print("\\nPlot saved to /tmp/piechart.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a Pie Chart showing the proportional breakdown of a categorical column.

Line 6-10: Auto-detect a low-cardinality column
  • Loops through columns and finds one with 2–10 unique values
  • df[c].nunique() counts distinct non-null values
  • Why: Pie charts become unreadable with too many slices
    - 2–10 categories give clear, meaningful proportions

Line 16: counts = df[cat_col].value_counts()
  • Counts occurrences of each unique value, sorted descending
  • Returns a Series: index = labels, values = counts
  • Why: This is the raw data the pie chart needs

Line 18-20: colors = [...]
  • Pre-defined color palette with gold, red, blue, green tones
  • Why: Ensures each slice is visually distinct

Line 23-31: ax.pie(counts.values, labels=counts.index, autopct='%1.1f%%', ...)
  • counts.values: the numeric sizes for each wedge
  • labels: text labels placed next to each slice
  • autopct='%1.1f%%': shows percentage with 1 decimal inside each wedge
  • startangle=140: rotates the chart so the first slice starts at 140°
  • wedgeprops: adds dark borders between slices for clarity
  • Why: A well-formatted pie chart communicates proportions at a glance

Line 32-34: Style the percentage text
  • Sets percentage labels to dark color with bold weight
  • Why: Ensures readability against the colored wedge backgrounds

Line 40-44: Print summary table
  • Lists each category with its count and percentage
  • Why: Exact numbers complement the visual proportions
    - Pie charts are good for rough comparison but imprecise for exact values`,
    },
    {
      id: "viz-violin",
      title: "10. Violin Plot — Distribution by Group",
      description: "Compare the distribution shape of a numeric variable across different categories using violin plots.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import numpy as np

# --- Select numeric and categorical columns ---
numeric_cols = df.select_dtypes(include='number').columns.tolist()
cat_col = None
for c in df.columns:
    nunique = df[c].nunique()
    if 2 <= nunique <= 8 and c not in numeric_cols:
        cat_col = c
        break
# Fallback: use first low-unique numeric as category
if cat_col is None:
    for c in numeric_cols:
        if df[c].nunique() <= 6:
            cat_col = c
            break

num_col = numeric_cols[0] if numeric_cols else None

if num_col is None or cat_col is None:
    print("Need a numeric column and a categorical column for Violin Plot.")
else:
    groups = df[cat_col].dropna().unique()
    data_groups = [df[df[cat_col] == g][num_col].dropna().astype(float).values for g in groups]
    data_groups = [d for d, g in zip(data_groups, groups) if len(d) > 1]
    group_labels = [str(g) for d, g in zip(
        [df[df[cat_col] == g][num_col].dropna().values for g in groups], groups
    ) if len(d) > 1]

    fig, ax = plt.subplots(figsize=(9, 5))
    parts = ax.violinplot(data_groups, showmeans=True, showmedians=True, showextrema=True)

    # Style the violins
    colors = ['#d4af37', '#ff6b6b', '#6bc5ff', '#7ddf7d', '#c9a961', '#e8a87c', '#9b59b6', '#3498db']
    for i, body in enumerate(parts['bodies']):
        body.set_facecolor(colors[i % len(colors)])
        body.set_alpha(0.65)
        body.set_edgecolor('#c9a961')
    for key in ['cmeans', 'cmedians', 'cbars', 'cmins', 'cmaxes']:
        if key in parts:
            parts[key].set_color('#f4d03f')

    ax.set_xticks(range(1, len(group_labels) + 1))
    ax.set_xticklabels(group_labels, color='#c9a961')
    ax.set_title(f'Violin Plot — {num_col} by {cat_col}', color='#f4d03f', fontsize=14, fontweight='bold')
    ax.set_xlabel(cat_col, color='#c9a961')
    ax.set_ylabel(num_col, color='#c9a961')
    ax.tick_params(colors='#c9a961')
    fig.patch.set_facecolor('#1a1a1a')
    ax.set_facecolor('#1a1a1a')
    for spine in ax.spines.values():
        spine.set_color('#d4af37')

    plt.tight_layout()
    plt.savefig('/tmp/violinplot.png', dpi=120, facecolor='#1a1a1a')
    plt.close()

    print(f"Numeric: {num_col}  |  Category: {cat_col}")
    for label, data in zip(group_labels, data_groups):
        d = np.array(data)
        print(f"  {label} (n={len(d)}): mean={d.mean():.2f}, median={np.median(d):.2f}, std={d.std():.2f}")
    print("\\nPlot saved to /tmp/violinplot.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a Violin Plot — combining box plot statistics with KDE density shapes per group.

Line 7-20: Auto-detect columns
  • Finds a numeric column (continuous values to plot)
  • Finds a categorical column with 2–8 unique values
  • Fallback: treats a low-unique numeric column as a category
  • Why: Violin plots need one numeric axis and one grouping axis

Line 27: data_groups = [df[df[cat_col] == g][num_col]...]
  • For each unique category value, extracts the numeric values
  • Filters out groups with fewer than 2 data points
  • Why: Each group needs enough data to compute a density shape

Line 33: parts = ax.violinplot(data_groups, showmeans=True, showmedians=True, showextrema=True)
  • Creates violin shapes for each group
  • showmeans: horizontal line at the mean value
  • showmedians: horizontal line at the median
  • showextrema: whiskers at min/max values
  • Why: These statistics embedded in the violin shape give
    a complete view of each group's distribution

Line 36-42: Style the violins
  • Each violin body gets a unique color from the palette
  • Alpha 0.65 makes shapes semi-transparent to show overlap
  • Statistical markers (mean/median lines) are gold
  • Why: Color-coding makes group comparison intuitive

Line 44-46: Set x-axis tick labels to group names
  • Why: By default violinplot uses numeric positions (1, 2, 3...)
    — labels make the chart readable

Line 59-62: Print per-group statistics
  • Shows count, mean, median, and std for each group
  • Why: Exact values to complement the visual comparison
    - A wider violin = more spread; a taller peak = more concentration`,
    },
    {
      id: "viz-heatmap",
      title: "11. HeatMap — Correlation Matrix",
      description: "Pairwise Pearson correlation matrix of all numeric features, color-coded by strength and direction.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import numpy as np

# --- Compute correlation matrix for numeric columns ---
numeric_df = df.select_dtypes(include='number')
cols = numeric_df.columns.tolist()

if len(cols) < 2:
    print("Need at least 2 numeric columns for a HeatMap.")
else:
    # Limit to 10 columns for readability
    if len(cols) > 10:
        cols = cols[:10]
        numeric_df = numeric_df[cols]

    corr = numeric_df.corr()

    fig, ax = plt.subplots(figsize=(10, 8))

    # Draw heatmap manually for full control
    im = ax.imshow(corr.values, cmap='RdYlGn', vmin=-1, vmax=1, aspect='auto')

    # Add colorbar
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.tick_params(colors='#c9a961')

    # Annotate cells with correlation values
    for i in range(len(cols)):
        for j in range(len(cols)):
            val = corr.values[i, j]
            color = '#0a0a0a' if abs(val) > 0.5 else '#c9a961'
            ax.text(j, i, f'{val:.2f}', ha='center', va='center',
                    color=color, fontsize=8, fontweight='bold')

    ax.set_xticks(range(len(cols)))
    ax.set_yticks(range(len(cols)))
    ax.set_xticklabels(cols, rotation=45, ha='right', color='#c9a961', fontsize=9)
    ax.set_yticklabels(cols, color='#c9a961', fontsize=9)
    ax.set_title('Correlation Heatmap', color='#f4d03f', fontsize=14, fontweight='bold', pad=15)
    fig.patch.set_facecolor('#1a1a1a')
    ax.set_facecolor('#1a1a1a')

    plt.tight_layout()
    plt.savefig('/tmp/heatmap.png', dpi=120, facecolor='#1a1a1a')
    plt.close()

    # Find strongest correlations
    pairs = []
    for i in range(len(cols)):
        for j in range(i+1, len(cols)):
            pairs.append((cols[i], cols[j], corr.values[i, j]))
    pairs.sort(key=lambda x: abs(x[2]), reverse=True)

    print(f"Correlation matrix: {len(cols)} features")
    print("\\nTop 5 correlations (by absolute value):")
    for c1, c2, r in pairs[:5]:
        direction = "positive" if r > 0 else "negative"
        strength = "strong" if abs(r) > 0.7 else "moderate" if abs(r) > 0.4 else "weak"
        print(f"  {c1} & {c2}: r = {r:.3f} ({strength} {direction})")
    print("\\nPlot saved to /tmp/heatmap.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a Correlation Heatmap showing pairwise Pearson correlations between numeric columns.

Line 7-8: numeric_df = df.select_dtypes(include='number')
  • Selects only numeric columns from the DataFrame
  • Why: Pearson correlation is defined for numeric data only

Line 13-15: Limit to 10 columns
  • If more than 10 numeric columns, keeps only the first 10
  • Why: Large matrices become unreadable; 10x10 is the practical limit

Line 17: corr = numeric_df.corr()
  • Computes the Pearson correlation matrix
  • Result is an NxN DataFrame where corr[i][j] = correlation of column i with j
  • Values range from -1 (perfect inverse) to +1 (perfect positive)
  • 0 means no linear relationship
  • Why: The correlation matrix is the foundation of the heatmap

Line 21: im = ax.imshow(corr.values, cmap='RdYlGn', vmin=-1, vmax=1)
  • imshow renders the matrix as a color grid
  • cmap='RdYlGn': Red (negative) → Yellow (zero) → Green (positive)
  • vmin=-1, vmax=1: fixes the color scale to correlation range
  • Why: Color encodes correlation strength visually

Line 24-25: fig.colorbar(im, ...)
  • Adds a color legend bar showing the value-to-color mapping
  • Why: Viewers need the scale to interpret colors as values

Line 28-32: Annotate cells
  • Writes the actual r-value inside each cell
  • Dark text on strong colors, light text on weak colors
  • Why: Exact values are important — color alone is approximate

Line 47-54: Find and print top correlations
  • Extracts all unique pairs (i < j to avoid duplicates)
  • Sorts by absolute correlation strength
  • Classifies each as strong/moderate/weak and positive/negative
  • Why: Highlights the most important relationships in the data
    - Strong positive: features increase together
    - Strong negative: one increases as the other decreases
    - Weak: features are largely independent`,
    },
    {
      id: "viz-pairplot",
      title: "12. PairPlot — Pairwise Feature Relationships",
      description: "Grid of scatter plots for every pair of numeric features, with histograms on the diagonal.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import numpy as np

# --- Select up to 4 numeric columns for readability ---
numeric_cols = df.select_dtypes(include='number').columns.tolist()[:4]

# Optional: find a grouping column
group_col = None
for c in df.columns:
    nunique = df[c].nunique()
    if 2 <= nunique <= 5 and c not in numeric_cols:
        group_col = c
        break

if len(numeric_cols) < 2:
    print("Need at least 2 numeric columns for PairPlot.")
else:
    n = len(numeric_cols)
    fig, axes = plt.subplots(n, n, figsize=(3 * n + 1, 3 * n + 1))
    fig.patch.set_facecolor('#1a1a1a')

    palette = ['#d4af37', '#ff6b6b', '#6bc5ff', '#7ddf7d', '#c9a961']

    if group_col:
        groups = df[group_col].dropna().unique()
    else:
        groups = ['all']

    for i in range(n):
        for j in range(n):
            ax = axes[i][j] if n > 1 else axes
            ax.set_facecolor('#1a1a1a')
            for spine in ax.spines.values():
                spine.set_color('#d4af37')
            ax.tick_params(colors='#c9a961', labelsize=7)

            if i == j:
                # Diagonal: histogram
                for gi, g in enumerate(groups):
                    subset = df if g == 'all' else df[df[group_col] == g]
                    vals = subset[numeric_cols[i]].dropna().astype(float)
                    ax.hist(vals, bins=15, alpha=0.6, color=palette[gi % len(palette)],
                            edgecolor='#c9a961', linewidth=0.5, label=str(g))
                ax.set_ylabel('Count', fontsize=8, color='#c9a961')
            else:
                # Off-diagonal: scatter
                for gi, g in enumerate(groups):
                    subset = df if g == 'all' else df[df[group_col] == g]
                    x = subset[numeric_cols[j]].dropna().astype(float)
                    y = subset[numeric_cols[i]].dropna().astype(float)
                    min_len = min(len(x), len(y))
                    ax.scatter(x.values[:min_len], y.values[:min_len],
                              s=12, alpha=0.5, color=palette[gi % len(palette)], label=str(g))

            # Labels on edges only
            if i == n - 1:
                ax.set_xlabel(numeric_cols[j], fontsize=8, color='#c9a961')
            else:
                ax.set_xticklabels([])
            if j == 0:
                ax.set_ylabel(numeric_cols[i], fontsize=8, color='#c9a961')

    # Legend
    if group_col and n > 1:
        handles, labels = axes[0][1].get_legend_handles_labels()
        fig.legend(handles, labels, loc='upper right', fontsize=9,
                  title=group_col, title_fontsize=10,
                  facecolor='#2a2416', edgecolor='#d4af37',
                  labelcolor='#c9a961')

    fig.suptitle('Pair Plot' + (f' (colored by {group_col})' if group_col else ''),
                color='#f4d03f', fontsize=14, fontweight='bold', y=1.01)
    plt.tight_layout()
    plt.savefig('/tmp/pairplot.png', dpi=100, facecolor='#1a1a1a', bbox_inches='tight')
    plt.close()

    print(f"Features: {', '.join(numeric_cols)}")
    if group_col:
        print(f"Grouped by: {group_col} ({', '.join(str(g) for g in groups)})")
    print(f"Grid: {n}x{n} = {n*n} panels ({n} histograms + {n*(n-1)} scatter plots)")
    print("\\nPlot saved to /tmp/pairplot.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a Pair Plot — an NxN grid showing all pairwise relationships between numeric features.

Line 7: numeric_cols = df.select_dtypes(include='number').columns.tolist()[:4]
  • Selects up to 4 numeric columns
  • Why: A 4x4 grid = 16 panels; more columns make the plot too dense

Line 10-15: Find a grouping column
  • Looks for a column with 2–5 unique values (e.g. sex, output)
  • Why: Color-coding by group reveals whether features separate groups

Line 21: fig, axes = plt.subplots(n, n, figsize=(3*n+1, 3*n+1))
  • Creates an NxN grid of subplots
  • Each subplot is roughly 3 inches square
  • Why: Every pair of features gets its own scatter plot

Line 32-33: Diagonal panels — Histograms
  • When i == j, both axes reference the same column
  • Draws a histogram showing that feature's distribution
  • If grouped, draws overlapping histograms per group
  • Why: Diagonal shows univariate distribution for each feature

Line 38-43: Off-diagonal panels — Scatter plots
  • When i != j, plots column j (x) vs column i (y)
  • Each group gets its own color
  • s=12: small dot size; alpha=0.5: semi-transparent to show density
  • Why: Scatter plots reveal correlations, clusters, and non-linear patterns

Line 47-51: Labels on edges only
  • Column names appear on the bottom row (x) and left column (y)
  • Interior panels hide tick labels to avoid clutter
  • Why: Reduces visual noise while keeping the grid readable

Line 54-58: Shared legend
  • If grouped, adds a legend showing which color = which group
  • Why: One legend is cleaner than repeating it in every panel

Key insight: Pair plots let you spot which feature pairs best
separate groups (clear color clusters in scatter cells) and which
features have strong correlations (diagonal scatter patterns).`,
    },
    {
      id: "viz-jointplot",
      title: "13. JointPlot — Bivariate Distribution",
      description: "Central scatter plot with marginal histograms on each axis, showing joint and individual distributions of two variables.",
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.gridspec import GridSpec

# --- Pick two numeric columns ---
numeric_cols = df.select_dtypes(include='number').columns.tolist()

if len(numeric_cols) < 2:
    print("Need at least 2 numeric columns for JointPlot.")
else:
    x_col, y_col = numeric_cols[0], numeric_cols[1]
    x_data = df[x_col].dropna().astype(float)
    y_data = df[y_col].dropna().astype(float)
    min_len = min(len(x_data), len(y_data))
    x_data, y_data = x_data.values[:min_len], y_data.values[:min_len]

    # Create layout: main scatter + top marginal + right marginal
    fig = plt.figure(figsize=(9, 9))
    fig.patch.set_facecolor('#1a1a1a')
    gs = GridSpec(4, 4, hspace=0.05, wspace=0.05)

    ax_main   = fig.add_subplot(gs[1:, :-1])
    ax_top    = fig.add_subplot(gs[0, :-1], sharex=ax_main)
    ax_right  = fig.add_subplot(gs[1:, -1], sharey=ax_main)

    # Main scatter plot
    ax_main.scatter(x_data, y_data, s=18, alpha=0.5, color='#d4af37', edgecolors='#c9a961', linewidth=0.3)
    ax_main.set_xlabel(x_col, color='#c9a961', fontsize=11)
    ax_main.set_ylabel(y_col, color='#c9a961', fontsize=11)

    # Regression line
    z = np.polyfit(x_data, y_data, 1)
    p = np.poly1d(z)
    x_line = np.linspace(x_data.min(), x_data.max(), 100)
    ax_main.plot(x_line, p(x_line), color='#ff6b6b', linewidth=2, linestyle='--', alpha=0.8)

    # Top marginal histogram
    ax_top.hist(x_data, bins=25, color='#d4af37', alpha=0.6, edgecolor='#c9a961', linewidth=0.5)
    ax_top.set_ylabel('Count', color='#c9a961', fontsize=9)
    plt.setp(ax_top.get_xticklabels(), visible=False)

    # Right marginal histogram
    ax_right.hist(y_data, bins=25, orientation='horizontal',
                  color='#d4af37', alpha=0.6, edgecolor='#c9a961', linewidth=0.5)
    ax_right.set_xlabel('Count', color='#c9a961', fontsize=9)
    plt.setp(ax_right.get_yticklabels(), visible=False)

    # Style all axes
    for ax in [ax_main, ax_top, ax_right]:
        ax.set_facecolor('#1a1a1a')
        ax.tick_params(colors='#c9a961')
        for spine in ax.spines.values():
            spine.set_color('#d4af37')

    # Correlation annotation
    r = np.corrcoef(x_data, y_data)[0, 1]
    ax_main.annotate(f'r = {r:.3f}', xy=(0.05, 0.95), xycoords='axes fraction',
                     fontsize=12, fontweight='bold', color='#f4d03f',
                     bbox=dict(boxstyle='round,pad=0.3', facecolor='#2a2416', edgecolor='#d4af37'))

    fig.suptitle(f'Joint Plot — {x_col} vs {y_col}', color='#f4d03f',
                fontsize=14, fontweight='bold', y=0.98)
    plt.savefig('/tmp/jointplot.png', dpi=120, facecolor='#1a1a1a', bbox_inches='tight')
    plt.close()

    # Summary
    strength = "strong" if abs(r) > 0.7 else "moderate" if abs(r) > 0.4 else "weak"
    direction = "positive" if r > 0 else "negative"
    print(f"X: {x_col}  |  Y: {y_col}")
    print(f"Pearson r = {r:.3f} ({strength} {direction} correlation)")
    print(f"\\n{x_col}: mean={x_data.mean():.2f}, std={x_data.std():.2f}, range=[{x_data.min():.2f}, {x_data.max():.2f}]")
    print(f"{y_col}: mean={y_data.mean():.2f}, std={y_data.std():.2f}, range=[{y_data.min():.2f}, {y_data.max():.2f}]")
    print("\\nPlot saved to /tmp/jointplot.png")`,
      editable: true,
      autoRun: false,
      explanation: `This cell creates a Joint Plot — a scatter plot with marginal histograms on each axis.

Line 5: from matplotlib.gridspec import GridSpec
  • GridSpec lets you create complex subplot layouts with precise sizing
  • Why: The joint plot needs 3 panels with shared axes (not a simple grid)

Line 20-22: GridSpec layout
  • Creates a 4x4 grid with minimal spacing
  • Main scatter: rows 1-3, columns 0-2 (the large central panel)
  • Top marginal: row 0, columns 0-2 (shares x-axis with main)
  • Right marginal: rows 1-3, column 3 (shares y-axis with main)
  • Why: This layout links the scatter and histograms spatially

Line 28: ax_main.scatter(x_data, y_data, ...)
  • Plots each data point as a small semi-transparent gold dot
  • edgecolors add subtle borders for definition
  • Why: The scatter reveals the joint relationship between two variables

Line 31-34: Regression line
  • np.polyfit fits a degree-1 (linear) polynomial y = mx + b
  • np.poly1d creates a callable function from the coefficients
  • Drawn as a dashed red line over the scatter
  • Why: The trend line shows the overall linear direction
    — rising line = positive correlation, falling = negative

Line 37-38: Top marginal histogram
  • Shows the x-variable's distribution above the scatter
  • plt.setp hides x-tick labels (shared with main)
  • Why: Reveals where x-values concentrate, independent of y

Line 41-44: Right marginal histogram
  • orientation='horizontal' rotates the bars to align with the y-axis
  • Why: Shows y-variable distribution alongside the scatter

Line 52-55: Pearson correlation annotation
  • np.corrcoef computes the correlation coefficient
  • Displayed as a badge in the scatter plot corner
  • r near +1: strong positive; r near -1: strong negative; r near 0: no linear relationship
  • Why: The single most important summary statistic for the joint relationship

The three panels together reveal more than any single view:
• Scatter: joint pattern, clusters, outliers
• Top histogram: x-distribution shape
• Right histogram: y-distribution shape`,
    },
    {
      id: "custom",
      title: "14. Your Custom Code",
      description: "Write and run your own Python code here. The cleaned DataFrame is available as 'df'.",
      code: `# Your code here
# Example: Get column statistics
df.describe()`,
      editable: true,
      autoRun: false,
      explanation: `This cell is yours! Write any Python code you want.

The cleaned DataFrame is available as 'df'
Common operations you can try:

Data Exploration:
• df.info() - Overview of data types and memory usage
• df.describe() - Statistical summary of numeric columns
• df['column_name'].value_counts() - Count unique values
• df['column_name'].unique() - List unique values
• df.shape - Get (rows, columns) as a tuple

Filtering Data:
• df[df['age'] > 25] - Filter rows where age > 25
• df[df['name'].str.contains('John')] - Find names containing 'John'
• df[df['column'].isnull()] - Find rows with missing values

Column Operations:
• df['new_column'] = df['col1'] + df['col2'] - Create new column
• df.drop('column_name', axis=1) - Remove a column
• df.rename(columns={'old': 'new'}) - Rename column

Grouping & Aggregation:
• df.groupby('category')['value'].mean() - Average by group
• df.groupby('category').size() - Count items per group

Sorting:
• df.sort_values('column_name') - Sort by column
• df.sort_values('column', ascending=False) - Sort descending

Try it out! Experiment with your data.`,
    },
  ];

  return (
    <div className="space-y-6 reveal-up delay-1">
      <div className="glass-card hover-lift rounded-xl bg-[#2a2416]/84 p-4">
        <div className="flex items-start gap-3">
          <div className="status-pulse mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-xs font-bold text-[#0a0a0a]">
            ✓
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#f4d03f]">Interactive Python Environment</h3>
            <p className="mt-1 text-sm text-[#c9a961]">
              File: <span className="font-mono text-xs text-[#f4d03f]">{fileName}</span>. Your CSV data is loaded as{" "}
              <code className="rounded bg-[#1a1a1a] px-1 py-0.5 font-mono text-xs text-[#ffd700]">df_original</code>. Click &quot;Run&quot; on any cell to execute code.
              Edit cells marked as editable to customize the cleaning process.
            </p>
          </div>
        </div>
      </div>

      {cells.map((cell, index) => (
        <div
          key={cell.id}
          className="space-y-2 reveal-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div>
            <h3 className="text-lg font-semibold text-[#f4d03f]">{cell.title}</h3>
            <p className="text-sm text-[#c9a961]">{cell.description}</p>
            {cell.editable && (
              <span className="mt-1 inline-block rounded-full bg-[#2a2416] px-2 py-0.5 text-xs font-medium text-[#d4af37]">
                Editable
              </span>
            )}
          </div>
          <CodeCell
            initialCode={cell.code}
            isEditable={cell.editable}
            onExecute={runCode}
            autoRun={dataLoaded && cell.autoRun}
            showOutput={true}
            explanation={cell.explanation}
          />
        </div>
      ))}

      <div className="glass-card hover-lift rounded-xl bg-[#2a2416]/84 p-6">
        <h3 className="text-lg font-semibold text-[#f4d03f]">Tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-[#c9a961]">
          <li>• Run cells in order for best results</li>
          <li>• Edit cells marked as &quot;Editable&quot; to customize the cleaning process</li>
          <li>• The cleaned data is stored in the <code className="rounded bg-[#1a1a1a] px-1 py-0.5 font-mono text-xs text-[#ffd700]">df</code> variable</li>
          <li>• Use the &quot;Your Custom Code&quot; cell to perform additional analysis</li>
          <li>• All pandas and numpy functions are available</li>
        </ul>
      </div>
    </div>
  );
}
