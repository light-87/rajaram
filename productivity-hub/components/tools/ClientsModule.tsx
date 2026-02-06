"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BusinessClient, ProductBrand, SalesAgent } from "@/types/database";
import { Edit2, DollarSign, MapPin, Search, Save, X, ExternalLink, Trash2, Clock, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { logActivity } from "@/lib/tools-utils";
import { useEmployeeAuth } from "@/lib/employee-auth";

interface ClientsModuleProps {
    clients: BusinessClient[];
    onUpdate: () => void;
    brand: ProductBrand;
}

export default function ClientsModule({ clients, onUpdate, brand }: ClientsModuleProps) {
    const { employee, isAdmin } = useEmployeeAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingClient, setEditingClient] = useState<BusinessClient | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agents, setAgents] = useState<SalesAgent[]>([]);

    const fetchAgents = async () => {
        const { data } = await supabase.from("sales_agents").select("*").order("name");
        if (data) setAgents(data);
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const [editData, setEditData] = useState({
        setup_profit: "",
        recurring_profit: "",
        agent_name: "",
        agent_incentive: "",
        address: "",
        latitude: "",
        longitude: "",
        google_maps_link: ""
    });

    const handleEditClick = (client: BusinessClient) => {
        setEditingClient(client);
        setEditData({
            setup_profit: (client.setup_profit ?? 0).toString(),
            recurring_profit: (client.recurring_profit ?? 0).toString(),
            agent_name: client.agent_name || "",
            agent_incentive: (client.agent_incentive ?? 0).toString(),
            address: client.address || "",
            latitude: (client.latitude ?? "").toString(),
            longitude: (client.longitude ?? "").toString(),
            google_maps_link: client.google_maps_link || ""
        });
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("business_clients")
                .update({
                    setup_profit: parseFloat(editData.setup_profit) || 0,
                    recurring_profit: parseFloat(editData.recurring_profit) || 0,
                    agent_name: editData.agent_name,
                    agent_incentive: parseFloat(editData.agent_incentive) || 0,
                    address: editData.address,
                    latitude: parseFloat(editData.latitude) || null,
                    longitude: parseFloat(editData.longitude) || null,
                    google_maps_link: editData.google_maps_link
                })
                .eq("id", editingClient.id);

            if (error) throw error;

            await logActivity(
                "Client Updated",
                `Details updated for "${editingClient.name}"`,
                employee?.username
            );

            showToast("Client data updated!");
            setEditingClient(null);
            onUpdate();
        } catch (error) {
            console.error("Update error:", error);
            showToast("Failed to update client.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
    const [paidClient, setPaidClient] = useState<BusinessClient | null>(null);
    const [paidData, setPaidData] = useState({
        setup_profit: "",
        recurring_profit: ""
    });

    const handleMarkAsPaid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paidClient) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("business_clients")
                .update({
                    is_free_trial: false,
                    is_trial_converted: true,
                    trial_converted_at: new Date().toISOString(),
                    status: "active",
                    setup_profit: parseFloat(paidData.setup_profit) || 0,
                    recurring_profit: parseFloat(paidData.recurring_profit) || 0
                })
                .eq("id", paidClient.id);

            if (error) throw error;

            await logActivity(
                "Trial Converted to Paid",
                `"${paidClient.name}" free trial converted to paid client (Setup: Rs.${paidData.setup_profit}, Recurring: Rs.${paidData.recurring_profit})`,
                employee?.username
            );

            showToast("Client marked as paid! Financials updated.");
            setIsPaidModalOpen(false);
            setPaidClient(null);
            setPaidData({ setup_profit: "", recurring_profit: "" });
            onUpdate();
        } catch (error) {
            console.error("Error converting trial:", error);
            showToast("Failed to update client", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (client: BusinessClient) => {
        if (!confirm(`Are you sure you want to delete the client "${client.name}"?\n\nThis will also delete all related payments and follow-ups. This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from("business_clients")
                .delete()
                .eq("id", client.id);

            if (error) throw error;

            await logActivity(
                "Client Deleted",
                `Client "${client.name}" was deleted (Setup: ₹${client.setup_profit}, Recurring: ₹${client.recurring_profit}/yr)`,
                employee?.username
            );

            showToast("Client deleted successfully");
            onUpdate(); // This will trigger refetch and recalculation
        } catch (error) {
            console.error("Error deleting client:", error);
            showToast("Failed to delete client", "error");
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background-card border border-border/50 rounded-xl focus:border-pink/50 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredClients.map((client) => (
                    <div key={client.id} className={`card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${client.is_free_trial ? 'hover:border-purple/30 border-purple/10' : 'hover:border-sky/30'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${client.is_free_trial ? 'bg-purple/10 text-purple' : 'bg-sky/10 text-sky'}`}>
                                {client.is_free_trial ? <Clock className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-bold text-text-primary">{client.name}</h4>
                                    {client.is_free_trial && (
                                        <span className="text-[10px] px-2 py-0.5 bg-purple/10 text-purple rounded-full font-bold border border-purple/20">
                                            FREE TRIAL {client.trial_months ? `(${client.trial_months}mo)` : ""}
                                        </span>
                                    )}
                                    {client.is_trial_converted && (
                                        <span className="text-[10px] px-2 py-0.5 bg-green/10 text-green rounded-full font-bold border border-green/20 flex items-center gap-0.5">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> CONVERTED
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1 mt-1">
                                    <p className="text-sm text-text-secondary flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-red-400" /> {client.address}
                                    </p>
                                    {client.google_maps_link && (
                                        <a
                                            href={client.google_maps_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-sky hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-2.5 h-2.5" /> View on Google Maps
                                        </a>
                                    )}
                                </div>
                                {client.agent_name && (
                                    <p className="text-[10px] text-purple font-bold mt-2 uppercase flex items-center gap-1">
                                        Agent: {client.agent_name} {client.agent_incentive ? `(₹${client.agent_incentive})` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8">
                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-bold text-text-secondary uppercase">Total Revenue</p>
                                <p className="text-lg font-bold text-text-primary">₹{(Number(client.setup_profit) + Number(client.recurring_profit)).toLocaleString()}</p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-bold text-text-secondary uppercase">Setup Profit</p>
                                <p className="text-lg font-bold text-green">₹{Number(client.setup_profit).toLocaleString()}</p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-bold text-text-secondary uppercase">MRR/Profit</p>
                                <p className="text-lg font-bold text-sky">₹{Number(client.recurring_profit).toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2 ml-auto">
                                {client.is_free_trial && !client.is_trial_converted && (
                                    <button
                                        onClick={() => {
                                            setPaidClient(client);
                                            setPaidData({ setup_profit: "", recurring_profit: "" });
                                            setIsPaidModalOpen(true);
                                        }}
                                        className="px-3 py-2 bg-green/10 text-green hover:bg-green/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                        <DollarSign className="w-3.5 h-3.5" /> Mark as Paid
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditClick(client)}
                                    className="p-2 bg-border/20 rounded-lg text-text-secondary hover:text-sky hover:bg-sky/10 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteClient(client)}
                                        className="p-2 bg-red-400/10 rounded-lg text-red-400 hover:bg-red-400/20 transition-all"
                                        title="Delete client"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mark as Paid Modal */}
            <Modal
                isOpen={isPaidModalOpen}
                onClose={() => { setIsPaidModalOpen(false); setPaidClient(null); }}
                title="Convert Trial to Paid"
                color="green"
                size="md"
            >
                <form onSubmit={handleMarkAsPaid} className="space-y-4 p-2">
                    <div className="p-4 bg-green/5 border border-green/20 rounded-xl">
                        <p className="text-sm font-bold text-text-primary">{paidClient?.name}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            Trial period: {paidClient?.trial_months} month{(paidClient?.trial_months || 0) > 1 ? 's' : ''}
                            {paidClient?.trial_end_date && ` (ends ${new Date(paidClient.trial_end_date).toLocaleDateString()})`}
                        </p>
                    </div>

                    <p className="text-xs text-text-secondary">
                        Enter the financials now that the client has paid. This will add them to your finance tracking.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Setup Profit (Rs.)</label>
                            <input
                                required
                                type="number"
                                placeholder="10000"
                                value={paidData.setup_profit}
                                onChange={e => setPaidData({ ...paidData, setup_profit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Recurring Profit/yr (Rs.)</label>
                            <input
                                required
                                type="number"
                                placeholder="24000"
                                value={paidData.recurring_profit}
                                onChange={e => setPaidData({ ...paidData, recurring_profit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-green/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsPaidModalOpen(false); setPaidClient(null); }}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green text-white rounded-xl font-bold shadow-lg hover:bg-green/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Updating...' : 'Confirm Payment & Activate'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingClient}
                onClose={() => setEditingClient(null)}
                title="Edit Client Details"
                size="lg"
            >
                <form onSubmit={handleUpdateClient} className="space-y-6 p-2">
                    <div className="p-4 bg-border/10 rounded-xl">
                        <p className="text-sm font-bold text-text-primary">Editing: {editingClient?.name}</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-text-secondary uppercase border-b border-border/50 pb-1">Financials</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Setup Profit (₹)</label>
                                <input
                                    required
                                    type="number"
                                    value={editData.setup_profit}
                                    onChange={e => setEditData({ ...editData, setup_profit: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Recurring Profit/mo (₹)</label>
                                <input
                                    required
                                    type="number"
                                    value={editData.recurring_profit}
                                    onChange={e => setEditData({ ...editData, recurring_profit: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Agent Name</label>
                                <input
                                    type="text"
                                    list="agent-edit-suggestions"
                                    value={editData.agent_name}
                                    onChange={e => setEditData({ ...editData, agent_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                                />
                                <datalist id="agent-edit-suggestions">
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Agent Incentive (₹)</label>
                                <input
                                    type="number"
                                    value={editData.agent_incentive}
                                    onChange={e => setEditData({ ...editData, agent_incentive: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-text-secondary uppercase border-b border-border/50 pb-1">Location Details</h4>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Physical Address</label>
                            <textarea
                                rows={2}
                                value={editData.address}
                                onChange={e => setEditData({ ...editData, address: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Google Maps Link</label>
                            <input
                                type="url"
                                placeholder="https://maps.app.goo.gl/..."
                                value={editData.google_maps_link}
                                onChange={e => setEditData({ ...editData, google_maps_link: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Latitude</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 28.6139"
                                    value={editData.latitude}
                                    onChange={e => setEditData({ ...editData, latitude: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Longitude</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 77.2090"
                                    value={editData.longitude}
                                    onChange={e => setEditData({ ...editData, longitude: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setEditingClient(null)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-sky text-white rounded-xl font-bold shadow-lg hover:bg-sky/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
