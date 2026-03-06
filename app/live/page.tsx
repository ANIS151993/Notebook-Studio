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
        </section>

        <section className="glass-card hover-lift reveal-up delay-3 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-[#f4d03f]">
            Developer Guidance
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
        </section>
      </main>
    </div>
  );
}
