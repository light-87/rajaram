"use client";

import { useEmployeeAuth } from "@/lib/employee-auth";
import {
    Users,
    ArrowLeft,
    Plus,
    UserPlus,
    Activity,
    Shield,
    XCircle,
    Edit2,
    Eye,
    MoreVertical
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { Profile, ActivityLog } from "@/types/database";
import { logActivity, hashPassword } from "@/lib/tools-utils";
import { showToast } from "@/components/ui/Toast";

export default function EmployeesAdminPage() {
    const { isAdmin } = useEmployeeAuth();
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);

    // Form State
    const [employeeForm, setEmployeeForm] = useState({
        username: "",
        full_name: "",
        password: "",
        role: "employee"
    });

    const fetchAdminData = async () => {
        try {
            // Fetch All Profiles
            const { data: profilesData } = await supabase
                .from("profiles")
                .select("*");

            // Fetch Recent Activity Logs
            const { data: logsData } = await supabase
                .from("activity_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(10);

            setEmployees(profilesData || []);
            setLogs(logsData || []);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData();
        }
    }, [isAdmin]);

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEmployee) {
                // Update
                const updateData: any = {
                    username: employeeForm.username,
                    full_name: employeeForm.full_name,
                    role: employeeForm.role
                };

                if (employeeForm.password) {
                    updateData.password_hash = await hashPassword(employeeForm.password);
                }

                const { error } = await supabase
                    .from("profiles")
                    .update(updateData)
                    .eq("id", editingEmployee.id);

                if (error) throw error;

                await logActivity(
                    "Employee Updated",
                    `Profile updated for "${employeeForm.full_name}"`,
                    "Admin"
                );
                showToast("Profile updated!");
            } else {
                // Create
                const password_hash = await hashPassword(employeeForm.password);
                const { error } = await supabase.from("profiles").insert({
                    username: employeeForm.username,
                    full_name: employeeForm.full_name,
                    password_hash: password_hash,
                    role: employeeForm.role,
                    is_active: true
                });

                if (error) throw error;

                await logActivity(
                    "Employee Created",
                    `New employee profile created for "${employeeForm.full_name}"`,
                    "Admin"
                );
                showToast("Employee profile created!");
            }

            setEmployeeForm({ username: "", full_name: "", password: "", role: "employee" });
            setEditingEmployee(null);
            setIsModalOpen(false);
            fetchAdminData();
        } catch (error) {
            console.error("Error saving employee:", error);
            showToast("Failed to save profile.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEmployee = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.from("profiles").delete().eq("id", id);
            if (error) throw error;

            await logActivity(
                "Employee Deleted",
                `Employee profile "${name}" was deleted`,
                "Admin"
            );

            showToast("Employee deleted.");
            fetchAdminData();
        } catch (error) {
            console.error("Error deleting employee:", error);
            showToast("Failed to delete profile.", "error");
        }
    };

    const handleEditClick = (emp: Profile) => {
        setEditingEmployee(emp);
        setEmployeeForm({
            username: emp.username,
            full_name: emp.full_name,
            password: "", // Don't show existing hash
            role: emp.role
        });
        setIsModalOpen(true);
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-text-secondary">Unauthorized access.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-purple/10 border-b border-purple/20 px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/tools" className="text-purple flex items-center gap-1 text-sm font-medium hover:underline mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Portal
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-text-primary">Employee Management</h1>
                            <p className="text-text-secondary">Monitor team activity and manage access</p>
                        </div>

                        <button
                            onClick={() => {
                                setEditingEmployee(null);
                                setEmployeeForm({ username: "", full_name: "", password: "", role: "employee" });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple text-white rounded-xl font-bold hover:bg-purple/90 transition-all shadow-lg self-start"
                        >
                            <UserPlus className="w-5 h-5" /> Add Employee
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Employee List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple" /> Active Team
                        </h3>
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-border/20 text-text-secondary text-xs uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {employees.length > 0 ? employees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-border/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-pink-purple flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                            {emp.full_name.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{emp.full_name}</p>
                                                            <p className="text-xs text-text-secondary">@{emp.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={emp.role === 'admin' ? 'purple' : 'sky'}>{emp.role}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-green' : 'bg-red-400'}`} />
                                                        <span className="text-sm text-text-secondary capitalize">{emp.is_active ? 'active' : 'disabled'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(emp)}
                                                            className="p-2 hover:bg-purple/10 rounded-lg transition-all text-purple"
                                                            title="Edit Profile"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                                                            className="p-2 hover:bg-red-400/10 rounded-lg transition-all text-red-400"
                                                            title="Delete Profile"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No employees found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <Activity className="w-5 h-5 text-pink" /> Recent Activity
                        </h3>
                        <div className="card p-6 space-y-6">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    {i !== logs.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-6 bg-border/50" />}
                                    <div className={`w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center shrink-0`}>
                                        <Shield className={`w-5 h-5 text-purple`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-text-primary font-medium">
                                            {log.action}
                                        </p>
                                        <p className="text-xs text-sky font-bold italic">“{log.details || 'No details'}”</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-text-secondary uppercase font-bold">
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {log.performed_by && (
                                                <>
                                                    <span className="text-[10px] text-border">•</span>
                                                    <p className="text-[10px] text-purple font-bold">BY {log.performed_by.toUpperCase()}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-text-secondary">No recent activity.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Employee Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingEmployee ? "Edit Employee" : "Add New Employee"}
                size="md"
            >
                <form onSubmit={handleSaveEmployee} className="space-y-4 p-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="Vaibhav Rajaram"
                            value={employeeForm.full_name}
                            onChange={e => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Username</label>
                            <input
                                required
                                type="text"
                                placeholder="vaibhav123"
                                value={employeeForm.username}
                                onChange={e => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Role</label>
                            <select
                                value={employeeForm.role}
                                onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value as any })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none text-xs"
                            >
                                <option value="employee">Sales/Employee</option>
                                <option value="admin">Admin/Owner</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">
                            {editingEmployee ? "New Password (Leave blank to keep current)" : "Initial Password"}
                        </label>
                        <input
                            required={!editingEmployee}
                            type="text"
                            placeholder={editingEmployee ? "Set new password..." : "Enter login PIN or password"}
                            value={employeeForm.password}
                            onChange={e => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl focus:border-purple/50 outline-none"
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
                            className="flex-1 py-3 bg-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (editingEmployee ? 'Updating...' : 'Creating...') : (editingEmployee ? 'Update Profile' : 'Finalize Profile')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
