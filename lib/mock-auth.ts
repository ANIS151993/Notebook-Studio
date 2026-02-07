// Mock authentication system for demo mode
// This simulates Firebase auth without requiring a Firebase project

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type MockUser = {
  uid: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
};

let currentUser: MockUser | null = null;
const listeners: Array<(user: MockUser | null) => void> = [];

// Simulate localStorage for server-side rendering
const isBrowser = typeof window !== "undefined";

export const mockAuth = {
  currentUser: () => currentUser,

  signInWithEmail: async (email: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const uid = `demo-${Date.now()}`;
        const now = new Date();
        let user: MockUser;

        // Check if user exists in localStorage
        if (isBrowser) {
          const stored = localStorage.getItem(`demo-user-${email}`);
          if (stored) {
            const userData = JSON.parse(stored);
            user = {
              uid: userData.uid,
              email: userData.email,
              createdAt: new Date(userData.createdAt),
              lastLoginAt: now,
            };
          } else {
            user = {
              uid,
              email,
              createdAt: now,
              lastLoginAt: now,
            };
          }

          localStorage.setItem(`demo-user-${email}`, JSON.stringify({
            uid: user.uid,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt.toISOString(),
          }));
          localStorage.setItem("demo-current-user", email);
        } else {
          user = {
            uid,
            email,
            createdAt: now,
            lastLoginAt: now,
          };
        }

        currentUser = user;
        listeners.forEach((listener) => listener(currentUser));
        resolve();
      }, 500);
    });
  },

  signOut: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentUser = null;
        if (isBrowser) {
          localStorage.removeItem("demo-current-user");
        }
        listeners.forEach((listener) => listener(null));
        resolve();
      }, 300);
    });
  },

  onAuthStateChanged: (callback: (user: MockUser | null) => void): (() => void) => {
    listeners.push(callback);

    // Check for existing session
    if (isBrowser) {
      const email = localStorage.getItem("demo-current-user");
      if (email) {
        const stored = localStorage.getItem(`demo-user-${email}`);
        if (stored) {
          const userData = JSON.parse(stored);
          currentUser = {
            ...userData,
            createdAt: new Date(userData.createdAt),
            lastLoginAt: new Date(userData.lastLoginAt),
          };
          setTimeout(() => callback(currentUser), 0);
        }
      } else {
        setTimeout(() => callback(null), 0);
      }
    } else {
      setTimeout(() => callback(null), 0);
    }

    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  getUserProfile: (uid: string): MockUser | null => {
    return currentUser?.uid === uid ? currentUser : null;
  },

  isAdmin: (uid: string): boolean => {
    // In demo mode, make all users admins
    return true;
  },
};
