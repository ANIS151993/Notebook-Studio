"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "@/lib/firebase";
import { replaceWithTransition } from "@/lib/view-transition";

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
        replaceWithTransition(router, "/");
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
        setProfile({
          uid: user.uid,
          email: user.email ?? "Unknown",
        });
        setError(
          "Signed in successfully, but profile details are temporarily unavailable."
        );
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
    replaceWithTransition(router, "/");
  };

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="glass-card reveal-up rounded-3xl p-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a961]">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f4d03f] md:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#c9a961]">
            Your account details are below.
          </p>
        </header>

        {loading && (
          <div className="glass-card panel-enter rounded-2xl bg-[#2a2416]/85 p-4 text-sm text-[#c9a961]">
            Loading your profile...
          </div>
        )}

        {error && (
          <div className="glass-card panel-enter rounded-2xl bg-[#2a2416]/85 p-4 text-sm text-[#ffd700]">
            {error}
          </div>
        )}

        {profile && (
          <section className="grid gap-6 panel-enter lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-card hover-lift rounded-3xl p-8">
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

            <div className="glass-card hover-lift flex flex-col justify-between gap-6 rounded-3xl bg-[#2a2416]/88 p-8">
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
                className="tab-pill shine-btn inline-flex h-12 items-center justify-center rounded-xl border border-[#d4af37] bg-[#1a1a1a]/70 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
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
