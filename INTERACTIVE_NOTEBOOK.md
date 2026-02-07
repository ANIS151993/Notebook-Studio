# Interactive Python Notebook Feature 🎉

## Overview

The Notebook Studio now includes an **Interactive Python Notebook** that runs directly in your browser! After uploading a CSV file, you can:

1. **See how** the CSV cleaning process works step-by-step
2. **Run Python code** directly in the browser (no server needed)
3. **Edit code cells** to customize the cleaning process
4. **Write your own Python code** for data analysis

## Features

### ✨ Interactive Code Execution
- Runs Python using **Pyodide** (Python compiled to WebAssembly)
- Executes pandas, numpy, and standard library code
- All processing happens locally in your browser
- No backend server required

### 📊 Step-by-Step CSV Cleaning
The notebook shows the complete cleaning pipeline:

1. **Import Libraries** - Load pandas and numpy
2. **Load CSV Data** - Read your uploaded CSV
3. **Normalize Column Names** - Convert to lowercase, replace spaces
4. **Trim Whitespace** - Remove leading/trailing spaces
5. **Remove Empty Rows** - Drop rows with all null values
6. **Remove Duplicates** - Keep only unique rows
7. **Data Summary** - View statistics and info
8. **Your Custom Code** - Write and run your own Python!

### 🎯 Key Capabilities

#### Editable Cells
- Some cells are marked as "Editable"
- Click in the code area to modify
- Change cleaning logic to fit your needs
- Run modified code with the ▶ Run button

#### Custom Code Cell
- Last cell is for your own Python code
- The cleaned DataFrame is available as `df`
- Use any pandas or numpy functions
- Examples: `df.describe()`, `df.groupby('column').sum()`, etc.

#### Real-time Output
- Click "Run" on any cell to execute
- See output immediately below the cell
- View DataFrames, print statements, and plots
- Errors are shown with helpful messages

## How to Use

### Step 1: Upload CSV
1. Go to the home page
2. Upload your CSV file
3. Wait for automatic cleaning to complete

### Step 2: Switch to Interactive Notebook
1. Click the **"Interactive Notebook"** tab
2. Wait a few seconds for Python to load (first time only)
3. See the green "Interactive Python Environment" message

### Step 3: Run Code Cells
1. Click "▶ Run" on any cell to execute it
2. The first cell (Import Libraries) runs automatically
3. Run cells in order for best results
4. View output below each cell

### Step 4: Customize & Experiment
1. Edit cells marked as "Editable"
2. Modify the cleaning logic
3. Write custom analysis in the "Your Custom Code" cell
4. Re-run cells to see new results

## Technical Details

### Python Runtime
- **Pyodide v0.25.0** - Python 3.11 in WebAssembly
- **Packages included**: pandas, numpy
- **Runs entirely in browser** - no server calls
- **Loading time**: ~5-10 seconds on first load
- **Cached**: Faster on subsequent uses

### Code Highlighting
- Uses `react-syntax-highlighter` for Python syntax
- VS Code Dark+ theme
- Supports both display and editing modes

### Data Flow
1. CSV uploaded → stored in React state
2. Data passed to Pyodide as string
3. Loaded into pandas DataFrame as `df_original`
4. Each cell manipulates `df` variable
5. Results displayed below cells

### Browser Compatibility
- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (may be slower)
- **Mobile**: ⚠️ Works but loading is slow

## Example Usage

### Example 1: View Data Summary
```python
# Already included in cell 7
print("=== Cleaned Data Summary ===")
print(f"\nRows: {len(df)}")
print(f"Columns: {len(df.columns)}")
df.head()
```

### Example 2: Custom Analysis
```python
# In the "Your Custom Code" cell
# Get statistics for numeric columns
df.describe()

# Count unique values in a column
print(df['column_name'].value_counts())

# Filter data
filtered = df[df['column_name'] > 100]
print(f"Filtered rows: {len(filtered)}")
```

### Example 3: Data Transformation
```python
# Convert column to datetime
df['date_column'] = pd.to_datetime(df['date_column'])

# Create new column
df['total'] = df['quantity'] * df['price']

# Group by and aggregate
summary = df.groupby('category')['total'].sum()
print(summary)
```

