import AnimatedLink from "@/components/AnimatedLink";

const userSteps = [
  {
    title: "Upload Your CSV",
    description:
      "Choose any raw CSV file and let Notebook Studio parse it instantly in the browser.",
  },
  {
    title: "Auto Clean Data",
    description:
      "Headers are normalized, whitespace is trimmed, empty rows are removed, and duplicates are filtered.",
  },
  {
    title: "Download Outputs",
    description:
      "Get a cleaned CSV and a generated Jupyter notebook template for repeatable workflows.",
  },
  {
    title: "Run Interactive Python",
    description:
      "Use in-browser Pyodide cells to inspect, transform, and experiment with your data.",
  },
  {
    title: "Explore Visualizations",
    description:
      "Generate chart-based insights from cleaned data using the built-in visualization panel.",
  },
  {
    title: "Use Secure Sign-In",
    description:
      "Access protected features through passwordless email-link authentication with Firebase.",
  },
];

const techStack = [
  "Next.js 16 (App Router)",
  "React 19 + TypeScript",
  "Tailwind CSS 4 + custom animations",
  "PapaParse (CSV parsing)",
  "Pyodide (in-browser Python)",
  "Firebase Auth + Firestore",
  "Chart.js + react-chartjs-2",
];

const completionPhases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    summary:
      "Set up Next.js app structure, routing, core UI shell, and Firebase integration points.",
    outcome: "A stable app foundation and auth-ready architecture.",
  },
  {
    phase: "Phase 2",
    title: "CSV Processing Engine",
    summary:
      "Implemented CSV upload, parsing, cleanup logic, and download generation for cleaned outputs.",
    outcome: "Users can transform noisy CSV files into ready-to-use data.",
  },
  {
    phase: "Phase 3",
    title: "Interactive Notebook Runtime",
    summary:
      "Integrated Pyodide for browser-side Python execution with editable cells and output rendering.",
    outcome: "Users can run notebook-like workflows without any backend Python server.",
  },
  {
    phase: "Phase 4",
    title: "Analytics and UX",
    summary:
      "Added visualization modules, motion system, interactive cards, and route transitions.",
    outcome: "A more visual, animated, and guided product experience.",
  },
];

const workflowGuide = [
  {
    step: "1",
    action: "Open the app and upload a CSV file.",
    result: "The file is parsed in-browser and validated.",
    tip: "Use standard CSV headers for best chart suggestions.",
  },
  {
    step: "2",
    action: "Allow the cleaning pipeline to run.",
    result:
      "Headers are normalized, whitespace is trimmed, and empty/duplicate rows are removed.",
    tip: "Review the cleanup summary card before exporting.",
  },
  {
    step: "3",
    action: "Download cleaned CSV and generated notebook.",
    result: "You get reusable outputs for analytics and automation.",
    tip: "The notebook includes step-by-step data cleaning logic.",
  },
  {
    step: "4",
    action: "Use the Interactive Notebook tab.",
    result: "Run and edit Python code cells directly in your browser.",
    tip: "Start with the predefined cells before writing custom code.",
  },
  {
    step: "5",
    action: "Open Visualizations.",
    result: "Explore automatic charts from cleaned data.",
    tip: "Try both standard and custom chart modes.",
  },
  {
    step: "6",
    action: "Sign in with passwordless email link.",
    result: "Access protected dashboard/admin routes.",
    tip: "Use the same email device or confirm email on `/finish`.",
  },
];

const stackByLayer = [
  {
    layer: "Frontend Framework",
    tools: "Next.js 16, React 19, TypeScript",
    reason:
      "Provides fast routing, type safety, and maintainable component architecture.",
  },
  {
    layer: "Styling and Motion",
    tools: "Tailwind CSS 4 + custom CSS animation utilities",
    reason:
      "Enables responsive design and a polished animated UI with reusable classes.",
  },
  {
    layer: "Data Handling",
    tools: "PapaParse",
    reason: "Efficient CSV parsing and transformation directly on the client.",
  },
  {
    layer: "In-Browser Python",
    tools: "Pyodide (WebAssembly)",
    reason:
      "Runs Python notebook cells locally in the browser without backend compute.",
  },
  {
    layer: "Auth and Database",
    tools: "Firebase Auth (email link), Firestore",
    reason:
      "Secure passwordless login plus user profile persistence and protected routes.",
  },
  {
    layer: "Data Visualization",
    tools: "Chart.js + react-chartjs-2",
    reason: "Interactive chart rendering for cleaned CSV data insights.",
  },
];

const faqs = [
  {
    q: "Why does the Python runtime take time on first load?",
    a: "Pyodide and Python packages are downloaded in the browser on first run. Later loads are faster due to caching.",
  },
  {
    q: "Do I need a backend server for notebook execution?",
    a: "No. Notebook code execution runs client-side in WebAssembly through Pyodide.",
  },
  {
    q: "What if my email link opens on another device?",
    a: "The `/finish` page prompts for your email and completes sign-in securely.",
  },
  {
    q: "Why do some charts not appear?",
    a: "Some charts require specific column types or enough non-empty values. Try the Custom mode in Visualizations.",
  },
];

