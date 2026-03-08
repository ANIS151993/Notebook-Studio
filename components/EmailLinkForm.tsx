"use client";

import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth, firebaseConfigError } from "@/lib/firebase";
import { isValidEmail } from "@/lib/validators";

type Status = "idle" | "sending" | "sent";
type AuthMode = "signup" | "signin";

const getEmailLinkErrorMessage = (
  error: unknown,
  appUrl: string,
): string => {
  const targetDomain = (() => {
    try {
      return new URL(appUrl).host;
    } catch {
      return appUrl;
    }
  })();

  if (!(error instanceof FirebaseError)) {
    return "We could not send the email link. Please try again.";
  }

  switch (error.code) {
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return `Firebase blocked this redirect URL. Add ${targetDomain} and your Pages domain to Firebase Auth -> Settings -> Authorized domains.`;
    case "auth/operation-not-allowed":
      return "Enable Email link authentication in Firebase Auth -> Sign-in method -> Email/Password.";
    case "auth/network-request-failed":
      return "Network issue while contacting Firebase. Check connection and try again.";
    case "auth/invalid-email":
      return "Email address format is invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and retry.";
    default:
      return `Firebase error: ${error.code}. Check Firebase Auth settings and environment variables.`;
  }
};

export default function EmailLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<AuthMode>("signup");
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
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    ).replace(/\/+$/, "");

    try {
      await sendSignInLinkToEmail(auth, trimmedEmail, {
        url: `${appUrl}/finish`,
        handleCodeInApp: true,
      });

      window.localStorage.setItem("emailForSignIn", trimmedEmail);
      window.localStorage.setItem("emailLinkMode", mode);
      setStatus("sent");
    } catch (err: unknown) {
      console.error(err);
      setError(getEmailLinkErrorMessage(err, appUrl));
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
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#d4af37]/60 bg-[#1a1a1a]/80 p-2">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setStatus("idle");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            mode === "signup"
              ? "bg-[#d4af37] text-[#111111]"
              : "bg-transparent text-[#c9a961] hover:text-[#ffd700]"
          }`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setStatus("idle");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            mode === "signin"
              ? "bg-[#d4af37] text-[#111111]"
              : "bg-transparent text-[#c9a961] hover:text-[#ffd700]"
          }`}
        >
          Log In
        </button>
      </div>
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
          {mode === "signup"
            ? "Use this for first-time account creation."
            : "Use this if you already created an account."}
        </p>
        <p className="text-xs text-[#c9a961]">
          We will email you a secure link. No password is required.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "sending" || !!firebaseConfigError}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-[#d4af37] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
      >
        {status === "sending"
          ? "Sending..."
          : mode === "signup"
            ? "Send Sign-Up Link"
            : "Send Login Link"}
      </button>

      {status === "sent" && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          ✓ Link sent! Check your inbox and click the link to continue.
          {mode === "signup"
            ? " Your account will be created on first successful sign-in."
            : " Use the same email you used previously."}
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
