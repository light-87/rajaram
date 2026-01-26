"use client";

export const dynamic = "force-dynamic";

import LeadsModule from "@/components/tools/LeadsModule";
import ClientsMapModule from "@/components/tools/ClientsMapModule";
import ClientsModule from "@/components/tools/ClientsModule";
import { ArrowLeft, LayoutDashboard, Users, Map as MapIcon, List } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BusinessClient } from "@/types/database";
import { showToast } from "@/components/ui/Toast";

type Tab = "leads" | "clients";

export default function KuberbookPage() {
    const [activeTab, setActiveTab] = useState<Tab>("leads");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [clients, setClients] = useState<BusinessClient[]>([]);

    const fetchClients = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("business_clients")
                .select("*")
                .eq("brand", "Kuberbook");

            if (error) {
                console.error("Error fetching clients:", error);
                showToast("Failed to load clients", "error");
            } else {
                setClients(data || []);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            showToast("Failed to load clients", "error");
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Brand Header */}
            <div className="bg-sky/10 border-b border-sky/20 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/tools" className="text-sky flex items-center gap-1 text-sm font-medium hover:underline mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Portal
                        </Link>
                        <h1 className="text-3xl font-bold text-text-primary">Kuberbook Dashboard</h1>
                        <p className="text-text-secondary">Sales & Client Management for Kuberbook Project</p>
                    </div>

                    <div className="flex bg-background/50 p-1 rounded-xl border border-border/50 self-start sm:self-center">
                        <button
                            onClick={() => setActiveTab("leads")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'leads' ? 'bg-sky text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Leads
                        </button>
                        <button
                            onClick={() => setActiveTab("clients")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'clients' ? 'bg-sky text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <Users className="w-4 h-4" /> Clients
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "leads" && <LeadsModule brand="Kuberbook" onConvert={fetchClients} />}
                {activeTab === "clients" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">Kuberbook Clients</h2>
                                <p className="text-sm text-text-secondary">Managing active recurring business relationships</p>
                            </div>

                            <div className="flex bg-background/50 p-1 rounded-xl border border-border/50">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-sky text-white shadow-sm' : 'text-text-secondary'}`}
                                >
                                    <List className="w-3.5 h-3.5" /> List
                                </button>
                                <button
                                    onClick={() => setViewMode("map")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-sky text-white shadow-sm' : 'text-text-secondary'}`}
                                >
                                    <MapIcon className="w-3.5 h-3.5" /> Map
                                </button>
                            </div>
                        </div>

                        {viewMode === "map" ? (
                            <ClientsMapModule clients={clients} brand="Kuberbook" />
                        ) : (
                            <ClientsModule clients={clients} onUpdate={fetchClients} brand="Kuberbook" />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
