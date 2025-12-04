"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-accent-success/20 border-accent-success text-accent-success",
    error: "bg-red-600/20 border-red-600 text-red-500",
    info: "bg-accent-secondary/20 border-accent-secondary text-accent-secondary",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm animate-in slide-in-from-top-5",
                colors[toast.type]
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
