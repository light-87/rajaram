"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import {
    BookMarked,
    Sun,
    Users,
    Target,
    TrendingUp,
    Plus,
    ArrowRight,
    Settings,
    DollarSign,
    Briefcase
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ToolsPage() {
    const { employee, logout, isAdmin } = useEmployeeAuth();
    const [stats, setStats] = useState([
        { label: "New Leads", value: "...", icon: Target, color: "sky" },
        { label: "Active Clients", value: "...", icon: Users, color: "green" },
        { label: "Revenue (Proj.)", value: "...", icon: TrendingUp, color: "pink" },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Leads
                const { data: leads } = await supabase
                    .from("leads")
                    .select("*")
                    .neq("status", "converted");

                // Fetch Clients 
                const { data: clients } = await supabase
                    .from("business_clients")
                    .select("*");

                const totalRevenue = (clients || []).reduce((acc: number, curr: any) =>
                    acc + (Number(curr.setup_profit) || 0) + (Number(curr.recurring_profit) || 0), 0
                );

                setStats([
                    { label: "Total Leads", value: (leads?.length || 0).toString(), icon: Target, color: "sky" },
                    { label: "Active Clients", value: (clients?.length || 0).toString(), icon: Users, color: "green" },
                    {
                        label: "Est. Revenue",
                        value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
                        icon: TrendingUp,
                        color: "pink"
                    },
                ]);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
    }, []);

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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                {/* Welcome Section */}
                <section>
                    <h2 className="text-3xl font-bold text-text-primary">
                        Welcome back, {employee?.full_name.split(' ')[0]}!
                    </h2>
                    <p className="text-text-secondary mt-1">Here's what's happening with our projects today.</p>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="card p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Brand Selector */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-pink-purple rounded-full" />
                            Select Product
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Kuberbook */}
                        <Link
                            href="/tools/kuberbook"
                            className="group relative overflow-hidden rounded-3xl bg-background-card border border-border/50 p-8 hover:border-sky/50 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-sky/20 transition-colors" />
                            <div className="relative space-y-4">
                                <div className="p-4 rounded-2xl bg-sky/10 w-fit">
                                    <BookMarked className="w-8 h-8 text-sky" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-text-primary">Kuberbook</h4>
                                    <p className="text-text-secondary">Digital ledger and inventory management</p>
                                </div>
                                <div className="flex items-center gap-2 text-sky font-medium">
                                    Open Dashboard <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        {/* Solar Vendor */}
                        <Link
                            href="/tools/solar"
                            className="group relative overflow-hidden rounded-3xl bg-background-card border border-border/50 p-8 hover:border-yellow/50 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-yellow/20 transition-colors" />
                            <div className="relative space-y-4">
                                <div className="p-4 rounded-2xl bg-yellow/10 w-fit">
                                    <Sun className="w-8 h-8 text-yellow" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-text-primary">Solar Vendor</h4>
                                    <p className="text-text-secondary">Solar installation and vendor management</p>
                                </div>
                                <div className="flex items-center gap-2 text-yellow font-medium">
                                    Open Dashboard <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Admin/Finance Section (Conditional) */}
                {isAdmin && (
                    <section className="space-y-6">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-pink-purple rounded-full" />
                            Management
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Link
                                href="/tools/admin/employees"
                                className="card p-6 flex items-center justify-between group hover:border-purple/50 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-purple/10 text-purple">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">Employees</p>
                                        <p className="text-xs text-text-secondary">Access Control & Staff</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-purple transition-all" />
                            </Link>

                            <Link
                                href="/tools/agents"
                                className="card p-6 flex items-center justify-between group hover:border-sky/50 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-sky/10 text-sky">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">Sales Agents</p>
                                        <p className="text-xs text-text-secondary">External Partners & Leads</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-sky transition-all" />
                            </Link>

                            <Link
                                href="/tools/finance"
                                className="card p-6 flex items-center justify-between group hover:border-green/50 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-green/10 text-green">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">Finance</p>
                                        <p className="text-xs text-text-secondary">Expenses & Profitability</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-green transition-all" />
                            </Link>

                            <div className="card p-6 flex items-center justify-between opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-yellow/10 text-yellow">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">Settings</p>
                                        <p className="text-xs text-text-secondary">System configuration</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