### Example 4: Advanced Cleaning
Edit cell 3 (Normalize Column Names) to customize:
```python
# Custom normalization - keep uppercase
df.columns = [c.strip().replace(" ", "_") for c in df.columns]

print(f"Normalized columns: {list(df.columns)}")
df.head()
```

## Tips & Tricks

### 💡 Best Practices
- Run cells in order from top to bottom
- Use `df.head()` to preview data after transformations
- Check for errors in red text below cells
- The original data is in `df_original` (never modified)
- Current data is in `df` (modified by each cell)

### ⚡ Performance
- Processing is fast for files under 10MB
- Larger files (10MB+) may take longer to load
- All operations are local - no network delays
- Refresh page to reset if Python becomes unresponsive

### 🎨 Customization Ideas
- Change column normalization rules
- Add custom validation logic
- Create calculated columns
- Export specific subsets of data
- Perform statistical analysis
- Generate data summaries

## Troubleshooting

### Python Runtime Won't Load
- **Issue**: Stuck on "Loading Python runtime..."
- **Solution**: Wait up to 30 seconds, refresh page if needed
- **Cause**: First-time download of WebAssembly files (~20MB)

### Cell Won't Run
- **Issue**: Click "Run" but nothing happens
- **Solution**: Wait for "Interactive Python Environment" green badge
- **Cause**: Python not fully initialized yet

### Error: "Python runtime not loaded"
- **Issue**: Red error message when running code
- **Solution**: Wait for loading to complete
- **Cause**: Trying to run before Pyodide is ready

### Error in Code Output
- **Issue**: Red error message below cell
- **Solution**: Check syntax, variable names, and data types
- **Cause**: Python code error (same as regular Python)

### DataFrame Not Found
- **Issue**: Error: "name 'df' is not defined"
- **Solution**: Run cell 2 (Load CSV Data) first
- **Cause**: Cells run out of order

## Architecture

### Components

#### `usePyodide.ts` Hook
- Manages Pyodide initialization
- Loads Python packages (pandas, numpy)
- Executes code with output capture
- Handles CSV data loading

#### `CodeCell.tsx` Component
- Displays Python code with syntax highlighting
- Shows editable textarea or read-only display
- Executes code and shows output
- Handles loading and error states

#### `NotebookViewer.tsx` Component
- Orchestrates all cells in sequence
- Loads CSV data into Pyodide
- Manages cell execution order
- Shows tips and instructions

#### `CsvNotebookBuilder.tsx` Component (Updated)
- Added tab system (Upload | Interactive Notebook)
- Stores raw CSV content for notebook
- Switches between download and notebook views

### State Management
- React useState for UI state
- Pyodide globals for Python variables
- Browser localStorage for Pyodide cache

### Data Flow
```
CSV Upload
    ↓
Store in State (rawCsvContent)
    ↓
Pass to NotebookViewer
    ↓
Load into Pyodide (df_original)
    ↓
Execute Cells
    ↓
Display Results
```

## Future Enhancements

Potential features for future versions:
- 📊 **Matplotlib support** - Generate charts and graphs
- 💾 **Save notebooks** - Export modified notebooks
- 🔗 **Cell linking** - Automatically run dependent cells
- 📝 **Markdown cells** - Add documentation between code
- 🎨 **Themes** - Light/dark mode for code cells
- ⚙️ **More packages** - scikit-learn, statsmodels, etc.
- 📤 **Export results** - Save cleaned data from notebook
- 🔄 **Cell reordering** - Drag and drop cells

## Credits

Built with:
- **Pyodide** - Python in WebAssembly
- **React** - UI framework
- **Next.js** - React framework
- **react-syntax-highlighter** - Code highlighting
- **pandas** - Data manipulation (via Pyodide)
- **numpy** - Numerical computing (via Pyodide)

## License

Part of Notebook Studio - See main project license

---

**Ready to try it?** Upload a CSV and click "Interactive Notebook" to get started! 🚀
