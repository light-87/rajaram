"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loan } from "@/types/database";
import Loading from "@/components/ui/Loading";
import LoanSetupForm from "@/components/loans/LoanSetupForm";
import LoanView from "@/components/loans/LoanView";

export default function LoansPage() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoan();
  }, []);

  const fetchLoan = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLoan(data as Loan);
      }
    } catch (error) {
      console.error("Error fetching loan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanCreated = (newLoan: Loan) => {
    setLoan(newLoan);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading loan data..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loan ? (
        <LoanView loan={loan} onUpdate={fetchLoan} />
      ) : (
        <LoanSetupForm onLoanCreated={handleLoanCreated} />
      )}
    </div>
  );
}
