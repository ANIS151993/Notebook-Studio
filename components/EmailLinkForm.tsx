"use client";

import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "@/lib/firebase";
import { replaceWithTransition } from "@/lib/view-transition";
import { isValidEmail } from "@/lib/validators";

type Status = "idle" | "submitting" | "signupSuccess" | "resetSent";
type AuthMode = "signup" | "signin";
const minimumPasswordLength = 8;

const getAuthErrorMessage = (
  error: unknown,
): string => {
  if (!(error instanceof FirebaseError)) {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Use Log In.";
    case "auth/weak-password":
      return `Password is too weak. Use at least ${minimumPasswordLength} characters.`;
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Invalid email or password. Please try again.";
    case "auth/operation-not-allowed":
      return "Enable Email/Password authentication in Firebase Auth -> Sign-in method.";
    case "auth/network-request-failed":
      return "Network issue while contacting Firebase. Check connection and try again.";
    case "auth/invalid-email":
      return "Email address format is invalid.";
    case "auth/user-disabled":
      return "This account is disabled. Contact support.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and retry.";
    case "unavailable":
      return "Firebase service is temporarily unavailable. Try again in a moment.";
    case "permission-denied":
      return "Firestore access is denied. Check Firestore rules for /users/{uid}.";
    case "failed-precondition":
      return "Firestore may not be initialized yet. Create the Firestore database and publish rules.";
    default:
      return `Firebase error: ${error.code}. Check Firebase settings and environment variables.`;
  }
};

export default function EmailLinkForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<AuthMode>("signup");
  const [error, setError] = useState<string | null>(null);

  const upsertUserProfile = async (uid: string, userEmail: string) => {
    if (!db) {
      return;
    }

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        uid,
        email: userEmail,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      return;
    }

    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth || !db) {
      setError(firebaseConfigError ?? "Firebase is not configured correctly.");
      return;
    }

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      setError("Enter your password.");
      return;
    }

    if (mode === "signup") {
      if (trimmedPassword.length < minimumPasswordLength) {
        setError(`Password must be at least ${minimumPasswordLength} characters.`);
        return;
      }

      if (trimmedPassword !== confirmPassword.trim()) {
        setError("Passwords do not match.");
        return;
      }
    }

    setError(null);
    setStatus("submitting");

    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          trimmedPassword,
        );
        await sendEmailVerification(result.user);
        await signOut(auth);
        setStatus("signupSuccess");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const result = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword,
      );

      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        setError("Email is not verified yet. We sent a new verification email.");
        setStatus("idle");
        return;
      }

      try {
        await upsertUserProfile(result.user.uid, result.user.email ?? trimmedEmail);
      } catch (profileError) {
        // Do not block sign-in if profile sync fails temporarily.
        console.error("Profile sync failed during sign-in:", profileError);
      }
      replaceWithTransition(router, "/dashboard");
    } catch (err: unknown) {
      console.error(err);
      setError(getAuthErrorMessage(err));
      setStatus("idle");
    }
  };

  const handlePasswordReset = async () => {
    if (!auth) {
      setError(firebaseConfigError ?? "Firebase is not configured correctly.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }

    try {
      setError(null);
      setStatus("submitting");
      await sendPasswordResetEmail(auth, trimmedEmail);
      setStatus("resetSent");
    } catch (err: unknown) {
      console.error(err);
      setError(getAuthErrorMessage(err));
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
            setPassword("");
            setConfirmPassword("");
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
            setPassword("");
            setConfirmPassword("");
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
            ? "Create your account with a password, then verify your email."
            : "Log in using your registered email and password."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#f4d03f]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={
            mode === "signup"
              ? `At least ${minimumPasswordLength} characters`
              : "Enter your password"
          }
          className="h-12 rounded-xl border border-[#d4af37] bg-[#0a0a0a] px-4 text-base text-[#f4d03f] placeholder-[#6b5d45] shadow-sm outline-none transition focus:border-[#ffd700] focus:ring-4 focus:ring-[#2a2416]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {mode === "signup" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#f4d03f]" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className="h-12 rounded-xl border border-[#d4af37] bg-[#0a0a0a] px-4 text-base text-[#f4d03f] placeholder-[#6b5d45] shadow-sm outline-none transition focus:border-[#ffd700] focus:ring-4 focus:ring-[#2a2416]"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-[#d4af37]/50 bg-[#171717]/80 p-4 text-xs text-[#c9a961]">
        {mode === "signup"
          ? "After Sign Up, check inbox and verify your email before logging in."
          : "If your email is not verified yet, we will send a new verification email."}
      </div>

      <button
        type="submit"
        disabled={status === "submitting" || !!firebaseConfigError}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-[#d4af37] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
      >
        {status === "submitting"
          ? "Please wait..."
          : mode === "signup"
            ? "Create Account"
            : "Log In"}
      </button>

      {mode === "signin" && (
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={status === "submitting" || !!firebaseConfigError}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37]/80 bg-[#16120d] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] transition hover:bg-[#d4af37] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:border-[#6b5d45] disabled:text-[#6b5d45]"
        >
          Forgot Password
        </button>
      )}

      {status === "signupSuccess" && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          ✓ Account created. Verification email sent. Verify your email, then switch
          to Log In.
        </div>
      )}
      {status === "resetSent" && (
        <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
          ✓ Password reset email sent. Check your inbox and set a new password.
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
