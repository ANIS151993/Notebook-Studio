import EmailLinkForm from "@/components/EmailLinkForm";
import AnimatedLink from "@/components/AnimatedLink";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-[#d4af37]/70 bg-[#0f0f0f]/82 px-6 py-4 backdrop-blur-xl reveal-up">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <AnimatedLink href="/">
            <div>
              <h1 className="text-xl font-semibold text-[#f4d03f]">
                Notebook Studio
              </h1>
              <p className="text-xs text-[#c9a961]">
                CSV Cleaner & Jupyter Notebook Generator
              </p>
            </div>
          </AnimatedLink>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-lg px-6 py-16">
        <div className="mb-8 text-center reveal-up delay-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/70 bg-[#20190f]/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-[#f4d03f]">
            <span className="status-pulse inline-block h-2 w-2 rounded-full bg-[#ffd700]" />
            Secure account access
          </div>
          <h2 className="text-3xl font-semibold text-[#f4d03f] md:text-4xl">
            Sign Up / Log In
          </h2>
          <p className="mt-2 text-sm text-[#c9a961]">
            Create an account with email and password, verify your email, then log in
            securely.
          </p>
        </div>

        <div className="glass-card hover-lift reveal-up delay-2 rounded-3xl p-8">
          <EmailLinkForm />
        </div>

        <div className="glass-card hover-lift reveal-up delay-3 mt-6 rounded-2xl bg-[#2a2416]/85 p-6">
          <h3 className="text-sm font-semibold text-[#f4d03f]">Why this auth flow?</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#c9a961]">
            <li>• Fast and secure authentication</li>
            <li>• New users verify email before first login</li>
            <li>• Protected account access with password</li>
            <li>• Access your account from any device</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <AnimatedLink href="/" className="text-sm text-[#c9a961] underline transition-colors hover:text-[#ffd700]">
            ← Back to CSV Cleaner
          </AnimatedLink>
        </div>
      </main>
    </div>
  );
}
