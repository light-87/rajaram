"use client";

import { useState } from "react";
import { Loan } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { calculateSimpleInterest, daysBetween } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  onPaymentAdded: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  loan,
  onPaymentAdded,
}: PaymentModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount_paid: "",
    payment_type: "regular" as "regular" | "extra",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Fetch last payment date
      const { data: lastPayment } = await supabase
        .from("loan_payments")
        .select("payment_date, balance_after_payment")
        .eq("loan_id", loan.id)
        .order("payment_date", { ascending: false })
        .limit(1)
        .single();

      const lastPaymentDate = lastPayment
        ? new Date(lastPayment.payment_date)
        : new Date(loan.start_date);

      const currentPaymentDate = new Date(formData.payment_date);
      const daysSinceLastPayment = daysBetween(lastPaymentDate, currentPaymentDate);

      // Calculate interest accrued since last payment
      const interestAccrued = calculateSimpleInterest(
        loan.current_balance,
        loan.interest_rate,
        daysSinceLastPayment
      );

      const amountPaid = parseFloat(formData.amount_paid);
      const principalPaid = Math.max(0, amountPaid - interestAccrued);
      const newBalance = loan.current_balance + interestAccrued - amountPaid;

      // Insert payment record
      const { error: paymentError } = await supabase.from("loan_payments").insert({
        loan_id: loan.id,
        payment_date: formData.payment_date,
        amount_paid: amountPaid,
        payment_type: formData.payment_type,
        notes: formData.notes,
        balance_after_payment: Math.max(0, newBalance),
        interest_accrued: interestAccrued,
        principal_paid: principalPaid,
      });

      if (paymentError) throw paymentError;

      // Update loan balance
      const { error: loanError } = await supabase
        .from("loans")
        .update({ current_balance: Math.max(0, newBalance) })
        .eq("id", loan.id);

      if (loanError) throw loanError;

      showToast("Payment logged successfully!", "success");
      onPaymentAdded();
    } catch (error) {
      console.error("Error logging payment:", error);
      showToast("Failed to log payment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Payment Date
          </label>
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) =>
              setFormData({ ...formData, payment_date: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Amount Paid (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount_paid}
            onChange={(e) =>
              setFormData({ ...formData, amount_paid: e.target.value })
            }
            placeholder="50000"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Payment Type
          </label>
          <select
            value={formData.payment_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_type: e.target.value as "regular" | "extra",
              })
            }
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
          >
            <option value="regular">Regular EMI</option>
            <option value="extra">Extra Payment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 resize-none"
            placeholder="Add any notes about this payment..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Logging..." : "Log Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
