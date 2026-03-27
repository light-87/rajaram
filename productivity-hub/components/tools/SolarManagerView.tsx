"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, Lead, ActivityLog } from "@/types/database";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import { format, subDays } from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Users,
    User,
    PhoneCall,
    PhoneMissed,
    TrendingUp,
    Calendar,
    Hash,
    ChevronDown,
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    Zap,
} from "lucide-react";

const SOLAR_STATUS_LABELS: Record<string, string> = {
    not_called: "Not Called",
    no_answer: "No Answer",
    not_interested: "Not Interested",
    interested: "Interested",
    demo_scheduled: "Demo Scheduled",
    converted: "Converted",
    disqualified: "Disqualified",
};

const SOLAR_STATUS_COLORS: Record<string, string> = {
    not_called: "text-text-secondary",
    no_answer: "text-yellow",
    not_interested: "text-red-400",
    interested: "text-green",
    demo_scheduled: "text-purple",
    converted: "text-green",
    disqualified: "text-text-secondary",
};

interface InternDayStats {
    intern: Profile;
    calls: number;
    noAnswer: number;
    notInterested: number;
    interested: number;
    demoScheduled: number;
    converted: number;
    disqualified: number;
    leadsWorked: Lead[];
}

export default function SolarManagerView() {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [selectedIntern, setSelectedIntern] = useState<string | null>(null);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all active employees
            const { data: profiles } = await supabase
                .from("profiles")
                .select("*")
                .eq("is_active", true)
                .order("full_name");
            setEmployees(profiles || []);

            // Fetch leads with call_date = selectedDate for Solar Vendor
            const { data: leadsData } = await supabase
                .from("leads")
                .select("*")
                .eq("brand", "Solar Vendor")
                .eq("call_date", selectedDate)
                .order("updated_at", { ascending: false });
            setAllLeads(leadsData || []);

            // Fetch activity logs for the selected date
            const dayStart = `${selectedDate}T00:00:00.000Z`;
            const dayEnd = `${selectedDate}T23:59:59.999Z`;
            const { data: logs } = await supabase
                .from("activity_logs")
                .select("*")
                .gte("created_at", dayStart)
                .lte("created_at", dayEnd)
                .order("created_at", { ascending: false });
            setActivityLogs(logs || []);
        } catch (err) {
            console.error("Error fetching manager data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Build per-intern stats
    const internStats: InternDayStats[] = employees.map((intern) => {
        const leadsWorked = allLeads.filter((l) => l.assigned_to === intern.id);
        const counts = {
            noAnswer: leadsWorked.filter((l) => l.status === "no_answer").length,
            notInterested: leadsWorked.filter((l) => l.status === "not_interested").length,
            interested: leadsWorked.filter((l) => l.status === "interested").length,
            demoScheduled: leadsWorked.filter((l) => l.status === "demo_scheduled").length,
            converted: leadsWorked.filter((l) => l.status === "converted").length,
            disqualified: leadsWorked.filter((l) => l.status === "disqualified").length,
        };
        return {
            intern,
            calls: leadsWorked.length,
            ...counts,
            leadsWorked,
        };
    }).filter((s) => s.calls > 0 || activityLogs.some((l) => l.employee_id === s.intern.id));

    const selectedInternStats = selectedIntern
        ? internStats.find((s) => s.intern.id === selectedIntern)
        : null;
    const selectedInternLogs = selectedIntern
        ? activityLogs.filter((l) => l.employee_id === selectedIntern)
        : activityLogs;

    const prevDay = () =>
        setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
    const nextDay = () => {
        const next = format(subDays(new Date(selectedDate), -1), "yyyy-MM-dd");
        if (next <= new Date().toISOString().split("T")[0]) setSelectedDate(next);
    };
    const isToday = selectedDate === new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Date navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevDay}
                        className="p-2 bg-background-card border border-border/50 rounded-lg hover:border-yellow/50 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-background-card border border-border/50 rounded-lg px-4 py-2">
                        <Calendar className="w-4 h-4 text-yellow" />
                        <input
                            type="date"
                            value={selectedDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold text-text-primary"
                        />
                    </div>
                    <button
                        onClick={nextDay}
                        disabled={isToday}
                        className="p-2 bg-background-card border border-border/50 rounded-lg hover:border-yellow/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {isToday && (
                        <span className="text-xs font-bold text-yellow bg-yellow/10 px-2 py-1 rounded-lg">
                            Today
                        </span>
                    )}
                </div>

                {/* Intern selector */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedIntern(null)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedIntern === null ? "bg-yellow text-background" : "bg-background-card border border-border/50 text-text-secondary hover:text-text-primary"}`}
                    >
                        <Users className="w-4 h-4" />
                        All Interns
                    </button>

                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        <select
                            value={selectedIntern ?? ""}
                            onChange={(e) => setSelectedIntern(e.target.value || null)}
                            className="pl-9 pr-8 py-2 bg-background-card border border-border/50 rounded-lg text-sm font-bold outline-none cursor-pointer appearance-none hover:border-yellow/50 transition-all min-w-[160px]"
                        >
                            <option value="">Select Intern...</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loading text="Loading activity data..." />
                </div>
            ) : selectedIntern === null ? (
                /* ──────── ALL INTERNS VIEW ──────── */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary">
                            All Interns — {format(new Date(selectedDate), "EEEE, MMM d yyyy")}
                        </h3>
                        <span className="text-sm text-text-secondary">
                            {internStats.length} active intern{internStats.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {internStats.length === 0 ? (
                        <div className="card p-12 text-center space-y-3">
                            <div className="w-12 h-12 bg-border/20 rounded-full flex items-center justify-center mx-auto">
                                <Activity className="w-6 h-6 text-text-secondary" />
                            </div>
                            <p className="text-text-secondary">No activity recorded for this date.</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-[10px] font-bold uppercase text-text-secondary">
                                        <th className="text-left px-4 py-3">Intern</th>
                                        <th className="text-center px-3 py-3">Calls</th>
                                        <th className="text-center px-3 py-3 text-yellow">No Answer</th>
                                        <th className="text-center px-3 py-3 text-red-400">Not Interested</th>
                                        <th className="text-center px-3 py-3 text-green">Interested</th>
                                        <th className="text-center px-3 py-3 text-purple">Demo Sched.</th>
                                        <th className="text-center px-3 py-3 text-green">Converted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {internStats.map((stat) => (
                                        <tr
                                            key={stat.intern.id}
                                            className="border-b border-border/30 hover:bg-border/10 cursor-pointer transition-colors"
                                            onClick={() => setSelectedIntern(stat.intern.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-yellow/20 flex items-center justify-center text-[10px] font-bold text-yellow uppercase">
                                                        {stat.intern.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                                    </div>
                                                    <span className="font-bold text-text-primary">{stat.intern.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-center px-3 py-3 font-bold text-text-primary">{stat.calls}</td>
                                            <td className="text-center px-3 py-3 text-yellow">{stat.noAnswer || "—"}</td>
                                            <td className="text-center px-3 py-3 text-red-400">{stat.notInterested || "—"}</td>
                                            <td className="text-center px-3 py-3 text-green">{stat.interested || "—"}</td>
                                            <td className="text-center px-3 py-3 text-purple">{stat.demoScheduled || "—"}</td>
                                            <td className="text-center px-3 py-3 text-green">{stat.converted || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-2 text-[10px] text-text-secondary italic border-t border-border/30">
                                Click a row to view detailed activity for that intern.
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ──────── SPECIFIC INTERN VIEW ──────── */
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow/20 flex items-center justify-center text-sm font-bold text-yellow uppercase">
                            {employees.find((e) => e.id === selectedIntern)?.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">
                                {employees.find((e) => e.id === selectedIntern)?.full_name}
                            </h3>
                            <p className="text-sm text-text-secondary">
                                {format(new Date(selectedDate), "EEEE, MMMM d yyyy")}
                            </p>
                        </div>
                    </div>

                    {/* Summary cards */}
                    {selectedInternStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-text-primary">{selectedInternStats.calls}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <PhoneCall className="w-3 h-3" /> Calls Made
                                </div>
                            </div>
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-yellow">{selectedInternStats.noAnswer}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <PhoneMissed className="w-3 h-3" /> No Answer
                                </div>
                            </div>
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-red-400">{selectedInternStats.notInterested}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <XCircle className="w-3 h-3" /> Not Interested
                                </div>
                            </div>
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-green">{selectedInternStats.interested}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Interested
                                </div>
                            </div>
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-purple">{selectedInternStats.demoScheduled}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <Calendar className="w-3 h-3" /> Demos
                                </div>
                            </div>
                            <div className="card p-4 text-center space-y-1">
                                <div className="text-2xl font-bold text-green">{selectedInternStats.converted}</div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Converted
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Leads worked table */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <PhoneCall className="w-4 h-4 text-yellow" />
                            Leads Called on {format(new Date(selectedDate), "MMM d")}
                            <span className="text-text-secondary font-normal">
                                ({selectedInternStats?.leadsWorked.length ?? 0})
                            </span>
                        </h4>

                        {(selectedInternStats?.leadsWorked.length ?? 0) === 0 ? (
                            <div className="card p-8 text-center text-text-secondary text-sm">
                                No calls logged for this date.
                            </div>
                        ) : (
                            <div className="card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 text-[10px] font-bold uppercase text-text-secondary">
                                            <th className="text-left px-4 py-3">Company</th>
                                            <th className="text-left px-3 py-3">Location</th>
                                            <th className="text-center px-3 py-3">Status</th>
                                            <th className="text-center px-3 py-3">Attempts</th>
                                            <th className="text-left px-3 py-3">Call Notes</th>
                                            <th className="text-center px-3 py-3">Follow-up</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInternStats?.leadsWorked.map((lead) => (
                                            <tr key={lead.id} className="border-b border-border/30 hover:bg-border/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-text-primary">{lead.customer_name}</div>
                                                    {lead.phone && (
                                                        <div className="text-[10px] text-text-secondary">{lead.phone}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-text-secondary">
                                                    {lead.district && (
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            {lead.district}
                                                        </div>
                                                    )}
                                                    {lead.installations != null && (
                                                        <div className="flex items-center gap-1 text-green">
                                                            <Zap className="w-3 h-3" />
                                                            {lead.installations}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`text-xs font-bold ${SOLAR_STATUS_COLORS[lead.status] ?? "text-text-secondary"}`}>
                                                        {SOLAR_STATUS_LABELS[lead.status] ?? lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`text-xs font-bold flex items-center justify-center gap-1 ${(lead.attempt_count ?? 0) >= 3 ? "text-red-400" : "text-text-primary"}`}>
                                                        <Hash className="w-3 h-3" />
                                                        {lead.attempt_count ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 max-w-xs">
                                                    <p className="text-xs text-text-secondary line-clamp-2 italic">
                                                        {lead.call_notes || <span className="opacity-50">—</span>}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {lead.next_follow_up ? (
                                                        <span className="text-xs text-purple flex items-center justify-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(lead.next_follow_up), "MMM d")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary opacity-40">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Activity log */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple" />
                            Activity Log
                            <span className="text-text-secondary font-normal">({selectedInternLogs.length})</span>
                        </h4>

                        {selectedInternLogs.length === 0 ? (
                            <div className="card p-8 text-center text-text-secondary text-sm">
                                No activity recorded for this date.
                            </div>
                        ) : (
                            <div className="card divide-y divide-border/30">
                                {selectedInternLogs.map((log) => (
                                    <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow mt-2 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-text-primary">{log.action}</span>
                                                <span className="text-[10px] text-text-secondary flex items-center gap-1 flex-shrink-0">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {format(new Date(log.created_at), "HH:mm")}
                                                </span>
                                            </div>
                                            {log.details && (
                                                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{log.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
