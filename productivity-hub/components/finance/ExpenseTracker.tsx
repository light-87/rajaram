"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PersonalExpense, ExpenseCategory } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Subscription",
  "Loan Payment",
  "Utilities",
  "Misc",
];

const CATEGORY_ICONS: Record<ExpenseCategory, { color: string; bg: string }> = {
  Food: { color: "text-yellow", bg: "bg-yellow/15" },
  Transport: { color: "text-sky", bg: "bg-sky/15" },
  Shopping: { color: "text-pink", bg: "bg-pink/15" },
  Entertainment: { color: "text-purple", bg: "bg-purple/15" },
  Health: { color: "text-green", bg: "bg-green/15" },
  Education: { color: "text-sky", bg: "bg-sky/15" },
  Subscription: { color: "text-purple", bg: "bg-purple/15" },
  "Loan Payment": { color: "text-coral", bg: "bg-coral/15" },
  Utilities: { color: "text-green", bg: "bg-green/15" },
  Misc: { color: "text-text-secondary", bg: "bg-background-elevated" },
};

interface ExpenseTrackerProps {
  refreshKey?: number;
}

export default function ExpenseTracker({ refreshKey }: ExpenseTrackerProps) {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    amount: "",
    category: "Food" as ExpenseCategory,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_expenses")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExpenses(
          data.map((d: any) => ({
            ...d,
            amount: parseFloat(d.amount),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("personal_expenses").insert({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || null,
        date: formData.date,
        source: "manual",
      });

      if (error) throw error;

      showToast("Expense added!", "success");
      setFormData({
        amount: "",
        category: "Food",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      showToast("Failed to add expense", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("personal_expenses").delete().eq("id", id);
      if (error) throw error;
      showToast("Expense deleted", "success");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      showToast("Failed to delete", "error");
    }
  };

  const currentMonth = format(new Date(), "yyyy-MM");
  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown for this month
  const categoryBreakdown = thisMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1]);

  const filteredExpenses = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* This Month Summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">This Month&apos;s Spending</h3>
          <span className="text-2xl font-bold text-coral">{formatCurrency(thisMonthTotal)}</span>
        </div>
        {sortedCategories.length > 0 && (
          <div className="space-y-2">
            {sortedCategories.slice(0, 5).map(([cat, amount]) => {
              const catStyle = CATEGORY_ICONS[cat as ExpenseCategory] || CATEGORY_ICONS.Misc;
              const percentage = thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-28 ${catStyle.color}`}>{cat}</span>
                  <div className="flex-1 h-2 bg-background-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catStyle.bg.replace("/15", "")} opacity-70`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text-primary w-24 text-right">
                    {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button onClick={() => setShowForm(!showForm)} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:border-pink focus:outline-none"
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="250"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Lunch at cafe, Uber ride..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={() => setShowForm(false)} variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No expenses yet</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const catStyle = CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Misc;
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-background-card hover:border-pink/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-coral">{formatCurrency(expense.amount)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${catStyle.color} ${catStyle.bg}`}>
                      {expense.category}
                    </span>
                    {expense.source === "loan_payment" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-coral/15 text-coral font-medium">
                        Auto from Loan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-text-secondary">
                      {format(new Date(expense.date), "dd MMM yyyy")}
                    </span>
                    {expense.description && (
                      <span className="text-sm text-text-secondary">· {expense.description}</span>
                    )}
                  </div>
                </div>
                {expense.source !== "loan_payment" && (
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
