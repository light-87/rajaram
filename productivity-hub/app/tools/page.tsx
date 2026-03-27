"use client";

export const dynamic = "force-dynamic";

import { useEmployeeAuth } from "@/lib/employee-auth";
import {
    BookMarked,
    Sun,
    Users,
    Target,
    TrendingUp,
    ArrowRight,
    DollarSign,
    Briefcase,
    Bell,
    Calendar,
    Clock,
    Phone,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Activity,
    Upload
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Lead, BusinessClient, FollowUp, Notification, ActivityLog } from "@/types/database";
import { format, isToday, isPast, formatDistanceToNow } from "date-fns";
import { showToast } from "@/components/ui/Toast";
import EmployeePointsCard from "@/components/tools/EmployeePointsCard";
import AnnouncementBoard from "@/components/tools/AnnouncementBoard";
import CustomerAssignmentTracker from "@/components/tools/CustomerAssignmentTracker";
import InstallPWAButton from "@/components/tools/InstallPWAButton";

interface DashboardData {
    totalLeads: number;
    newLeadsToday: number;
    totalClients: number;
    totalARR: number;
    pendingFollowUps: FollowUp[];
    overdueFollowUps: FollowUp[];
    recentLeads: Lead[];
    recentActivity: ActivityLog[];
    notifications: Notification[];
    kuberbookLeads: number;
    solarLeads: number;
    trialClients: BusinessClient[];
}

