"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import { supabase } from "@/lib/supabase";
import { Payment, BusinessClient, PaymentType, PaymentMethod, PaymentStatus } from "@/types/database";
import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, addYears } from "date-fns";
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
    IndianRupee,
    Bell,
    MessageCircle,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Phone
} from "lucide-react";
import Link from "next/link";

type ActiveTab = "payments" | "reminders";

export default function PaymentsPage() {
    const { employee, isAdmin } = useEmployeeAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [clients, setClients] = useState<BusinessClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<ActiveTab>("payments");

    // Mark as Paid (recurring reminder) state
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [renewalClient, setRenewalClient] = useState<BusinessClient | null>(null);
    const [renewalAmount, setRenewalAmount] = useState("");
    const [renewalMethod, setRenewalMethod] = useState<PaymentMethod>("upi");

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
            const enriched = (paymentsData || []).map((p: Payment) => ({
                ...p,
                client_name: clientsData?.find((c: BusinessClient) => c.id === p.client_id)?.name
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

    // Handle recurring renewal Mark as Paid
    const handleRenewalPaid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewalClient) return;
        setIsSubmitting(true);
        try {
            const amount = parseFloat(renewalAmount) || 0;
            if (amount <= 0) {
                showToast("Please enter a valid amount", "error");
                setIsSubmitting(false);
                return;
            }

            // 1. Create payment record
            const { error: paymentError } = await supabase.from("payments").insert({
                client_id: renewalClient.id,
                amount,
                payment_date: new Date().toISOString().split('T')[0],
                payment_type: "recurring",
                payment_method: renewalMethod,
                status: "completed",
                notes: "Annual renewal payment",
                recorded_by: employee?.id
            });

            if (paymentError) throw paymentError;

            // 2. Advance next_payment_due by 1 year from the current due date
            const currentDue = renewalClient.next_payment_due
                ? new Date(renewalClient.next_payment_due)
                : new Date();
            const nextDue = addYears(currentDue, 1);

            const { error: clientError } = await supabase
                .from("business_clients")
                .update({
                    next_payment_due: nextDue.toISOString().split('T')[0],
                    recurring_profit: amount
                })
                .eq("id", renewalClient.id);

            if (clientError) throw clientError;

            await logActivity(
                "Renewal Payment Recorded",
                `Annual renewal ₹${amount.toLocaleString()} recorded for "${renewalClient.name}". Next due: ${format(nextDue, "MMM d, yyyy")}`,
                employee?.username,
                employee?.id
            );

            showToast("Renewal payment recorded! Next payment due updated.");
            setIsRenewalModalOpen(false);
            setRenewalClient(null);
            setRenewalAmount("");
            setRenewalMethod("upi");
            fetchData();
        } catch (error) {
            console.error("Error recording renewal:", error);
            showToast("Failed to record renewal payment", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate WhatsApp deep link
    const getWhatsAppLink = (client: BusinessClient) => {
        const phone = client.phone?.replace(/[^0-9]/g, "") || "";
        // Add India country code if not present
        const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
        const amount = Number(client.recurring_profit || 0).toLocaleString();
        const brandName = client.brand || "our service";
        const message = `Hi ${client.name}, your annual subscription for ${brandName} is due for renewal this month. Kindly arrange the payment of ₹${amount}. Thank you!`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
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

    // Calculate reminder clients: active clients whose next_payment_due is within 30 days or overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderClients = clients
        .filter(c => {
            if (c.status !== "active" || !c.next_payment_due) return false;
            const dueDate = new Date(c.next_payment_due);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntilDue = differenceInDays(dueDate, today);
            // Show if due within 30 days or already overdue
            return daysUntilDue <= 30;
        })
        .sort((a, b) => {
            const dateA = new Date(a.next_payment_due!);
            const dateB = new Date(b.next_payment_due!);
            return dateA.getTime() - dateB.getTime();
        });

    const overdueCount = reminderClients.filter(c => {
        const dueDate = new Date(c.next_payment_due!);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }).length;

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

    const getDueBadge = (dueDate: string) => {
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const daysUntil = differenceInDays(due, today);

        if (daysUntil < 0) {
            return <Badge variant="danger">Overdue by {Math.abs(daysUntil)} days</Badge>;
        } else if (daysUntil === 0) {
            return <Badge variant="danger">Due Today</Badge>;
        } else if (daysUntil <= 7) {
            return <Badge variant="warning">Due in {daysUntil} days</Badge>;
        } else {
            return <Badge variant="sky">Due in {daysUntil} days</Badge>;
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
                        {isAdmin && activeTab === "payments" && (
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
                {/* Tab Navigation */}
                <div className="flex gap-1 bg-background-card border border-border/50 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab("payments")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "payments"
                                ? "bg-green text-white shadow-lg"
                                : "text-text-secondary hover:text-text-primary hover:bg-border/20"
                        }`}
                    >
                        <IndianRupee className="w-4 h-4" />
                        Payments
                    </button>
                    <button
                        onClick={() => setActiveTab("reminders")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                            activeTab === "reminders"
                                ? "bg-yellow text-white shadow-lg"
                                : "text-text-secondary hover:text-text-primary hover:bg-border/20"
                        }`}
                    >
                        <Bell className="w-4 h-4" />
                        Reminders
                        {reminderClients.length > 0 && (
                            <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                                overdueCount > 0 ? "bg-red-500 text-white" : "bg-yellow text-white"
                            }`}>
                                {reminderClients.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* === PAYMENTS TAB === */}
                {activeTab === "payments" && (
                    <>
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
                    </>
                )}

                {/* === REMINDERS TAB === */}
                {activeTab === "reminders" && (
                    <>
                        {/* Reminder Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="card p-5 border-l-4 border-l-yellow">
                                <p className="text-xs text-text-secondary uppercase font-bold">Due This Month</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{reminderClients.length}</p>
                                <p className="text-xs text-text-secondary mt-1">clients need renewal</p>
                            </div>

                            <div className="card p-5 border-l-4 border-l-red-400">
                                <p className="text-xs text-text-secondary uppercase font-bold">Overdue</p>
                                <p className="text-2xl font-bold text-red-400 mt-1">{overdueCount}</p>
                                <p className="text-xs text-text-secondary mt-1">payments past due</p>
                            </div>

                            <div className="card p-5 border-l-4 border-l-green col-span-2 lg:col-span-1">
                                <p className="text-xs text-text-secondary uppercase font-bold">Expected Revenue</p>
                                <p className="text-2xl font-bold text-green mt-1">
                                    ₹{reminderClients.reduce((acc, c) => acc + (Number(c.recurring_profit) || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">from upcoming renewals</p>
                            </div>
                        </div>

                        {/* Reminders List */}
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <Loading text="Loading reminders..." />
                            </div>
                        ) : reminderClients.length === 0 ? (
                            <div className="card p-12 text-center space-y-4">
                                <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-green" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-text-primary">All caught up!</p>
                                    <p className="text-text-secondary">No payment renewals due in the next 30 days</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reminderClients.map(client => {
                                    const dueDate = new Date(client.next_payment_due!);
                                    dueDate.setHours(0, 0, 0, 0);
                                    const isOverdue = dueDate < today;
                                    const amount = Number(client.recurring_profit) || 0;

                                    return (
                                        <div
                                            key={client.id}
                                            className={`card p-6 transition-all ${
                                                isOverdue
                                                    ? "border-red-400/30 hover:border-red-400/50 bg-red-400/5"
                                                    : "hover:border-yellow/30"
                                            }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Client Info */}
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                        isOverdue ? "bg-red-400/10" : "bg-yellow/10"
                                                    }`}>
                                                        {isOverdue ? (
                                                            <AlertTriangle className="w-6 h-6 text-red-400" />
                                                        ) : (
                                                            <Clock className="w-6 h-6 text-yellow" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-lg font-bold text-text-primary">{client.name}</h4>
                                                            <Badge variant={client.brand === "Kuberbook" ? "sky" : "warning"}>
                                                                {client.brand}
                                                            </Badge>
                                                            {getDueBadge(client.next_payment_due!)}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Due: {format(dueDate, "MMM d, yyyy")}
                                                            </span>
                                                            {client.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {client.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-lg font-bold text-green mt-1">
                                                            ₹{amount.toLocaleString()}/year
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-3 ml-auto">
                                                    {client.phone && (
                                                        <a
                                                            href={getWhatsAppLink(client)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-green/10 text-green hover:bg-green/20 rounded-xl text-sm font-bold transition-all"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                            Send Reminder
                                                        </a>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                setRenewalClient(client);
                                                                setRenewalAmount((client.recurring_profit || 0).toString());
                                                                setRenewalMethod("upi");
                                                                setIsRenewalModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-green text-white hover:bg-green/90 rounded-xl text-sm font-bold transition-all shadow-lg"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Mark as Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
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

            {/* Renewal Mark as Paid Modal */}
            <Modal
                isOpen={isRenewalModalOpen}
                onClose={() => { setIsRenewalModalOpen(false); setRenewalClient(null); }}
                title="Record Renewal Payment"
                color="green"
                size="md"
            >
                <form onSubmit={handleRenewalPaid} className="space-y-4 p-2">
                    <div className="p-4 bg-green/5 border border-green/20 rounded-xl">
                        <p className="text-sm font-bold text-text-primary">{renewalClient?.name}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            {renewalClient?.brand} &middot; Due: {renewalClient?.next_payment_due && format(new Date(renewalClient.next_payment_due), "MMM d, yyyy")}
                        </p>
                    </div>

                    <p className="text-xs text-text-secondary">
                        Confirm the annual renewal payment amount. This will record the payment and set the next due date to 1 year from the current due date.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Amount (₹) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="10000"
                                value={renewalAmount}
                                onChange={e => setRenewalAmount(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Payment Method</label>
                            <select
                                value={renewalMethod}
                                onChange={e => setRenewalMethod(e.target.value as PaymentMethod)}
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

                    {renewalClient?.next_payment_due && (
                        <div className="p-3 bg-border/10 rounded-xl text-xs text-text-secondary">
                            <p>Next payment due will be updated to: <span className="font-bold text-text-primary">
                                {format(addYears(new Date(renewalClient.next_payment_due), 1), "MMM d, yyyy")}
                            </span></p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsRenewalModalOpen(false); setRenewalClient(null); }}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green text-white rounded-xl font-bold shadow-lg hover:bg-green/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
