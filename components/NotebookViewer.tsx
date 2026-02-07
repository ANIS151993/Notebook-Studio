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
      <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f4d03f] border-t-transparent"></div>
          <p className="text-sm text-[#c9a961]">
            Loading Python runtime... This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (pyodideError) {
    return (
      <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-6 text-sm text-[#ffd700]">
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
    },
    {
      id: "custom",
      title: "8. Your Custom Code",
      description: "Write and run your own Python code here. The cleaned DataFrame is available as 'df'.",
      code: `# Your code here
# Example: Get column statistics
df.describe()`,
      editable: true,
      autoRun: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-[#0a0a0a] text-xs font-bold">
            ✓
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#f4d03f]">Interactive Python Environment</h3>
            <p className="mt-1 text-sm text-[#c9a961]">
              Your CSV data is loaded as <code className="rounded bg-[#1a1a1a] px-1 py-0.5 font-mono text-xs text-[#ffd700]">df_original</code>.
              Click "Run" on any cell to execute the code. Edit cells marked as editable to customize the cleaning process.
            </p>
          </div>
        </div>
      </div>

      {cells.map((cell) => (
        <div key={cell.id} className="space-y-2">
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
          />
        </div>
      ))}

      <div className="rounded-xl border border-[#d4af37] bg-[#2a2416] p-6">
        <h3 className="text-lg font-semibold text-[#f4d03f]">Tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-[#c9a961]">
          <li>• Run cells in order for best results</li>
          <li>• Edit cells marked as "Editable" to customize the cleaning process</li>
          <li>• The cleaned data is stored in the <code className="rounded bg-[#1a1a1a] px-1 py-0.5 font-mono text-xs text-[#ffd700]">df</code> variable</li>
          <li>• Use the "Your Custom Code" cell to perform additional analysis</li>
          <li>• All pandas and numpy functions are available</li>
        </ul>
      </div>
    </div>
  );
}
