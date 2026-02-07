import Link from "next/link";
import CsvNotebookBuilder from "@/components/CsvNotebookBuilder";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-[#d4af37] bg-[#1a1a1a] px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#f4d03f]">Notebook Studio</h1>
            <p className="text-xs text-[#c9a961]">CSV Cleaner & Jupyter Notebook Generator</p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d4af37] px-5 text-sm font-semibold text-[#f4d03f] transition hover:bg-[#d4af37] hover:text-[#0a0a0a]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#f4d03f]">
            CSV Cleanup Tool with Interactive Python Notebook
          </h2>
          <p className="mt-2 text-lg text-[#c9a961]">
            Upload your raw CSV file and get a cleaned version plus an interactive Jupyter-style notebook
            where you can see the cleaning process and run your own Python code right in the browser!
          </p>
        </div>

        <div className="rounded-3xl border border-[#d4af37] bg-[#1a1a1a] p-8 shadow-[0_20px_60px_rgba(212,175,55,0.1)]">
          <CsvNotebookBuilder />
        </div>

        <div className="mt-8 rounded-2xl border border-[#d4af37] bg-[#2a2416] p-6">
          <h3 className="text-lg font-semibold text-[#f4d03f]">How it works</h3>
          <ol className="mt-4 space-y-3 text-sm text-[#c9a961]">
            <li><strong>1. Upload</strong> - Select your raw CSV file</li>
            <li><strong>2. Auto-clean</strong> - Headers normalized, whitespace trimmed, duplicates removed</li>
            <li><strong>3. Download</strong> - Get your cleaned CSV and a Jupyter notebook</li>
            <li><strong>4. Interactive</strong> - View the cleaning process step-by-step in a Python notebook</li>
            <li><strong>5. Customize</strong> - Edit and run your own Python code directly in the browser</li>
          </ol>
          <div className="mt-4 rounded-xl border border-[#d4af37] bg-[#1a1a1a] p-4">
            <p className="text-sm text-[#ffd700]">
              <strong>✨ New!</strong> The Interactive Notebook tab runs Python in your browser using WebAssembly.
              No server required - everything runs locally!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
