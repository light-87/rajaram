"use client";

import { useState } from "react";
import { Wallet, TrendingUp, RefreshCw, ShoppingBag, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import FinanceOverview from "@/components/finance/FinanceOverview";
import IncomeTracker from "@/components/finance/IncomeTracker";
import RecurringPayments from "@/components/finance/RecurringPayments";
import ExpenseTracker from "@/components/finance/ExpenseTracker";

type FinanceTab = "overview" | "income" | "recurring" | "expenses";

const tabs: { id: FinanceTab; label: string; icon: typeof Wallet; color: string; activeClasses: string }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: TrendingUp,
    color: "yellow",
    activeClasses: "bg-yellow/15 text-yellow border-yellow/30",
  },
  {
    id: "income",
    label: "Income",
    icon: ArrowUpRight,
    color: "green",
    activeClasses: "bg-green/15 text-green border-green/30",
  },
  {
    id: "recurring",
    label: "Recurring",
    icon: RefreshCw,
    color: "purple",
    activeClasses: "bg-purple/15 text-purple border-purple/30",
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: ShoppingBag,
    color: "pink",
    activeClasses: "bg-pink/15 text-pink border-pink/30",
  },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-gradient-pink-purple">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Finance Tracker</h1>
          <p className="text-text-secondary text-sm">Track your personal income, expenses & subscriptions</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap",
                isActive
                  ? tab.activeClasses
                  : "border-transparent text-text-secondary hover:bg-background-elevated hover:text-text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <FinanceOverview />}
      {activeTab === "income" && <IncomeTracker />}
      {activeTab === "recurring" && <RecurringPayments />}
      {activeTab === "expenses" && <ExpenseTracker refreshKey={expenseRefreshKey} />}
    </div>
  );
}
