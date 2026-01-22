"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import { supabase } from "@/lib/supabase";
import { Payment, BusinessClient, PaymentType, PaymentMethod, PaymentStatus } from "@/types/database";
import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { showToast } from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { logActivity } from "@/lib/tools-utils";
import {
    DollarSign,
    Plus,
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Building,
    Calendar,
    RefreshCw,
    Search,
    IndianRupee
} from "lucide-react";
import Link from "next/link";

export default function PaymentsPage() {
    const { employee, isAdmin } = useEmployeeAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [clients, setClients] = useState<BusinessClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [newPayment, setNewPayment] = useState({
        client_id: "",
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: "recurring" as PaymentType,
        payment_method: "upi" as PaymentMethod,
        reference_number: "",
        notes: ""
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                { data: paymentsData, error: paymentsError },
                { data: clientsData }
            ] = await Promise.all([
                supabase.from("payments").select("*").order("payment_date", { ascending: false }),
                supabase.from("business_clients").select("*").order("name")
            ]);

            if (paymentsError) throw paymentsError;

            // Enrich payments with client names
            const enriched = (paymentsData || []).map(p => ({
                ...p,
                client_name: clientsData?.find(c => c.id === p.client_id)?.name
            }));

            setPayments(enriched);
            setClients(clientsData || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
            showToast("Failed to load payments", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPayment.client_id || !newPayment.amount) {
            showToast("Please fill all required fields", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("payments").insert({
                client_id: newPayment.client_id,
                amount: parseFloat(newPayment.amount),
                payment_date: newPayment.payment_date,
                payment_type: newPayment.payment_type,
                payment_method: newPayment.payment_method,
                reference_number: newPayment.reference_number || null,
                notes: newPayment.notes || null,
                status: "completed",
                recorded_by: employee?.id
            });

            if (error) throw error;

            const clientName = clients.find(c => c.id === newPayment.client_id)?.name;
            await logActivity(
                "Payment Recorded",
                `Recorded ₹${newPayment.amount} ${newPayment.payment_type} payment from ${clientName}`,
                employee?.username,
                employee?.id
            );

            showToast("Payment recorded successfully!");
            setIsModalOpen(false);
            setNewPayment({
                client_id: "",
                amount: "",
                payment_date: new Date().toISOString().split('T')[0],
                payment_type: "recurring",
                payment_method: "upi",
                reference_number: "",
                notes: ""
            });
            fetchData();
        } catch (error) {
            console.error("Error recording payment:", error);
            showToast("Failed to record payment", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate stats
    const thisMonth = new Date();
    const thisMonthStart = startOfMonth(thisMonth);
    const thisMonthEnd = endOfMonth(thisMonth);
    const lastMonthStart = startOfMonth(subMonths(thisMonth, 1));
    const lastMonthEnd = endOfMonth(subMonths(thisMonth, 1));

    const thisMonthPayments = payments.filter(p =>
        p.status === "completed" &&
        new Date(p.payment_date) >= thisMonthStart &&
        new Date(p.payment_date) <= thisMonthEnd
    );
    const lastMonthPayments = payments.filter(p =>
        p.status === "completed" &&
        new Date(p.payment_date) >= lastMonthStart &&
        new Date(p.payment_date) <= lastMonthEnd
    );

    const thisMonthTotal = thisMonthPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const lastMonthTotal = lastMonthPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalCollected = payments.filter(p => p.status === "completed").reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const filteredPayments = payments.filter(p =>
        p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeBadge = (type: PaymentType) => {
        switch (type) {
            case "setup": return <Badge variant="purple">Setup</Badge>;
            case "recurring": return <Badge variant="sky">Recurring</Badge>;
            case "one-time": return <Badge variant="warning">One-time</Badge>;
            case "refund": return <Badge variant="danger">Refund</Badge>;
            default: return <Badge>{type}</Badge>;
        }
    };

    const getMethodLabel = (method?: PaymentMethod) => {
        switch (method) {
            case "cash": return "💵 Cash";
            case "upi": return "📱 UPI";
            case "bank_transfer": return "🏦 Bank Transfer";
            case "cheque": return "📝 Cheque";
            case "card": return "💳 Card";
            default: return method || "Unknown";
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="border-b border-border/50 bg-background-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="p-2 hover:bg-border/20 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-text-secondary" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green/10">
                                <IndianRupee className="w-5 h-5 text-green" />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary">Payment Tracking</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchData}
                            className="p-2 hover:bg-border/20 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-text-secondary" />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl font-medium text-sm hover:bg-green/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Record Payment
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-5 border-l-4 border-l-green">
                        <p className="text-xs text-text-secondary uppercase font-bold">This Month</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">₹{thisMonthTotal.toLocaleString()}</p>
                        <p className="text-xs text-text-secondary mt-1">{thisMonthPayments.length} payments</p>
                    </div>

                    <div className="card p-5 border-l-4 border-l-sky">
                        <p className="text-xs text-text-secondary uppercase font-bold">Last Month</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">₹{lastMonthTotal.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                            {thisMonthTotal >= lastMonthTotal ? (
                                <TrendingUp className="w-3 h-3 text-green" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            <p className={`text-xs ${thisMonthTotal >= lastMonthTotal ? "text-green" : "text-red-400"}`}>
                                {lastMonthTotal > 0 ? Math.abs(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>

                    <div className="card p-5 border-l-4 border-l-purple">
                        <p className="text-xs text-text-secondary uppercase font-bold">Total Collected</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">₹{totalCollected.toLocaleString()}</p>
                        <p className="text-xs text-text-secondary mt-1">{payments.filter(p => p.status === "completed").length} payments</p>
                    </div>

                    <div className="card p-5 border-l-4 border-l-yellow">
                        <p className="text-xs text-text-secondary uppercase font-bold">Active Clients</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{clients.filter(c => c.status === "active").length}</p>
                        <p className="text-xs text-text-secondary mt-1">with contracts</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search by client name or reference..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background-card border border-border/50 rounded-xl focus:border-green/50 outline-none transition-all"
                    />
                </div>

                {/* Payments List */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loading text="Loading payments..." />
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="card p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-border/20 rounded-full flex items-center justify-center mx-auto text-text-secondary">
                            <IndianRupee className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-text-primary">No payments found</p>
                            <p className="text-text-secondary">Record your first payment to start tracking</p>
                        </div>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-border/10">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase">Client</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase hidden sm:table-cell">Type</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase hidden md:table-cell">Method</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase hidden lg:table-cell">Reference</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-text-secondary uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-border/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                                                    <Building className="w-4 h-4 text-green" />
                                                </div>
                                                <span className="font-medium text-text-primary">{payment.client_name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${payment.payment_type === "refund" ? "text-red-400" : "text-green"}`}>
                                                {payment.payment_type === "refund" ? "-" : "+"}₹{Number(payment.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            {getTypeBadge(payment.payment_type)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-sm text-text-secondary">
                                            {getMethodLabel(payment.payment_method)}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-sm text-text-secondary">
                                            {payment.reference_number || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">
                                            {format(new Date(payment.payment_date), "MMM d, yyyy")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Add Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Payment"
                size="md"
            >
                <form onSubmit={handleAddPayment} className="space-y-4 p-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Client *</label>
                        <select
                            required
                            value={newPayment.client_id}
                            onChange={e => setNewPayment({ ...newPayment, client_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                        >
                            <option value="">Select client...</option>
                            {clients.filter(c => c.status === "active").map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Amount (₹) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="10000"
                                value={newPayment.amount}
                                onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Date *</label>
                            <input
                                required
                                type="date"
                                value={newPayment.payment_date}
                                onChange={e => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Payment Type</label>
                            <select
                                value={newPayment.payment_type}
                                onChange={e => setNewPayment({ ...newPayment, payment_type: e.target.value as PaymentType })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            >
                                <option value="setup">Setup Fee</option>
                                <option value="recurring">Recurring</option>
                                <option value="one-time">One-time</option>
                                <option value="refund">Refund</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Payment Method</label>
                            <select
                                value={newPayment.payment_method}
                                onChange={e => setNewPayment({ ...newPayment, payment_method: e.target.value as PaymentMethod })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            >
                                <option value="upi">UPI</option>
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Reference Number</label>
                        <input
                            type="text"
                            placeholder="UPI/Transaction ID..."
                            value={newPayment.reference_number}
                            onChange={e => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Notes</label>
                        <textarea
                            rows={2}
                            placeholder="Any additional notes..."
                            value={newPayment.notes}
                            onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green text-white rounded-xl font-bold shadow-lg transition-all hover:bg-green/90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
