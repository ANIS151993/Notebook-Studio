import EmailLinkForm from "@/components/EmailLinkForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-[#d4af37] bg-[#1a1a1a] px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/">
            <div>
              <h1 className="text-xl font-semibold text-[#f4d03f]">Notebook Studio</h1>
              <p className="text-xs text-[#c9a961]">CSV Cleaner & Jupyter Notebook Generator</p>
            </div>
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-lg px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-[#f4d03f]">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            We'll email you a secure sign-in link. No password required.
          </p>
        </div>

        <div className="rounded-3xl border border-[#d4af37] bg-[#1a1a1a] p-8 shadow-[0_20px_60px_rgba(212,175,55,0.1)]">
          <EmailLinkForm />
        </div>

        <div className="mt-6 rounded-2xl border border-[#d4af37] bg-[#2a2416] p-6">
          <h3 className="text-sm font-semibold text-[#f4d03f]">Why passwordless?</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#c9a961]">
            <li>• Fast and secure authentication</li>
            <li>• No passwords to remember</li>
            <li>• Access your account from any device</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#c9a961] underline">
            ← Back to CSV Cleaner
          </Link>
        </div>
      </main>
    </div>
  );
}
