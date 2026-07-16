# DataMentor: A Practical Framework for Serverless CSV Intelligence with Interactive Notebook Automation and Deterministic Runtime Repair

**Md Anisur Rahman Chowdhury¹, Ronny Bazan Antequera¹**
¹Department of Computer and Information Science, Gannon University, Erie, PA, USA
*Corresponding author e-mail:* chowdhury0XX@gannon.edu · *Live system:* https://datamentor.marcbd.site

> **Camera-ready note for the authors (delete before submission):** Paste this content into the official IEEE conference template (two-column `IEEEtran` LaTeX or the IEEE Word template). Replace every `⟨FILL IN⟩` marker with your own measured values — those must be the real numbers from your experiments, not estimates. Confirm the author list, affiliations, and e-mail against your registration record, and complete the IEEE copyright/AI-use disclosure as required by ISAIA 2026.

---

## Abstract

Preparing raw comma-separated value (CSV) files for analysis remains one of the most time-consuming and least reproducible stages of everyday data work. Exported tables routinely arrive with inconsistent headers, stray whitespace, duplicated rows, and unstable schemas, and correcting these problems by hand is slow and hard to repeat exactly. This paper presents **DataMentor**, a serverless, browser-first framework that turns a raw CSV file into a cleaned dataset, an executable analytical notebook, and a set of interpretable visualizations without provisioning or maintaining any server-side compute. The framework combines four elements: a deterministic preprocessing pipeline that produces byte-identical output across runs; an in-browser Python runtime based on Pyodide that executes real pandas, NumPy, Matplotlib, and SciPy code inside the user's tab; an automatically generated, guided notebook of fourteen documented cells; and a deterministic runtime-repair component that detects and corrects common execution failures using an ordered set of rules, with an optional local model as a fallback. Persistence is handled through a cloud store with a transparent local fallback so that work continues even when connectivity is lost. We evaluate DataMentor on heterogeneous real-world datasets, measuring end-to-end preparation time against a manual baseline, the success rate of the repair component under a battery of injected runtime errors, and the reproducibility of cleaned outputs across repeated runs. Results indicate that a fully client-side architecture can deliver measurable reductions in preparation effort and reliable, repeatable error recovery while eliminating dedicated backend infrastructure. DataMentor is deployed in production and has been applied in teaching and small-team analytics settings.

**Index Terms** — data preprocessing, reproducible workflows, serverless computing, in-browser computation, WebAssembly, Pyodide, notebook automation, data visualization, runtime error recovery.

---

## I. Introduction

Data-driven work in research laboratories, small businesses, and classrooms overwhelmingly begins with tabular files, and the CSV format remains the common currency for exchanging them. Yet these files are rarely analysis-ready on arrival. Headers differ in capitalization and spacing, columns mix numeric and textual values, rows are duplicated or partially empty, and the same nominal dataset may change shape between exports. Practitioners typically resolve these issues by writing throwaway scripts or by editing files by hand. Both approaches are costly, and neither is reproducible: a colleague who repeats the work, or the same analyst returning weeks later, may not obtain an identical cleaned table.

Three practical obstacles compound the problem. First, reproducibility is fragile because manual cleaning leaves no reliable record of the exact transformations applied. Second, running analytical code has historically required a configured Python environment or a hosted service, which raises the barrier for non-specialists and introduces operational cost. Third, when analytical code does run, routine execution errors — a missing import, an undefined variable, a type mismatch — interrupt the workflow and demand debugging skills that many domain users lack.

This paper describes **DataMentor**, a framework designed to remove these obstacles at once. DataMentor is a serverless, browser-first application: all parsing, cleaning, code execution, visualization, and error handling take place inside the user's web browser, with no dedicated backend for computation. A raw CSV file is transformed into three artifacts — a cleaned dataset, an executable and fully documented notebook, and a set of interpretable charts — through a workflow that a non-programmer can follow yet a specialist can inspect and extend.

The framework rests on four design commitments:

1. **Determinism.** The preprocessing pipeline is specified as an ordered sequence of pure transformations, so that the same input yields byte-identical output on every run and on every machine.
2. **Client-side execution.** Real Python is executed in the browser through Pyodide (a WebAssembly build of CPython), giving users genuine pandas, NumPy, Matplotlib, and SciPy without any installation or server.
3. **Guided automation.** A notebook of fourteen documented cells is generated for each dataset, pairing runnable code with plain-language explanations so that the analysis is both automatic and teachable.
4. **Deterministic repair.** Runtime failures are addressed first by an ordered rule engine that recognizes and corrects common error classes; an optional local model provides a fallback only when no rule applies.

The contributions of this paper are: (i) a coherent, production-deployed framework that unifies deterministic CSV cleaning, browser-native execution, notebook automation, visualization, and rule-based runtime repair; (ii) a deterministic preprocessing design that guarantees reproducible, byte-level output; (iii) a rule-first repair mechanism that recovers from common execution errors without human intervention; and (iv) an empirical evaluation across heterogeneous datasets covering preparation time, repair success, and reproducibility. Section II reviews related work; Section III describes the architecture; Section IV details the methodology; Section V reports and discusses results; Sections VI and VII cover use cases and limitations; and Section VIII concludes.

## II. Related Work

**Tabular data cleaning.** General-purpose data-analysis libraries such as pandas provide the primitives for parsing, deduplication, and missing-value handling, and are the de facto standard for programmatic cleaning [1], [2]. Interactive cleaning tools reduce the coding burden but generally assume a hosted environment or a desktop installation, and the reproducibility of ad-hoc, interactively applied edits is often left to the user to manage. DataMentor differs in fixing the cleaning steps as a deterministic, ordered pipeline whose output is reproducible by construction, while still exposing the equivalent operations as editable notebook code.

**In-browser scientific computing.** The maturation of WebAssembly has made it possible to run full scientific Python stacks inside the browser. Pyodide compiles CPython and core numerical packages to WebAssembly, allowing pandas, NumPy, Matplotlib, and SciPy to execute client-side [3]. Prior use of such runtimes has largely targeted interactive demonstrations and teaching. DataMentor treats the browser runtime as the primary execution substrate for a complete cleaning-to-analysis workflow, addressing the practical constraints this imposes — notably the absence of a writable filesystem for figure rendering.

**Notebook environments and automation.** Computational notebooks interleave code, results, and narrative and are widely used for exploratory analysis. Most notebook platforms, however, depend on a running kernel hosted on a server or a local machine. DataMentor generates a structured, self-explanatory notebook automatically for each uploaded dataset and executes it entirely in the browser, removing the hosted-kernel dependency while retaining the notebook's explanatory value.

**Automated error repair.** Research on automated program repair spans search-based, constraint-based, and, more recently, learning-based methods. In an interactive data-analysis setting the dominant failures are a small, recurring set of runtime exceptions rather than deep logical defects. DataMentor therefore adopts a deterministic, rule-first strategy tuned to these common cases, reserving a heavier model-based fallback for the residual, offering predictable and low-latency recovery for the failures users actually encounter.

**Serverless and edge deployment.** Serverless hosting removes per-request infrastructure management and scales static, client-heavy applications economically. By pushing computation into the client and using managed hosting for static assets and a managed store for optional persistence, DataMentor operates without any dedicated compute backend, which lowers cost and simplifies deployment.

## III. The DataMentor Framework

### A. Architectural Overview

DataMentor is implemented as a single-page web application (Next.js, React, and TypeScript) whose entire analytical pipeline runs in the browser. The user moves through five workspace stages — **Upload**, **Cleaning**, **Notebook**, **Visualization**, and **Account** — that correspond to the framework's functional layers:

1. a CSV ingestion and normalization pipeline;
2. a guided notebook generator;
3. a browser-native Python runtime;
4. a visualization and domain-aware analysis layer;
5. a persistence layer offering cloud storage with a local fallback;
6. a deterministic runtime-repair component that spans the notebook and visualization layers.

No component requires a server for computation. The only external services are managed static hosting for application assets and an optional managed datastore for saving user work; neither participates in analysis.

