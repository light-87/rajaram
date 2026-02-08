"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RecurringPayment, RecurringFrequency, RecurringCategory } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2, RefreshCw, Pause, Play } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const CATEGORIES: RecurringCategory[] = [
  "Subscription",
  "Loan EMI",
  "Insurance",
  "Rent",
  "Utilities",
  "Education",
  "Other",
];

const CATEGORY_COLORS: Record<RecurringCategory, string> = {
  Subscription: "text-purple bg-purple/15",
  "Loan EMI": "text-coral bg-coral/15",
  Insurance: "text-sky bg-sky/15",
  Rent: "text-yellow bg-yellow/15",
  Utilities: "text-green bg-green/15",
  Education: "text-pink bg-pink/15",
  Other: "text-text-secondary bg-background-elevated",
};

export default function RecurringPayments() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as RecurringFrequency,
    category: "Subscription" as RecurringCategory,
    next_due_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_payments")
        .select("*")
        .order("is_active", { ascending: false })
        .order("next_due_date", { ascending: true });

      if (!error && data) {
        setPayments(
          data.map((d: any) => ({
            ...d,
            amount: parseFloat(d.amount),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching recurring payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("recurring_payments").insert({
        name: formData.name,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        category: formData.category,
        next_due_date: formData.next_due_date || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      showToast("Recurring payment added!", "success");
      setFormData({
        name: "",
        amount: "",
        frequency: "monthly",
        category: "Subscription",
        next_due_date: "",
        notes: "",
      });
      setShowForm(false);
      fetchPayments();
    } catch (error) {
      console.error("Error adding recurring payment:", error);
      showToast("Failed to add payment", "error");
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("recurring_payments")
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      showToast(currentActive ? "Payment paused" : "Payment resumed", "success");
      fetchPayments();
    } catch (error) {
      console.error("Error toggling payment:", error);
      showToast("Failed to update", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("recurring_payments").delete().eq("id", id);
      if (error) throw error;
      showToast("Payment deleted", "success");
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      showToast("Failed to delete", "error");
    }
  };

  const getMonthlyEquivalent = (amount: number, frequency: RecurringFrequency): number => {
    switch (frequency) {
      case "weekly": return amount * 4.33;
      case "monthly": return amount;
      case "quarterly": return amount / 3;
      case "yearly": return amount / 12;
    }
  };

  const activePayments = payments.filter((p) => p.is_active);
  const monthlyBurn = activePayments.reduce(
    (sum, p) => sum + getMonthlyEquivalent(p.amount, p.frequency),
    0
  );
  const yearlyBurn = monthlyBurn * 12;

  const getDueBadge = (nextDue?: string) => {
    if (!nextDue) return null;
    const days = differenceInDays(new Date(nextDue), new Date());
    if (days < 0) return <Badge variant="danger">Overdue</Badge>;
    if (days === 0) return <Badge variant="warning">Due Today</Badge>;
    if (days <= 7) return <Badge variant="warning">Due in {days}d</Badge>;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-coral/10 border border-coral/30 rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-1">Monthly Burn</p>
          <p className="text-2xl font-bold text-coral">{formatCurrency(monthlyBurn)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-1">Yearly Burn</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(yearlyBurn)}</p>
        </div>
        <div className="bg-sky/10 border border-sky/30 rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-1">Active Subscriptions</p>
          <p className="text-2xl font-bold text-sky">{activePayments.length}</p>
        </div>
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowForm(!showForm)} variant="primary">
        <Plus className="w-4 h-4 mr-2" />
        Add Recurring Payment
      </Button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Netflix, Spotify, Home Loan EMI..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="499"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RecurringCategory })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Next Due Date</label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Notes (optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any details..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
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

      {/* Payments List */}
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No recurring payments yet</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className={`flex items-center justify-between p-4 rounded-xl border bg-background-card transition-colors ${
                payment.is_active
                  ? "border-border hover:border-purple/30"
                  : "border-border/50 opacity-60"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`font-semibold ${payment.is_active ? "text-text-primary" : "text-text-secondary line-through"}`}>
                    {payment.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[payment.category]}`}>
                    {payment.category}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-background-elevated text-text-secondary font-medium">
                    {FREQUENCIES.find((f) => f.value === payment.frequency)?.label}
                  </span>
                  {getDueBadge(payment.next_due_date)}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg font-bold text-coral">{formatCurrency(payment.amount)}</span>
                  {payment.next_due_date && (
                    <span className="text-sm text-text-secondary">
                      Next: {format(new Date(payment.next_due_date), "dd MMM yyyy")}
                    </span>
                  )}
                  {payment.notes && (
                    <span className="text-sm text-text-secondary">· {payment.notes}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(payment.id, payment.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    payment.is_active
                      ? "text-yellow hover:bg-yellow/10"
                      : "text-green hover:bg-green/10"
                  }`}
                  title={payment.is_active ? "Pause" : "Resume"}
                >
                  {payment.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
