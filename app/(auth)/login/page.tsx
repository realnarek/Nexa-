"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.loginWithEmail);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome back");
      router.push("/chat");
    } else {
      toast.error(res.error ?? "Login failed");
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    toast.success("Guest session started");
    router.push("/onboarding");
  };

  return (
    <main className="relative min-h-screen grid place-items-center px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top,hsl(28_100%_50%/0.08),transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-8"
      >
        <Link href="/" className="flex justify-center">
          <Logo size="lg" />
        </Link>

        <div className="surface-elevated p-7 rounded-xl space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl tracking-tight">Sign in to your workspace</h1>
            <p className="text-sm text-muted-foreground">
              Demo accepts any email and password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@nexa.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGuest}
          >
            <KeyRound className="size-3.5" /> Continue as guest
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-foreground hover:text-primary transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
