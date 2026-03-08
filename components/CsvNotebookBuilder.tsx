"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { onAuthStateChanged } from "firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import NotebookViewer from "./NotebookViewer";
import CsvVisualizations from "./CsvVisualizations";
import { auth, db } from "@/lib/firebase";
import AnimatedLink from "./AnimatedLink";

type Stats = {
  rows: number;
  columns: string[];
};

type Tab = "upload" | "notebook" | "visualizations";

type WorkSnapshot = {
  fileName: string;
  rawCsvContent: string;
  cleanedCsv: string;
  notebook: string;
  outputName: string;
  stats: Stats;
};

type SavedWorkListItem = {
  id: string;
  name: string;
  fileName: string;
  rows: number;
  columns: string[];
  updatedAtLabel: string;
};

type SyncStatus = "idle" | "saving" | "saved" | "error";

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

const parseStats = (raw: unknown): Stats | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as { rows?: unknown; columns?: unknown };
  const rows = typeof candidate.rows === "number" ? candidate.rows : null;
  const columns = Array.isArray(candidate.columns)
    ? candidate.columns.filter((value): value is string => typeof value === "string")
    : null;

  if (rows === null || columns === null) {
    return null;
  }

  return { rows, columns };
};

const formatUpdatedAt = (raw: unknown): string => {
  if (raw instanceof Timestamp) {
    return raw.toDate().toLocaleString();
  }

  return "Unknown time";
};

const createWorkName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const timestamp = new Date().toLocaleString();
  return `${baseName} (${timestamp})`;
};

