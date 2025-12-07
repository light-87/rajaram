"use client";

import { useState, useEffect } from "react";
import { Loan, LoanPayment } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import { Plus, Calculator, TrendingDown } from "lucide-react";
import PaymentModal from "./PaymentModal";
import PaymentHistory from "./PaymentHistory";
import EMICalculator from "./EMICalculator";

interface LoanViewProps {
  loan: Loan;
  onUpdate: () => void;
}

export default function LoanView({ loan, onUpdate }: LoanViewProps) {
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan.id]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", loan.id)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      // Convert numeric string values to actual numbers
      const normalizedPayments = data.map((payment: any) => ({
        ...payment,
        amount_paid: parseFloat(payment.amount_paid),
        balance_after_payment: parseFloat(payment.balance_after_payment),
        interest_accrued: parseFloat(payment.interest_accrued),
        principal_paid: parseFloat(payment.principal_paid),
      }));
      setPayments(normalizedPayments);
    }
  };

  const freedomPercentage =
    ((loan.initial_principal - loan.current_balance) / loan.initial_principal) * 100;

  const totalInterestPaid = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.interest_accrued.toString()),
    0
  );

  const totalPrincipalPaid = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.principal_paid.toString()),
    0
  );

  const monthlyInterestAccrual =
    (loan.current_balance * (loan.interest_rate / 100)) / 12;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {loan.name}
            </h1>
            <p className="text-text-secondary">
              Started: {new Date(loan.start_date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Interest Rate</p>
            <p className="text-2xl font-bold text-accent-primary">
              {loan.interest_rate}% p.a.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-secondary mb-1">Principal</p>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(loan.initial_principal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-accent-primary">
              {formatCurrency(loan.current_balance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-1">
              Monthly Interest Accrual
            </p>
            <p className="text-2xl font-bold text-red-500">
              ~{formatCurrency(monthlyInterestAccrual)}
            </p>
          </div>
        </div>
      </div>

      {/* Freedom Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-accent-success" />
          Freedom Progress
        </h2>

        <ProgressBar
          percentage={freedomPercentage}
          showLabel
          color="gradient"
          size="lg"
          className="mb-6"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-accent-success/10 border border-accent-success/20">
            <p className="text-sm text-text-secondary mb-1">
              Total Principal Paid
            </p>
            <p className="text-2xl font-bold text-accent-success">
              {formatCurrency(totalPrincipalPaid)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/20">
            <p className="text-sm text-text-secondary mb-1">
              Total Interest Paid
            </p>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(totalInterestPaid)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => setIsPaymentModalOpen(true)} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Log Payment
        </Button>
        <Button
          onClick={() => setShowCalculator(!showCalculator)}
          variant="secondary"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {showCalculator ? "Hide" : "Show"} Calculator
        </Button>
      </div>

      {/* EMI Calculator */}
      {showCalculator && (
        <EMICalculator
          currentBalance={loan.current_balance}
          interestRate={loan.interest_rate}
        />
      )}

      {/* Payment History */}
      <PaymentHistory payments={payments} onRefresh={fetchPayments} />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loan={loan}
        onPaymentAdded={() => {
          onUpdate();
          fetchPayments();
          setIsPaymentModalOpen(false);
        }}
      />
    </div>
  );
}
