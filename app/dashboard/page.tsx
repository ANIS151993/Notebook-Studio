"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "@/lib/firebase";
import { replaceWithTransition } from "@/lib/view-transition";
import AnimatedLink from "@/components/AnimatedLink";

type Profile = {
  uid: string;
  email: string;
  fullName?: string;
  organization?: string;
  contactNumber?: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
};

type LocalProfile = {
  fullName: string;
  organization: string;
  contactNumber: string;
  updatedAtIso: string;
};

const getErrorCode = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const rawCode = (error as { code: unknown }).code;
  return typeof rawCode === "string" ? rawCode : null;
};

const formatTimestamp = (value?: Timestamp) => {
  if (!value) {
    return "Not available";
  }
  return value.toDate().toLocaleString();
};

const localProfileStoragePrefix = "notebook_studio_local_profile_v1_";

const getLocalProfileStorageKey = (uid: string) =>
  `${localProfileStoragePrefix}${uid}`;

const readLocalProfile = (uid: string): LocalProfile | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getLocalProfileStorageKey(uid));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    if (
      typeof parsed.fullName !== "string" ||
      typeof parsed.organization !== "string" ||
      typeof parsed.contactNumber !== "string" ||
      typeof parsed.updatedAtIso !== "string"
    ) {
      return null;
    }

    return {
      fullName: parsed.fullName,
      organization: parsed.organization,
      contactNumber: parsed.contactNumber,
      updatedAtIso: parsed.updatedAtIso,
    };
  } catch (error) {
    console.error("Failed to read local profile:", error);
    return null;
  }
};