export default function CsvNotebookBuilder() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [cleanedCsv, setCleanedCsv] = useState<string | null>(null);
  const [rawCsvContent, setRawCsvContent] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [savedWorks, setSavedWorks] = useState<SavedWorkListItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const canSaveCurrentWork = useMemo(
    () =>
      Boolean(
        authUserId &&
          rawCsvContent &&
          cleanedCsv &&
          notebook &&
          outputName &&
          stats,
      ),
    [authUserId, cleanedCsv, notebook, outputName, rawCsvContent, stats],
  );

  const loadSavedWorks = async (uid: string) => {
    if (!db) {
      return;
    }

    setLoadingWorks(true);
    try {
      const worksRef = collection(db, "users", uid, "works");
      const worksQuery = query(worksRef, orderBy("updatedAt", "desc"), limit(25));
      const snapshot = await getDocs(worksQuery);

      const items: SavedWorkListItem[] = snapshot.docs
        .map((workDoc) => {
          const data = workDoc.data() as {
            name?: unknown;
            fileName?: unknown;
            stats?: unknown;
            updatedAt?: unknown;
          };

          const parsedStats = parseStats(data.stats);
          if (!parsedStats) {
            return null;
          }

          return {
            id: workDoc.id,
            name:
              typeof data.name === "string" && data.name.trim().length > 0
                ? data.name
                : "Untitled work",
            fileName:
              typeof data.fileName === "string" && data.fileName.trim().length > 0
                ? data.fileName
                : "data.csv",
            rows: parsedStats.rows,
            columns: parsedStats.columns,
            updatedAtLabel: formatUpdatedAt(data.updatedAt),
          };
        })
        .filter((item): item is SavedWorkListItem => item !== null);

      setSavedWorks(items);

      if (items.length > 0) {
        setSelectedWorkId((current) => current || items[0].id);
      } else {
        setSelectedWorkId("");
      }
    } catch (loadError) {
      console.error(loadError);
      setSyncStatus("error");
      setSyncMessage("Could not load saved works from your account.");
    } finally {
      setLoadingWorks(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setAuthUserId(null);
      setAuthEmail(null);
      setSavedWorks([]);
      setSelectedWorkId("");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthUserId(null);
        setAuthEmail(null);
        setSavedWorks([]);
        setSelectedWorkId("");
        return;
      }

      setAuthUserId(user.uid);
      setAuthEmail(user.email ?? null);
      void loadSavedWorks(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const saveWorkSnapshot = async (snapshot: WorkSnapshot, suggestedFileName: string) => {
    if (!db || !authUserId) {
      return;
    }

    setSyncStatus("saving");
    setSyncMessage("Saving work to your account...");

    try {
      const workRef = doc(collection(db, "users", authUserId, "works"));
      await setDoc(workRef, {
        ...snapshot,
        name: createWorkName(suggestedFileName),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSyncStatus("saved");
      setSyncMessage("Work saved to your account.");
      setSelectedWorkId(workRef.id);
      await loadSavedWorks(authUserId);
    } catch (saveError) {
      console.error(saveError);
      setSyncStatus("error");
      setSyncMessage("Could not save work. Please try again.");
    }
  };

  const saveCurrentWork = async () => {
    if (!fileName || !rawCsvContent || !cleanedCsv || !notebook || !outputName || !stats) {
      setSyncStatus("error");
      setSyncMessage("Process a CSV first, then save your work.");
      return;
    }

    await saveWorkSnapshot(
      {
        fileName,
        rawCsvContent,
        cleanedCsv,
        notebook,
        outputName,
        stats,
      },
      fileName,
    );
  };

  const loadSelectedWork = async () => {
    if (!db || !authUserId || !selectedWorkId) {
      return;
    }

    setLoadingWorks(true);
    setSyncMessage(null);

    try {
      const workRef = doc(db, "users", authUserId, "works", selectedWorkId);
      const snapshot = await getDoc(workRef);

      if (!snapshot.exists()) {
        setError("That saved work does not exist anymore.");
        return;
      }

      const data = snapshot.data() as {
        fileName?: unknown;
        rawCsvContent?: unknown;
        cleanedCsv?: unknown;
        notebook?: unknown;
        outputName?: unknown;
        stats?: unknown;
      };

      const savedFileName =
        typeof data.fileName === "string" && data.fileName.trim().length > 0
          ? data.fileName
          : "data.csv";
      const savedRaw =
        typeof data.rawCsvContent === "string" ? data.rawCsvContent : null;
      const savedCleaned =
        typeof data.cleanedCsv === "string" ? data.cleanedCsv : null;
      const savedNotebook = typeof data.notebook === "string" ? data.notebook : null;
      const savedOutputName =
        typeof data.outputName === "string" ? data.outputName : null;
      const savedStats = parseStats(data.stats);

      if (!savedRaw || !savedCleaned || !savedNotebook || !savedOutputName || !savedStats) {
        setError("Saved work is incomplete and cannot be loaded.");
        return;
      }

      setFileName(savedFileName);
      setRawCsvContent(savedRaw);
      setCleanedCsv(savedCleaned);
      setNotebook(savedNotebook);
      setOutputName(savedOutputName);
      setStats(savedStats);
      setActiveTab("upload");
      setError(null);
      setSyncStatus("saved");
      setSyncMessage("Saved work loaded from your account.");
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load selected work.");
      setSyncStatus("error");
      setSyncMessage("Could not load selected work.");
    } finally {
      setLoadingWorks(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      return;
    }

    setProcessing(true);
    setError(null);
    setFileName(selected.name);
    setCleanedCsv(null);
    setRawCsvContent(null);
    setNotebook(null);
    setStats(null);
    setOutputName(null);

    try {
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
      const nextStats: Stats = {
        rows: deduped.length,
        columns: Object.keys(deduped[0] ?? {}),
      };
      setCleanedCsv(csvOutput);
      setStats(nextStats);

      const templateResponse = await fetch("/clean_csv_template.ipynb");
      if (!templateResponse.ok) {
        throw new Error("Unable to load notebook template.");
      }
      const templateText = await templateResponse.text();

      const safeName = selected.name.replace(/\s+/g, "_");
      const nextOutputName = safeName.toLowerCase().endsWith(".csv")
        ? `clean_${safeName}`
        : `clean_${safeName}.csv`;

      const notebookText = templateText
        .replaceAll("{{INPUT_FILE}}", safeName)
        .replaceAll("{{OUTPUT_FILE}}", nextOutputName);

      setNotebook(notebookText);
      setOutputName(nextOutputName);

      if (authUserId) {
        void saveWorkSnapshot(
          {
            fileName: selected.name,
            rawCsvContent: rawContent,
            cleanedCsv: csvOutput,
            notebook: notebookText,
            outputName: nextOutputName,
            stats: nextStats,
          },
          selected.name,
        );
      }
    } catch (processError) {
      console.error(processError);
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

      {authUserId ? (
        <div className="glass-card rounded-2xl p-5 text-sm text-[#c9a961]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f]">
            Account workspace
          </p>
          <p className="mt-2">
            Signed in as <span className="text-[#f4d03f]">{authEmail ?? "User"}</span>.
            Your processed work can be saved and restored from your account.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <select
              className="h-11 rounded-xl border border-[#d4af37]/70 bg-[#111111] px-3 text-sm text-[#f4d03f] outline-none focus:border-[#ffd700]"
              value={selectedWorkId}
              onChange={(event) => setSelectedWorkId(event.target.value)}
              disabled={loadingWorks || savedWorks.length === 0}
            >
              {savedWorks.length === 0 && (
                <option value="">No saved works yet</option>
              )}
              {savedWorks.map((work) => (
                <option key={work.id} value={work.id}>
                  {work.name} - {work.rows} rows - {work.updatedAtLabel}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                void loadSelectedWork();
              }}
              disabled={loadingWorks || !selectedWorkId}
              className="tab-pill inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37]/70 bg-[#16120d] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:border-[#6b5d45] disabled:text-[#6b5d45]"
            >
              Load Work
            </button>

            <button
              type="button"
              onClick={() => {
                void saveCurrentWork();
              }}
              disabled={!canSaveCurrentWork || syncStatus === "saving"}
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
            >
              {syncStatus === "saving" ? "Saving..." : "Save Current Work"}
            </button>
          </div>

          {syncMessage && (
            <p className="mt-3 text-xs text-[#ffd700]">{syncMessage}</p>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 text-sm text-[#c9a961]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f]">
            Guest mode
          </p>
          <p className="mt-2">
            Sign in to save work into your account and continue later from any
            login session.
          </p>
          <AnimatedLink
            href="/login"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#d4af37] bg-[#15120c] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
          >
            Sign Up / Sign In
          </AnimatedLink>
        </div>
      )}

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

      {activeTab === "upload" && (
        <div className="panel-enter flex flex-col gap-6">
          <label className="glass-card hover-lift flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-[#d4af37] bg-[#2a2416]/85 p-6 text-sm text-[#c9a961] transition hover:border-[#ffd700]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a961]">
              Upload CSV
            </span>
            <span>{fileName ?? "Choose a .csv file to upload."}</span>
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
              disabled={!notebook || !fileName}
              onClick={() =>
                notebook &&
                fileName &&
                downloadFile(
                  notebook,
                  `${fileName.replace(/\s+/g, "_")}.ipynb`,
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

      {activeTab === "notebook" && rawCsvContent && (
        <div className="panel-enter">
          <NotebookViewer csvContent={rawCsvContent} fileName={fileName ?? "data.csv"} />
        </div>
      )}

      {activeTab === "visualizations" && cleanedCsv && stats && (
        <div className="panel-enter">
          <CsvVisualizations cleanedCsv={cleanedCsv} stats={stats} />
        </div>
      )}
    </div>
  );
}
