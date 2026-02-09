"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PersonalIncome, IncomeSource } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2, Wallet } from "lucide-react";
import { format } from "date-fns";

const INCOME_SOURCES: IncomeSource[] = ["Salary", "Dividend", "Freelance", "Other"];

export default function IncomeTracker() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<PersonalIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    source: "Salary" as IncomeSource,
    notes: "",
  });

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_income")
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        setEntries(
          data.map((d: any) => ({
            ...d,
            amount: parseFloat(d.amount),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching income:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("personal_income").insert({
        amount: parseFloat(formData.amount),
        date: formData.date,
        source: formData.source,
        notes: formData.notes || null,
      });

      if (error) throw error;

      showToast("Income logged!", "success");
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        source: "Salary",
        notes: "",
      });
      setShowForm(false);
      fetchIncome();
    } catch (error) {
      console.error("Error adding income:", error);
      showToast("Failed to log income", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("personal_income").delete().eq("id", id);
      if (error) throw error;
      showToast("Entry deleted", "success");
      fetchIncome();
    } catch (error) {
      console.error("Error deleting income:", error);
      showToast("Failed to delete", "error");
    }
  };

  const thisMonthTotal = entries
    .filter((e) => e.date.startsWith(format(new Date(), "yyyy-MM")))
    .reduce((sum, e) => sum + e.amount, 0);

  const thisYearTotal = entries
    .filter((e) => e.date.startsWith(format(new Date(), "yyyy")))
    .reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green/10 border border-green/30 rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-1">This Month</p>
          <p className="text-2xl font-bold text-green">{formatCurrency(thisMonthTotal)}</p>
        </div>
        <div className="bg-sky/10 border border-sky/30 rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-1">This Year</p>
          <p className="text-2xl font-bold text-sky">{formatCurrency(thisYearTotal)}</p>
        </div>
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowForm(!showForm)} variant="primary">
        <Plus className="w-4 h-4 mr-2" />
        Log Income
      </Button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100000"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as IncomeSource })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
            >
              {INCOME_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Notes (optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Monthly salary draw..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
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

      {/* Entries List */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No income logged yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-background-card hover:border-green/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green">{formatCurrency(entry.amount)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green/15 text-green font-medium">
                    {entry.source}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-text-secondary">
                    {format(new Date(entry.date), "dd MMM yyyy")}
                  </span>
                  {entry.notes && (
                    <span className="text-sm text-text-secondary">· {entry.notes}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-2 text-text-secondary hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
