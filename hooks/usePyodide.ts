"use client";

import { useEffect, useState, useRef } from "react";

type PyodideGlobals = {
  set: (key: string, value: string) => void;
};

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (packages: string[] | string) => Promise<void>;
  globals: PyodideGlobals;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (initPromise.current) return;

    initPromise.current = (async () => {
      try {
        // Load Pyodide from CDN
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.async = true;

        const scriptLoadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
        });

        document.head.appendChild(script);
        await scriptLoadPromise;

        if (!window.loadPyodide) {
          throw new Error("Pyodide loader not available");
        }

        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        });

        // Load pandas and other packages
        await pyodideInstance.loadPackage(["pandas", "numpy"]);

        setPyodide(pyodideInstance);
        setLoading(false);
      } catch (err: unknown) {
        console.error("Failed to load Pyodide:", err);
        setError(err instanceof Error ? err.message : "Failed to load Python runtime");
        setLoading(false);
      }
    })();
  }, []);

  const runCode = async (code: string): Promise<{ output: string; error: string | null }> => {
    if (!pyodide) {
      return { output: "", error: "Python runtime not loaded" };
    }

    try {
      // Capture stdout
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run user code
      const result = await pyodide.runPythonAsync(code);

      // Get stdout
      const stdoutResult = await pyodide.runPythonAsync(`sys.stdout.getvalue()`);
      const stderrResult = await pyodide.runPythonAsync(`sys.stderr.getvalue()`);
      const stdout = typeof stdoutResult === "string" ? stdoutResult : String(stdoutResult ?? "");
      const stderr = typeof stderrResult === "string" ? stderrResult : String(stderrResult ?? "");

      // Reset stdout
      await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);

      let output = stdout || "";
      if (result !== undefined && result !== null) {
        output += (output ? "\n" : "") + String(result);
      }

      return {
        output: output || "(no output)",
        error: stderr || null,
      };
    } catch (err: unknown) {
      return {
        output: "",
        error: err instanceof Error ? err.message : "Execution error",
      };
    }
  };

  const loadCSVData = async (csvContent: string, variableName: string = "df") => {
    if (!pyodide) return;

    try {
      // Store CSV content in Pyodide
      pyodide.globals.set("csv_content", csvContent);

      // Load into pandas DataFrame
      await pyodide.runPythonAsync(`
import pandas as pd
from io import StringIO
${variableName} = pd.read_csv(StringIO(csv_content))
      `);
    } catch (err) {
      console.error("Failed to load CSV:", err);
    }
  };

  return {
    pyodide,
    loading,
    error,
    runCode,
    loadCSVData,
  };
}
