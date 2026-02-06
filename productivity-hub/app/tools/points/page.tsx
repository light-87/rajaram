"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployeeAuth } from "@/lib/employee-auth";
import { PointMilestone, Profile } from "@/types/database";
import { showToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
    Trophy,
    Star,
    Crown,
    ArrowLeft,
    Zap,
    Gift,
    Users,
    Target,
    ChevronDown,
    ChevronUp,
    Medal,
    TrendingUp,
    CheckCircle2,
    Lock
} from "lucide-react";

interface LeaderboardEntry {
    employee_id: string;
    employee_name: string;
    total_points: number;
    client_count: number;
    total_redeemed: number;
    rank: number;
}

interface PointsPageData {
    leaderboard: LeaderboardEntry[];
    milestones: PointMilestone[];
    totalCompanyClients: number;
    myEntry: LeaderboardEntry | null;
}

export default function PointsPage() {
    const { employee, isAdmin } = useEmployeeAuth();
    const [data, setData] = useState<PointsPageData>({
        leaderboard: [],
        milestones: [],
        totalCompanyClients: 0,
        myEntry: null
    });
    const [loading, setLoading] = useState(true);
    const [expandedMilestones, setExpandedMilestones] = useState(false);

    const fetchData = useCallback(async () => {
        if (!employee?.id) return;

        try {
            setLoading(true);

            const [
                { data: clients },
                { data: points },
                { data: milestones },
                { data: profiles },
                { data: redemptions }
            ] = await Promise.all([
                supabase.from("business_clients").select("*"),
                supabase.from("employee_points").select("*"),
                supabase.from("point_milestones").select("*").order("milestone_count", { ascending: true }),
                supabase.from("profiles").select("*").eq("is_active", true),
                supabase.from("point_redemptions").select("*")
            ]);

            const totalClients = clients?.length || 0;

            // Build leaderboard from points data
            const pointsByEmployee = new Map<string, { points: number; clients: number; redeemed: number }>();

            for (const p of (points || [])) {
                const entry = pointsByEmployee.get(p.employee_id) || { points: 0, clients: 0, redeemed: 0 };
                entry.points += p.points;
                entry.clients += 1;
                pointsByEmployee.set(p.employee_id, entry);
            }

            // Add redemption data
            for (const r of (redemptions || [])) {
                const entry = pointsByEmployee.get(r.employee_id);
                if (entry) {
                    entry.redeemed += r.points_redeemed;
                }
            }

            // Also include employees with 0 points
            for (const profile of (profiles || [])) {
                if (!pointsByEmployee.has(profile.id)) {
                    pointsByEmployee.set(profile.id, { points: 0, clients: 0, redeemed: 0 });
                }
            }

            // Build leaderboard
            const profileMap = new Map<string, Profile>((profiles || []).map((p: Profile) => [p.id, p]));
            const leaderboard: LeaderboardEntry[] = Array.from(pointsByEmployee.entries())
                .map(([empId, data]) => ({
                    employee_id: empId,
                    employee_name: profileMap.get(empId)?.full_name || "Unknown",
                    total_points: data.points,
                    client_count: data.clients,
                    total_redeemed: data.redeemed,
                    rank: 0
                }))
                .sort((a, b) => b.total_points - a.total_points)
                .map((entry, i) => ({ ...entry, rank: i + 1 }));

            const myEntry = leaderboard.find(e => e.employee_id === employee.id) || null;

            setData({
                leaderboard,
                milestones: (milestones || []) as PointMilestone[],
                totalCompanyClients: totalClients,
                myEntry
            });
        } catch (error) {
            console.error("Error fetching points data:", error);
            showToast("Failed to load points data", "error");
        } finally {
            setLoading(false);
        }
    }, [employee?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-5 h-5 text-yellow" />;
            case 2: return <Medal className="w-5 h-5 text-gray-400" />;
            case 3: return <Medal className="w-5 h-5 text-amber-600" />;
            default: return <span className="text-sm font-bold text-text-secondary w-5 text-center">#{rank}</span>;
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1: return "bg-yellow/5 border-yellow/20";
            case 2: return "bg-gray-400/5 border-gray-400/20";
            case 3: return "bg-amber-600/5 border-amber-600/20";
            default: return "bg-border/5 border-border/10";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-border/30 rounded w-48" />
                        <div className="h-40 bg-border/30 rounded-2xl" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-border/30 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="border-b border-border/50 bg-background-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <Link href="/tools" className="p-2 rounded-lg hover:bg-border/10 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow" />
                        <h1 className="text-lg font-bold text-text-primary">Points Leaderboard</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* My Stats Card */}
                {data.myEntry && (
                    <div className="card p-6 bg-gradient-to-br from-yellow/5 via-transparent to-pink/5 border border-yellow/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-text-secondary mb-1">Your Standing</p>
                                <div className="flex items-center gap-3">
                                    {getRankIcon(data.myEntry.rank)}
                                    <div>
                                        <p className="text-2xl font-bold text-text-primary">
                                            {data.myEntry.total_points.toLocaleString()} pts
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            Rank #{data.myEntry.rank} of {data.leaderboard.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-green">{data.myEntry.client_count}</p>
                                    <p className="text-xs text-text-secondary">Converted</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-sky">{data.myEntry.total_redeemed.toLocaleString()}</p>
                                    <p className="text-xs text-text-secondary">Redeemed</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-pink">
                                        {(data.myEntry.total_points - data.myEntry.total_redeemed).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-text-secondary">Available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Company Milestones */}
                <div className="card p-6">
                    <button
                        onClick={() => setExpandedMilestones(!expandedMilestones)}
                        className="w-full flex items-center justify-between"
                    >
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <Target className="w-5 h-5 text-pink" /> Company Milestones
                            <span className="text-sm font-normal text-text-secondary">
                                ({data.totalCompanyClients} total clients)
                            </span>
                        </h3>
                        {expandedMilestones ? (
                            <ChevronUp className="w-5 h-5 text-text-secondary" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-text-secondary" />
                        )}
                    </button>

                    {expandedMilestones && (
                        <div className="mt-4 space-y-3">
                            {data.milestones.map((ms) => {
                                const reached = data.totalCompanyClients >= ms.milestone_count;
                                const progress = Math.min(100, (data.totalCompanyClients / ms.milestone_count) * 100);
                                return (
                                    <div
                                        key={ms.id}
                                        className={`flex items-center gap-4 p-3 rounded-xl border ${
                                            reached
                                                ? "bg-green/5 border-green/20"
                                                : "bg-border/5 border-border/10"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            reached ? "bg-green/10" : "bg-border/10"
                                        }`}>
                                            {reached ? (
                                                <CheckCircle2 className="w-5 h-5 text-green" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-text-secondary/30" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`text-sm font-bold ${reached ? "text-green" : "text-text-primary"}`}>
                                                    {ms.label} - {ms.milestone_count} clients
                                                </p>
                                                {reached && (
                                                    <span className="text-xs text-green font-bold">Unlocked</span>
                                                )}
                                            </div>
                                            {!reached && (
                                                <div className="w-full h-1.5 bg-border/20 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow/50 rounded-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Compact milestone bar when collapsed */}
                    {!expandedMilestones && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                            {data.milestones.map((ms) => {
                                const reached = data.totalCompanyClients >= ms.milestone_count;
                                return (
                                    <div
                                        key={ms.id}
                                        className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
                                            reached
                                                ? "bg-green/10 text-green border-green/20"
                                                : "bg-border/5 text-text-secondary/50 border-border/10"
                                        }`}
                                    >
                                        {ms.label} ({ms.milestone_count})
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-purple" /> Employee Rankings
                    </h3>

                    {data.leaderboard.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            <Trophy className="w-12 h-12 mx-auto mb-3 text-border" />
                            <p className="text-sm">No points earned yet</p>
                            <p className="text-xs mt-1">Points are earned when customers convert and pay the initial Rs.10,000</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.leaderboard.map((entry) => {
                                const isMe = entry.employee_id === employee?.id;
                                return (
                                    <div
                                        key={entry.employee_id}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                                            isMe
                                                ? "bg-sky/5 border-sky/20 ring-1 ring-sky/30"
                                                : getRankBg(entry.rank)
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {getRankIcon(entry.rank)}
                                            <div>
                                                <p className={`text-sm font-bold ${isMe ? "text-sky" : "text-text-primary"}`}>
                                                    {entry.employee_name}
                                                    {isMe && <span className="text-xs font-normal ml-2 text-sky/70">(you)</span>}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {entry.client_count} client{entry.client_count !== 1 ? "s" : ""} converted
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-text-primary flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow" />
                                                    {entry.total_points.toLocaleString()}
                                                </p>
                                                {entry.total_redeemed > 0 && (
                                                    <p className="text-xs text-text-secondary">
                                                        <Gift className="w-3 h-3 inline mr-0.5" />
                                                        {entry.total_redeemed.toLocaleString()} redeemed
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* How Points Work */}
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-sky" /> How Points Work
                    </h3>
                    <div className="space-y-3 text-sm text-text-secondary">
                        <div className="flex items-start gap-3">
                            <Zap className="w-4 h-4 text-yellow mt-0.5 flex-shrink-0" />
                            <p>Earn <strong className="text-text-primary">1,000 points</strong> for every customer you convert who pays the initial Rs.10,000 fee.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Target className="w-4 h-4 text-pink mt-0.5 flex-shrink-0" />
                            <p>Points become <strong className="text-text-primary">redeemable</strong> only when the company reaches milestones (total clients across all employees).</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Gift className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                            <p>Once a milestone is reached, all your accumulated points up to that point become redeemable.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
