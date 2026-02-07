"use client";

import { FormEvent, useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth, firebaseConfigError } from "@/lib/firebase";
import { isValidEmail } from "@/lib/validators";

type Status = "idle" | "sending" | "sent";

export default function EmailLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      setError(firebaseConfigError ?? "Firebase is not configured.");
      return;
    }

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

      await sendSignInLinkToEmail(auth, trimmedEmail, {
        url: `${appUrl}/finish`,
        handleCodeInApp: true,
      });

      window.localStorage.setItem("emailForSignIn", trimmedEmail);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setError("We could not send the email link. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {firebaseConfigError && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          {firebaseConfigError}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#f4d03f]" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-12 rounded-xl border border-[#d4af37] bg-[#0a0a0a] px-4 text-base text-[#f4d03f] placeholder-[#6b5d45] shadow-sm outline-none transition focus:border-[#ffd700] focus:ring-4 focus:ring-[#2a2416]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <p className="text-xs text-[#c9a961]">
          We will email you a secure sign-in link.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "sending" || !!firebaseConfigError}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-[#d4af37] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
      >
        {status === "sending" ? "Sending..." : "Send Sign-In Link"}
      </button>

      {status === "sent" && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          ✓ Link sent! Check your inbox and click the email to finish signing in.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          {error}
        </div>
      )}
    </form>
  );
}
