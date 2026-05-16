"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shortId } from "@/lib/utils";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  ready: boolean;
  hydrate: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOut: () => void;
}

const FAKE_LATENCY = 600;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      ready: false,
      hydrate: () => set({ ready: true }),
      loginWithEmail: async (email, password) => {
        if (!email || !password) return { ok: false, error: "Missing credentials" };
        await new Promise((r) => setTimeout(r, FAKE_LATENCY));
        const user: User = {
          id: shortId("usr"),
          email,
          name: email.split("@")[0] ?? "Operator",
          isGuest: false,
          createdAt: Date.now(),
        };
        set({ user });
        return { ok: true };
      },
      signUpWithEmail: async (email, password, name) => {
        if (!email || !password) return { ok: false, error: "Missing credentials" };
        await new Promise((r) => setTimeout(r, FAKE_LATENCY));
        const user: User = {
          id: shortId("usr"),
          email,
          name: name || email.split("@")[0] || "Operator",
          isGuest: false,
          createdAt: Date.now(),
        };
        set({ user });
        return { ok: true };
      },
      continueAsGuest: () => {
        const user: User = {
          id: shortId("guest"),
          email: "guest@nexa.local",
          name: "Guest Operator",
          isGuest: true,
          createdAt: Date.now(),
        };
        set({ user });
      },
      signOut: () => set({ user: null }),
    }),
    {
      name: "nexa-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    },
  ),
);
