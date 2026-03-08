type IssueSeverity = "error" | "warning" | "tip";

export type AssistantIssue = {
  severity: IssueSeverity;
  title: string;
  detail: string;
  fix?: string;
  example?: string;
};

export type AssistantAnswer = {
  title: string;
  summary: string;
  steps: string[];
  snippet?: string;
  matchedTopics: string[];
};

type KnowledgeTopic = {
  id: string;
  keywords: string[];
  title: string;
  summary: string;
  steps: string[];
  snippet?: string;
};

const pythonKnowledgeBase: KnowledgeTopic[] = [
  {
    id: "pandas_missing_values",
    keywords: ["missing", "null", "nan", "fillna", "dropna", "impute"],
    title: "Handle Missing Values (Pandas)",
    summary: "Inspect missing counts first, then choose drop or fill based on business meaning.",
    steps: [
      "Check missing counts by column.",
      "Drop rows only if data loss is acceptable.",
      "Use median for skewed numeric data, mean for stable numeric data, mode for categorical.",
      "Re-check missing counts after cleaning.",
    ],
    snippet: `# 1) Inspect
print(df.isna().sum())

# 2) Fill examples
df["age"] = df["age"].fillna(df["age"].median())
df["city"] = df["city"].fillna(df["city"].mode().iloc[0])

# 3) Verify
print(df.isna().sum())`,
  },
  {
    id: "pandas_duplicates",
    keywords: ["duplicate", "duplicates", "drop_duplicates", "dedupe", "unique rows"],
    title: "Remove Duplicates Safely",
    summary: "Count before/after and define duplicate columns explicitly for stable behavior.",
    steps: [
      "Capture row count before cleaning.",
      "Use subset columns when full-row match is too strict.",
      "Keep first or last based on business rule.",
      "Validate result count after cleanup.",
    ],
    snippet: `before = len(df)
df = df.drop_duplicates(subset=["email", "date"], keep="first")
after = len(df)
print(f"Removed {before - after} duplicates")`,
  },
  {
    id: "key_error",
    keywords: ["keyerror", "column not found", "no such column", "df.columns"],
    title: "Fix KeyError in DataFrame",
    summary: "KeyError usually means the column/key name is wrong or not created yet.",
    steps: [
      "Print available columns with df.columns.tolist().",
      "Normalize names (lowercase, strip spaces, replace spaces).",
      "Use exact case-sensitive column names.",
      "Confirm upstream code did not rename/drop the column.",
    ],
    snippet: `print(df.columns.tolist())
df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
# then use exact normalized name`,
  },
  {
    id: "type_error",
    keywords: ["typeerror", "type mismatch", "string to int", "astype", "conversion"],
    title: "Fix Type Errors",
    summary: "Convert types deliberately and coerce bad records safely.",
    steps: [
      "Inspect type with df.dtypes and type(variable).",
      "Use pd.to_numeric(..., errors='coerce') for robust numeric conversion.",
      "Handle invalid rows after conversion.",
      "Avoid mixing strings and numbers in arithmetic.",
    ],
    snippet: `df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
df = df.dropna(subset=["amount"])`,
  },
  {
    id: "groupby_aggregation",
    keywords: ["groupby", "aggregate", "agg", "summary by", "count by"],
    title: "Group and Aggregate Data",
    summary: "Use groupby with named aggregations for clean, production-ready tables.",
    steps: [
      "Group by category columns.",
      "Use explicit named aggregations.",
      "Reset index for downstream compatibility.",
      "Sort to highlight top groups.",
    ],
    snippet: `summary = (
    df.groupby("department", as_index=False)
      .agg(total_sales=("sales", "sum"), avg_sales=("sales", "mean"), rows=("sales", "size"))
      .sort_values("total_sales", ascending=False)
)
print(summary.head())`,
  },
  {
    id: "merge_join",
    keywords: ["merge", "join", "left join", "inner join", "combine dataframes"],
    title: "Merge DataFrames Correctly",
    summary: "Choose join type explicitly and validate duplicates in key columns.",
    steps: [
      "Check key uniqueness in both tables.",
      "Choose join type based on requirement (left/inner/right).",
      "Use indicator=True to audit unmatched rows.",
      "Validate row counts after merge.",
    ],
    snippet: `merged = df_left.merge(
    df_right,
    on="customer_id",
    how="left",
    indicator=True,
)
print(merged["_merge"].value_counts())`,
  },
  {
    id: "datetime_cleaning",
    keywords: ["date", "datetime", "timestamp", "to_datetime", "time series"],
    title: "Clean Datetime Columns",
    summary: "Parse once with errors='coerce', then inspect invalid rows and timezone needs.",
    steps: [
      "Use pd.to_datetime with errors='coerce'.",
      "Check null count after parsing to catch bad formats.",
      "Standardize timezone if needed.",
      "Use dt accessor for features (year, month, day).",
    ],
    snippet: `df["event_time"] = pd.to_datetime(df["event_time"], errors="coerce", utc=True)
print(df["event_time"].isna().sum())
df["event_date"] = df["event_time"].dt.date`,
  },
  {
    id: "performance",
    keywords: ["slow", "performance", "optimize", "iterrows", "faster"],
    title: "Speed Up Python/Pandas Code",
    summary: "Avoid row-by-row loops; prefer vectorized operations and built-in pandas methods.",
    steps: [
      "Replace iterrows loops with vectorized column operations.",
      "Use map/merge instead of manual lookup loops.",
      "Filter/select only required columns.",
      "Profile large operations before optimizing.",
    ],
    snippet: `# slower: for _, row in df.iterrows(): ...
# faster:
df["net"] = df["revenue"] - df["cost"]
df["is_high"] = df["net"] > 1000`,
  },
  {
    id: "debugging_runtime_error",
    keywords: ["debug", "traceback", "runtime error", "exception", "failed"],
    title: "Debug Python Runtime Errors",
    summary: "Use a minimal reproducible check and inspect variables immediately before failure.",
    steps: [
      "Read the last line of traceback first (real exception type).",
      "Print shape, dtypes, and sample values before failing line.",
      "Add temporary guards/assertions around risky operations.",
      "Run step-by-step from known good state.",
    ],
    snippet: `print(df.shape)
print(df.dtypes)
print(df.head(3))
assert "target_col" in df.columns`,
  },
];

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9_ ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const includesAny = (text: string, options: string[]): boolean =>
  options.some((option) => text.includes(option));

