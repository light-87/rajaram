"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployeeAuth } from "@/lib/employee-auth";
import { PointMilestone } from "@/types/database";
import {
    Trophy,
    Star,
    ChevronRight,
    Crown,
    Zap,
    Gift,
    TrendingUp,
    Users
} from "lucide-react";
import Link from "next/link";

interface EmployeePointsData {
    myPoints: number;
    myQualifiedClients: number;
    totalCompanyClients: number;
    milestones: PointMilestone[];
    currentMilestone: PointMilestone | null;
    nextMilestone: PointMilestone | null;
    totalRedeemed: number;
    redeemablePoints: number;
}

export default function EmployeePointsCard() {
    const { employee } = useEmployeeAuth();
    const [data, setData] = useState<EmployeePointsData>({
        myPoints: 0,
        myQualifiedClients: 0,
        totalCompanyClients: 0,
        milestones: [],
        currentMilestone: null,
        nextMilestone: null,
        totalRedeemed: 0,
        redeemablePoints: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchPointsData = useCallback(async () => {
        if (!employee?.id) return;

        try {
            setLoading(true);

            // Fetch all data in parallel
            const [
                { data: allClients },
                { data: myPoints },
                { data: milestones },
                { data: redemptions }
            ] = await Promise.all([
                supabase.from("business_clients").select("*"),
                supabase.from("employee_points").select("*").eq("employee_id", employee.id),
                supabase.from("point_milestones").select("*").order("milestone_count", { ascending: true }),
                supabase.from("point_redemptions").select("*").eq("employee_id", employee.id)
            ]);

            const totalClients = allClients?.length || 0;
            const totalMyPoints = (myPoints || []).reduce((sum: number, p: { points: number }) => sum + p.points, 0);
            const totalRedeemed = (redemptions || []).reduce((sum: number, r: { points_redeemed: number }) => sum + r.points_redeemed, 0);

            // Find current and next milestones
            const sortedMilestones = (milestones || []) as PointMilestone[];
            let currentMs: PointMilestone | null = null;
            let nextMs: PointMilestone | null = null;

            for (const ms of sortedMilestones) {
                if (totalClients >= ms.milestone_count) {
                    currentMs = ms;
                } else if (!nextMs) {
                    nextMs = ms;
                }
            }

            // Points are redeemable only if a milestone has been reached
            const redeemablePoints = currentMs ? totalMyPoints - totalRedeemed : 0;

            setData({
                myPoints: totalMyPoints,
                myQualifiedClients: (myPoints || []).length,
                totalCompanyClients: totalClients,
                milestones: sortedMilestones,
                currentMilestone: currentMs,
                nextMilestone: nextMs,
                totalRedeemed,
                redeemablePoints: Math.max(0, redeemablePoints)
            });
        } catch (error) {
            console.error("Error fetching points data:", error);
        } finally {
            setLoading(false);
        }
    }, [employee?.id]);

    useEffect(() => {
        fetchPointsData();
    }, [fetchPointsData]);

    if (loading) {
        return (
            <div className="card p-6 animate-pulse">
                <div className="h-6 bg-border/30 rounded w-40 mb-4" />
                <div className="h-20 bg-border/30 rounded" />
            </div>
        );
    }

    const progressToNext = data.nextMilestone
        ? Math.min(100, (data.totalCompanyClients / data.nextMilestone.milestone_count) * 100)
        : 100;

    return (
        <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow" /> Points System
                </h3>
                <Link
                    href="/tools/points"
                    className="text-xs text-sky hover:underline flex items-center gap-1"
                >
                    Leaderboard <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            {/* My Points Display */}
            <div className="bg-gradient-to-br from-yellow/10 via-transparent to-pink/5 rounded-xl p-4 border border-yellow/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow" />
                        <span className="text-sm font-medium text-text-secondary">My Points</span>
                    </div>
                    {data.currentMilestone && (
                        <span className="text-xs px-2 py-1 bg-yellow/10 text-yellow rounded-full font-bold">
                            {data.currentMilestone.label}
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-text-primary">
                    {data.myPoints.toLocaleString()}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-text-secondary">
                        <Zap className="w-3 h-3 inline mr-1 text-green" />
                        {data.myQualifiedClients} converted clients
                    </span>
                    {data.redeemablePoints > 0 && (
                        <span className="text-xs text-green font-bold flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {data.redeemablePoints.toLocaleString()} redeemable
                        </span>
                    )}
                </div>
            </div>

            {/* Company Progress */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Users className="w-3 h-3" /> Company Total
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                        {data.totalCompanyClients} clients
                    </span>
                </div>

                {/* Milestone Progress Bar */}
                {data.nextMilestone && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-secondary">
                                Next: {data.nextMilestone.label} ({data.nextMilestone.milestone_count})
                            </span>
                            <span className="text-xs font-bold text-yellow">
                                {Math.round(progressToNext)}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow to-pink rounded-full transition-all duration-700"
                                style={{ width: `${progressToNext}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-secondary mt-1">
                            {data.nextMilestone.milestone_count - data.totalCompanyClients} more clients to unlock redemption
                        </p>
                    </div>
                )}

                {!data.nextMilestone && data.currentMilestone && (
                    <div className="flex items-center gap-2 text-green text-sm font-medium">
                        <Crown className="w-4 h-4" />
                        All milestones reached!
                    </div>
                )}
            </div>

            {/* Milestone Badges */}
            <div className="flex gap-2 flex-wrap">
                {data.milestones.slice(0, 5).map((ms) => {
                    const reached = data.totalCompanyClients >= ms.milestone_count;
                    return (
                        <div
                            key={ms.id}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                                reached
                                    ? "bg-yellow/15 text-yellow border border-yellow/30"
                                    : "bg-border/10 text-text-secondary/50 border border-border/20"
                            }`}
                        >
                            {ms.label}
                        </div>
                    );
                })}
            </div>

            {/* Points Rule */}
            <p className="text-xs text-text-secondary border-t border-border/30 pt-3">
                <TrendingUp className="w-3 h-3 inline mr-1 text-sky" />
                Earn 1,000 pts per converted customer (after initial payment of Rs.10,000)
            </p>
        </div>
    );
}