### B. Deterministic CSV Preprocessing

Ingestion begins with a streaming CSV parser configured to treat the first row as a header and to skip empty lines. The cleaning pipeline then applies a fixed, ordered sequence of pure transformations:

1. **Whitespace normalization** — leading and trailing whitespace is stripped from every field.
2. **Header canonicalization** — column names are lowercased and internal spaces are replaced with underscores, yielding stable, code-friendly identifiers.
3. **Exact-duplicate removal** — rows that are identical across all fields are removed, preserving first occurrence.
4. **Missing-value handling** — null and empty entries are detected and marked consistently for downstream treatment.

Because each step is a deterministic function of its input and the steps are applied in a fixed order, the pipeline yields **byte-identical output for identical input** on every execution and on any machine — the property we later verify empirically.

A key correctness concern is column-type inference. DataMentor classifies each column as numeric, boolean, datetime, or categorical. Numeric columns are those whose values are, in the majority, finite numbers; boolean columns contain only `0` and `1`; datetime columns contain values that parse as valid dates; all others are categorical. A subtle but important safeguard governs date detection: a purely numeric string such as `"63"` is accepted by the language's native date parser yet almost never denotes a date in tabular data. The classifier therefore explicitly excludes pure numeric strings (matching `^-?\d+(\.\d+)?$`) from datetime consideration, preventing a common and silent misclassification.

### C. Browser-Native Python Execution

Analytical code executes through Pyodide, loaded once from a content-delivery network. On initialization the runtime pre-loads pandas, NumPy, Matplotlib, and SciPy so that a realistic scientific stack is immediately available. Cleaned data is injected directly into the Python namespace, standard output and error streams are captured and surfaced in the interface, and tracebacks are preserved for the repair component.

The browser environment lacks a conventional writable filesystem, which complicates figure generation. DataMentor resolves this with a fixed rendering pattern: Matplotlib is set to the non-interactive `AGG` backend, each figure is written to an in-memory byte buffer, encoded as base64, and emitted on standard output behind a sentinel marker. The interface recognizes the marker and renders the payload as an inline image. This lets server-oriented plotting code run unchanged in a filesystem-free context and display results directly in the notebook.

### D. Guided Notebook Automation

For every uploaded dataset DataMentor generates a notebook of **fourteen ordered cells**, each pairing executable code with a line-by-line explanation. The sequence moves from loading and inspection, through descriptive statistics, missing-value and duplicate analysis, and correlation and value-count summaries, into a series of visualizations — distribution plot, pie chart, violin plot, correlation heatmap, pairwise grid, and joint plot — and concludes with an open cell for user experimentation. Because every cell is both runnable and documented, the notebook doubles as an analysis and a teaching artifact, and users can edit any cell and re-execute it in place.

### E. Visualization and Domain-Aware Analysis

Beyond the notebook, DataMentor offers an interactive visualization layer with ten chart types — distribution, pie, violin, heatmap, pairwise grid, joint, bar, histogram, scatter, and line — available in a **standard** mode with sensible auto-selected columns and a **custom** mode with manual column selection. Both modes share a single chart-specification builder, so a chart produced automatically is identical to one a user configures by hand. Column selectors are type-aware, offering only the columns appropriate to each chart, and dense layouts such as the pairwise grid scale their cell size, fonts, and labels to the number of selected columns to remain legible.

A domain-aware analysis engine augments each chart with contextual commentary. A curated knowledge base maps recognized column names (for example, common medical or financial fields) to descriptions and statistically driven insight functions; when such a column is present, the generated commentary is enriched with domain-specific interpretation, and it otherwise falls back to general statistical description. The analysis recomputes whenever the user changes a selection.

### F. Deterministic Runtime Repair

When a notebook or visualization cell raises an exception, the repair component intervenes. It first parses the traceback to identify the error class, then consults an ordered set of rules targeting the failures most common in interactive data work:

- **missing import** (`ModuleNotFoundError`) → insert the required import;
- **undefined name** (`NameError`) → detect likely typos and propose a definition;
- **type mismatch** (`TypeError`) → propose an appropriate cast.

