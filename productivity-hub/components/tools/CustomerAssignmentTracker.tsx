"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployeeAuth } from "@/lib/employee-auth";
import { CustomerAssignment, Profile } from "@/types/database";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
    ClipboardList,
    Plus,
    User,
    Building2,
    AlertTriangle,
    Trash2,
    Search,
    Pause,
    Play,
    CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CustomerAssignmentTracker() {
    const { employee, isAdmin } = useEmployeeAuth();
    const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [duplicateWarning, setDuplicateWarning] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        company_name: "",
        assigned_to: "",
        brand: "",
        notes: ""
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [{ data: assignmentData }, { data: employeeData }] = await Promise.all([
                supabase.from("customer_assignments").select("*").order("created_at", { ascending: false }),
                supabase.from("profiles").select("*").eq("is_active", true)
            ]);
            setAssignments((assignmentData || []) as CustomerAssignment[]);
            setEmployees((employeeData || []) as Profile[]);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Check for duplicates as user types
    const checkDuplicate = useCallback((customerName: string, companyName: string) => {
        if (!customerName.trim() && !companyName.trim()) {
            setDuplicateWarning("");
            return;
        }

        const existing = assignments.find(
            a =>
                (customerName.trim() && a.customer_name.toLowerCase() === customerName.toLowerCase().trim()) ||
                (companyName.trim() && a.company_name.toLowerCase() === companyName.toLowerCase().trim())
        );

        if (existing) {
            setDuplicateWarning(
                `"${existing.customer_name}" at "${existing.company_name}" is already assigned to ${existing.assigned_to_name || "someone"}`
            );
        } else {
            setDuplicateWarning("");
        }
    }, [assignments]);

    const handleCreate = async () => {
        if (!formData.customer_name.trim() || !formData.company_name.trim() || !formData.assigned_to) {
            showToast("Customer name, company name, and assignee are required", "warning");
            return;
        }

        // Double-check for duplicates
        const existing = assignments.find(
            a =>
                a.customer_name.toLowerCase() === formData.customer_name.toLowerCase().trim() &&
                a.company_name.toLowerCase() === formData.company_name.toLowerCase().trim()
        );

        if (existing) {
            showToast(`This customer+company is already assigned to ${existing.assigned_to_name}`, "error");
            return;
        }

        try {
            const assignedEmployee = employees.find(e => e.id === formData.assigned_to);

            await supabase.from("customer_assignments").insert({
                customer_name: formData.customer_name.trim(),
                company_name: formData.company_name.trim(),
                assigned_to: formData.assigned_to,
                assigned_to_name: assignedEmployee?.full_name || "",
                brand: formData.brand || null,
                notes: formData.notes.trim() || null,
                created_by: employee?.id
            });

            showToast("Customer assigned successfully!", "success");
            setShowModal(false);
            setFormData({ customer_name: "", company_name: "", assigned_to: "", brand: "", notes: "" });
            setDuplicateWarning("");
            fetchData();
        } catch (error: any) {
            if (error?.message?.includes("unique") || error?.message?.includes("duplicate")) {
                showToast("This customer+company combination already exists", "error");
            } else {
                console.error("Error creating assignment:", error);
                showToast("Failed to create assignment", "error");
            }
        }
    };

    const handleStatusChange = async (assignment: CustomerAssignment, newStatus: string) => {
        try {
            await supabase
                .from("customer_assignments")
                .update({ status: newStatus })
                .eq("id", assignment.id);
            showToast(`Status updated to ${newStatus}`, "success");
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status", "error");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await supabase.from("customer_assignments").delete().eq("id", id);
            showToast("Assignment removed", "success");
            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting assignment:", error);
            showToast("Failed to delete", "error");
        }
    };

    const filtered = assignments.filter(a => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            a.customer_name.toLowerCase().includes(q) ||
            a.company_name.toLowerCase().includes(q) ||
            (a.assigned_to_name || "").toLowerCase().includes(q)
        );
    });

    const statusIcon = (status: string) => {
        switch (status) {
            case "active": return <Play className="w-3 h-3 text-green" />;
            case "completed": return <CheckCircle2 className="w-3 h-3 text-sky" />;
            case "on_hold": return <Pause className="w-3 h-3 text-yellow" />;
            default: return null;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green/10 text-green border-green/20";
            case "completed": return "bg-sky/10 text-sky border-sky/20";
            case "on_hold": return "bg-yellow/10 text-yellow border-yellow/20";
            default: return "bg-border/10 text-text-secondary border-border/20";
        }
    };

    if (loading) {
        return (
            <div className="card p-6 animate-pulse">
                <div className="h-6 bg-border/30 rounded w-52 mb-4" />
                <div className="space-y-3">
                    <div className="h-14 bg-border/30 rounded" />
                    <div className="h-14 bg-border/30 rounded" />
                    <div className="h-14 bg-border/30 rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-purple" /> Customer Assignments
                    </h3>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs px-3 py-1.5 bg-purple/10 text-purple rounded-lg font-medium hover:bg-purple/20 transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Assign
                    </button>
                </div>

                {/* Search */}
                {assignments.length > 3 && (
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none"
                            placeholder="Search customer, company, or employee..."
                        />
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 text-border" />
                        <p className="text-sm">
                            {assignments.length === 0 ? "No assignments yet" : "No matches found"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filtered.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="flex items-center justify-between p-3 bg-border/5 rounded-xl hover:bg-border/10 transition-colors border border-border/10"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-4 h-4 text-purple" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {assignment.customer_name}
                                        </p>
                                        <p className="text-xs text-text-secondary truncate">
                                            {assignment.company_name}
                                            {assignment.brand && (
                                                <span className="ml-2 text-text-secondary/60">&middot; {assignment.brand}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-medium text-text-primary flex items-center gap-1 justify-end">
                                            <User className="w-3 h-3" />
                                            {assignment.assigned_to_name}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="relative group">
                                        <button
                                            className={`text-xs px-2 py-1 rounded-full border font-bold flex items-center gap-1 ${statusColor(assignment.status)}`}
                                        >
                                            {statusIcon(assignment.status)}
                                            {assignment.status}
                                        </button>
                                        {isAdmin && (
                                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-background-card border border-border rounded-xl shadow-xl z-10 overflow-hidden min-w-[120px]">
                                                {["active", "on_hold", "completed"].filter(s => s !== assignment.status).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleStatusChange(assignment, s)}
                                                        className="block w-full text-left px-3 py-2 text-xs hover:bg-border/10 text-text-primary capitalize"
                                                    >
                                                        {s.replace("_", " ")}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(assignment.id)}
                                            className="p-1.5 rounded-lg text-text-secondary/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                <div className="flex gap-4 mt-4 pt-3 border-t border-border/30 text-xs text-text-secondary">
                    <span>{assignments.filter(a => a.status === "active").length} active</span>
                    <span>{assignments.filter(a => a.status === "on_hold").length} on hold</span>
                    <span>{assignments.filter(a => a.status === "completed").length} completed</span>
                </div>
            </div>

            {/* Create Assignment Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setDuplicateWarning(""); }} title="Assign Customer" color="purple">
                <div className="space-y-4">
                    {duplicateWarning && (
                        <div className="flex items-start gap-2 p-3 bg-yellow/10 border border-yellow/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-yellow flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow">{duplicateWarning}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={formData.customer_name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, customer_name: e.target.value }));
                                checkDuplicate(e.target.value, formData.company_name);
                            }}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none"
                            placeholder="Customer name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
                        <input
                            type="text"
                            value={formData.company_name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, company_name: e.target.value }));
                                checkDuplicate(formData.customer_name, e.target.value);
                            }}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none"
                            placeholder="Company name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
                        <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none"
                        >
                            <option value="">Select employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Brand (optional)</label>
                        <select
                            value={formData.brand}
                            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none"
                        >
                            <option value="">Select brand...</option>
                            <option value="Kuberbook">Kuberbook</option>
                            <option value="Solar Vendor">Solar Vendor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Notes (optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-purple/50 focus:border-purple/50 outline-none resize-none"
                            placeholder="Any additional notes..."
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => { setShowModal(false); setDuplicateWarning(""); }}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-5 py-2 bg-purple text-white rounded-xl text-sm font-bold hover:bg-purple/90 transition-colors"
                        >
                            Assign Customer
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
