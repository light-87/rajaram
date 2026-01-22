"use client";

export const dynamic = "force-dynamic";

import LeadsModule from "@/components/tools/LeadsModule";
import ClientsMapModule from "@/components/tools/ClientsMapModule";
import ClientsModule from "@/components/tools/ClientsModule";
import { ArrowLeft, LayoutDashboard, Users, FileText, Settings, Map as MapIcon, List } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BusinessClient } from "@/types/database";

type Tab = "leads" | "clients" | "reports";

export default function SolarPage() {
    const [activeTab, setActiveTab] = useState<Tab>("leads");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [clients, setClients] = useState<BusinessClient[]>([]);

    const fetchClients = async () => {
        const { data } = await supabase
            .from("business_clients")
            .select("*")
            .eq("brand", "Solar Vendor");
        if (data) setClients(data);
    };

    useEffect(() => {
        fetchClients();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Brand Header */}
            <div className="bg-yellow/10 border-b border-yellow/20 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/tools" className="text-yellow flex items-center gap-1 text-sm font-bold hover:underline mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Portal
                        </Link>
                        <h1 className="text-3xl font-bold text-text-primary">Solar Vendor Dashboard</h1>
                        <p className="text-text-secondary">Sales & Vendor Management for Solar Project</p>
                    </div>

                    <div className="flex bg-background/50 p-1 rounded-xl border border-border/50 self-start sm:self-center">
                        <button
                            onClick={() => setActiveTab("leads")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'leads' ? 'bg-yellow text-background shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Leads
                        </button>
                        <button
                            onClick={() => setActiveTab("clients")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'clients' ? 'bg-yellow text-background shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <Users className="w-4 h-4" /> Clients
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "leads" && <LeadsModule brand="Solar Vendor" onConvert={fetchClients} />}
                {activeTab === "clients" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">Solar Clients</h2>
                                <p className="text-sm text-text-secondary">Managing active vendor relationships & solar projects</p>
                            </div>

                            <div className="flex bg-background/50 p-1 rounded-xl border border-border/50">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-yellow text-background shadow-sm' : 'text-text-secondary'}`}
                                >
                                    <List className="w-3.5 h-3.5" /> List
                                </button>
                                <button
                                    onClick={() => setViewMode("map")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-yellow text-background shadow-sm' : 'text-text-secondary'}`}
                                >
                                    <MapIcon className="w-3.5 h-3.5" /> Map
                                </button>
                            </div>
                        </div>

                        {viewMode === "map" ? (
                            <ClientsMapModule clients={clients} brand="Solar Vendor" />
                        ) : (
                            <ClientsModule clients={clients} onUpdate={fetchClients} brand="Solar Vendor" />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