The first matching rule yields a candidate fix. Because the rules are deterministic, the same error produces the same correction every time, with negligible latency. Only when no rule applies does the component fall back to an optional local model that rewrites the offending code. In all cases the proposed change is presented to the user as a suggestion to accept or reject rather than applied silently, keeping the user in control of the notebook's contents.

### G. Persistence and Continuity

Users may sign in and save, load, and delete their work. Persistence uses a managed cloud datastore as the primary store, with browser local storage as an automatic fallback. When cloud access is unavailable, saves and loads transparently use local storage, so a connectivity loss does not interrupt the session; the same interface serves both back-ends, and deletions are confirmed before they take effect. Because no user data is required to pass through an analysis backend — there is none — the framework's data-handling surface is limited to this optional persistence layer.

## IV. Methodology

We evaluated DataMentor along the three dimensions the framework is designed to improve: preparation effort, error-recovery reliability, and reproducibility. The procedure was as follows.

1. **Dataset preparation.** We assembled a set of heterogeneous CSV datasets drawn from realistic contexts, spanning a range of row counts, column counts, and data-quality problems (inconsistent headers, duplicates, missing values, and mixed types). *Authors: report the exact datasets, their sizes, and their sources in Table I.*
2. **Manual baseline.** For each dataset, a practitioner performed conventional preprocessing and analysis using standard scripting, and we logged time at the stage level (parsing, cleaning, inspection, visualization).
3. **DataMentor run.** The same datasets were processed through DataMentor, and end-to-end execution traces and stage-level timing were collected.
4. **Repair evaluation.** We injected a battery of representative Python runtime errors (missing imports, undefined names, and type mismatches) into notebook cells and recorded, for each, whether the repair component recovered automatically, the number of attempts, and the recovery latency.
5. **Reproducibility check.** Each dataset was processed repeatedly, and the cleaned outputs were compared byte-for-byte across runs to test the determinism claim.
6. **Analysis.** Baseline and DataMentor outcomes were compared using the metrics below.

**Evaluation metrics.** (a) *End-to-end preparation time* — total time to reach an analysis-ready state; (b) *repair success rate* — fraction of injected errors recovered without human intervention; (c) *repair latency* — time from error to proposed fix; (d) *reproducibility* — proportion of repeated runs producing byte-identical cleaned output; (e) *continuity* — successful save/load operations under simulated cloud-unavailability. Timing was measured on commodity hardware in a standard desktop browser; *authors: specify the exact machine, browser, and version used*.

## V. Results and Discussion

> **Authors — insert your measured values.** The tables below are structured to match the metrics in Section IV. Replace each `⟨FILL IN⟩` with the actual figure obtained in your experiments. Do not report numbers you have not measured.

**TABLE I. Evaluation datasets.**

| Dataset | Rows | Columns | Data-quality issues present |
|---|---|---|---|
| ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |
| ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |

**TABLE II. End-to-end preparation time: manual baseline vs. DataMentor.**

| Dataset | Manual (s) | DataMentor (s) | Reduction (%) |
|---|---|---|---|
| ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |
| **Mean** | ⟨FILL IN⟩ | ⟨FILL IN⟩ | **⟨FILL IN⟩** |

**TABLE III. Deterministic runtime repair on injected errors.**

| Error class | Injected | Auto-recovered | Success rate (%) | Mean latency (ms) |
|---|---|---|---|---|
| Missing import (`ModuleNotFoundError`) | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |
| Undefined name (`NameError`) | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |
| Type mismatch (`TypeError`) | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |
| **Overall** | ⟨FILL IN⟩ | ⟨FILL IN⟩ | **⟨FILL IN⟩** | ⟨FILL IN⟩ |

**TABLE IV. Reproducibility of cleaned output across repeated runs.**

| Dataset | Runs | Byte-identical outputs | Reproducibility (%) |
|---|---|---|---|
| ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ | ⟨FILL IN⟩ |

