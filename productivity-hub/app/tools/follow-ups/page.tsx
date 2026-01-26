"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import { supabase } from "@/lib/supabase";
import { FollowUp, FollowUpStatus, Lead, BusinessClient } from "@/types/database";
import { useEffect, useState, useCallback } from "react";
import { format, isToday, isPast, isTomorrow, formatDistanceToNow } from "date-fns";
import { showToast } from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { logActivity } from "@/lib/tools-utils";
import {
    Calendar,
    Phone,
    Mail,
    MessageSquare,
    Users,
    Building,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    Filter,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function FollowUpsPage() {
    const { employee } = useEmployeeAuth();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [clients, setClients] = useState<BusinessClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "overdue" | "today" | "upcoming">("all");
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
    const [completionNotes, setCompletionNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                { data: followUpsData, error: followUpsError },
                { data: leadsData },
                { data: clientsData }
            ] = await Promise.all([
                supabase.from("follow_ups").select("*").order("scheduled_date", { ascending: true }),
                supabase.from("leads").select("*"),
                supabase.from("business_clients").select("*")
            ]);

            if (followUpsError) throw followUpsError;

            // Enrich follow-ups with lead/client names
            const enriched = (followUpsData || []).map((f: FollowUp) => ({
                ...f,
                lead_name: leadsData?.find((l: Lead) => l.id === f.lead_id)?.customer_name,
                client_name: clientsData?.find((c: BusinessClient) => c.id === f.client_id)?.name
            }));

            setFollowUps(enriched);
            setLeads(leadsData || []);
            setClients(clientsData || []);
        } catch (error) {
            console.error("Error fetching follow-ups:", error);
            showToast("Failed to load follow-ups", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleComplete = async () => {
        if (!selectedFollowUp) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("follow_ups").update({
                status: "completed",
                completed_at: new Date().toISOString(),
                completed_notes: completionNotes || null
            }).eq("id", selectedFollowUp.id);

            if (error) throw error;

            await logActivity(
                "Follow-up Completed",
                `Completed ${selectedFollowUp.type} follow-up for "${selectedFollowUp.lead_name || selectedFollowUp.client_name}"`,
                employee?.username,
                employee?.id
            );

            showToast("Follow-up marked as complete!");
            setIsCompleteModalOpen(false);
            setCompletionNotes("");
            fetchData();
        } catch (error) {
            console.error("Error completing follow-up:", error);
            showToast("Failed to complete follow-up", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (followUp: FollowUp) => {
        if (!confirm("Are you sure you want to cancel this follow-up?")) return;
        try {
            const { error } = await supabase.from("follow_ups").update({
                status: "cancelled"
            }).eq("id", followUp.id);

            if (error) throw error;

            showToast("Follow-up cancelled");
            fetchData();
        } catch (error) {
            console.error("Error cancelling follow-up:", error);
            showToast("Failed to cancel follow-up", "error");
        }
    };

    const getFilteredFollowUps = () => {
        const pending = followUps.filter(f => f.status === "pending");

        switch (filter) {
            case "overdue":
                return pending.filter(f => isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));
            case "today":
                return pending.filter(f => isToday(new Date(f.scheduled_date)));
            case "upcoming":
                return pending.filter(f => !isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));
            default:
                return followUps;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "call": return <Phone className="w-4 h-4" />;
            case "email": return <Mail className="w-4 h-4" />;
            case "whatsapp": return <MessageSquare className="w-4 h-4" />;
            case "meeting": return <Users className="w-4 h-4" />;
            case "visit": return <Building className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (followUp: FollowUp) => {
        if (followUp.status === "completed") return <Badge variant="success">Completed</Badge>;
        if (followUp.status === "cancelled") return <Badge variant="danger">Cancelled</Badge>;

        const date = new Date(followUp.scheduled_date);
        if (isPast(date) && !isToday(date)) return <Badge variant="danger">Overdue</Badge>;
        if (isToday(date)) return <Badge variant="warning">Today</Badge>;
        if (isTomorrow(date)) return <Badge variant="sky">Tomorrow</Badge>;
        return <Badge variant="purple">Scheduled</Badge>;
    };

    const filteredFollowUps = getFilteredFollowUps();
    const overdueCount = followUps.filter(f => f.status === "pending" && isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date))).length;
    const todayCount = followUps.filter(f => f.status === "pending" && isToday(new Date(f.scheduled_date))).length;

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
                            <div className="p-2 rounded-lg bg-purple/10">
                                <Calendar className="w-5 h-5 text-purple" />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary">Follow-ups</h1>
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-border/20 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => setFilter("all")}
                        className={`card p-4 text-left transition-all ${filter === "all" ? "ring-2 ring-purple" : ""}`}
                    >
                        <p className="text-xs text-text-secondary uppercase font-bold">All</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{followUps.length}</p>
                    </button>
                    <button
                        onClick={() => setFilter("overdue")}
                        className={`card p-4 text-left transition-all ${filter === "overdue" ? "ring-2 ring-red-400" : ""} ${overdueCount > 0 ? "bg-red-400/5" : ""}`}
                    >
                        <p className="text-xs text-text-secondary uppercase font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-400" /> Overdue
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? "text-red-400" : "text-text-primary"}`}>{overdueCount}</p>
                    </button>
                    <button
                        onClick={() => setFilter("today")}
                        className={`card p-4 text-left transition-all ${filter === "today" ? "ring-2 ring-yellow" : ""}`}
                    >
                        <p className="text-xs text-text-secondary uppercase font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow" /> Today
                        </p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{todayCount}</p>
                    </button>
                    <button
                        onClick={() => setFilter("upcoming")}
                        className={`card p-4 text-left transition-all ${filter === "upcoming" ? "ring-2 ring-sky" : ""}`}
                    >
                        <p className="text-xs text-text-secondary uppercase font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky" /> Upcoming
                        </p>
                        <p className="text-2xl font-bold text-text-primary mt-1">
                            {followUps.filter(f => f.status === "pending" && !isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date))).length}
                        </p>
                    </button>
                </div>

                {/* Follow-ups List */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loading text="Loading follow-ups..." />
                    </div>
                ) : filteredFollowUps.length === 0 ? (
                    <div className="card p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-border/20 rounded-full flex items-center justify-center mx-auto text-text-secondary">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-text-primary">No follow-ups found</p>
                            <p className="text-text-secondary">Schedule follow-ups from lead cards</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFollowUps.map(followUp => {
                            const isPending = followUp.status === "pending";
                            const isOverdue = isPending && isPast(new Date(followUp.scheduled_date)) && !isToday(new Date(followUp.scheduled_date));

                            return (
                                <div
                                    key={followUp.id}
                                    className={`card p-5 ${isOverdue ? "border-red-400/30 bg-red-400/5" : ""} ${followUp.status === "completed" ? "opacity-60" : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${isOverdue ? "bg-red-400/10 text-red-400" : "bg-purple/10 text-purple"}`}>
                                                {getTypeIcon(followUp.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-primary">
                                                    {followUp.lead_name || followUp.client_name || "Unknown"}
                                                </h3>
                                                <p className="text-sm text-text-secondary capitalize">{followUp.type} follow-up</p>
                                                {followUp.notes && (
                                                    <p className="text-sm text-text-secondary mt-2 line-clamp-2">{followUp.notes}</p>
                                                )}
                                                {followUp.completed_notes && (
                                                    <p className="text-sm text-green mt-2 italic">
                                                        Completed: {followUp.completed_notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(followUp)}
                                            <p className="text-xs text-text-secondary">
                                                {format(new Date(followUp.scheduled_date), "MMM d, yyyy")}
                                                {followUp.scheduled_time && ` at ${followUp.scheduled_time}`}
                                            </p>
                                            {isPending && (
                                                <p className="text-xs text-text-secondary">
                                                    {formatDistanceToNow(new Date(followUp.scheduled_date), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {isPending && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                                            <button
                                                onClick={() => {
                                                    setSelectedFollowUp(followUp);
                                                    setIsCompleteModalOpen(true);
                                                }}
                                                className="flex-1 py-2 bg-green/10 text-green hover:bg-green/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Mark Complete
                                            </button>
                                            <button
                                                onClick={() => handleCancel(followUp)}
                                                className="px-4 py-2 bg-border/20 text-text-secondary hover:bg-border/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Complete Follow-up Modal */}
            <Modal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                title="Complete Follow-up"
                size="md"
            >
                <div className="space-y-4 p-2">
                    <div className="p-4 bg-border/10 rounded-xl">
                        <p className="text-sm font-bold text-text-primary">
                            {selectedFollowUp?.lead_name || selectedFollowUp?.client_name}
                        </p>
                        <p className="text-xs text-text-secondary capitalize">{selectedFollowUp?.type} follow-up</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Completion Notes (Optional)</label>
                        <textarea
                            rows={4}
                            placeholder="What was discussed? Any outcome or next steps?"
                            value={completionNotes}
                            onChange={e => setCompletionNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCompleteModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green text-white rounded-xl font-bold shadow-lg transition-all hover:bg-green/90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Complete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
