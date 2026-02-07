"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeCellProps = {
  initialCode: string;
  isEditable?: boolean;
  onExecute?: (code: string) => Promise<{ output: string; error: string | null }>;
  autoRun?: boolean;
  showOutput?: boolean;
};

export default function CodeCell({
  initialCode,
  isEditable = false,
  onExecute,
  autoRun = false,
  showOutput = true,
}: CodeCellProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(autoRun);

  const handleRun = async () => {
    if (!onExecute) return;

    setIsRunning(true);
    setError(null);
    setOutput(null);

    try {
      const result = await onExecute(code);
      setOutput(result.output);
      setError(result.error);
      setHasRun(true);
    } catch (err: any) {
      setError(err.message || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#d4af37] bg-[#1a1a1a] overflow-hidden">
      {/* Code Editor/Display */}
      {isEditable ? (
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none"
            rows={code.split("\n").length + 1}
            spellCheck={false}
          />
          {onExecute && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="absolute top-2 right-2 inline-flex h-8 items-center justify-center rounded-lg bg-[#d4af37] px-4 text-xs font-semibold text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:bg-[#6b5d45] disabled:cursor-not-allowed disabled:text-[#3a3420]"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              borderRadius: 0,
            }}
          >
            {code}
          </SyntaxHighlighter>
          {onExecute && !hasRun && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="absolute top-2 right-2 inline-flex h-8 items-center justify-center rounded-lg bg-[#d4af37] px-4 text-xs font-semibold text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:bg-[#6b5d45] disabled:cursor-not-allowed disabled:text-[#3a3420]"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
          )}
        </div>
      )}

      {/* Output Display */}
      {showOutput && (hasRun || output || error) && (
        <div className="border-t border-[#d4af37] bg-[#0a0a0a] p-4">
          {isRunning ? (
            <div className="text-sm text-[#c9a961]">Executing...</div>
          ) : error ? (
            <div className="font-mono text-sm text-[#ffd700] whitespace-pre-wrap">
              <strong>Error:</strong>
              {"\n"}
              {error}
            </div>
          ) : output ? (
            <div className="font-mono text-sm text-[#f4d03f] whitespace-pre-wrap">
              {output}
            </div>
          ) : (
            <div className="text-sm text-[#c9a961]">Ready to run</div>
          )}
        </div>
      )}
    </div>
  );
}
