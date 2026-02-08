"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, subMonths } from "date-fns";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  recurring: number;
}

export default function FinanceOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [thisMonthIncome, setThisMonthIncome] = useState(0);
  const [thisMonthExpenses, setThisMonthExpenses] = useState(0);
  const [thisMonthRecurring, setThisMonthRecurring] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [lastMonthExpenses, setLastMonthExpenses] = useState(0);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyData[]>([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState<any[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const now = new Date();
      const currentMonth = format(now, "yyyy-MM");
      const lastMonth = format(subMonths(now, 1), "yyyy-MM");

      // Fetch all data in parallel
      const [incomeRes, expensesRes, recurringRes] = await Promise.all([
        supabase.from("personal_income").select("*").order("date", { ascending: false }),
        supabase.from("personal_expenses").select("*").order("date", { ascending: false }),
        supabase
          .from("recurring_payments")
          .select("*")
          .eq("is_active", true)
          .order("next_due_date", { ascending: true }),
      ]);

      const allIncome = (incomeRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));
      const allExpenses = (expensesRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));
      const recurring = (recurringRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));

      // This month totals
      const thisIncome = allIncome
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const thisExpenses = allExpenses
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      // Calculate monthly recurring total
      const monthlyRecurring = recurring.reduce((sum: number, r: any) => {
        switch (r.frequency) {
          case "weekly": return sum + r.amount * 4.33;
          case "monthly": return sum + r.amount;
          case "quarterly": return sum + r.amount / 3;
          case "yearly": return sum + r.amount / 12;
          default: return sum;
        }
      }, 0);

      // Last month totals
      const prevIncome = allIncome
        .filter((e: any) => e.date.startsWith(lastMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const prevExpenses = allExpenses
        .filter((e: any) => e.date.startsWith(lastMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      // Build 6-month history
      const history: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        const monthLabel = format(monthDate, "MMM");

        const monthIncome = allIncome
          .filter((e: any) => e.date.startsWith(monthKey))
          .reduce((sum: number, e: any) => sum + e.amount, 0);

        const monthExp = allExpenses
          .filter((e: any) => e.date.startsWith(monthKey))
          .reduce((sum: number, e: any) => sum + e.amount, 0);

        history.push({
          month: monthLabel,
          income: monthIncome,
          expenses: monthExp,
          recurring: monthlyRecurring,
        });
      }

      // Upcoming recurring (next 30 days)
      const upcoming = recurring.filter((r: any) => {
        if (!r.next_due_date) return false;
        const dueDate = new Date(r.next_due_date);
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        return dueDate <= thirtyDaysLater;
      });

      setThisMonthIncome(thisIncome);
      setThisMonthExpenses(thisExpenses);
      setThisMonthRecurring(monthlyRecurring);
      setLastMonthIncome(prevIncome);
      setLastMonthExpenses(prevExpenses);
      setMonthlyHistory(history);
      setUpcomingRecurring(upcoming);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const netThisMonth = thisMonthIncome - thisMonthExpenses - thisMonthRecurring;
  const netLastMonth = lastMonthIncome - lastMonthExpenses - thisMonthRecurring;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow" />
      </div>
    );
  }

  // Find the max value for chart scaling
  const maxChartValue = Math.max(
    ...monthlyHistory.map((m) => Math.max(m.income, m.expenses + m.recurring)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green/10 border border-green/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-green" />
            <p className="text-sm text-text-secondary">Income (This Month)</p>
          </div>
          <p className="text-2xl font-bold text-green">{formatCurrency(thisMonthIncome)}</p>
          {lastMonthIncome > 0 && (
            <p className="text-xs text-text-secondary mt-1">
              Last month: {formatCurrency(lastMonthIncome)}
            </p>
          )}
        </div>

        <div className="bg-coral/10 border border-coral/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-coral" />
            <p className="text-sm text-text-secondary">Expenses (This Month)</p>
          </div>
          <p className="text-2xl font-bold text-coral">{formatCurrency(thisMonthExpenses)}</p>
          {lastMonthExpenses > 0 && (
            <p className="text-xs text-text-secondary mt-1">
              Last month: {formatCurrency(lastMonthExpenses)}
            </p>
          )}
        </div>

        <div className="bg-purple/10 border border-purple/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-purple" />
            <p className="text-sm text-text-secondary">Monthly Recurring</p>
          </div>
          <p className="text-2xl font-bold text-purple">{formatCurrency(thisMonthRecurring)}</p>
          <p className="text-xs text-text-secondary mt-1">
            {formatCurrency(thisMonthRecurring * 12)}/yr
          </p>
        </div>

        <div className={`${netThisMonth >= 0 ? "bg-green/10 border-green/30" : "bg-red-500/10 border-red-500/30"} border rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-text-secondary" />
            <p className="text-sm text-text-secondary">Net This Month</p>
          </div>
          <p className={`text-2xl font-bold ${netThisMonth >= 0 ? "text-green" : "text-red-400"}`}>
            {netThisMonth >= 0 ? "+" : ""}{formatCurrency(netThisMonth)}
          </p>
          {netLastMonth !== 0 && (
            <p className="text-xs text-text-secondary mt-1">
              Last month: {netLastMonth >= 0 ? "+" : ""}{formatCurrency(netLastMonth)}
            </p>
          )}
        </div>
      </div>

      {/* 6-Month Cash Flow Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky" />
          6-Month Cash Flow
        </h3>
        <div className="space-y-4">
          {monthlyHistory.map((month) => (
            <div key={month.month} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary w-12">{month.month}</span>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="text-green">+{formatCurrency(month.income)}</span>
                  <span className="text-coral">-{formatCurrency(month.expenses + month.recurring)}</span>
                </div>
              </div>
              <div className="flex gap-1 h-3">
                {month.income > 0 && (
                  <div
                    className="bg-green/60 rounded-full"
                    style={{ width: `${(month.income / maxChartValue) * 100}%` }}
                  />
                )}
                {(month.expenses + month.recurring) > 0 && (
                  <div
                    className="bg-coral/60 rounded-full"
                    style={{ width: `${((month.expenses + month.recurring) / maxChartValue) * 100}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green/60" />
            <span className="text-xs text-text-secondary">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-coral/60" />
            <span className="text-xs text-text-secondary">Expenses + Recurring</span>
          </div>
        </div>
      </div>

      {/* Upcoming Recurring Payments */}
      {upcomingRecurring.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple" />
            Upcoming Payments (30 days)
          </h3>
          <div className="space-y-3">
            {upcomingRecurring.map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background-card"
              >
                <div>
                  <p className="font-medium text-text-primary">{payment.name}</p>
                  <p className="text-sm text-text-secondary">
                    {payment.next_due_date && format(new Date(payment.next_due_date), "dd MMM yyyy")}
                    {" · "}{payment.category}
                  </p>
                </div>
                <span className="font-bold text-coral">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Burn Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-coral" />
          Burn Rate Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background-elevated rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary mb-1">Daily Avg Spend</p>
            <p className="text-xl font-bold text-text-primary">
              {formatCurrency((thisMonthExpenses + thisMonthRecurring) / new Date().getDate())}
            </p>
          </div>
          <div className="bg-background-elevated rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary mb-1">Monthly Total Outflow</p>
            <p className="text-xl font-bold text-coral">
              {formatCurrency(thisMonthExpenses + thisMonthRecurring)}
            </p>
          </div>
          <div className="bg-background-elevated rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary mb-1">Savings Rate</p>
            <p className={`text-xl font-bold ${netThisMonth >= 0 ? "text-green" : "text-red-400"}`}>
              {thisMonthIncome > 0
                ? `${((netThisMonth / thisMonthIncome) * 100).toFixed(0)}%`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
