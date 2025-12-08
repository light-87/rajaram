"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import Button from "./Button";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "pink" | "purple" | "sky" | "green" | "yellow" | "coral";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  color = "purple",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const headerColors = {
    pink: "border-b-pink/40 bg-gradient-to-r from-pink/10 to-transparent",
    purple: "border-b-purple/40 bg-gradient-to-r from-purple/10 to-transparent",
    sky: "border-b-sky/40 bg-gradient-to-r from-sky/10 to-transparent",
    green: "border-b-green/40 bg-gradient-to-r from-green/10 to-transparent",
    yellow: "border-b-yellow/40 bg-gradient-to-r from-yellow/10 to-transparent",
    coral: "border-b-coral/40 bg-gradient-to-r from-coral/10 to-transparent",
  };

  const titleColors = {
    pink: "text-pink",
    purple: "text-purple",
    sky: "text-sky",
    green: "text-green",
    yellow: "text-yellow",
    coral: "text-coral",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-background-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200",
          sizes[size]
        )}
      >
        {/* Colored top accent */}
        <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-2xl", `bg-${color}`)} />

        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-6 border-b-2 rounded-t-2xl",
          headerColors[color]
        )}>
          <h2 className={cn("text-xl font-bold", titleColors[color])}>{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
