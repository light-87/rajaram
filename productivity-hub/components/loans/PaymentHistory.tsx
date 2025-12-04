"use client";

import { LoanPayment } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Calendar, DollarSign, TrendingDown } from "lucide-react";

interface PaymentHistoryProps {
  payments: LoanPayment[];
  onRefresh: () => void;
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="card p-8 text-center">
        <DollarSign className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No Payments Yet
        </h3>
        <p className="text-text-secondary">
          Start logging payments to track your progress
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-accent-secondary" />
        Payment History
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Date
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Amount Paid
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Interest
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Principal
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Balance After
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/50 hover:bg-background/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-text-primary">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-right text-text-primary">
                  {formatCurrency(payment.amount_paid)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-red-500">
                  {formatCurrency(payment.interest_accrued)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-accent-success">
                  {formatCurrency(payment.principal_paid)}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-right text-accent-primary">
                  {formatCurrency(payment.balance_after_payment)}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge
                    variant={payment.payment_type === "extra" ? "success" : "default"}
                    size="sm"
                  >
                    {payment.payment_type === "extra" ? "Extra" : "Regular"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-background border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Payments</p>
              <p className="text-lg font-bold text-text-primary">
                {payments.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Avg Payment</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(
                  payments.reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0) /
                    payments.length
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Last Payment</p>
              <p className="text-lg font-bold text-text-primary">
                {new Date(payments[0].payment_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