const writeLocalProfile = (uid: string, profile: Omit<LocalProfile, "updatedAtIso">) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: LocalProfile = {
    ...profile,
    updatedAtIso: new Date().toISOString(),
  };
  window.localStorage.setItem(getLocalProfileStorageKey(uid), JSON.stringify(payload));
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;
    const firestoreDb = db;
    if (!firebaseAuth) {
      setError(firebaseConfigError ?? "Firebase Auth is not configured.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        replaceWithTransition(router, "/");
        return;
      }

      const localProfile = readLocalProfile(user.uid);

      if (!firestoreDb) {
        const fallbackProfile: Profile = {
          uid: user.uid,
          email: user.email ?? "Unknown",
          fullName: localProfile?.fullName ?? "",
          organization: localProfile?.organization ?? "",
          contactNumber: localProfile?.contactNumber ?? "",
        };
        setProfile(fallbackProfile);
        setFullName(fallbackProfile.fullName ?? "");
        setOrganization(fallbackProfile.organization ?? "");
        setContactNumber(fallbackProfile.contactNumber ?? "");
        setError("Cloud profile database unavailable. Using local profile data.");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(firestoreDb, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as Profile;
          const loadedProfile: Profile = {
            uid: data.uid ?? user.uid,
            email: data.email ?? user.email ?? "Unknown",
            fullName: data.fullName ?? localProfile?.fullName ?? "",
            organization: data.organization ?? localProfile?.organization ?? "",
            contactNumber: data.contactNumber ?? localProfile?.contactNumber ?? "",
            createdAt: data.createdAt,
            lastLoginAt: data.lastLoginAt,
          };

          setProfile(loadedProfile);
          setFullName(loadedProfile.fullName ?? "");
          setOrganization(loadedProfile.organization ?? "");
          setContactNumber(loadedProfile.contactNumber ?? "");
        } else {
          const fallbackProfile: Profile = {
            uid: user.uid,
            email: user.email ?? "Unknown",
            fullName: localProfile?.fullName ?? "",
            organization: localProfile?.organization ?? "",
            contactNumber: localProfile?.contactNumber ?? "",
          };
          setProfile(fallbackProfile);
          setFullName(fallbackProfile.fullName ?? "");
          setOrganization(fallbackProfile.organization ?? "");
          setContactNumber(fallbackProfile.contactNumber ?? "");
        }
      } catch (loadError) {
        console.error(loadError);
        const fallbackProfile: Profile = {
          uid: user.uid,
          email: user.email ?? "Unknown",
          fullName: localProfile?.fullName ?? "",
          organization: localProfile?.organization ?? "",
          contactNumber: localProfile?.contactNumber ?? "",
        };
        setProfile(fallbackProfile);
        setFullName(fallbackProfile.fullName ?? "");
        setOrganization(fallbackProfile.organization ?? "");
        setContactNumber(fallbackProfile.contactNumber ?? "");
        setError(
          "Signed in successfully, but cloud profile sync is temporarily unavailable."
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

  const handleSaveProfile = async () => {
    if (!auth || !profile || !auth.currentUser) {
      setSaveMessage("Cannot save profile right now.");
      return;
    }

    const nextFullName = fullName.trim();
    const nextOrganization = organization.trim();
    const nextContactNumber = contactNumber.trim();

    setSavingProfile(true);
    setSaveMessage(null);

    try {
      writeLocalProfile(auth.currentUser.uid, {
        fullName: nextFullName,
        organization: nextOrganization,
        contactNumber: nextContactNumber,
      });
    } catch (localSaveError) {
      console.error("Local profile save failed:", localSaveError);
    }

    if (!db) {
      setProfile((current) =>
        current
          ? {
              ...current,
              fullName: nextFullName,
              organization: nextOrganization,
              contactNumber: nextContactNumber,
            }
          : current,
      );
      setSaveMessage("Cloud save unavailable. Profile saved locally in this browser.");
      setSavingProfile(false);
      return;
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email ?? profile.email,
          fullName: nextFullName,
          organization: nextOrganization,
          contactNumber: nextContactNumber,
          ...(profile.createdAt ? {} : { createdAt: serverTimestamp() }),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );

      setProfile((current) =>
        current
          ? {
              ...current,
              fullName: nextFullName,
              organization: nextOrganization,
              contactNumber: nextContactNumber,
            }
          : current,
      );
      setSaveMessage("Profile saved successfully.");
    } catch (saveError) {
      console.error(saveError);
      const errorCode = getErrorCode(saveError);
      setSaveMessage(
        errorCode
          ? `Cloud save unavailable (${errorCode}). Profile saved locally in this browser.`
          : "Cloud save unavailable. Profile saved locally in this browser.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="glass-card reveal-up rounded-3xl p-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a961]">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f4d03f] md:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#c9a961]">
            Manage your profile and continue your work.
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
          <section className="grid gap-6 panel-enter lg:grid-cols-[1.2fr_0.8fr]">
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

              <div className="mt-8 rounded-2xl border border-[#d4af37]/50 bg-[#171717]/80 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f4d03f]">
                  Profile details
                </h3>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-[#c9a961]">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your full name"
                      className="h-11 rounded-xl border border-[#d4af37]/60 bg-[#0f0f0f] px-3 text-[#f4d03f] outline-none focus:border-[#ffd700]"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-[#c9a961]">
                    <span>Organization</span>
                    <input
                      type="text"
                      value={organization}
                      onChange={(event) => setOrganization(event.target.value)}
                      placeholder="Your organization"
                      className="h-11 rounded-xl border border-[#d4af37]/60 bg-[#0f0f0f] px-3 text-[#f4d03f] outline-none focus:border-[#ffd700]"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-[#c9a961]">
                    <span>Contact number</span>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(event) => setContactNumber(event.target.value)}
                      placeholder="Phone number"
                      className="h-11 rounded-xl border border-[#d4af37]/60 bg-[#0f0f0f] px-3 text-[#f4d03f] outline-none focus:border-[#ffd700]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="shine-btn inline-flex h-11 items-center justify-center rounded-xl bg-[#d4af37] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:bg-[#6b5d45] disabled:text-[#3a3420]"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  {saveMessage && (
                    <p className="text-xs text-[#ffd700]">{saveMessage}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card hover-lift flex flex-col justify-between gap-6 rounded-3xl bg-[#2a2416]/88 p-8">
              <div>
                <h2 className="text-lg font-semibold text-[#f4d03f]">
                  Quick actions
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#c9a961]">
                  Open your workspace and continue your saved work.
                </p>
                <div className="mt-5 grid gap-3">
                  <AnimatedLink
                    href="/"
                    className="tab-pill inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37] bg-[#15120c] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d03f] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
                  >
                    Open Notebook Studio
                  </AnimatedLink>
                  <AnimatedLink
                    href="/live"
                    className="tab-pill inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37]/70 bg-[#16120d] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a961] hover:text-[#f4d03f]"
                  >
                    Open Live Guide
                  </AnimatedLink>
                  <AnimatedLink
                    href="/admin"
                    className="tab-pill inline-flex h-11 items-center justify-center rounded-xl border border-[#d4af37]/70 bg-[#16120d] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a961] hover:text-[#f4d03f]"
                  >
                    Open Admin (If Authorized)
                  </AnimatedLink>
                </div>
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
