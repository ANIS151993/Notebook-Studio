"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "@/lib/firebase";

type Profile = {
  uid: string;
  email: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
};

const formatTimestamp = (value?: Timestamp) => {
  if (!value) {
    return "Not available";
  }
  return value.toDate().toLocaleString();
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;
    const firestoreDb = db;
    if (!firebaseAuth || !firestoreDb) {
      setError(firebaseConfigError ?? "Firebase is not configured.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const userRef = doc(firestoreDb, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as Profile;
          setProfile({
            uid: data.uid,
            email: data.email,
            createdAt: data.createdAt,
            lastLoginAt: data.lastLoginAt,
          });
        } else {
          setProfile({
            uid: user.uid,
            email: user.email ?? "Unknown",
          });
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your profile details.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="rounded-3xl border border-[#d4af37] bg-[#1a1a1a] p-8 shadow-[0_20px_60px_rgba(212,175,55,0.1)]">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a961]">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f4d03f]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#c9a961]">
            Your account details are below.
          </p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#c9a961]">
            Loading your profile...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-[#d4af37] bg-[#2a2416] p-4 text-sm text-[#ffd700]">
            {error}
          </div>
        )}

        {profile && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[#d4af37] bg-[#1a1a1a] p-8 shadow-[0_20px_60px_rgba(212,175,55,0.08)]">
              <h2 className="text-lg font-semibold text-[#f4d03f]">
                Account summary
              </h2>
              <dl className="mt-6 space-y-4 text-sm text-[#c9a961]">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-[#c9a961]">
                    Email
                  </dt>
                  <dd className="mt-1 text-base font-medium text-[#f4d03f]">
                    {profile.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-[#c9a961]">
                    UID
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-[#c9a961]">
                    {profile.uid}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-[#c9a961]">
                    Created at
                  </dt>
                  <dd className="mt-1">{formatTimestamp(profile.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-[#c9a961]">
                    Last login
                  </dt>
                  <dd className="mt-1">{formatTimestamp(profile.lastLoginAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[#d4af37] bg-[#2a2416] p-8">
              <div>
                <h2 className="text-lg font-semibold text-[#f4d03f]">
                  Security
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#c9a961]">
                  This dashboard is protected by Firebase Authentication. Only
                  signed-in users can access their profile data.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d4af37] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#f4d03f] transition hover:bg-[#d4af37] hover:text-[#0a0a0a]"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
