"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import {
    Users,
    ArrowLeft,
    Plus,
    UserPlus,
    Activity,
    Shield,
    Mail,
    Phone,
    DollarSign,
    Briefcase,
    Edit2,
    Trash2,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { SalesAgent, BusinessClient } from "@/types/database";
import { logActivity } from "@/lib/tools-utils";
import { showToast } from "@/components/ui/Toast";

export default function AgentsPage() {
    const { isAdmin, employee } = useEmployeeAuth();
    const [agents, setAgents] = useState<SalesAgent[]>([]);
    const [clients, setClients] = useState<BusinessClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAgent, setEditingAgent] = useState<SalesAgent | null>(null);

    // Form State
    const [agentForm, setAgentForm] = useState({
        name: "",
        phone: "",
        email: "",
        default_incentive: ""
    });

    const fetchData = async () => {
        try {
            const { data: agentsData } = await supabase
                .from("sales_agents")
                .select("*")
                .order("name");

            const { data: clientsData } = await supabase
                .from("business_clients")
                .select("agent_name, agent_incentive");

            setAgents(agentsData || []);
            setClients(clientsData || []);
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const handleSaveAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAgent) {
                const { error } = await supabase.from("sales_agents").update({
                    name: agentForm.name,
                    phone: agentForm.phone,
                    email: agentForm.email,
                    default_incentive: parseFloat(agentForm.default_incentive) || 0
                }).eq("id", editingAgent.id);

                if (error) throw error;

                await logActivity(
                    "Agent Updated",
                    `Sales agent "${agentForm.name}" details updated`,
                    employee?.username
                );
                showToast("Agent details updated!");
            } else {
                const { error } = await supabase.from("sales_agents").insert({
                    name: agentForm.name,
                    phone: agentForm.phone,
                    email: agentForm.email,
                    default_incentive: parseFloat(agentForm.default_incentive) || 0
                });

                if (error) throw error;

                await logActivity(
                    "Agent Added",
                    `New sales agent "${agentForm.name}" registered`,
                    employee?.username
                );
                showToast("Agent registered successfully!");
            }

            setAgentForm({ name: "", phone: "", email: "", default_incentive: "" });
            setEditingAgent(null);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving agent:", error);
            showToast("Failed to save agent.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAgent = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete agent "${name}"? This will not remove their historical deal association but they will no longer appear in suggestions.`)) return;

        try {
            const { error } = await supabase.from("sales_agents").delete().eq("id", id);
            if (error) throw error;

            await logActivity(
                "Agent Deleted",
                `Sales agent "${name}" was removed from the database`,
                employee?.username
            );

            showToast("Agent deleted.");
            fetchData();
        } catch (error) {
            console.error("Error deleting agent:", error);
            showToast("Failed to delete agent. They might be linked to active clients.", "error");
        }
    };

    const handleEditClick = (agent: SalesAgent) => {
        setEditingAgent(agent);
        setAgentForm({
            name: agent.name,
            phone: agent.phone || "",
            email: agent.email || "",
            default_incentive: (agent.default_incentive || 0).toString()
        });
        setIsModalOpen(true);
    };

    // Calculate agent stats
    const totalIncentives = clients.reduce((acc, curr) => acc + (Number(curr.agent_incentive) || 0), 0);

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-text-secondary">Unauthorized access.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-sky/10 border-b border-sky/20 px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/tools" className="text-sky flex items-center gap-1 text-sm font-medium hover:underline mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Portal
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-text-primary">Sales Agents</h1>
                            <p className="text-text-secondary">Manage external partners and track their incentives</p>
                        </div>

                        <button
                            onClick={() => {
                                setEditingAgent(null);
                                setAgentForm({ name: "", phone: "", email: "", default_incentive: "" });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky text-white rounded-xl font-bold hover:bg-sky/90 transition-all shadow-lg self-start"
                        >
                            <Plus className="w-5 h-5" /> Register Agent
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6 border-l-4 border-l-sky">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-text-secondary">Network Size</p>
                            <Briefcase className="w-5 h-5 text-sky" />
                        </div>
                        <p className="text-3xl font-bold text-text-primary">{agents.length} Agents</p>
                    </div>
                    <div className="card p-6 border-l-4 border-l-pink">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-text-secondary">Total Incentives Paid</p>
                            <DollarSign className="w-5 h-5 text-pink" />
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{totalIncentives.toLocaleString()}</p>
                    </div>
                </div>

                {/* Agent List */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-border/20 text-text-secondary text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">Agent Name</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Deals Closed</th>
                                    <th className="px-6 py-4 text-right">Default Incentive</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {agents.length > 0 ? agents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-border/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-sky/20 flex items-center justify-center text-[10px] font-bold text-sky uppercase">
                                                    {agent.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <p className="text-sm font-bold text-text-primary">{agent.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {agent.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                        <Phone className="w-3 h-3" /> {agent.phone}
                                                    </div>
                                                )}
                                                {agent.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                        <Mail className="w-3 h-3" /> {agent.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="sky">
                                                {clients.filter(c => c.agent_name === agent.name).length} Deals
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-bold text-text-primary">₹{Number(agent.default_incentive).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(agent)}
                                                    className="p-2 hover:bg-sky/10 rounded-lg transition-all text-sky"
                                                    title="Edit Agent"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAgent(agent.id, agent.name)}
                                                    className="p-2 hover:bg-red-400/10 rounded-lg transition-all text-red-400"
                                                    title="Delete Agent"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">No agents registered yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAgent ? "Edit Agent Info" : "Register New Sales Agent"}
                size="md"
            >
                <form onSubmit={handleSaveAgent} className="space-y-4 p-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Agent Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="John Carter"
                            value={agentForm.name}
                            onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Phone (Optional)</label>
                            <input
                                type="tel"
                                placeholder="+91 ..."
                                value={agentForm.phone}
                                onChange={e => setAgentForm({ ...agentForm, phone: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Default Incentive (₹)</label>
                            <input
                                type="number"
                                placeholder="1000"
                                value={agentForm.default_incentive}
                                onChange={e => setAgentForm({ ...agentForm, default_incentive: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Email (Optional)</label>
                        <input
                            type="email"
                            placeholder="agent@example.com"
                            value={agentForm.email}
                            onChange={e => setAgentForm({ ...agentForm, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingAgent(null);
                            }}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold hover:bg-border/30 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-sky text-white rounded-xl font-bold shadow-lg hover:bg-sky/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (editingAgent ? 'Update Agent' : 'Complete Registration')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
