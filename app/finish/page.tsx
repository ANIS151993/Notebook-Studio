"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "@/lib/firebase";
import { isValidEmail } from "@/lib/validators";

type Stage = "checking" | "needsEmail" | "signingIn" | "error";

export default function FinishPage() {
  const router = useRouter();
  const firebaseSetupError =
    firebaseConfigError ?? (!auth || !db ? "Firebase is not configured." : null);
  const [stage, setStage] = useState<Stage>(
    firebaseSetupError ? "error" : "checking"
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(firebaseSetupError);

  const completeSignIn = useCallback(async (userEmail: string) => {
    const firebaseAuth = auth;
    const firestoreDb = db;
    if (!firebaseAuth || !firestoreDb) {
      setError(firebaseSetupError ?? "Firebase is not configured.");
      setStage("error");
      return;
    }

    setStage("signingIn");
    setError(null);

    try {
      const result = await signInWithEmailLink(
        firebaseAuth,
        userEmail,
        window.location.href,
      );

      const user = result.user;
      const userRef = doc(firestoreDb, "users", user.uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email ?? userEmail,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        });
      }

      window.localStorage.removeItem("emailForSignIn");
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("This sign-in link is invalid or expired.");
      setStage("error");
    }
  }, [firebaseSetupError, router]);

  useEffect(() => {
    if (firebaseSetupError) {
      return;
    }

    const firebaseAuth = auth;
    if (!firebaseAuth) {
      return;
    }

    const link = window.location.href;
    if (!isSignInWithEmailLink(firebaseAuth, link)) {
      queueMicrotask(() => {
        setError("This link is not valid. Request a new email link.");
        setStage("error");
      });
      return;
    }

    const storedEmail = window.localStorage.getItem("emailForSignIn");
    if (storedEmail) {
      queueMicrotask(() => {
        void completeSignIn(storedEmail);
      });
    } else {
      queueMicrotask(() => {
        setStage("needsEmail");
      });
    }
  }, [completeSignIn, firebaseSetupError]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter the email address you used to request the link.");
      return;
    }

    completeSignIn(trimmedEmail);
  };

  return (
    <div className="min-h-screen bg-[#f6f2ea] px-6 py-16">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-[#eadfce] bg-white p-8 shadow-[0_20px_60px_rgba(30,20,10,0.1)]">
        <h1 className="text-2xl font-semibold text-[#111111]">
          Finish signing in
        </h1>
        <p className="mt-3 text-sm text-[#5a5147]">
          We are verifying your secure link. This should only take a moment.
        </p>

        {stage === "needsEmail" && (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleEmailSubmit}>
            <label className="text-sm font-medium text-[#2d2a27]" htmlFor="email">
              Confirm your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-12 rounded-xl border border-[#e3d7c6] bg-white px-4 text-base text-[#1b1b1b] shadow-sm outline-none transition focus:border-[#b5a896] focus:ring-4 focus:ring-[#f3e6d5]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#111111] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2c2c2c]"
            >
              Confirm and sign in
            </button>
          </form>
        )}

        {stage === "signingIn" && (
          <div className="mt-6 rounded-2xl border border-[#e6d7c2] bg-[#fff6e9] p-4 text-sm text-[#4e453b]">
            Signing you in...
          </div>
        )}

        {stage === "error" && error && (
          <div className="mt-6 rounded-2xl border border-[#efc6b9] bg-[#fff1ee] p-4 text-sm text-[#8b3b2f]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
