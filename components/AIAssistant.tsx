"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  analyzePythonCode,
  answerPythonQuestion,
  autoFixPythonCode,
  type AssistantAnswer,
} from "@/lib/pythonAssistant";
import { askLocalPythonModel, loadLocalPythonModel } from "@/lib/localPythonLlm";

type AIAssistantProps = {
  code: string;
  error: string | null;
  onApplyCode?: (nextCode: string) => void;
};

type ModelState = "idle" | "loading" | "ready" | "error";

const storageKeys = {
  useNeuralModel: "nb_ai_use_neural_model_v1",
  autoLoadModel: "nb_ai_auto_load_model_v1",
  autoFixEnabled: "nb_ai_auto_fix_enabled_v1",
} as const;

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

const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = window.localStorage.getItem(key);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
};

const writeStoredBoolean = (key: string, value: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, String(value));
};

export default function AIAssistant({ code, error, onApplyCode }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [ruleAnswer, setRuleAnswer] = useState<AssistantAnswer | null>(null);
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [modelState, setModelState] = useState<ModelState>("idle");
  const [modelMessage, setModelMessage] = useState(
    "Model will auto-load once and stay cached in your browser.",
  );
  const [useNeuralModel, setUseNeuralModel] = useState(true);
  const [autoLoadModel, setAutoLoadModel] = useState(true);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [autoFixMessage, setAutoFixMessage] = useState(
    "Auto-fix is monitoring your editable code.",
  );
  const [isAsking, setIsAsking] = useState(false);
  const lastAutoAppliedCodeRef = useRef<string | null>(null);

  const issues = useMemo(() => analyzePythonCode(code, error), [code, error]);

  useEffect(() => {
    setUseNeuralModel(readStoredBoolean(storageKeys.useNeuralModel, true));
    setAutoLoadModel(readStoredBoolean(storageKeys.autoLoadModel, true));
    setAutoFixEnabled(readStoredBoolean(storageKeys.autoFixEnabled, true));
  }, []);

  useEffect(() => {
    writeStoredBoolean(storageKeys.useNeuralModel, useNeuralModel);
  }, [useNeuralModel]);

  useEffect(() => {
    writeStoredBoolean(storageKeys.autoLoadModel, autoLoadModel);
  }, [autoLoadModel]);

  useEffect(() => {
    writeStoredBoolean(storageKeys.autoFixEnabled, autoFixEnabled);
  }, [autoFixEnabled]);

  const loadModel = useCallback(async (): Promise<boolean> => {
    if (modelState === "loading") {
      return false;
    }
    if (modelState === "ready") {
      return true;
    }

    setModelState("loading");
    setModelMessage("Preparing model runtime...");
    try {
      const result = await loadLocalPythonModel((progressMessage) => {
        setModelMessage(progressMessage);
      });
      setModelState("ready");
      setModelMessage(
        `Model ready (${result.modelId}) on ${result.runtime.toUpperCase()} runtime.`,
      );
      return true;
    } catch (loadError) {
      console.error(loadError);
      setModelState("error");
      setModelMessage(
        "Could not load neural model. Offline expert engine remains active.",
      );
      return false;
    }
  }, [modelState]);

  useEffect(() => {
    if (!autoLoadModel || !useNeuralModel || modelState !== "idle") {
      return;
    }
    void loadModel();
  }, [autoLoadModel, useNeuralModel, modelState, loadModel]);

  useEffect(() => {
    if (!autoFixEnabled || !onApplyCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      const fixResult = autoFixPythonCode(code);
      if (!fixResult || fixResult.code === code) {
        return;
      }

      if (lastAutoAppliedCodeRef.current === fixResult.code) {
        return;
      }

      lastAutoAppliedCodeRef.current = fixResult.code;
      onApplyCode(fixResult.code);
      const details =
        fixResult.changes.length > 0
          ? fixResult.changes.join("; ")
          : "basic syntax adjustments";
      setAutoFixMessage(`Auto-fix applied: ${details}.`);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoFixEnabled, code, onApplyCode]);

  useEffect(() => {
    if (!autoFixEnabled) {
      setAutoFixMessage("Auto-fix is off.");
    } else if (!onApplyCode) {
      setAutoFixMessage("Auto-fix unavailable in read-only cells.");
    } else if (!autoFixMessage) {
      setAutoFixMessage("Auto-fix is monitoring your editable code.");
    }
  }, [autoFixEnabled, onApplyCode, autoFixMessage]);

  const handleAsk = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setRuleAnswer(answerPythonQuestion("", code, error));
      setModelAnswer(null);
      return;
    }

    setIsAsking(true);
    setRuleAnswer(null);
    setModelAnswer(null);

    try {
      let canUseModel = useNeuralModel && modelState === "ready";
      if (useNeuralModel && modelState !== "ready") {
        canUseModel = await loadModel();
      }

      if (canUseModel) {
        const generated = await askLocalPythonModel({
          question: trimmed,
          code,
          runtimeError: error,
        });
        setModelAnswer(generated);
      } else {
        setRuleAnswer(answerPythonQuestion(trimmed, code, error));
      }
    } catch (askError) {
      console.error(askError);
      setModelState("error");
      setModelMessage(
        "Neural model response failed for this request. Falling back to offline expert engine.",
      );
      setRuleAnswer(answerPythonQuestion(trimmed, code, error));
    } finally {
      setIsAsking(false);
    }
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
            Always-on auto-check for editable code, with local neural model support.
          </p>
        </div>
        <span className="rounded-full border border-[#4dabf7]/60 bg-[#101b29] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
          Local Mode
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#4dabf7]/30 bg-[#111a26] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
          Automation
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAutoFixEnabled((current) => !current)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] ${
              autoFixEnabled
                ? "bg-[#4dabf7] text-[#0a0a0a]"
                : "border border-[#4dabf7]/70 bg-[#132236] text-[#bcdcff]"
            }`}
          >
            {autoFixEnabled ? "Auto-Fix On" : "Auto-Fix Off"}
          </button>

          <button
            type="button"
            onClick={() => setAutoLoadModel((current) => !current)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] ${
              autoLoadModel
                ? "bg-[#4dabf7] text-[#0a0a0a]"
                : "border border-[#4dabf7]/70 bg-[#132236] text-[#bcdcff]"
            }`}
          >
            {autoLoadModel ? "Auto-Load Model On" : "Auto-Load Model Off"}
          </button>
        </div>

        <p className="mt-2 text-xs text-[#c9d7e8]">{autoFixMessage}</p>
      </div>

      <div className="mt-4 rounded-lg border border-[#4dabf7]/30 bg-[#111a26] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5ff]">
          Neural Model
        </p>
        <p className="mt-1 text-xs text-[#c9d7e8]">
          Model: <span className="text-[#d9ecff]">Qwen2.5-Coder 0.5B</span> (first download cached by browser).
        </p>
        <p className="mt-1 text-xs text-[#c9d7e8]">{modelMessage}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUseNeuralModel((current) => !current)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] ${
              useNeuralModel
                ? "bg-[#4dabf7] text-[#0a0a0a]"
                : "border border-[#4dabf7]/70 bg-[#132236] text-[#bcdcff]"
            }`}
          >
            {useNeuralModel ? "Neural Mode On" : "Neural Mode Off"}
          </button>

          <button
            type="button"
            onClick={() => {
              void loadModel();
            }}
            disabled={modelState === "loading"}
            className="rounded-lg border border-[#4dabf7]/70 bg-[#132236] px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#bcdcff] hover:border-[#7dc1ff] hover:text-[#e5f3ff] disabled:cursor-not-allowed disabled:border-[#385069] disabled:text-[#6f8aa7]"
          >
            {modelState === "loading" ? "Loading..." : "Load Model"}
          </button>

          <span className="text-[11px] text-[#9ab8d6]">
            Status: {modelState}
          </span>
        </div>
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
                void handleAsk(prompt);
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
          onClick={() => {
            void handleAsk(question);
          }}
          disabled={isAsking}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#4dabf7] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] hover:bg-[#74c0fc] disabled:cursor-not-allowed disabled:bg-[#385069] disabled:text-[#9ab8d6]"
        >
          {isAsking ? "Thinking..." : "Get Guidance"}
        </button>

        {modelAnswer && (
          <div className="mt-4 rounded-lg border border-[#4dabf7]/50 bg-[#132236] p-3">
            <p className="text-sm font-semibold text-[#d9ecff]">
              Neural Model Answer
            </p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#d6e7ff]">
              {modelAnswer}
            </pre>
          </div>
        )}

        {ruleAnswer && (
          <div className="mt-4 rounded-lg border border-[#4dabf7]/50 bg-[#132236] p-3">
            <p className="text-sm font-semibold text-[#d9ecff]">{ruleAnswer.title}</p>
            <p className="mt-1 text-xs text-[#c3d9f2]">{ruleAnswer.summary}</p>

            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-[#d6e7ff]">
              {ruleAnswer.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {ruleAnswer.snippet && (
              <pre className="mt-3 overflow-x-auto rounded border border-[#4dabf7]/40 bg-[#0d1117] p-3 text-xs text-[#d6e7ff]">
                <code>{ruleAnswer.snippet}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
