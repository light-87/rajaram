"use client";

import { useState, useEffect } from "react";
import { calculateEMI, formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Calculator } from "lucide-react";

interface EMICalculatorProps {
  currentBalance: number;
  interestRate: number;
}

export default function EMICalculator({
  currentBalance,
  interestRate,
}: EMICalculatorProps) {
  const [monthlyEMI, setMonthlyEMI] = useState("");
  const [extraPayment, setExtraPayment] = useState("");
  const [results, setResults] = useState<{
    monthsToPayoff: number;
    totalInterest: number;
    payoffDate: string;
    withExtra?: {
      monthsToPayoff: number;
      totalInterest: number;
      interestSaved: number;
      payoffDate: string;
    };
  } | null>(null);

  const calculatePayoff = () => {
    if (!monthlyEMI || parseFloat(monthlyEMI) <= 0) return;

    const emi = parseFloat(monthlyEMI);
    const extra = parseFloat(extraPayment) || 0;
    const totalMonthlyPayment = emi + extra;

    // Calculate without extra payment
    let balance = currentBalance;
    let months = 0;
    let totalInterestPaid = 0;
    const monthlyRate = interestRate / 12 / 100;

    while (balance > 0 && months < 600) {
      // Cap at 50 years
      const interestForMonth = balance * monthlyRate;
      const principalForMonth = Math.min(emi - interestForMonth, balance);

      if (principalForMonth <= 0) {
        // EMI is less than interest - loan will never be paid off
        alert("EMI is too low to cover interest! Increase the EMI amount.");
        return;
      }

      totalInterestPaid += interestForMonth;
      balance -= principalForMonth;
      months++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    let resultsData: typeof results = {
      monthsToPayoff: months,
      totalInterest: totalInterestPaid,
      payoffDate: payoffDate.toLocaleDateString(),
    };

    // Calculate with extra payment if provided
    if (extra > 0) {
      let balanceWithExtra = currentBalance;
      let monthsWithExtra = 0;
      let totalInterestWithExtra = 0;

      while (balanceWithExtra > 0 && monthsWithExtra < 600) {
        const interestForMonth = balanceWithExtra * monthlyRate;
        const principalForMonth = Math.min(
          totalMonthlyPayment - interestForMonth,
          balanceWithExtra
        );

        totalInterestWithExtra += interestForMonth;
        balanceWithExtra -= principalForMonth;
        monthsWithExtra++;
      }

      const payoffDateWithExtra = new Date();
      payoffDateWithExtra.setMonth(payoffDateWithExtra.getMonth() + monthsWithExtra);

      resultsData.withExtra = {
        monthsToPayoff: monthsWithExtra,
        totalInterest: totalInterestWithExtra,
        interestSaved: totalInterestPaid - totalInterestWithExtra,
        payoffDate: payoffDateWithExtra.toLocaleDateString(),
      };
    }

    setResults(resultsData);
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Calculator className="w-6 h-6 text-accent-secondary" />
        EMI Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Monthly EMI Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={monthlyEMI}
            onChange={(e) => setMonthlyEMI(e.target.value)}
            placeholder="50000"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Extra Payment per Month (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            placeholder="10000 (optional)"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
          />
        </div>
      </div>

      <Button onClick={calculatePayoff} variant="secondary" className="mb-6">
        Calculate Payoff
      </Button>

      {results && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background border border-border">
            <h3 className="font-semibold text-text-primary mb-3">
              Standard Payment Plan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Months to Payoff</p>
                <p className="text-xl font-bold text-text-primary">
                  {results.monthsToPayoff}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Interest</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(results.totalInterest)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-text-secondary">Payoff Date</p>
                <p className="text-xl font-bold text-accent-secondary">
                  {results.payoffDate}
                </p>
              </div>
            </div>
          </div>

          {results.withExtra && (
            <div className="p-4 rounded-lg bg-accent-success/10 border border-accent-success/30">
              <h3 className="font-semibold text-accent-success mb-3 flex items-center gap-2">
                With Extra Payments
                <Badge variant="success" size="sm">
                  Saves {formatCurrency(results.withExtra.interestSaved)}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Months to Payoff</p>
                  <p className="text-xl font-bold text-text-primary">
                    {results.withExtra.monthsToPayoff}
                  </p>
                  <p className="text-xs text-accent-success">
                    {results.monthsToPayoff - results.withExtra.monthsToPayoff} months
                    sooner
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Interest</p>
                  <p className="text-xl font-bold text-accent-success">
                    {formatCurrency(results.withExtra.totalInterest)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-text-secondary">Payoff Date</p>
                  <p className="text-xl font-bold text-accent-success">
                    {results.withExtra.payoffDate}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
