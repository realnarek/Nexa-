"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Plus, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "nexa_install_dismissed_at";
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (!ts) return false;
    const daysSince = (Date.now() - parseInt(ts)) / 86_400_000;
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function recordDismissal(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  if (!/iPad|iPhone|iPod/.test(ua)) return false;
  // Exclude in-app browsers on iOS
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;
  return /Safari/.test(ua);
}

// ─── Android Banner ──────────────────────────────────────────────────────────

interface AndroidBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

function AndroidBanner({ onInstall, onDismiss }: AndroidBannerProps) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto max-w-sm rounded-2xl border border-white/[0.08] bg-[hsl(0_0%_9%)] shadow-2xl shadow-black/60"
        style={{
          backgroundImage:
            "linear-gradient(180deg, hsl(0 0% 100% / 0.025) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-3 p-3.5">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(0_0%_6%)] ring-1 ring-white/[0.06]">
            <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 2.5L21 12L12 21.5L3 12L12 2.5Z"
                stroke="hsl(28 100% 64%)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M12 7L17 12L12 17L7 12L12 7Z"
                fill="hsl(28 100% 64%)"
                fillOpacity="0.85"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-[hsl(40_12%_96%)]">
              Install Nexa
            </p>
            <p className="mt-0.5 text-xs leading-tight text-[hsl(40_4%_55%)]">
              Add to home screen for the full app experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onInstall}
              className="rounded-lg bg-[hsl(28_100%_64%)] px-3.5 py-1.5 text-xs font-semibold text-[hsl(0_0%_6%)] transition-all duration-150 hover:bg-[hsl(28_100%_70%)] active:scale-95"
            >
              Install
            </button>
            <button
              onClick={onDismiss}
              aria-label="Dismiss install banner"
              className="rounded-md p-1 text-[hsl(40_4%_50%)] transition-colors hover:text-[hsl(40_12%_96%)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── iOS Bottom Sheet ─────────────────────────────────────────────────────────

interface IOSSheetProps {
  onDismiss: () => void;
}

function IOSSheet({ onDismiss }: IOSSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="ios-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden
      />

      {/* Sheet */}
      <motion.div
        key="ios-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/[0.08] bg-[hsl(0_0%_8%)] pb-safe"
        style={{
          backgroundImage:
            "linear-gradient(180deg, hsl(0 0% 100% / 0.03) 0%, transparent 60px)",
        }}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[hsl(0_0%_20%)]" />

        <div className="px-6 pb-8 pt-5">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(0_0%_6%)] ring-1 ring-white/[0.06]">
              <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M12 2.5L21 12L12 21.5L3 12L12 2.5Z"
                  stroke="hsl(28 100% 64%)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M12 7L17 12L12 17L7 12L12 7Z"
                  fill="hsl(28 100% 64%)"
                  fillOpacity="0.85"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[hsl(40_12%_96%)]">
                Install Nexa on your iPhone
              </h2>
              <p className="mt-0.5 text-sm text-[hsl(40_4%_55%)]">
                Add to Home Screen for the full app experience
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-6 space-y-2.5">
            <IOSStep
              number={1}
              icon={<Upload size={15} />}
              text={
                <>
                  Tap the{" "}
                  <span className="font-medium text-[hsl(40_12%_96%)]">
                    Share
                  </span>{" "}
                  button in Safari
                </>
              }
            />
            <IOSStep
              number={2}
              icon={<Plus size={15} />}
              text={
                <>
                  Tap{" "}
                  <span className="font-medium text-[hsl(40_12%_96%)]">
                    &ldquo;Add to Home Screen&rdquo;
                  </span>
                </>
              }
            />
            <IOSStep
              number={3}
              icon={<Check size={15} />}
              text={
                <>
                  Tap{" "}
                  <span className="font-medium text-[hsl(40_12%_96%)]">
                    &ldquo;Add&rdquo;
                  </span>{" "}
                  to confirm
                </>
              }
            />
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full rounded-xl border border-white/[0.08] py-3 text-sm text-[hsl(40_4%_55%)] transition-colors hover:border-white/[0.14] hover:text-[hsl(40_12%_80%)] active:opacity-70"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </>
  );
}

interface IOSStepProps {
  number: number;
  icon: React.ReactNode;
  text: React.ReactNode;
}

function IOSStep({ number, icon, text }: IOSStepProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[hsl(0_0%_11%)] px-3.5 py-3">
      {/* Step number */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(28_100%_64%/0.15)] ring-1 ring-[hsl(28_100%_64%/0.3)]">
        <span className="text-[11px] font-bold leading-none text-[hsl(28_100%_64%)]">
          {number}
        </span>
      </div>

      {/* Platform icon */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(0_0%_16%)] text-[hsl(40_4%_60%)]">
        {icon}
      </div>

      {/* Instruction */}
      <p className="text-sm text-[hsl(40_4%_65%)]">{text}</p>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Never show if already installed or dismissed recently
    if (isStandalone() || wasDismissedRecently()) return;

    // iOS Safari: show instructions sheet after a short delay
    if (isIOSSafari()) {
      const id = setTimeout(() => setShowIOS(true), 4000);
      return () => clearTimeout(id);
    }

    // Android / desktop Chrome: listen for the install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowAndroid(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setShowAndroid(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") recordDismissal();
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowAndroid(false);
    setShowIOS(false);
    recordDismissal();
  }, []);

  return (
    <AnimatePresence>
      {showAndroid && (
        <AndroidBanner
          key="android"
          onInstall={handleInstall}
          onDismiss={handleDismiss}
        />
      )}
      {showIOS && (
        <IOSSheet key="ios" onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}
