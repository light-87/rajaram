"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loan } from "@/types/database";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Banknote } from "lucide-react";

interface LoanSetupFormProps {
  onLoanCreated: (loan: Loan) => void;
}

export default function LoanSetupForm({ onLoanCreated }: LoanSetupFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "Student Loan",
    initial_principal: "",
    current_balance: "",
    interest_rate: "",
    start_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("loans")
        .insert({
          name: formData.name,
          initial_principal: parseFloat(formData.initial_principal),
          current_balance: parseFloat(formData.current_balance || formData.initial_principal),
          interest_rate: parseFloat(formData.interest_rate),
          start_date: formData.start_date,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned from insert");

      showToast("Loan initialized successfully!", "success");
      onLoanCreated(data as Loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      showToast("Failed to initialize loan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-full bg-accent-primary/10">
            <Banknote className="w-10 h-10 text-accent-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-text-primary mb-2">
          Initialize Your Loan
        </h1>
        <p className="text-center text-text-secondary mb-8">
          Set up your loan to start tracking your journey to financial freedom
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Loan Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Initial Principal Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.initial_principal}
              onChange={(e) =>
                setFormData({ ...formData, initial_principal: e.target.value })
              }
              placeholder="4000000"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              Enter the total loan amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Current Balance (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) =>
                setFormData({ ...formData, current_balance: e.target.value })
              }
              placeholder="Leave empty if same as principal"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
            />
            <p className="text-xs text-text-secondary mt-1">
              Optional: If loan is already partially paid
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) =>
                setFormData({ ...formData, interest_rate: e.target.value })
              }
              placeholder="10.0"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Initializing..." : "Initialize Loan"}
          </Button>
        </form>
      </div>
    </div>
  );
}