const getRegexIssues = (code: string): AssistantIssue[] => {
  const issues: AssistantIssue[] = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    if (
      /^(if|for|while|def|class|try|except|with)\s+.*[^:]$/.test(trimmed) &&
      !trimmed.endsWith(")")
    ) {
      issues.push({
        severity: "error",
        title: `Line ${index + 1}: Missing colon`,
        detail: "Python control blocks must end with ':'.",
        fix: `Add ':' at the end of line ${index + 1}.`,
      });
    }

    const opens = (line.match(/[\(\[\{]/g) || []).length;
    const closes = (line.match(/[\)\]\}]/g) || []).length;
    if (opens !== closes) {
      issues.push({
        severity: "warning",
        title: `Line ${index + 1}: Unbalanced brackets`,
        detail: "Opening and closing brackets/parentheses do not match on this line.",
        fix: "Balance (), [], and {} in the expression.",
      });
    }

    if (/\biterrows\(/.test(trimmed)) {
      issues.push({
        severity: "tip",
        title: `Line ${index + 1}: Possible performance bottleneck`,
        detail: "iterrows() is usually slow for large DataFrames.",
        fix: "Prefer vectorized pandas operations.",
      });
    }

    if (/df\.(drop|rename|fillna|replace|sort_values)\(/.test(trimmed) && !trimmed.includes("inplace=True") && !trimmed.includes("df =")) {
      issues.push({
        severity: "warning",
        title: `Line ${index + 1}: Result may not be stored`,
        detail: "Many pandas methods return a new DataFrame unless inplace=True is set.",
        fix: "Assign back to df or use inplace=True.",
      });
    }

    if (/ and | or /.test(trimmed) && /\[.*\]/.test(trimmed) && trimmed.includes("df[")) {
      issues.push({
        severity: "warning",
        title: `Line ${index + 1}: Boolean filter may be invalid`,
        detail: "Use '&' and '|' for pandas boolean masks (with parentheses), not 'and/or'.",
        fix: `Example: df[(df["a"] > 0) & (df["b"] < 10)]`,
      });
    }
  });

  return issues;
};

