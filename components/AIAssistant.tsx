"use client";

import { useMemo, useState } from "react";
import {
  analyzePythonCode,
  answerPythonQuestion,
  type AssistantAnswer,
} from "@/lib/pythonAssistant";

type AIAssistantProps = {
  code: string;
  error: string | null;
};

const quickPrompts = [
  "Why am I getting this error?",
  "How do I handle missing values correctly?",
  "How can I remove duplicates safely?",
  "How can I make this pandas code faster?",
];

const issueStyle = {
  error: "border-[#ff6b6b] bg-[#3a1a1a]",
  warning: "border-[#fab005] bg-[#3a2a1a]",
  tip: "border-[#4dabf7] bg-[#1a2a3a]",
} as const;

export default function AIAssistant({ code, error }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);

  const issues = useMemo(() => analyzePythonCode(code, error), [code, error]);

  const handleAsk = (input: string) => {
    const nextAnswer = answerPythonQuestion(input, code, error);
    setAnswer(nextAnswer);
  };

  const onAskClick = () => {
    handleAsk(question);
  };

  const suggestionCountText =
    issues.length === 1 ? "1 issue detected" : `${issues.length} issues detected`;

  return (
    <div className="rounded-xl border border-[#4dabf7] bg-[#1a2332] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#4dabf7]">
            Python AI Assistant (Offline)
          </h4>
          <p className="mt-1 text-xs text-[#a5b4c4]">
            Local expert engine for Python and pandas. No API key required.
          </p>
        </div>
        <span className="rounded-full border border-[#4dabf7]/60 bg-[#101b29] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
          Local Mode
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#4dabf7]/30 bg-[#111a26] p-3">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
            Code Diagnostics
          </span>
          <span className="text-xs text-[#c9d7e8]">
            {issues.length === 0 ? "No issue detected" : suggestionCountText}{" "}
            {isExpanded ? "▲" : "▼"}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {issues.length === 0 && (
              <p className="text-xs text-[#c9d7e8]">
                No obvious static issues found. If behavior is wrong, ask with the exact output/error.
              </p>
            )}

            {issues.map((issue, index) => (
              <div
                key={`${issue.title}-${index}`}
                className={`rounded-lg border p-3 ${issueStyle[issue.severity]}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f4d03f]">
                  {issue.severity}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#f8e9bd]">{issue.title}</p>
                <p className="mt-1 text-xs text-[#d7c9a1]">{issue.detail}</p>
                {issue.fix && (
                  <p className="mt-1 text-xs text-[#ffe082]">
                    Fix: {issue.fix}
                  </p>
                )}
                {issue.example && (
                  <pre className="mt-2 overflow-x-auto rounded border border-[#d4af37]/40 bg-[#0d1117] p-2 text-xs text-[#f4d03f]">
                    <code>{issue.example}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-[#4dabf7]/30 bg-[#111a26] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
          Ask Python Expert
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuestion(prompt);
                handleAsk(prompt);
              }}
              className="rounded-full border border-[#4dabf7]/50 bg-[#132236] px-3 py-1 text-[11px] text-[#bcdcff] hover:border-[#7dc1ff] hover:text-[#e5f3ff]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your Python code, pandas workflow, or error."
          className="mt-3 w-full rounded-lg border border-[#4dabf7]/50 bg-[#0d1622] p-3 text-sm text-[#d6e7ff] outline-none placeholder:text-[#6f8aa7] focus:border-[#7dc1ff]"
          rows={3}
        />

        <button
          type="button"
          onClick={onAskClick}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#4dabf7] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] hover:bg-[#74c0fc]"
        >
          Get Guidance
        </button>

        {answer && (
          <div className="mt-4 rounded-lg border border-[#4dabf7]/50 bg-[#132236] p-3">
            <p className="text-sm font-semibold text-[#d9ecff]">{answer.title}</p>
            <p className="mt-1 text-xs text-[#c3d9f2]">{answer.summary}</p>

            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-[#d6e7ff]">
              {answer.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {answer.snippet && (
              <pre className="mt-3 overflow-x-auto rounded border border-[#4dabf7]/40 bg-[#0d1117] p-3 text-xs text-[#d6e7ff]">
                <code>{answer.snippet}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