export default function LiveGuidePage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="glass-card reveal-up rounded-3xl p-8 md:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/70 bg-[#20190f]/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-[#f4d03f]">
            <span className="status-pulse inline-block h-2 w-2 rounded-full bg-[#ffd700]" />
            Live app guide
          </div>
          <h1 className="text-3xl font-semibold text-[#f4d03f] md:text-5xl">
            Notebook Studio User Guide
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-[#c9a961] md:text-base">
            A complete user page for your live app, with practical steps, stack
            details, and the fastest way to get started.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AnimatedLink
              href="/"
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:-translate-y-0.5 hover:bg-[#ffd700]"
            >
              Open App
            </AnimatedLink>
            <AnimatedLink
              href="/login"
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37] bg-[#1a1a1a]/70 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] transition hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#0a0a0a]"
            >
              Sign In
            </AnimatedLink>
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-1 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Step-by-Step: How Users Work in This App
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {userSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#ffd700]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a961]">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#f4d03f]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[#c9a961]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-2 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            How This Project Was Completed
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            Build progression from initial setup to full interactive live app.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {completionPhases.map((phase) => (
              <article
                key={phase.phase}
                className="rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#ffd700]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a961]">
                  {phase.phase}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#f4d03f]">
                  {phase.title}
                </h3>
                <p className="mt-2 text-sm text-[#c9a961]">{phase.summary}</p>
                <p className="mt-2 text-xs text-[#ffd700]">Outcome: {phase.outcome}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-2 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Complete Workflow Guide
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            End-to-end user journey with expected outputs and best-practice tips.
          </p>
          <div className="mt-6 space-y-3">
            {workflowGuide.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a961]">
                  Step {item.step}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#f4d03f]">
                  {item.action}
                </h3>
                <p className="mt-1 text-sm text-[#c9a961]">
                  <span className="text-[#ffd700]">Result:</span> {item.result}
                </p>
                <p className="mt-1 text-xs text-[#c9a961]">
                  <span className="text-[#ffd700]">Tip:</span> {item.tip}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-3 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Technology Used to Build This App
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            This is the exact development stack used in Notebook Studio.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[#d4af37]/60 bg-[#1a1a1a]/80 px-3 py-1.5 text-xs text-[#f4d03f]"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {stackByLayer.map((item) => (
              <article
                key={item.layer}
                className="rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-5"
              >
                <h3 className="text-base font-semibold text-[#f4d03f]">
                  {item.layer}
                </h3>
                <p className="mt-1 text-xs text-[#ffd700]">{item.tools}</p>
                <p className="mt-2 text-sm text-[#c9a961]">{item.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-4 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Complete Developer Guidance
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-[#c9a961]">
            <li>
              <strong>1.</strong> Clone repository and install dependencies.
            </li>
            <li>
              <strong>2.</strong> Configure Firebase environment variables in
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                .env.local
              </code>
              .
            </li>
            <li>
              <strong>3.</strong> Run
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                npm run dev
              </code>
              and open
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                /live
              </code>
              for this guide and
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                /
              </code>
              for the app.
            </li>
            <li>
              <strong>4.</strong> Validate using
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                npm run lint
              </code>
              and
              <code className="mx-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-xs text-[#ffd700]">
                npm run build
              </code>
              before deploy.
            </li>
          </ol>
          <div className="mt-5 rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#c9a961]">
              Recommended command sequence
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-[#d4af37]/40 bg-[#111111] p-4 text-xs text-[#f4d03f]">
              <code>{`cp .env.local.example .env.local
npm install
npm run dev
npm run lint
npm run build`}</code>
            </pre>
          </div>
        </section>

        <section className="glass-card hover-lift reveal-up delay-4 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Troubleshooting and FAQ
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="rounded-2xl border border-[#d4af37]/55 bg-[#171717]/85 p-4 text-sm text-[#c9a961]"
              >
                <summary className="cursor-pointer font-semibold text-[#f4d03f]">
                  {faq.q}
                </summary>
                <p className="mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="glass-card reveal-up delay-4 rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Start Using Notebook Studio
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            Everything is ready: upload CSV, clean data, run Python, generate
            charts, and access protected pages with secure email-link sign-in.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <AnimatedLink
              href="/"
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:-translate-y-0.5 hover:bg-[#ffd700]"
            >
              Go to App
            </AnimatedLink>
            <AnimatedLink
              href="/dashboard"
              className="shine-btn inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37] bg-[#1a1a1a]/70 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] transition hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#0a0a0a]"
            >
              Open Dashboard
            </AnimatedLink>
          </div>
        </section>
      </main>
    </div>
  );
}
