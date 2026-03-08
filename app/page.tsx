import AnimatedLink from "@/components/AnimatedLink";
import CsvNotebookBuilder from "@/components/CsvNotebookBuilder";

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-[#d4af37]/70 bg-[#0f0f0f]/82 px-6 py-4 backdrop-blur-xl reveal-up">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#f4d03f]">
              Notebook Studio
            </h1>
            <p className="text-xs text-[#c9a961]">
              CSV Cleaner & Jupyter Notebook Generator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedLink
              href="/live"
              className="tab-pill inline-flex h-10 items-center justify-center rounded-xl border border-[#d4af37]/70 bg-[#16120d] px-4 text-sm font-semibold text-[#c9a961] hover:text-[#f4d03f]"
            >
              Live Guide
            </AnimatedLink>
            <AnimatedLink
              href="/login"
              className="tab-pill shine-btn inline-flex h-10 items-center justify-center rounded-xl border border-[#d4af37] bg-[#15120c] px-5 text-sm font-semibold text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
            >
              Sign Up / Sign In
            </AnimatedLink>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="section-glow mb-8 reveal-up delay-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/70 bg-[#20190f]/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-[#f4d03f]">
            <span className="status-pulse inline-block h-2 w-2 rounded-full bg-[#ffd700]" />
            Interactive workflow enabled
          </div>
          <h2 className="text-3xl font-semibold leading-tight text-[#f4d03f] md:text-4xl">
            CSV Cleanup Tool with Interactive Python Notebook
          </h2>
          <p className="mt-3 max-w-4xl text-lg text-[#c9a961]">
            Upload your raw CSV and get a cleaned version plus an interactive
            Jupyter-style notebook where you can run Python code directly in the
            browser.
          </p>
        </div>

        <div className="glass-card hover-lift reveal-up delay-2 rounded-3xl p-8">
          <CsvNotebookBuilder />
        </div>

        <div className="glass-card hover-lift reveal-up delay-3 mt-8 rounded-2xl bg-[#2a2416]/85 p-6">
          <h3 className="text-lg font-semibold text-[#f4d03f]">How it works</h3>
          <ol className="mt-4 space-y-3 text-sm text-[#c9a961]">
            <li>
              <strong>1. Upload</strong> - Select your raw CSV file
            </li>
            <li>
              <strong>2. Auto-clean</strong> - Headers normalized, whitespace
              trimmed, duplicates removed
            </li>
            <li>
              <strong>3. Download</strong> - Get your cleaned CSV and a Jupyter
              notebook
            </li>
            <li>
              <strong>4. Interactive</strong> - View the cleaning process
              step-by-step in a Python notebook
            </li>
            <li>
              <strong>5. Customize</strong> - Edit and run your own Python code
              directly in the browser
            </li>
          </ol>
          <div className="mt-4 rounded-xl border border-[#d4af37]/70 bg-[#1a1a1a]/80 p-4 transition-colors duration-300 hover:border-[#ffd700]">
            <p className="text-sm text-[#ffd700]">
              <strong>New:</strong> The interactive notebook runs Python in your
              browser with WebAssembly. No server required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
