"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import AIAssistant from "./AIAssistant";
import { autoFixPythonCodeWithRuntimeError } from "@/lib/pythonAssistant";
import { attemptModelCodeAutoFix } from "@/lib/localPythonLlm";

type CodeCellProps = {
  initialCode: string;
  isEditable?: boolean;
  onExecute?: (code: string) => Promise<{ output: string; error: string | null }>;
  autoRun?: boolean;
  showOutput?: boolean;
  explanation?: string; // Line-by-line explanation
};

export default function CodeCell({
  initialCode,
  isEditable = false,
  onExecute,
  autoRun = false,
  showOutput = true,
  explanation,
}: CodeCellProps) {
  const maxAutoRepairAttempts = 3;
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(autoRun);
  const [showExplanation, setShowExplanation] = useState(false);
  const [autoRunAfterFix, setAutoRunAfterFix] = useState(true);
  const [autoFixStatus, setAutoFixStatus] = useState("Monitoring...");
  const lastAppliedFixRef = useRef<string | null>(null);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number) => {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error("timeout"));
      }, timeoutMs);

      promise
        .then((value) => {
          window.clearTimeout(timer);
          resolve(value);
        })
        .catch((reason) => {
          window.clearTimeout(timer);
          reject(reason);
        });
    });
  }, []);

  const runWithCode = useCallback(async (codeToRun: string) => {
    if (!onExecute) return;

    setIsRunning(true);
    setError(null);
    setOutput(null);
    setAutoFixStatus("Running...");

    try {
      let workingCode = codeToRun;
      let lastError: string | null = null;

      for (let attempt = 0; attempt <= maxAutoRepairAttempts; attempt += 1) {
        const result = await onExecute(workingCode);
        setOutput(result.output);
        setError(result.error);
        setHasRun(true);
        lastError = result.error;

        if (!result.error) {
          if (attempt === 0) {
            setAutoFixStatus("Run successful.");
          } else {
            setAutoFixStatus(`Resolved after ${attempt} auto-fix attempt(s).`);
          }
          return;
        }

        if (!isEditable) {
          setAutoFixStatus("Error detected. Auto-fix is available only in editable cells.");
          return;
        }

        if (attempt === maxAutoRepairAttempts) {
          setAutoFixStatus(
            `Auto-fix reached max attempts (${maxAutoRepairAttempts}). Please edit manually.`,
          );
          return;
        }

        const fixResult = autoFixPythonCodeWithRuntimeError(workingCode, result.error);
        if (!fixResult || fixResult.code === workingCode) {
          try {
            setAutoFixStatus(`Attempt ${attempt + 1}: trying neural auto-fix...`);
            const modelFix = await withTimeout(
              attemptModelCodeAutoFix({
                code: workingCode,
                runtimeError: result.error,
              }),
              25000,
            );

            if (!modelFix || modelFix === workingCode) {
              setAutoFixStatus("Error detected. No safe automatic fix found.");
              return;
            }

            workingCode = modelFix;
            setCode(workingCode);
            setError(null);
            continue;
          } catch (modelFixError) {
            console.error("Neural auto-fix failed:", modelFixError);
            setAutoFixStatus("Error detected. No safe automatic fix found.");
            return;
          }
        }

        const detail =
          fixResult.changes.length > 0
            ? fixResult.changes.join("; ")
            : "basic correction";
        setAutoFixStatus(`Attempt ${attempt + 1}: ${detail}`);

        workingCode = fixResult.code;
        setCode(workingCode);
      }

      if (lastError) {
        setError(lastError);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Execution failed");
      setAutoFixStatus("Execution failed.");
    } finally {
      setIsRunning(false);
    }
  }, [onExecute, isEditable, withTimeout]);

  useEffect(() => {
    if (!isEditable || isRunning || Boolean(error)) {
      return;
    }

    const timer = window.setTimeout(() => {
      const fixResult = autoFixPythonCodeWithRuntimeError(code, null);
      if (!fixResult || fixResult.code === code) {
        setAutoFixStatus("Monitoring...");
        lastAppliedFixRef.current = null;
        return;
      }

      if (lastAppliedFixRef.current === code) {
        return;
      }

      lastAppliedFixRef.current = code;
      setCode(fixResult.code);
      setError(null);

      if (autoRunAfterFix && onExecute && !isRunning) {
        void runWithCode(fixResult.code);
      }

      const detail =
        fixResult.changes.length > 0
          ? fixResult.changes.join("; ")
          : "basic correction";
      setAutoFixStatus(`Applied: ${detail}`);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [code, error, isEditable, autoRunAfterFix, onExecute, isRunning, runWithCode]);

  const handleRun = async () => {
    await runWithCode(code);
  };

  return (
    <div className="space-y-3 panel-enter">
      {/* Explanation Section */}
      {explanation && (
        <div className="glass-card rounded-xl border-[#4dabf7]/60 bg-[#1a2332]/85 p-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <span className="text-sm font-semibold text-[#4dabf7]">
                Code Explanation
              </span>
            </div>
            <span className="text-xs text-[#a5b4c4]">
              {showExplanation ? "Hide" : "Show"} ▼
            </span>
          </button>

          {showExplanation && (
            <div className="mt-3 whitespace-pre-wrap text-xs text-[#a5b4c4] leading-relaxed">
              {explanation}
            </div>
          )}
        </div>
      )}

      {/* AI Assistant */}
      {isEditable && (
        <AIAssistant code={code} error={error} />
      )}

      {/* Code Editor/Display */}
      <div className="glass-card hover-lift overflow-hidden rounded-xl">
        {isEditable ? (
          <div className="relative">
            <div className="flex items-center justify-between bg-[#2a2416] px-4 py-2 border-b border-[#d4af37]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                Code Editor (Editable)
              </span>
              <div className="flex items-center gap-3">
                {onExecute && (
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#c9a961]">
                    <input
                      type="checkbox"
                      checked={autoRunAfterFix}
                      onChange={(event) => setAutoRunAfterFix(event.target.checked)}
                      className="h-3.5 w-3.5 rounded border border-[#d4af37] bg-[#111111] accent-[#d4af37]"
                    />
                    Auto-run after AI fix
                  </label>
                )}
                <span className="text-[10px] text-[#a5b4c4]">{autoFixStatus}</span>
                {onExecute && (
                  <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="shine-btn inline-flex h-8 items-center justify-center rounded-lg bg-[#d4af37] px-4 text-xs font-semibold text-[#0a0a0a] transition hover:-translate-y-0.5 hover:bg-[#ffd700] disabled:bg-[#6b5d45] disabled:cursor-not-allowed disabled:text-[#3a3420]"
                  >
                    {isRunning ? "Running..." : "▶ Run"}
                  </button>
                )}
              </div>
            </div>
            <div className="relative flex">
              {/* Line numbers */}
              <div className="select-none bg-[#1e1e1e] px-3 py-4 text-right text-sm text-[#858585] border-r border-[#3a3a3a]">
                {code.split("\n").map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* Code textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none leading-6"
                rows={code.split("\n").length}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between bg-[#2a2416] px-4 py-2 border-b border-[#d4af37]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#c9a961]">
                Code (Read-only)
              </span>
              {onExecute && !hasRun && (
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="shine-btn inline-flex h-8 items-center justify-center rounded-lg bg-[#d4af37] px-4 text-xs font-semibold text-[#0a0a0a] transition hover:-translate-y-0.5 hover:bg-[#ffd700] disabled:bg-[#6b5d45] disabled:cursor-not-allowed disabled:text-[#3a3420]"
                >
                  {isRunning ? "Running..." : "▶ Run"}
                </button>
              )}
            </div>
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              showLineNumbers={true}
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                borderRadius: 0,
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Output Display */}
        {showOutput && (hasRun || output || error) && (
          <div className="border-t border-[#d4af37] bg-[#0a0a0a] p-4">
            {isRunning ? (
              <div className="text-sm text-[#c9a961]">Executing...</div>
            ) : error ? (
              <div className="font-mono text-sm text-[#ff6b6b] whitespace-pre-wrap">
                <strong>Error:</strong>
                {"\n"}
                {error}
              </div>
            ) : output ? (
              <div className="font-mono text-sm text-[#f4d03f] whitespace-pre-wrap">
                {output.split("\n").map((line, i) =>
                  line.startsWith("__IMG_BASE64__:") ? (
                    <img
                      key={i}
                      src={`data:image/png;base64,${line.replace("__IMG_BASE64__:", "")}`}
                      alt="Plot output"
                      className="my-3 max-w-full rounded-lg border border-[#d4af37]/30"
                    />
                  ) : (
                    <span key={i}>{line}{"\n"}</span>
                  )
                )}
              </div>
            ) : (
              <div className="text-sm text-[#c9a961]">Ready to run</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
