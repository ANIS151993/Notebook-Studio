type LocalTransformersModule = {
  pipeline: (
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ) => Promise<(input: string, generationOptions?: Record<string, unknown>) => Promise<unknown>>;
  env?: {
    allowRemoteModels?: boolean;
    useBrowserCache?: boolean;
  };
};

type LocalModelLoadResult = {
  runtime: "webgpu" | "wasm";
  modelId: string;
};

export type LocalModelPromptInput = {
  question: string;
  code: string;
  runtimeError: string | null;
};

const DEFAULT_MODEL_ID = "onnx-community/Qwen2.5-Coder-0.5B-Instruct";

let transformersModulePromise: Promise<LocalTransformersModule> | null = null;
let generatorPromise: Promise<
  (input: string, generationOptions?: Record<string, unknown>) => Promise<unknown>
> | null = null;
let activeRuntime: "webgpu" | "wasm" | null = null;

const dynamicImport = async <T>(specifier: string): Promise<T> => {
  const importFunction = new Function(
    "moduleSpecifier",
    "return import(moduleSpecifier)",
  ) as (moduleSpecifier: string) => Promise<T>;
  return importFunction(specifier);
};

const loadTransformersModule = async (): Promise<LocalTransformersModule> => {
  if (!transformersModulePromise) {
    transformersModulePromise = dynamicImport<LocalTransformersModule>(
      "https://esm.sh/@huggingface/transformers@3.8.0?bundle",
    );
  }

  return transformersModulePromise;
};

const hasWebGpu = () =>
  typeof navigator !== "undefined" && typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";

const tryCreateGenerator = async (
  runtime: "webgpu" | "wasm",
  onProgress?: (message: string) => void,
) => {
  const transformers = await loadTransformersModule();
  if (transformers.env) {
    transformers.env.allowRemoteModels = true;
    transformers.env.useBrowserCache = true;
  }

  const attempts: Array<Record<string, unknown>> = [
    { device: runtime, dtype: "q4" },
    { device: runtime },
  ];

  let lastError: unknown = null;
  for (const options of attempts) {
    try {
      onProgress?.(
        `Loading model (${runtime.toUpperCase()}, ${typeof options.dtype === "string" ? options.dtype : "default precision"})...`,
      );
      const generator = await transformers.pipeline(
        "text-generation",
        DEFAULT_MODEL_ID,
        options,
      );
      return generator;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const loadLocalPythonModel = async (
  onProgress?: (message: string) => void,
): Promise<LocalModelLoadResult> => {
  if (generatorPromise) {
    await generatorPromise;
    return {
      runtime: activeRuntime ?? "wasm",
      modelId: DEFAULT_MODEL_ID,
    };
  }

  generatorPromise = (async () => {
    if (hasWebGpu()) {
      try {
        onProgress?.("WebGPU detected.");
        const generator = await tryCreateGenerator("webgpu", onProgress);
        activeRuntime = "webgpu";
        return generator;
      } catch (webGpuError) {
        console.error("WebGPU model load failed, falling back to WASM:", webGpuError);
        onProgress?.("WebGPU load failed. Falling back to WASM runtime...");
      }
    } else {
      onProgress?.("WebGPU not available. Using WASM runtime...");
    }

    const wasmGenerator = await tryCreateGenerator("wasm", onProgress);
    activeRuntime = "wasm";
    return wasmGenerator;
  })();

  try {
    await generatorPromise;
    return {
      runtime: activeRuntime ?? "wasm",
      modelId: DEFAULT_MODEL_ID,
    };
  } catch (error) {
    generatorPromise = null;
    activeRuntime = null;
    throw error;
  }
};

const buildPrompt = (input: LocalModelPromptInput) => {
  const safeCode = input.code.slice(0, 5000);
  const safeError = input.runtimeError ? input.runtimeError.slice(0, 1200) : "None";

  return `You are a Python and pandas expert assistant.
Rules:
- Focus only on Python, pandas, numpy, data cleaning, and debugging.
- Be concise and practical.
- Return plain text only (no markdown headers).
- Give concrete fixes and, when useful, include a short code snippet.

User question:
${input.question}

Runtime error (if any):
${safeError}

Current code:
${safeCode}

Answer with:
1) Root cause
2) Fix steps
3) Corrected code snippet (if needed)`;
};

const extractText = (rawResult: unknown): string => {
  if (typeof rawResult === "string") {
    return rawResult.trim();
  }

  if (Array.isArray(rawResult) && rawResult.length > 0) {
    const first = rawResult[0];
    if (first && typeof first === "object" && "generated_text" in first) {
      const generatedText = (first as { generated_text?: unknown }).generated_text;
      if (typeof generatedText === "string") {
        return generatedText.trim();
      }
    }
  }

  if (rawResult && typeof rawResult === "object" && "generated_text" in rawResult) {
    const generatedText = (rawResult as { generated_text?: unknown }).generated_text;
    if (typeof generatedText === "string") {
      return generatedText.trim();
    }
  }

  return String(rawResult ?? "").trim();
};

export const askLocalPythonModel = async (
  input: LocalModelPromptInput,
): Promise<string> => {
  if (!generatorPromise) {
    throw new Error("Local model not loaded yet.");
  }

  const generator = await generatorPromise;
  const prompt = buildPrompt(input);

  const result = await generator(prompt, {
    max_new_tokens: 220,
    temperature: 0.2,
    top_p: 0.9,
    do_sample: true,
    repetition_penalty: 1.08,
    return_full_text: false,
  });

  const text = extractText(result);
  return text || "No response generated. Please try again with a shorter question.";
};