export default function ToolsPage() {
    const { employee, logout, isAdmin } = useEmployeeAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({
        totalLeads: 0,
        newLeadsToday: 0,
        totalClients: 0,
        totalARR: 0,
        pendingFollowUps: [],
        overdueFollowUps: [],
        recentLeads: [],
        recentActivity: [],
        notifications: [],
        kuberbookLeads: 0,
        solarLeads: 0,
        trialClients: []
    });

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Fetch all data in parallel
            const [
                { data: leads },
                { data: clients },
                { data: followUps },
                { data: activity },
                { data: notifications }
            ] = await Promise.all([
                supabase.from("leads").select("*").neq("status", "converted").order("created_at", { ascending: false }),
                supabase.from("business_clients").select("*"),
                supabase.from("follow_ups").select("*").eq("status", "pending").order("scheduled_date"),
                supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
                employee?.id
                    ? supabase.from("notifications").select("*").eq("user_id", employee.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5)
                    : { data: [] }
            ]);

            const todayLeads = (leads || []).filter((l: Lead) => {
                const raw = l.created_at as unknown;
                const d = raw instanceof Date ? raw.toISOString().split('T')[0] : String(l.created_at);
                return d.startsWith(today);
            });
            // Only count non-trial clients in financials
            const paidClients = (clients || []).filter((c: BusinessClient) => !c.is_free_trial);
            const totalARR = paidClients.reduce((acc: number, c: BusinessClient) => acc + (Number(c.recurring_profit) || 0), 0);
            const trialClients = (clients || []).filter((c: BusinessClient) => c.is_free_trial && !c.is_trial_converted) as BusinessClient[];

            // Separate follow-ups into pending (today/future) and overdue
            const pending = (followUps || []).filter((f: FollowUp) => !isPast(new Date(f.scheduled_date)) || isToday(new Date(f.scheduled_date)));
            const overdue = (followUps || []).filter((f: FollowUp) => isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));

            setData({
                totalLeads: leads?.length || 0,
                newLeadsToday: todayLeads.length,
                totalClients: clients?.length || 0,
                totalARR,
                pendingFollowUps: pending.slice(0, 5),
                overdueFollowUps: overdue.slice(0, 5),
                recentLeads: (leads || []).slice(0, 5) as Lead[],
                recentActivity: (activity || []) as ActivityLog[],
                notifications: (notifications || []) as Notification[],
                kuberbookLeads: (leads || []).filter((l: Lead) => l.brand === 'Kuberbook').length,
                solarLeads: (leads || []).filter((l: Lead) => l.brand === 'Solar Vendor').length,
                trialClients
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            showToast("Failed to load dashboard", "error");
        } finally {
            setLoading(false);
        }
    }, [employee?.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const markNotificationRead = async (id: string) => {
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
        setData(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="border-b border-border/50 bg-background-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-pink-purple flex items-center justify-center">
                            <span className="text-white font-bold">RP</span>
                        </div>
                        <h1 className="text-xl font-bold text-text-primary hidden sm:block">Employee Portal</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <InstallPWAButton />
                        {/* Notifications Bell */}
                        {data.notifications.length > 0 && (
                            <div className="relative">
                                <Bell className="w-5 h-5 text-text-secondary" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {data.notifications.length}
                                </span>
                            </div>
                        )}

                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-text-primary">{employee?.full_name}</p>
                            <p className="text-xs text-text-secondary capitalize">{employee?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm text-pink hover:text-pink/80 font-medium px-3 py-1.5 rounded-lg bg-pink/10 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Section */}
                <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary">
                            Welcome back, {employee?.full_name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p className="text-text-secondary mt-1">
                            {format(new Date(), "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-3">
                        <Link
                            href="/tools/solar"
                            className="px-4 py-2 bg-sky text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-sky/90 transition-colors"
                        >
                            <Target className="w-4 h-4" /> Add Lead
                        </Link>
                    </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-5 border-l-4 border-l-sky">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Total Leads</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{data.totalLeads}</p>
                            </div>
                            <Target className="w-8 h-8 text-sky/30" />
                        </div>
                        {data.newLeadsToday > 0 && (
                            <p className="text-xs text-sky mt-2">+{data.newLeadsToday} today</p>
                        )}
                    </div>

                    <div className="card p-5 border-l-4 border-l-green">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Active Clients</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{data.totalClients}</p>
                            </div>
                            <Users className="w-8 h-8 text-green/30" />
                        </div>
                        <p className="text-xs text-green mt-2">₹{(data.totalARR / 100000).toFixed(1)}L ARR</p>
                    </div>

                    <div className="card p-5 border-l-4 border-l-yellow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Pending Follow-ups</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{data.pendingFollowUps.length}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-yellow/30" />
                        </div>
                        <p className="text-xs text-yellow mt-2">Scheduled tasks</p>
                    </div>

                    <div className={`card p-5 border-l-4 ${data.overdueFollowUps.length > 0 ? 'border-l-red-400 bg-red-400/5' : 'border-l-purple'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Overdue</p>
                                <p className={`text-2xl font-bold mt-1 ${data.overdueFollowUps.length > 0 ? 'text-red-400' : 'text-text-primary'}`}>
                                    {data.overdueFollowUps.length}
                                </p>
                            </div>
                            <AlertCircle className={`w-8 h-8 ${data.overdueFollowUps.length > 0 ? 'text-red-400/50' : 'text-purple/30'}`} />
                        </div>
                        {data.overdueFollowUps.length > 0 && (
                            <p className="text-xs text-red-400 mt-2">Needs attention!</p>
                        )}
                    </div>
                </div>

                {/* Announcements & Assignment Tracker */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnnouncementBoard />
                    <CustomerAssignmentTracker />
                </div>

                {/* Free Trial Clients Alert */}
                {data.trialClients.length > 0 && (
                    <div className="card p-6 bg-purple/5 border-purple/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-purple flex items-center gap-2">
                                <Clock className="w-5 h-5" /> Free Trial Clients ({data.trialClients.length})
                            </h3>
                            <span className="text-xs text-text-secondary">Follow up to convert to paid</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.trialClients.map(client => {
                                const trialEnd = client.trial_end_date ? new Date(client.trial_end_date) : null;
                                const isExpired = trialEnd && isPast(trialEnd);
                                const isEndingSoon = trialEnd && !isExpired && (trialEnd.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;
                                return (
                                    <div
                                        key={client.id}
                                        className={`p-3 rounded-xl border ${isExpired ? 'bg-red-400/5 border-red-400/20' :
                                                isEndingSoon ? 'bg-yellow/5 border-yellow/20' :
                                                    'bg-background border-border/20'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-text-primary truncate">{client.name}</p>
                                                <p className="text-xs text-text-secondary">{client.brand} &middot; {client.trial_months}mo trial</p>
                                            </div>
                                            {isExpired && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-red-400/10 text-red-400 rounded font-bold flex-shrink-0">EXPIRED</span>
                                            )}
                                            {isEndingSoon && !isExpired && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow/10 text-yellow rounded font-bold flex-shrink-0">ENDING SOON</span>
                                            )}
                                        </div>
                                        {trialEnd && (
                                            <p className={`text-xs mt-1.5 ${isExpired ? 'text-red-400' : isEndingSoon ? 'text-yellow' : 'text-text-secondary'}`}>
                                                {isExpired ? 'Expired' : 'Ends'} {formatDistanceToNow(trialEnd, { addSuffix: true })}
                                            </p>
                                        )}
                                        {client.phone && (
                                            <a href={`tel:${client.phone}`} className="text-xs text-sky flex items-center gap-1 mt-1 hover:underline">
                                                <Phone className="w-3 h-3" /> {client.phone}
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Follow-ups & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overdue Follow-ups Alert */}
                        {data.overdueFollowUps.length > 0 && (
                            <div className="card p-6 bg-red-400/5 border-red-400/20">
                                <h3 className="font-bold text-red-400 flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-5 h-5" /> Overdue Follow-ups
                                </h3>
                                <div className="space-y-3">
                                    {data.overdueFollowUps.map(followUp => (
                                        <div key={followUp.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                                                    <Phone className="w-4 h-4 text-red-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {followUp.lead_name || followUp.client_name || 'Follow-up'}
                                                    </p>
                                                    <p className="text-xs text-red-400">
                                                        {formatDistanceToNow(new Date(followUp.scheduled_date), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-red-400 uppercase">{followUp.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Today's Schedule */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-text-primary flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-sky" /> Today&apos;s Schedule
                                </h3>
                                <Link href="/tools/follow-ups" className="text-xs text-sky hover:underline flex items-center gap-1">
                                    View All <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                            {data.pendingFollowUps.length > 0 ? (
                                <div className="space-y-3">
                                    {data.pendingFollowUps.filter(f => isToday(new Date(f.scheduled_date))).slice(0, 3).map(followUp => (
                                        <div key={followUp.id} className="flex items-center justify-between p-3 bg-border/10 rounded-xl hover:bg-border/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
                                                    <Phone className="w-5 h-5 text-sky" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {followUp.lead_name || followUp.client_name || 'Follow-up'}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        {followUp.scheduled_time || 'Any time'} • {followUp.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="text-xs px-3 py-1.5 bg-green/10 text-green rounded-lg font-medium hover:bg-green/20 transition-colors">
                                                Complete
                                            </button>
                                        </div>
                                    ))}
                                    {data.pendingFollowUps.filter(f => isToday(new Date(f.scheduled_date))).length === 0 && (
                                        <div className="text-center py-8 text-text-secondary">
                                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green/30" />
                                            <p className="text-sm">No follow-ups scheduled for today!</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-border" />
                                    <p className="text-sm">No pending follow-ups</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Leads */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-text-primary flex items-center gap-2">
                                    <Target className="w-5 h-5 text-pink" /> Recent Leads
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {data.recentLeads.map(lead => (
                                    <div key={lead.id} className="flex items-center justify-between p-3 border-b border-border/30 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${lead.brand === 'Kuberbook' ? 'bg-sky' : 'bg-yellow'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{lead.customer_name}</p>
                                                <p className="text-xs text-text-secondary">{lead.brand} • {lead.status}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-text-secondary">
                                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Points, Quick Access & Activity */}
                    <div className="space-y-6">
                        {/* Employee Points */}
                        <EmployeePointsCard />

                        {/* Brand Quick Access */}
                        <div className="card p-6 space-y-4">
                            <h3 className="font-bold text-text-primary">Quick Access</h3>

                            <Link href="/tools/kuberbook" className="flex items-center justify-between p-4 bg-sky/5 rounded-xl hover:bg-sky/10 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-sky/10">
                                        <BookMarked className="w-5 h-5 text-sky" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-primary">Kuberbook</p>
                                        <p className="text-xs text-text-secondary">{data.kuberbookLeads} active leads</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-sky opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <Link href="/tools/solar" className="flex items-center justify-between p-4 bg-yellow/5 rounded-xl hover:bg-yellow/10 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow/10">
                                        <Sun className="w-5 h-5 text-yellow" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-primary">Solar Vendor</p>
                                        <p className="text-xs text-text-secondary">{data.solarLeads} active leads</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-yellow opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </div>

                        {/* Admin Quick Links */}
                        {isAdmin && (
                            <div className="card p-6 space-y-4">
                                <h3 className="font-bold text-text-primary">Management</h3>

                                <Link href="/tools/admin/employees" className="flex items-center gap-3 p-3 hover:bg-border/10 rounded-xl transition-colors">
                                    <Users className="w-5 h-5 text-purple" />
                                    <span className="text-sm text-text-primary">Employees</span>
                                </Link>

                                <Link href="/tools/agents" className="flex items-center gap-3 p-3 hover:bg-border/10 rounded-xl transition-colors">
                                    <Briefcase className="w-5 h-5 text-sky" />
                                    <span className="text-sm text-text-primary">Sales Agents</span>
                                </Link>

                                <Link href="/tools/finance" className="flex items-center gap-3 p-3 hover:bg-border/10 rounded-xl transition-colors">
                                    <DollarSign className="w-5 h-5 text-green" />
                                    <span className="text-sm text-text-primary">Finance</span>
                                </Link>

                                <Link href="/tools/payments" className="flex items-center gap-3 p-3 hover:bg-border/10 rounded-xl transition-colors">
                                    <TrendingUp className="w-5 h-5 text-pink" />
                                    <span className="text-sm text-text-primary">Payments</span>
                                </Link>

                                <Link href="/tools/admin/vendor-data" className="flex items-center gap-3 p-3 hover:bg-border/10 rounded-xl transition-colors">
                                    <Upload className="w-5 h-5 text-green" />
                                    <span className="text-sm text-text-primary">Vendor Data</span>
                                </Link>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="card p-6">
                            <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-purple" /> Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {data.recentActivity.map((log, i) => (
                                    <div key={log.id} className="flex gap-3">
                                        <div className="relative">
                                            <div className="w-2 h-2 rounded-full bg-purple mt-2" />
                                            {i < data.recentActivity.length - 1 && (
                                                <div className="absolute left-0.5 top-4 w-0.5 h-8 bg-border/50" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-text-primary">{log.action}</p>
                                            <p className="text-xs text-text-secondary">
                                                {log.performed_by} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {data.recentActivity.length === 0 && (
                                    <p className="text-sm text-text-secondary text-center py-4">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
