"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Keep standalone showToast for non-component usage if needed
let globalShowToast: (message: string, type: ToastType) => void = () => { };
export const showToast = (message: string, type: ToastType = "success") => {
  globalShowToast(message, type);
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    globalShowToast = addToast;
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border 
                            animate-in slide-in-from-right-10 fade-in duration-300
                            ${toast.type === 'success' ? 'bg-green/10 border-green/20 text-green' : ''}
                            ${toast.type === 'error' ? 'bg-red-400/10 border-red-400/20 text-red-500' : ''}
                            ${toast.type === 'warning' ? 'bg-yellow/10 border-yellow/20 text-yellow' : ''}
                            ${toast.type === 'info' ? 'bg-sky/10 border-sky/20 text-sky' : ''}
                        `}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}

            <span className="text-sm font-bold">{toast.message}</span>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-all"
            >
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Export ToastContainer as a default or dummy to avoid breaking ToolLayout imports if any
export default function ToastContainer() {
  return null; // The logic is now inside ToastProvider
}
