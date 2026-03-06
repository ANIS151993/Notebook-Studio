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
    {
      id: "custom",
      title: "8. Your Custom Code",
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
