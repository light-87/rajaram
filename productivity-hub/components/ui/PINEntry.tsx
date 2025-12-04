"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Button from "./Button";
import { Lock } from "lucide-react";

interface PINEntryProps {
  onSubmit: (pin: string) => Promise<boolean>;
}

export default function PINEntry({ onSubmit }: PINEntryProps) {
  const [pin, setPin] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join("");
    if (pinString.length !== 5) {
      setError("Please enter all 5 digits");
      return;
    }

    setIsLoading(true);
    const success = await onSubmit(pinString);
    setIsLoading(false);

    if (!success) {
      setError("Incorrect PIN");
      setPin(["", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{5}$/.test(pastedData)) {
      setPin(pastedData.split(""));
      setError("");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-full max-w-md p-8">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-accent-secondary/10">
              <Lock className="w-8 h-8 text-accent-secondary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-center text-text-secondary mb-8">
            Enter your 5-digit PIN to continue
          </p>

          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold bg-background border border-border rounded-lg focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 text-text-primary transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || pin.some((d) => !d)}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Verifying..." : "Unlock"}
          </Button>

          <p className="text-xs text-center text-text-secondary mt-6">
            This is your personal productivity hub
          </p>
        </div>
      </div>
    </div>
  );
}
