"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import NotebookViewer from "./NotebookViewer";
import CsvVisualizations from "./CsvVisualizations";

type Stats = {
  rows: number;
  columns: string[];
};

type Tab = "upload" | "notebook" | "visualizations";

const normalizeHeader = (header: string) =>
  header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function CsvNotebookBuilder() {
  const [file, setFile] = useState<File | null>(null);
  const [cleanedCsv, setCleanedCsv] = useState<string | null>(null);
  const [rawCsvContent, setRawCsvContent] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      return;
    }

    setProcessing(true);
    setError(null);
    setFile(selected);
    setCleanedCsv(null);
    setRawCsvContent(null);
    setNotebook(null);
    setStats(null);
    setOutputName(null);

    try {
      // Read raw CSV content for notebook viewer
      const rawContent = await selected.text();
      setRawCsvContent(rawContent);

      const result = await new Promise<Papa.ParseResult<Record<string, string>>>(
        (resolve, reject) => {
          Papa.parse(selected, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        },
      );

      const rawRows = result.data ?? [];
      const rawHeaders = result.meta.fields ?? Object.keys(rawRows[0] ?? {});

      if (!rawRows.length) {
        setError("No rows were found in this CSV file.");
        setProcessing(false);
        return;
      }

      const headerCounts = new Map<string, number>();
      const headerMap = new Map<string, string>();

      rawHeaders.forEach((header) => {
        const base = normalizeHeader(header) || "column";
        const count = headerCounts.get(base) ?? 0;
        headerCounts.set(base, count + 1);
        const unique = count === 0 ? base : `${base}_${count + 1}`;
        headerMap.set(header, unique);
      });

      const cleanedRows = rawRows
        .map((row) => {
          const cleaned: Record<string, string | number | null> = {};
          rawHeaders.forEach((header) => {
            const key = headerMap.get(header) ?? header;
            const value = row[header];
            cleaned[key] =
              typeof value === "string" ? value.trim() : value ?? null;
          });
          return cleaned;
        })
        .filter((row) =>
          Object.values(row).some(
            (value) => value !== "" && value !== null && value !== undefined,
          ),
        );

      const deduped: typeof cleanedRows = [];
      const seen = new Set<string>();
      cleanedRows.forEach((row) => {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        }
      });

      if (!deduped.length) {
        setError("All rows were empty after cleaning.");
        setProcessing(false);
        return;
      }

      const csvOutput = Papa.unparse(deduped);
      setCleanedCsv(csvOutput);
      setStats({
        rows: deduped.length,
        columns: Object.keys(deduped[0] ?? {}),
      });

      const templateResponse = await fetch("/clean_csv_template.ipynb");
      if (!templateResponse.ok) {
        throw new Error("Unable to load notebook template.");
      }
      const templateText = await templateResponse.text();

      const safeName = selected.name.replace(/\s+/g, "_");
      const outputName = safeName.toLowerCase().endsWith(".csv")
        ? `clean_${safeName}`
        : `clean_${safeName}.csv`;

      const notebookText = templateText
        .replaceAll("{{INPUT_FILE}}", safeName)
        .replaceAll("{{OUTPUT_FILE}}", outputName);

      setNotebook(notebookText);
      setOutputName(outputName);
    } catch (err) {
      console.error(err);
      setError("We could not process that CSV file.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 reveal-up delay-2">
      <div className="section-glow">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/70 bg-[#20190f]/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#f4d03f]">
          <span className="status-pulse inline-block h-2 w-2 rounded-full bg-[#ffd700]" />
          Smart data pipeline
        </div>
        <h2 className="text-2xl font-semibold text-[#f4d03f] md:text-3xl">
          CSV Cleanup & Interactive Notebook
        </h2>
        <p className="mt-2 text-sm text-[#c9a961]">
          Upload a raw CSV, download cleaned data, and explore the cleaning process
          in an interactive Python notebook.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card flex flex-wrap gap-2 rounded-2xl p-2">
        <button
          onClick={() => setActiveTab("upload")}
          className={`tab-pill rounded-xl px-4 py-2.5 text-sm font-semibold ${
            activeTab === "upload"
              ? "border-[#d4af37] bg-[#f4d03f] text-[#111111]"
              : "border-[#d4af37]/30 bg-[#191919] text-[#c9a961] hover:border-[#d4af37] hover:text-[#f4d03f]"
          }`}
        >
          Upload & Download
        </button>
        <button
          onClick={() => setActiveTab("notebook")}
          disabled={!rawCsvContent}
          className={`tab-pill rounded-xl px-4 py-2.5 text-sm font-semibold ${
            activeTab === "notebook"
              ? "border-[#d4af37] bg-[#f4d03f] text-[#111111]"
              : "border-[#d4af37]/30 bg-[#191919] text-[#c9a961] hover:border-[#d4af37] hover:text-[#f4d03f] disabled:cursor-not-allowed disabled:border-[#6b5d45] disabled:text-[#6b5d45]"
          }`}
        >
          Interactive Notebook
          {!rawCsvContent && " (upload first)"}
        </button>
        <button
          onClick={() => setActiveTab("visualizations")}
          disabled={!cleanedCsv}
          className={`tab-pill rounded-xl px-4 py-2.5 text-sm font-semibold ${
            activeTab === "visualizations"
              ? "border-[#d4af37] bg-[#f4d03f] text-[#111111]"
              : "border-[#d4af37]/30 bg-[#191919] text-[#c9a961] hover:border-[#d4af37] hover:text-[#f4d03f] disabled:cursor-not-allowed disabled:border-[#6b5d45] disabled:text-[#6b5d45]"
          }`}
        >
          Visualizations
          {!cleanedCsv && " (upload first)"}
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="panel-enter flex flex-col gap-6">
          <label className="glass-card hover-lift flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-[#d4af37] bg-[#2a2416]/85 p-6 text-sm text-[#c9a961] transition hover:border-[#ffd700]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a961]">
              Upload CSV
            </span>
            <span>{file ? file.name : "Choose a .csv file to upload."}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {processing && (
            <div className="glass-card rounded-2xl bg-[#2a2416]/88 p-4 text-sm text-[#c9a961]">
              Cleaning your CSV...
            </div>
          )}

          {error && (
            <div className="glass-card rounded-2xl bg-[#2a2416]/88 p-4 text-sm text-[#ffd700]">
              {error}
            </div>
          )}

          {stats && (
            <div className="glass-card hover-lift rounded-2xl p-6 text-sm text-[#c9a961]">
              <p className="font-medium text-[#f4d03f]">Cleanup summary</p>
              <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.2em] text-[#c9a961]">
                <span>Rows: {stats.rows}</span>
                <span>Columns: {stats.columns.length}</span>
              </div>
              <p className="mt-3 text-sm text-[#c9a961]">
                Headers normalized, whitespace trimmed, empty rows removed, and
                duplicates dropped.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!cleanedCsv}
              onClick={() =>
                cleanedCsv &&
                downloadFile(
                  cleanedCsv,
                  outputName ?? "cleaned.csv",
                  "text/csv;charset=utf-8",
                )
              }
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:-translate-y-0.5 hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
            >
              Download Clean CSV
            </button>
            <button
              type="button"
              disabled={!notebook || !file}
              onClick={() =>
                notebook &&
                file &&
                downloadFile(
                  notebook,
                  `${file.name.replace(/\s+/g, "_")}.ipynb`,
                  "application/x-ipynb+json",
                )
              }
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37] bg-[#1a1a1a]/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] transition hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:border-[#6b5d45] disabled:text-[#6b5d45]"
            >
              Download Notebook
            </button>
            {rawCsvContent && (
              <button
                type="button"
                onClick={() => setActiveTab("notebook")}
                className="shine-btn inline-flex h-11 items-center justify-center rounded-xl border border-[#ffd700] bg-[#20190f]/80 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd700] transition hover:-translate-y-0.5 hover:bg-[#ffd700] hover:text-[#0a0a0a]"
              >
                View Interactive Notebook →
              </button>
            )}
          </div>

          <div className="glass-card hover-lift rounded-2xl p-6 text-sm text-[#c9a961]">
            <p className="font-medium text-[#f4d03f]">Next steps</p>
            <ul className="mt-3 space-y-2">
              <li>• Download the cleaned CSV for immediate use</li>
              <li>• Download the Jupyter notebook for automated processing</li>
              <li>
                • Switch to &quot;Interactive Notebook&quot; tab to see the
                cleaning process and run Python code
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Interactive Notebook Tab */}
      {activeTab === "notebook" && rawCsvContent && (
        <div className="panel-enter">
          <NotebookViewer csvContent={rawCsvContent} fileName={file?.name ?? "data.csv"} />
        </div>
      )}

      {/* Visualizations Tab */}
      {activeTab === "visualizations" && cleanedCsv && stats && (
        <div className="panel-enter">
          <CsvVisualizations cleanedCsv={cleanedCsv} stats={stats} />
        </div>
      )}
    </div>
  );
}
