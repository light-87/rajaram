"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Plus,
    Calendar,
    Wallet,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { BusinessClient, CompanyExpense } from "@/types/database";
import { logActivity } from "@/lib/tools-utils";
import { showToast } from "@/components/ui/Toast";

/**
 * Normalize expense amount to monthly value based on frequency
 */
function getMonthlyAmount(expense: CompanyExpense): number {
    const amount = Number(expense.amount) || 0;
    switch (expense.frequency) {
        case 'monthly':
            return amount;
        case 'quarterly':
            return amount / 3;
        case 'annual':
            return amount / 12;
        case 'one-time':
            return 0; // One-time expenses don't count in monthly calculations
        default:
            return amount;
    }
}

export default function FinancePage() {
    const { isAdmin, employee } = useEmployeeAuth();
    const [clients, setClients] = useState<BusinessClient[]>([]);
    const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newExpense, setNewExpense] = useState({
        name: "",
        amount: "",
        category: "Subscription",
        frequency: "monthly"
    });

    const fetchFinanceData = useCallback(async () => {
        try {
            // Fetch Clients for Revenue & Profitability
            const { data: clientsData, error: clientsError } = await supabase
                .from("business_clients")
                .select("*");

            if (clientsError) {
                console.error("Error fetching clients:", clientsError);
                showToast("Failed to load client data", "error");
            }

            // Fetch Recurring Expenses (only active ones)
            const { data: expensesData, error: expensesError } = await supabase
                .from("company_expenses")
                .select("*")
                .eq("is_active", true);

            if (expensesError) {
                console.error("Error fetching expenses:", expensesError);
                showToast("Failed to load expenses", "error");
            }

            setClients(clientsData || []);
            setExpenses(expensesData || []);
        } catch (error) {
            console.error("Error fetching finance data:", error);
            showToast("Failed to load financial data", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchFinanceData();
        }
    }, [isAdmin, fetchFinanceData]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("company_expenses").insert({
                ...newExpense,
                amount: parseFloat(newExpense.amount)
            });

            if (error) throw error;

            await logActivity(
                "Expense Added",
                `New expense "${newExpense.name}" of ₹${newExpense.amount} added`,
                employee?.username,
                employee?.id
            );

            setNewExpense({ name: "", amount: "", category: "Subscription", frequency: "monthly" });
            setIsModalOpen(false);
            showToast("Expense added successfully!");
            fetchFinanceData();
        } catch (error) {
            console.error("Error adding expense:", error);
            showToast("Failed to add expense.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculations - normalize expenses to monthly values
    const totalMRR = clients.reduce((acc: number, curr: BusinessClient) => acc + (Number(curr.recurring_profit) || 0), 0);
    const totalMonthlyExpenses = expenses.reduce((acc: number, curr: CompanyExpense) => acc + getMonthlyAmount(curr), 0);
    const netProfit = totalMRR - totalMonthlyExpenses;

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-text-secondary">Unauthorized access.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-green/10 border-b border-green/20 px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/tools" className="text-green flex items-center gap-1 text-sm font-medium hover:underline mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Portal
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-text-primary">Company Finance</h1>
                            <p className="text-text-secondary">Monitor revenue, expenses, and net profitability</p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-green text-white rounded-xl font-bold hover:bg-green/90 transition-all shadow-lg self-start"
                        >
                            <Plus className="w-5 h-5" /> Add Expense
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6 border-l-4 border-l-green">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-text-secondary">Monthly Recurring Revenue (MRR)</p>
                            <TrendingUp className="w-4 h-4 text-green" />
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{totalMRR.toLocaleString()}</p>
                        <p className="text-xs text-green mt-2">Active recurring billing</p>
                    </div>

                    <div className="card p-6 border-l-4 border-l-red-400">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-text-secondary">Monthly Expenses</p>
                            <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{totalMonthlyExpenses.toLocaleString()}</p>
                        <p className="text-xs text-red-400 mt-2">Salaries, software & rent</p>
                    </div>

                    <div className="card p-6 border-l-4 border-l-sky bg-sky/5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-text-secondary">Estimated Net Profit</p>
                            <Wallet className="w-4 h-4 text-sky" />
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{netProfit.toLocaleString()}</p>
                        <p className="text-xs text-sky mt-2">
                            {totalMRR > 0 ? `${((netProfit / totalMRR) * 100).toFixed(0)}% margin` : 'No revenue yet'}
                        </p>
                    </div>
                </div>

                {/* Visual Reports Section */}
                <section className="card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">Revenue Distribution</h3>
                            <p className="text-sm text-text-secondary">Kuberbook vs Solar Vendor monthly contribution</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-sky">
                                <div className="w-3 h-3 bg-sky rounded-full" /> Kuberbook
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-yellow">
                                <div className="w-3 h-3 bg-yellow rounded-full" /> Solar
                            </div>
                        </div>
                    </div>

                    <div className="h-48 flex items-end gap-12 px-4 border-b border-border/50 pb-2">
                        {/* Calculate contributions */}
                        {(() => {
                            const kubMRR = clients.filter(c => c.brand === 'Kuberbook').reduce((acc, c) => acc + Number(c.recurring_profit), 0);
                            const solMRR = clients.filter(c => c.brand === 'Solar Vendor').reduce((acc, c) => acc + Number(c.recurring_profit), 0);
                            const total = totalMRR || 1; // avoid div by zero
                            const kubPerc = (kubMRR / total) * 100;
                            const solPerc = (solMRR / total) * 100;

                            return (
                                <>
                                    <div className="flex-1 flex flex-col items-center gap-2 group relative">
                                        <div className="absolute -top-8 px-2 py-1 bg-sky text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            ₹{kubMRR.toLocaleString()}
                                        </div>
                                        <div
                                            className="w-full bg-sky/20 border-t-4 border-sky rounded-t-lg transition-all duration-700 hover:bg-sky/30"
                                            style={{ height: `${Math.max(kubPerc, 5)}%` }}
                                        />
                                        <p className="text-xs font-bold text-text-secondary uppercase">Kuberbook</p>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center gap-2 group relative">
                                        <div className="absolute -top-8 px-2 py-1 bg-yellow text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            ₹{solMRR.toLocaleString()}
                                        </div>
                                        <div
                                            className="w-full bg-yellow/20 border-t-4 border-yellow rounded-t-lg transition-all duration-700 hover:bg-yellow/30"
                                            style={{ height: `${Math.max(solPerc, 5)}%` }}
                                        />
                                        <p className="text-xs font-bold text-text-secondary uppercase">Solar Vendor</p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recurring Expenses */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-pink" /> Recurring Expenses
                        </h3>
                        <div className="card divide-y divide-border/50">
                            {expenses.length > 0 ? expenses.map((exp) => {
                                const monthlyAmt = getMonthlyAmount(exp);
                                return (
                                    <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-border/10 transition-colors">
                                        <div>
                                            <p className="font-bold text-text-primary">{exp.name}</p>
                                            <p className="text-xs text-text-secondary">{exp.category} • {exp.frequency}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-400">₹{Number(exp.amount).toLocaleString()}</p>
                                            {exp.frequency !== 'monthly' && exp.frequency !== 'one-time' && (
                                                <p className="text-[10px] text-text-secondary">≈ ₹{monthlyAmt.toLocaleString()}/mo</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-text-secondary">No expenses recorded.</div>
                            )}
                        </div>
                    </section>

                    {/* Client Profitability */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green" /> Client Economics
                        </h3>
                        <div className="card divide-y divide-border/50">
                            {clients.length > 0 ? clients.map((client) => (
                                <div key={client.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-text-primary">{client.name}</p>
                                        <p className="text-xs text-text-secondary">{client.brand} • Setup Profit: ₹{Number(client.setup_profit).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green">₹{Number(client.recurring_profit).toLocaleString()}</p>
                                        <p className="text-[10px] text-text-secondary">Monthly Recurring</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-text-secondary">No active clients.</div>
                            )}
                        </div>
                        <Link href="#" className="flex items-center justify-center gap-2 text-sm text-sky hover:underline mt-4">
                            View detailed breakdown <ArrowRight className="w-4 h-4" />
                        </Link>
                    </section>
                </div>
            </main>

            {/* Add Expense Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Expense"
                size="md"
            >
                <form onSubmit={handleAddExpense} className="space-y-4 p-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Expense Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Server Rent, Salary"
                            value={newExpense.name}
                            onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Amount (₹)</label>
                            <input
                                required
                                type="number"
                                placeholder="1000"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Frequency</label>
                            <select
                                value={newExpense.frequency}
                                onChange={e => setNewExpense({ ...newExpense, frequency: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annual">Annual</option>
                                <option value="one-time">One-time</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Category</label>
                        <select
                            value={newExpense.category}
                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                        >
                            <option value="Subscription">Subscription/Software</option>
                            <option value="Salary">Salary/Payroll</option>
                            <option value="Rent">Rent/Office</option>
                            <option value="Marketing">Marketing/Ads</option>
                            <option value="Legal">Legal/Professional</option>
                            <option value="Hardware">Hardware/Asset</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold hover:bg-border/30 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green text-white rounded-xl font-bold shadow-lg hover:bg-green/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
