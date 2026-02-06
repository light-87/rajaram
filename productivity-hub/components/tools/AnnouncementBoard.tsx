"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployeeAuth } from "@/lib/employee-auth";
import { Announcement } from "@/types/database";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
    Megaphone,
    Plus,
    Pin,
    ExternalLink,
    Trash2,
    X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnnouncementBoard() {
    const { employee, isAdmin } = useEmployeeAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        link_url: "",
        link_label: "",
        is_pinned: false
    });

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from("announcements")
                .select("*")
                .order("is_pinned", { ascending: false });

            setAnnouncements((data || []) as Announcement[]);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            showToast("Title and content are required", "warning");
            return;
        }

        try {
            const insertData: Record<string, unknown> = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                is_pinned: formData.is_pinned,
                created_by: employee?.id,
                created_by_name: employee?.full_name
            };

            if (formData.link_url.trim()) {
                insertData.link_url = formData.link_url.trim();
                insertData.link_label = formData.link_label.trim() || "Link";
            }

            await supabase.from("announcements").insert(insertData);
            showToast("Announcement posted!", "success");
            setShowModal(false);
            setFormData({ title: "", content: "", link_url: "", link_label: "", is_pinned: false });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error creating announcement:", error);
            showToast("Failed to post announcement", "error");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await supabase.from("announcements").delete().eq("id", id);
            showToast("Announcement removed", "success");
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting announcement:", error);
            showToast("Failed to delete", "error");
        }
    };

    const togglePin = async (announcement: Announcement) => {
        try {
            await supabase
                .from("announcements")
                .update({ is_pinned: !announcement.is_pinned })
                .eq("id", announcement.id);
            fetchAnnouncements();
        } catch (error) {
            console.error("Error toggling pin:", error);
        }
    };

    if (loading) {
        return (
            <div className="card p-6 animate-pulse">
                <div className="h-6 bg-border/30 rounded w-48 mb-4" />
                <div className="space-y-3">
                    <div className="h-16 bg-border/30 rounded" />
                    <div className="h-16 bg-border/30 rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-pink" /> Announcements
                    </h3>
                    {isAdmin && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-xs px-3 py-1.5 bg-pink/10 text-pink rounded-lg font-medium hover:bg-pink/20 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Post
                        </button>
                    )}
                </div>

                {announcements.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                        <Megaphone className="w-10 h-10 mx-auto mb-2 text-border" />
                        <p className="text-sm">No announcements yet</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className={`p-4 rounded-xl border transition-colors ${
                                    announcement.is_pinned
                                        ? "bg-pink/5 border-pink/20"
                                        : "bg-border/5 border-border/20 hover:bg-border/10"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {announcement.is_pinned && (
                                                <Pin className="w-3 h-3 text-pink flex-shrink-0" />
                                            )}
                                            <h4 className="text-sm font-bold text-text-primary truncate">
                                                {announcement.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                                            {announcement.content}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {announcement.link_url && (
                                                <a
                                                    href={announcement.link_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-sky hover:underline flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {announcement.link_label || "Link"}
                                                </a>
                                            )}
                                            <span className="text-xs text-text-secondary/60">
                                                {announcement.created_by_name} &middot;{" "}
                                                {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => togglePin(announcement)}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    announcement.is_pinned
                                                        ? "text-pink hover:bg-pink/10"
                                                        : "text-text-secondary/50 hover:bg-border/10"
                                                }`}
                                                title={announcement.is_pinned ? "Unpin" : "Pin"}
                                            >
                                                <Pin className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-1.5 rounded-lg text-text-secondary/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Announcement Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post Announcement" color="pink">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-pink/50 focus:border-pink/50 outline-none"
                            placeholder="Announcement title..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-pink/50 focus:border-pink/50 outline-none resize-none"
                            placeholder="Write your announcement..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Link URL (optional)</label>
                            <input
                                type="url"
                                value={formData.link_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                                className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-pink/50 focus:border-pink/50 outline-none text-sm"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Link Label</label>
                            <input
                                type="text"
                                value={formData.link_label}
                                onChange={(e) => setFormData(prev => ({ ...prev, link_label: e.target.value }))}
                                className="w-full p-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-pink/50 focus:border-pink/50 outline-none text-sm"
                                placeholder="e.g. Read More"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_pinned}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                            className="w-4 h-4 accent-pink"
                        />
                        <span className="text-sm text-text-secondary">Pin this announcement</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-5 py-2 bg-pink text-white rounded-xl text-sm font-bold hover:bg-pink/90 transition-colors"
                        >
                            Post Announcement
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
