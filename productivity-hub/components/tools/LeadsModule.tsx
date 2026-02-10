"use client";

import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import { Lead, LeadStatus, ProductBrand, Profile, SalesAgent, FollowUp, FollowUpType, FollowUpStatus } from "@/types/database";
import VendorProspectsPanel from "@/components/tools/VendorProspectsPanel";
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
    ArrowRight,
    Calendar,
    Copy,
    CheckCircle2,
    MessageSquare,
    Trash2,
    Database
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { geocodeAddress, logActivity } from "@/lib/tools-utils";
import { useEmployeeAuth } from "@/lib/employee-auth";

interface LeadsModuleProps {
    brand: ProductBrand;
    onConvert?: () => void;
}

export default function LeadsModule({ brand, onConvert }: LeadsModuleProps) {
    const { employee, isAdmin } = useEmployeeAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [agents, setAgents] = useState<SalesAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProspectsOpen, setIsProspectsOpen] = useState(false);

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
        agent_incentive: "",
        is_free_trial: false,
        trial_months: "1"
    });

    // Follow-up State
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        scheduled_date: "",
        scheduled_time: "",
        type: "call" as FollowUpType,
        notes: ""
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("brand", brand)
                .neq("status", "converted")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching leads:", error);
                showToast("Failed to load leads", "error");
            } else {
                setLeads(data || []);
            }

            // Also fetch employees for assignment
            const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*");
            if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
            } else {
                setEmployees(profiles || []);
            }

            // Fetch agents for conversion dropdown
            const { data: agentsData, error: agentsError } = await supabase.from("sales_agents").select("*").order("name");
            if (agentsError) {
                console.error("Error fetching agents:", agentsError);
            } else {
                setAgents(agentsData || []);
            }
        } catch (e) {
            console.error("Unexpected error:", e);
            showToast("Failed to load data", "error");
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
                employee?.username,
                employee?.id
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
                employee?.username,
                employee?.id
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
                employee?.username,
                employee?.id
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
            const isTrial = clientData.is_free_trial;
            const trialMonths = parseInt(clientData.trial_months) || 1;

            // Calculate trial end date
            let trialEndDate: string | null = null;
            if (isTrial) {
                const end = new Date();
                end.setMonth(end.getMonth() + trialMonths);
                trialEndDate = end.toISOString().split('T')[0];
            }

            // 1. Insert into business_clients - include phone and email from lead
            const insertData: Record<string, unknown> = {
                name: selectedLead.customer_name,
                brand: selectedLead.brand,
                phone: selectedLead.phone,
                email: selectedLead.email,
                address: selectedLead.address,
                latitude: selectedLead.latitude,
                longitude: selectedLead.longitude,
                google_maps_link: selectedLead.google_maps_link,
                setup_profit: isTrial ? 0 : (parseFloat(clientData.setup_profit) || 0),
                recurring_profit: isTrial ? 0 : (parseFloat(clientData.recurring_profit) || 0),
                agent_name: clientData.agent_name,
                agent_incentive: parseFloat(clientData.agent_incentive) || 0,
                payment_frequency: "monthly",
                status: isTrial ? "trial" : "active",
                created_by: employee?.id,
                is_free_trial: isTrial,
                trial_months: isTrial ? trialMonths : null,
                trial_end_date: trialEndDate,
                is_trial_converted: false
            };

            // Calculate next_payment_due: 1 year from today for paid clients, 1 year from trial start for trials
            const nextPaymentDue = new Date();
            nextPaymentDue.setFullYear(nextPaymentDue.getFullYear() + 1);
            insertData.contract_start_date = new Date().toISOString().split('T')[0];
            insertData.next_payment_due = nextPaymentDue.toISOString().split('T')[0];

            const { data: newClient, error: clientError } = await supabase
                .from("business_clients")
                .insert(insertData)
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Update Lead Status
            const { error: leadError } = await supabase
                .from("leads")
                .update({ status: "converted" })
                .eq("id", selectedLead.id);

            if (leadError) {
                console.error("Failed to update lead status:", leadError);
                showToast("Client created but lead status update failed", "error");
            }

            // 3. Auto-create payment records for paid (non-trial) conversions
            if (!isTrial && newClient?.id) {
                const setupAmount = parseFloat(clientData.setup_profit) || 0;
                const recurringAmount = parseFloat(clientData.recurring_profit) || 0;
                const paymentRecords = [];

                if (setupAmount > 0) {
                    paymentRecords.push({
                        client_id: newClient.id,
                        amount: setupAmount,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_type: "setup",
                        status: "completed",
                        notes: "Auto-recorded on client conversion",
                        recorded_by: employee?.id
                    });
                }
                if (recurringAmount > 0) {
                    paymentRecords.push({
                        client_id: newClient.id,
                        amount: recurringAmount,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_type: "recurring",
                        status: "completed",
                        notes: "First year payment - auto-recorded on client conversion",
                        recorded_by: employee?.id
                    });
                }

                if (paymentRecords.length > 0) {
                    await supabase.from("payments").insert(paymentRecords);
                }
            }

            // 4. Award 1000 points for non-trial conversions
            if (!isTrial && newClient?.id && employee?.id) {
                await supabase.from("employee_points").insert({
                    employee_id: employee.id,
                    client_id: newClient.id,
                    points: 1000
                });
            }

            // 5. Log Activity
            await logActivity(
                "Lead Converted",
                `Lead "${selectedLead.customer_name}" converted to ${isTrial ? `Free Trial (${trialMonths} month${trialMonths > 1 ? 's' : ''})` : 'Business Client'}`,
                employee?.username,
                employee?.id
            );

            // 5. Reset & Close
            setIsConvertModalOpen(false);
            setClientData({ setup_profit: "", recurring_profit: "", agent_name: "", agent_incentive: "", is_free_trial: false, trial_months: "1" });
            showToast(isTrial ? "Free trial client created!" : "Lead converted to Client!");
            if (onConvert) onConvert();
            fetchLeads();
        } catch (error) {
            console.error("Conversion error:", error);
            showToast("Failed to convert lead.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("follow_ups").insert({
                lead_id: selectedLead.id,
                scheduled_date: followUpData.scheduled_date,
                scheduled_time: followUpData.scheduled_time || null,
                type: followUpData.type,
                notes: followUpData.notes || null,
                status: "pending",
                assigned_to: selectedLead.assigned_to || employee?.id,
                created_by: employee?.id
            });

            if (error) throw error;

            // Also update the lead's next_follow_up field
            await supabase.from("leads").update({
                next_follow_up: followUpData.scheduled_date,
                follow_up_notes: followUpData.notes || null
            }).eq("id", selectedLead.id);

            await logActivity(
                "Follow-up Scheduled",
                `${followUpData.type} follow-up scheduled for "${selectedLead.customer_name}" on ${followUpData.scheduled_date}`,
                employee?.username,
                employee?.id
            );

            setIsFollowUpModalOpen(false);
            setFollowUpData({ scheduled_date: "", scheduled_time: "", type: "call", notes: "" });
            showToast("Follow-up scheduled!");
            fetchLeads();
        } catch (error) {
            console.error("Error scheduling follow-up:", error);
            showToast("Failed to schedule follow-up", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLead = async (lead: Lead) => {
        if (!confirm(`Are you sure you want to delete the lead "${lead.customer_name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from("leads")
                .delete()
                .eq("id", lead.id);

            if (error) throw error;

            await logActivity(
                "Lead Deleted",
                `Lead "${lead.customer_name}" was deleted`,
                employee?.username,
                employee?.id
            );

            showToast("Lead deleted successfully");
            fetchLeads();
        } catch (error) {
            console.error("Error deleting lead:", error);
            showToast("Failed to delete lead", "error");
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            showToast("Copied to clipboard!");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            showToast("Failed to copy", "error");
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

                <div className="flex gap-2">
                    {brand === 'Solar Vendor' && (
                        <button
                            onClick={() => setIsProspectsOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green/10 text-green border border-green/30 rounded-xl transition-all hover:bg-green/20 font-bold"
                        >
                            <Database className="w-5 h-5" />
                            Vendor Prospects
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-lg ${brand === 'Kuberbook' ? 'bg-sky hover:bg-sky/90' : 'bg-yellow hover:bg-yellow/90 font-bold'}`}
                    >
                        <Plus className="w-5 h-5" />
                        Add New Lead
                    </button>
                </div>
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
                                        <div className="flex items-center justify-between gap-2 text-sm text-text-secondary group/copy">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Phone className="w-3 h-3 text-green flex-shrink-0" />
                                                <span className="truncate">{lead.phone}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(lead.phone!, `phone-${lead.id}`)}
                                                className="p-1 hover:bg-border/30 rounded opacity-0 group-hover/copy:opacity-100 transition-all"
                                                title="Copy phone"
                                            >
                                                {copiedId === `phone-${lead.id}` ? (
                                                    <CheckCircle2 className="w-3 h-3 text-green" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    {lead.email && (
                                        <div className="flex items-center justify-between gap-2 text-sm text-text-secondary group/copy">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Mail className="w-3 h-3 text-sky flex-shrink-0" />
                                                <span className="truncate">{lead.email}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(lead.email!, `email-${lead.id}`)}
                                                className="p-1 hover:bg-border/30 rounded opacity-0 group-hover/copy:opacity-100 transition-all"
                                                title="Copy email"
                                            >
                                                {copiedId === `email-${lead.id}` ? (
                                                    <CheckCircle2 className="w-3 h-3 text-green" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    {lead.address && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary line-clamp-1">
                                            <MapPin className="w-3 h-3 text-red-400" /> {lead.address}
                                        </div>
                                    )}
                                </div>

                                {/* Next Follow-up indicator */}
                                {lead.next_follow_up && (
                                    <div className="flex items-center gap-2 text-xs text-purple bg-purple/10 px-2 py-1 rounded-lg w-fit">
                                        <Calendar className="w-3 h-3" />
                                        Next: {format(new Date(lead.next_follow_up), "MMM d")}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {lead.assigned_to ? (
                                            <div title={`Assigned to ${employees.find(e => e.id === lead.assigned_to)?.full_name || 'Unknown'}`} className="w-8 h-8 rounded-full bg-purple/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-purple uppercase">
                                                {employees.find(e => e.id === lead.assigned_to)?.full_name?.split(' ').filter(Boolean).map((n: string) => n[0] || '').join('') || '?'}
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
                                            className="text-[10px] font-bold bg-background-card border border-border/50 rounded-lg px-2 py-1.5 outline-none text-text-primary cursor-pointer hover:border-pink/50 transition-colors"
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="lost">Lost</option>
                                        </select>

                                        <select
                                            value={lead.assigned_to || ""}
                                            onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                                            className="text-[10px] font-bold bg-background-card border border-border/50 rounded-lg px-2 py-1.5 outline-none text-text-primary cursor-pointer hover:border-pink/50 transition-colors"
                                        >
                                            <option value="">Assign To...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedLead(lead);
                                            setFollowUpData({
                                                ...followUpData,
                                                scheduled_date: new Date().toISOString().split('T')[0]
                                            });
                                            setIsFollowUpModalOpen(true);
                                        }}
                                        className="flex-1 py-2 bg-purple/10 text-purple hover:bg-purple/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Calendar className="w-3 h-3" /> Follow-up
                                    </button>

                                    {lead.status === 'qualified' && (
                                        <button
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setIsConvertModalOpen(true);
                                            }}
                                            className={`flex-1 py-2 ${brand === 'Kuberbook' ? 'bg-sky/10 text-sky hover:bg-sky/20' : 'bg-yellow/10 text-yellow hover:bg-yellow/20'} rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5`}
                                        >
                                            Convert <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteLead(lead)}
                                            className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-xl transition-all"
                                            title="Delete lead"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
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
                            <label className="text-xs font-bold text-text-secondary uppercase">Recurring Profit/yr (₹)</label>
                            <input
                                required
                                type="number"
                                placeholder="24000"
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

                    {/* Free Trial Toggle */}
                    <div className="border border-border/50 rounded-xl p-4 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={clientData.is_free_trial}
                                onChange={(e) => setClientData({ ...clientData, is_free_trial: e.target.checked })}
                                className="w-4 h-4 accent-purple"
                            />
                            <span className="text-sm font-bold text-text-primary">Free Trial</span>
                            <span className="text-[10px] text-text-secondary">(No financials until converted to paid)</span>
                        </label>

                        {clientData.is_free_trial && (
                            <div className="space-y-1 pl-7">
                                <label className="text-xs font-bold text-text-secondary uppercase">Trial Duration</label>
                                <select
                                    value={clientData.trial_months}
                                    onChange={e => setClientData({ ...clientData, trial_months: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none text-sm"
                                >
                                    <option value="1">1 month</option>
                                    <option value="2">2 months</option>
                                    <option value="3">3 months</option>
                                    <option value="6">6 months</option>
                                </select>
                                <p className="text-[10px] text-purple italic">
                                    Client will be added without financials. Mark as Paid later to include in finance.
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-text-secondary italic pt-2">
                        {clientData.is_free_trial
                            ? "Free trial will create a client without affecting financials. Convert to paid after trial ends."
                            : "Conversion will create an active client. Total contract value is derived from profits."
                        }
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
                            {isSubmitting ? 'Converting...' : clientData.is_free_trial ? 'Start Free Trial' : 'Complete Conversion'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Schedule Follow-up Modal */}
            <Modal
                isOpen={isFollowUpModalOpen}
                onClose={() => setIsFollowUpModalOpen(false)}
                title="Schedule Follow-up"
                size="md"
            >
                <form onSubmit={handleScheduleFollowUp} className="space-y-4 p-2">
                    <div className="p-4 bg-border/10 rounded-xl mb-4">
                        <p className="text-sm font-bold text-text-primary">{selectedLead?.customer_name}</p>
                        {selectedLead?.phone && (
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {selectedLead.phone}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Date *</label>
                            <input
                                required
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={followUpData.scheduled_date}
                                onChange={e => setFollowUpData({ ...followUpData, scheduled_date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Time (Optional)</label>
                            <input
                                type="time"
                                value={followUpData.scheduled_time}
                                onChange={e => setFollowUpData({ ...followUpData, scheduled_time: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Follow-up Type</label>
                        <select
                            value={followUpData.type}
                            onChange={e => setFollowUpData({ ...followUpData, type: e.target.value as FollowUpType })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none"
                        >
                            <option value="call">📞 Phone Call</option>
                            <option value="whatsapp">💬 WhatsApp</option>
                            <option value="email">📧 Email</option>
                            <option value="meeting">🤝 Meeting</option>
                            <option value="visit">🏢 Site Visit</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Notes</label>
                        <textarea
                            rows={3}
                            placeholder="What do you need to discuss or follow up on?"
                            value={followUpData.notes}
                            onChange={e => setFollowUpData({ ...followUpData, notes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsFollowUpModalOpen(false)}
                            className="flex-1 py-3 bg-border/20 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-purple text-white rounded-xl font-bold shadow-lg transition-all hover:bg-purple/90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Scheduling...' : 'Schedule Follow-up'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Vendor Prospects Panel */}
            {brand === 'Solar Vendor' && (
                <VendorProspectsPanel
                    isOpen={isProspectsOpen}
                    onClose={() => setIsProspectsOpen(false)}
                    brand={brand}
                    employeeId={employee?.id}
                    employeeUsername={employee?.username}
                    onImported={() => fetchLeads()}
                />
            )}
        </div>
    );
}
