"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import CsvNotebookBuilder from "@/components/CsvNotebookBuilder";
import { auth, db, firebaseConfigError } from "@/lib/firebase";
import { replaceWithTransition } from "@/lib/view-transition";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
        const adminRef = doc(firestoreDb, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
      } catch (err) {
        console.error(err);
        setError("Unable to verify admin access.");
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
      <div className="glass-card reveal-up mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl p-8">
        {loading && (
          <div className="glass-card panel-enter rounded-2xl bg-[#2a2416]/88 p-4 text-sm text-[#c9a961]">
            Checking admin access...
          </div>
        )}

        {error && (
          <div className="glass-card panel-enter rounded-2xl bg-[#2a2416]/88 p-4 text-sm text-[#ffd700]">
            {error}
          </div>
        )}

        {!loading && !error && !isAdmin && (
          <div className="flex flex-col gap-4 panel-enter">
            <div className="glass-card rounded-2xl bg-[#2a2416]/88 p-6 text-sm text-[#c9a961]">
              You do not have admin access. Contact your workspace owner to be
              added.
            </div>
            <button
              type="button"
              className="tab-pill shine-btn inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37] bg-[#1a1a1a]/70 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        )}

        {!loading && !error && isAdmin && <CsvNotebookBuilder />}
      </div>
    </div>
  );
}