const getRuntimeIssues = (error: string | null): AssistantIssue[] => {
  if (!error) {
    return [];
  }

  const normalized = error.toLowerCase();

  if (normalized.includes("keyerror")) {
    return [
      {
        severity: "error",
        title: "KeyError detected",
        detail: "A DataFrame column or dictionary key is missing.",
        fix: "Print df.columns and use the exact case-sensitive key.",
        example: `print(df.columns.tolist())`,
      },
    ];
  }

  if (normalized.includes("nameerror")) {
    return [
      {
        severity: "error",
        title: "NameError detected",
        detail: "A variable/function is referenced before it is defined.",
        fix: "Define it earlier or correct the variable name spelling.",
      },
    ];
  }

  if (normalized.includes("syntaxerror")) {
    return [
      {
        severity: "error",
        title: "SyntaxError detected",
        detail: "Python syntax is invalid in one or more lines.",
        fix: "Check missing colon, quote, comma, or bracket near reported line.",
      },
    ];
  }

  if (normalized.includes("indentationerror")) {
    return [
      {
        severity: "error",
        title: "IndentationError detected",
        detail: "Python block indentation is inconsistent.",
        fix: "Use 4 spaces per indentation level and avoid tab/space mixing.",
      },
    ];
  }

  if (normalized.includes("typeerror")) {
    return [
      {
        severity: "error",
        title: "TypeError detected",
        detail: "Operation used incompatible data types.",
        fix: "Inspect types with type() or df.dtypes, then convert explicitly.",
      },
    ];
  }

  if (normalized.includes("attributeerror")) {
    return [
      {
        severity: "error",
        title: "AttributeError detected",
        detail: "Object does not have the accessed method/attribute.",
        fix: "Confirm object type first, then use a valid method.",
      },
    ];
  }

  if (includesAny(normalized, ["module not found", "modulenotfounderror"])) {
    return [
      {
        severity: "error",
        title: "ModuleNotFoundError detected",
        detail: "The package is not available in current runtime.",
        fix: "Install/import available packages only. In Pyodide, use supported packages.",
      },
    ];
  }

  return [
    {
      severity: "warning",
      title: "Runtime error detected",
      detail: "The code execution failed. Review traceback and isolate the failing line.",
      fix: "Print intermediate values and run code step-by-step.",
    },
  ];
};

export const analyzePythonCode = (code: string, runtimeError: string | null): AssistantIssue[] => {
  const issues = [...getRegexIssues(code), ...getRuntimeIssues(runtimeError)];

  const deduped = new Map<string, AssistantIssue>();
  issues.forEach((issue) => {
    const key = `${issue.severity}|${issue.title}|${issue.detail}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  });

  return Array.from(deduped.values()).slice(0, 10);
};

const rankTopics = (question: string, code: string): KnowledgeTopic[] => {
  const questionTokens = tokenize(question);
  const codeLower = code.toLowerCase();

  const scored = pythonKnowledgeBase
    .map((topic) => {
      const keywordHits = topic.keywords.reduce((score, keyword) => {
        if (questionTokens.includes(keyword)) {
          return score + 2;
        }
        if (question.toLowerCase().includes(keyword)) {
          return score + 1;
        }
        if (codeLower.includes(keyword)) {
          return score + 0.5;
        }
        return score;
      }, 0);

      return { topic, score: keywordHits };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 2).map((entry) => entry.topic);
};

export const answerPythonQuestion = (
  question: string,
  code: string,
  runtimeError: string | null,
): AssistantAnswer => {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      title: "Ask a Python question",
      summary: "Describe the issue or goal. Example: 'Why am I getting KeyError on column age?'",
      steps: [
        "Mention the error text if available.",
        "Mention the column/function you are working on.",
        "Ask for a fix or best-practice approach.",
      ],
      matchedTopics: [],
    };
  }

  const lowerQuestion = trimmed.toLowerCase();
  const runtimeIssues = getRuntimeIssues(runtimeError);

  if (
    runtimeError &&
    includesAny(lowerQuestion, ["error", "fail", "traceback", "fix", "debug"])
  ) {
    const topIssue = runtimeIssues[0];
    return {
      title: topIssue ? `Debug: ${topIssue.title}` : "Debug runtime error",
      summary: topIssue?.detail ?? "Use traceback details to isolate the exact failing line.",
      steps: [
        ...(topIssue?.fix ? [topIssue.fix] : []),
        "Print df.head(), df.dtypes, and df.columns before the failing line.",
        "Run only the failing section in isolation with minimal sample data.",
        "Apply fix, then re-run full cell.",
      ],
      snippet: topIssue?.example,
      matchedTopics: ["runtime_error"],
    };
  }

  const matched = rankTopics(trimmed, code);
  if (matched.length > 0) {
    const primary = matched[0];
    return {
      title: primary.title,
      summary: primary.summary,
      steps: primary.steps,
      snippet: primary.snippet,
      matchedTopics: matched.map((topic) => topic.id),
    };
  }

  return {
    title: "General Python guidance",
    summary:
      "I can help with Python and pandas tasks. Ask with concrete goal + error text for a precise fix.",
    steps: [
      "State your expected output in one sentence.",
      "Share the exact error message or wrong behavior.",
      "Share the line/block that fails.",
      "I will return a minimal corrected snippet.",
    ],
    matchedTopics: ["general"],
  };
};
