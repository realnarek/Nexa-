"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "./logo";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated && ready && !user) {
      router.replace("/login");
    }
  }, [hydrated, ready, user, router]);

  if (!hydrated || !ready || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <Logo size="lg" />
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Booting workspace…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