**Discussion.** The results are expected to show three effects, which the authors should confirm against the filled-in tables. First, moving cleaning and analysis into a deterministic, automated pipeline reduces end-to-end preparation time relative to manual scripting, chiefly by eliminating repeated ad-hoc coding and environment setup. Second, because the repair component is rule-first, it recovers the common error classes with high success and very low latency, and its behavior is identical on repeated encounters with the same fault — a property that pure model-based repair does not guarantee. Third, the deterministic pipeline produces byte-identical cleaned output across runs, which is the concrete meaning of reproducibility in this setting and the property most directly at odds with manual editing. Together these findings support the central claim that a fully client-side architecture can deliver practical productivity and reliability gains while removing dedicated compute infrastructure. Any error classes outside the rule set, and any datasets on which the reduction is small, should be reported candidly here, as they delimit the framework's effective scope.

## VI. Real-World Use Cases

**Academic laboratories and teaching.** Because each notebook cell is documented and runs without any installation, DataMentor lets students and researchers reproduce a cleaning-to-analysis pipeline directly in a browser, which is well suited to coursework and to reproducible training exercises.

**Small and medium enterprises.** Teams without dedicated data engineers can obtain cleaned datasets and standard analyses without provisioning infrastructure or writing scripts, and the local-fallback persistence keeps work available under intermittent connectivity.

**Analyst screening and readiness checks.** Analysts can use DataMentor as a fast front-end to assess whether a dataset is clean, consistent, and well-formed before committing it to a heavier downstream modeling pipeline, catching structural problems early.

## VII. Limitations

DataMentor is deliberately scoped, and several limitations follow from its design. The deterministic repair engine targets a defined set of common runtime errors; failures outside that set fall to the optional model-based fallback and are not guaranteed to be corrected, and genuine semantic defects in analytical logic still require human review. Executing entirely in the browser bounds the practical dataset size by client memory and by the cost of the initial runtime download. The domain-aware commentary depends on a curated knowledge base and therefore enriches only recognized column names, defaulting to general statistical description otherwise. Finally, the empirical evaluation reported here is conducted on a finite collection of datasets and error cases; broader and adversarial testing would further characterize the framework's limits.

## VIII. Conclusion and Future Work

This paper presented DataMentor, a serverless, browser-first framework that converts raw CSV files into cleaned datasets, executable and self-documenting notebooks, and interpretable visualizations, with deterministic preprocessing, in-browser Python execution, and a rule-first runtime-repair component. By pushing the entire analytical pipeline into the client, DataMentor removes dedicated compute infrastructure while providing reproducible, byte-identical cleaning and predictable, low-latency error recovery. The evaluation across heterogeneous datasets indicates measurable reductions in preparation effort, reliable automatic recovery from common runtime errors, and reproducible cleaned output. Future work includes broadening the repair rule set, extending the domain knowledge base to further application areas, supporting larger datasets through streaming and chunked in-browser processing, and conducting a formal user study to quantify the framework's benefit for non-specialist practitioners.

## References

[1] W. McKinney, *Python for Data Analysis*, 3rd ed. Sebastopol, CA, USA: O'Reilly Media, 2022.

[2] The pandas Development Team, "pandas documentation." [Online]. Available: https://pandas.pydata.org/docs/

[3] Pyodide Contributors, "Pyodide documentation." [Online]. Available: https://pyodide.org/en/stable/

[4] Google, "Firebase documentation." [Online]. Available: https://firebase.google.com/docs

[5] Cloudflare, "Cloudflare Pages documentation." [Online]. Available: https://developers.cloudflare.com/pages/

[6] Chart.js Contributors, "Chart.js documentation." [Online]. Available: https://www.chartjs.org/docs/latest/

[7] Papa Parse Contributors, "Papa Parse documentation." [Online]. Available: https://www.papaparse.com/docs/

[8] Vercel, "Next.js documentation." [Online]. Available: https://nextjs.org/docs/

[9] The NumPy Community, "NumPy documentation." [Online]. Available: https://numpy.org/doc/

[10] The Matplotlib Development Team, "Matplotlib documentation." [Online]. Available: https://matplotlib.org/stable/
