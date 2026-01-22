"use client";

import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import { Lead, LeadStatus, ProductBrand, Profile, SalesAgent } from "@/types/database";
import {
    Plus,
    Search,
    Filter,
    Target,
    Phone,
    Mail,
    MapPin,
    Clock,
    User,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { geocodeAddress, logActivity } from "@/lib/tools-utils";
import { useEmployeeAuth } from "@/lib/employee-auth";

interface LeadsModuleProps {
    brand: ProductBrand;
    onConvert?: () => void;
}

export default function LeadsModule({ brand, onConvert }: LeadsModuleProps) {
    const { employee } = useEmployeeAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [agents, setAgents] = useState<SalesAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Lead Form State
    const [newLead, setNewLead] = useState({
        customer_name: "",
        phone: "",
        email: "",
        address: "",
        google_maps_link: "",
        latitude: "",
        longitude: "",
        notes: ""
    });

    // Convert to Client State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [clientData, setClientData] = useState({
        setup_profit: "",
        recurring_profit: "",
        agent_name: "",
        agent_incentive: ""
    });

    const fetchLeads = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("brand", brand)
                .neq("status", "converted")
                .order("created_at", { ascending: false });

            if (data) setLeads(data);

            // Also fetch employees for assignment
            const { data: profiles } = await supabase.from("profiles").select("*");
            if (profiles) setEmployees(profiles);

            // Fetch agents for conversion dropdown
            const { data: agentsData } = await supabase.from("sales_agents").select("*").order("name");
            if (agentsData) setAgents(agentsData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [brand]);

    const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
        try {
            const { error } = await supabase
                .from("leads")
                .update({ status: newStatus })
                .eq("id", leadId);

            if (error) throw error;

            const lead = leads.find(l => l.id === leadId);
            await logActivity(
                "Lead Status Updated",
                `Lead "${lead?.customer_name}" marked as ${newStatus}`,
                employee?.username
            );

            fetchLeads();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleAssignLead = async (leadId: string, employeeId: string) => {
        try {
            const { error } = await supabase
                .from("leads")
                .update({ assigned_to: employeeId })
                .eq("id", leadId);

            if (error) throw error;

            const lead = leads.find(l => l.id === leadId);
            const assignedTo = employees.find(e => e.id === employeeId);
            await logActivity(
                "Lead Assigned",
                `Lead "${lead?.customer_name}" assigned to ${assignedTo?.full_name}`,
                employee?.username
            );

            fetchLeads();
        } catch (error) {
            console.error("Error assigning lead:", error);
        }
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let lat = parseFloat(newLead.latitude);
            let lng = parseFloat(newLead.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                try {
                    const coords = await geocodeAddress(newLead.address);
                    if (coords) {
                        lat = coords[0];
                        lng = coords[1];
                    } else {
                        lat = 0;
                        lng = 0;
                    }
                } catch (e) {
                    console.error("Geocoding failed, using 0,0");
                    lat = 0;
                    lng = 0;
                }
            }

            const { error: leadError } = await supabase.from("leads").insert({
                customer_name: newLead.customer_name,
                phone: newLead.phone,
                email: newLead.email,
                address: newLead.address,
                google_maps_link: newLead.google_maps_link,
                brand,
                latitude: lat,
                longitude: lng,
                status: "new",
                created_by: employee?.id,
                notes: newLead.notes
            });

            if (leadError) throw leadError;

            await logActivity(
                "Lead Added",
                `New lead "${newLead.customer_name}" added for ${brand}`,
                employee?.username
            );

            setNewLead({
                customer_name: "",
                phone: "",
                email: "",
                address: "",
                google_maps_link: "",
                latitude: "",
                longitude: "",
                notes: ""
            });
            setIsModalOpen(false);
            showToast("Lead added successfully!");
            fetchLeads();
        } catch (error) {
            console.error("Error adding lead:", error);
            showToast("Failed to add lead. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConvertToClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setIsSubmitting(true);
        try {
            // 1. Insert into business_clients
            const { error: clientError } = await supabase.from("business_clients").insert({
                name: selectedLead.customer_name,
                brand: selectedLead.brand,
                address: selectedLead.address,
                latitude: selectedLead.latitude,
                longitude: selectedLead.longitude,
                google_maps_link: selectedLead.google_maps_link,
                setup_profit: parseFloat(clientData.setup_profit) || 0,
                recurring_profit: parseFloat(clientData.recurring_profit) || 0,
                agent_name: clientData.agent_name,
                agent_incentive: parseFloat(clientData.agent_incentive) || 0,
                payment_frequency: "monthly",
                status: "active",
                created_by: employee?.id
            });

            if (clientError) throw clientError;

            // 2. Update Lead Status
            const { error: leadError } = await supabase
                .from("leads")
                .update({ status: "converted" })
                .eq("id", selectedLead.id);

            if (leadError) throw leadError;

            // 3. Log Activity
            await logActivity(
                "Lead Converted",
                `Lead "${selectedLead.customer_name}" converted to Business Client`,
                employee?.username
            );

            // 4. Reset & Close
            setIsConvertModalOpen(false);
            setClientData({ setup_profit: "", recurring_profit: "", agent_name: "", agent_incentive: "" });
            showToast("Lead converted to Client!");
            if (onConvert) onConvert();
            fetchLeads();
        } catch (error) {
            console.error("Conversion error:", error);
            showToast("Failed to convert lead.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const filteredLeads = leads.filter(lead =>
        lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: LeadStatus) => {
        switch (status) {
            case 'new': return <Badge variant="warning">New</Badge>;
            case 'contacted': return <Badge variant="sky">Contacted</Badge>;
            case 'qualified': return <Badge variant="purple">Qualified</Badge>;
            case 'converted': return <Badge variant="success">Converted</Badge>;
            case 'lost': return <Badge variant="danger">Lost</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${brand === 'Kuberbook' ? 'bg-sky/10 text-sky' : 'bg-yellow/10 text-yellow'}`}>
                        <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">{brand} Leads</h2>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-lg ${brand === 'Kuberbook' ? 'bg-sky hover:bg-sky/90' : 'bg-yellow hover:bg-yellow/90 font-bold'}`}
                >
                    <Plus className="w-5 h-5" />
                    Add New Lead
                </button>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search leads by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background-card border border-border/50 rounded-xl focus:border-pink/50 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-background-card border border-border/50 rounded-xl text-text-secondary hover:text-text-primary transition-all">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Leads List */}
            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loading text="Fetching leads..." />
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="card p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-border/20 rounded-full flex items-center justify-center mx-auto text-text-secondary">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-text-primary">No leads found</p>
                        <p className="text-text-secondary">Start by adding your first lead for {brand}.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map((lead) => (
                        <div key={lead.id} className="card p-6 flex flex-col justify-between group hover:border-pink/30 transition-all">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-text-primary group-hover:text-pink transition-colors">{lead.customer_name}</h4>
                                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" /> Added {new Date(lead.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {getStatusBadge(lead.status)}
                                </div>

                                <div className="space-y-2">
                                    {lead.phone && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Phone className="w-3 h-3 text-green" /> {lead.phone}
                                        </div>
                                    )}
                                    {lead.email && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Mail className="w-3 h-3 text-sky" /> {lead.email}
                                        </div>
                                    )}
                                    {lead.address && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary line-clamp-1">
                                            <MapPin className="w-3 h-3 text-red-400" /> {lead.address}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {lead.assigned_to ? (
                                            <div title={`Assigned to ${employees.find(e => e.id === lead.assigned_to)?.full_name}`} className="w-8 h-8 rounded-full bg-purple/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-purple uppercase">
                                                {employees.find(e => e.id === lead.assigned_to)?.full_name.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-background flex items-center justify-center text-gray-400">
                                                <User className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                                            className="text-[10px] font-bold bg-border/20 border-none rounded-lg px-2 py-1 outline-none"
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="lost">Lost</option>
                                        </select>

                                        <select
                                            value={lead.assigned_to || ""}
                                            onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                                            className="text-[10px] font-bold bg-border/20 border-none rounded-lg px-2 py-1 outline-none"
                                        >
                                            <option value="">Assign To...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {lead.status === 'qualified' && (
                                    <button
                                        onClick={() => {
                                            setSelectedLead(lead);
                                            setIsConvertModalOpen(true);
                                        }}
                                        className={`w-full py-2.5 ${brand === 'Kuberbook' ? 'bg-sky/10 text-sky hover:bg-sky/20' : 'bg-yellow/10 text-yellow hover:bg-yellow/20'} rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2`}
                                    >
                                        Convert to Client <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Lead Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Add New ${brand} Lead`}
                size="lg"
            >
                <form onSubmit={handleAddLead} className="space-y-4 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Customer Name</label>
                            <input
                                required
                                type="text"
                                placeholder="John Doe"
                                value={newLead.customer_name}
                                onChange={e => setNewLead({ ...newLead, customer_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+91 ..."
                                value={newLead.phone}
                                onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Email Address</label>
                        <input
                            type="email"
                            placeholder="john@example.com"
                            value={newLead.email}
                            onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Office/Site Address</label>
                        <textarea
                            rows={2}
                            placeholder="Full address for map pinning..."
                            value={newLead.address}
                            onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none resize-none"
                        />
                        <p className="text-[10px] text-text-secondary italic">We will automatically attempt to find this on the map.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Google Maps Link (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://maps.app.goo.gl/..."
                            value={newLead.google_maps_link}
                            onChange={e => setNewLead({ ...newLead, google_maps_link: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Latitude (Manual Override)</label>
                            <input
                                type="text"
                                placeholder="e.g. 28.6139"
                                value={newLead.latitude}
                                onChange={e => setNewLead({ ...newLead, latitude: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Longitude (Manual Override)</label>
                            <input
                                type="text"
                                placeholder="e.g. 77.2090"
                                value={newLead.longitude}
                                onChange={e => setNewLead({ ...newLead, longitude: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Notes</label>
                        <textarea
                            rows={3}
                            placeholder="Any specific requirements..."
                            value={newLead.notes}
                            onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold hover:bg-border/30 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all ${brand === 'Kuberbook' ? 'bg-sky hover:bg-sky/90' : 'bg-yellow hover:bg-yellow/90'} disabled:opacity-50`}
                        >
                            {isSubmitting ? 'Adding...' : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Convert to Client Modal */}
            <Modal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                title="Convert Lead to Client"
                size="md"
            >
                <form onSubmit={handleConvertToClient} className="space-y-4 p-2">
                    <div className="p-4 bg-border/10 rounded-xl mb-4">
                        <p className="text-sm font-bold text-text-primary">{selectedLead?.customer_name}</p>
                        <p className="text-xs text-text-secondary">{selectedLead?.address}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Setup Profit (₹)</label>
                            <input
                                required
                                type="number"
                                placeholder="10000"
                                value={clientData.setup_profit}
                                onChange={e => setClientData({ ...clientData, setup_profit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Recurring Profit/mo (₹)</label>
                            <input
                                required
                                type="number"
                                placeholder="2000"
                                value={clientData.recurring_profit}
                                onChange={e => setClientData({ ...clientData, recurring_profit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Agent Name (Optional)</label>
                            <input
                                type="text"
                                list="agent-suggestions"
                                placeholder="Type or select agent..."
                                value={clientData.agent_name}
                                onChange={e => {
                                    const val = e.target.value;
                                    const agent = agents.find(a => a.name === val);
                                    setClientData({
                                        ...clientData,
                                        agent_name: val,
                                        agent_incentive: agent ? (agent.default_incentive?.toString() || "") : clientData.agent_incentive
                                    });
                                }}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none text-xs"
                            />
                            <datalist id="agent-suggestions">
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.name} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Agent Incentive (₹)</label>
                            <input
                                type="number"
                                placeholder="1000"
                                value={clientData.agent_incentive}
                                onChange={e => setClientData({ ...clientData, agent_incentive: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-sky/50 outline-none"
                            />
                        </div>
                    </div>

                    <p className="text-[10px] text-text-secondary italic pt-2">
                        Conversion will create an active client. Total contract value is derived from profits.
                    </p>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsConvertModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all ${brand === 'Kuberbook' ? 'bg-sky hover:bg-sky/90' : 'bg-yellow hover:bg-yellow/90'} disabled:opacity-50`}
                        >
                            {isSubmitting ? 'Converting...' : 'Complete Conversion'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
