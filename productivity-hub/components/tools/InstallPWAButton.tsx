"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Share2, X } from "lucide-react";
import { usePWAInstall } from "@/lib/usePWAInstall";

export default function InstallPWAButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSTip, setShowIOSTip] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  // Close iOS tip on outside click
  useEffect(() => {
    if (!showIOSTip) return;
    const handleClick = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setShowIOSTip(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showIOSTip]);

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  // iOS: show instructions since Safari doesn't support beforeinstallprompt
  if (isIOS) {
    return (
      <div className="relative" ref={tipRef}>
        <button
          onClick={() => setShowIOSTip(!showIOSTip)}
          className="text-sm text-sky hover:text-sky/80 font-medium px-3 py-1.5 rounded-lg bg-sky/10 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSTip && (
          <div className="absolute right-0 top-full mt-2 w-64 card p-4 shadow-lg z-50 bg-background-card border border-border/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-text-primary">Install App</p>
              <button onClick={() => setShowIOSTip(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-text-secondary">
              <p className="flex items-center gap-2">
                <span className="font-medium text-text-primary">1.</span>
                Tap the <Share2 className="w-3.5 h-3.5 text-sky inline" /> Share button
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-text-primary">2.</span>
                Scroll down and tap <span className="font-medium text-text-primary">&quot;Add to Home Screen&quot;</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-text-primary">3.</span>
                Tap <span className="font-medium text-text-primary">&quot;Add&quot;</span>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chromium browsers: direct install prompt
  return (
    <button
      onClick={promptInstall}
      className="text-sm text-sky hover:text-sky/80 font-medium px-3 py-1.5 rounded-lg bg-sky/10 transition-colors flex items-center gap-1.5"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
