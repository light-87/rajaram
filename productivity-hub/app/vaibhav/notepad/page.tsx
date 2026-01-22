"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Note, NoteCategory } from "@/types/database";
import { StickyNote, Plus, Search } from "lucide-react";
import NoteForm from "@/components/notepad/NoteForm";
import NoteList from "@/components/notepad/NoteList";
import CategorySidebar from "@/components/notepad/CategorySidebar";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function NotepadPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, categoriesRes] = await Promise.all([
        supabase.from("notes").select("*").order("created_at", { ascending: false }),
        supabase.from("note_categories").select("*").order("sort_order", { ascending: true }),
      ]);

      if (!notesRes.error && notesRes.data) {
        // Normalize tags from database (may come as string or array)
        const normalizedNotes = notesRes.data.map((note: Note) => ({
          ...note,
          tags: Array.isArray(note.tags) ? note.tags : [],
        }));
        setNotes(normalizedNotes);
      }

      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteAdded = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      showToast("Note deleted", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting note:", error);
      showToast("Failed to delete note", "error");
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      showToast(isPinned ? "Note pinned" : "Note unpinned", "success");
      fetchData();
    } catch (error) {
      console.error("Error toggling pin:", error);
      showToast("Failed to update note", "error");
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSelectedCategory(null);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery("");
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Calculate note counts per category
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      const catId = note.category_id || "uncategorized";
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [notes]);

  const pinnedCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Filter by category
    if (selectedCategory === "pinned") {
      result = result.filter((n) => n.is_pinned);
    } else if (selectedCategory) {
      result = result.filter((n) => n.category_id === selectedCategory);
    }

    // Filter by tag
    if (selectedTag) {
      result = result.filter((n) => n.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content?.toLowerCase().includes(query) ||
          n.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [notes, selectedCategory, selectedTag, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading notes..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-purple" />
            <h1 className="text-3xl font-bold text-text-primary">Notepad</h1>
          </div>

          {/* Desktop Add Button */}
          <button
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Note
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full pl-10 pr-4 py-3 bg-background-card border border-border rounded-xl text-text-primary focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            allTags={allTags}
            noteCounts={noteCounts}
            pinnedCount={pinnedCount}
            totalCount={notes.length}
            onSelectCategory={setSelectedCategory}
            onSelectTag={setSelectedTag}
            onClearFilters={handleClearFilters}
          />

          {/* Notes Grid */}
          <div className="flex-1">
            {/* Active Filters Display */}
            {(selectedCategory || selectedTag) && (
              <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
                <span>Showing:</span>
                {selectedCategory === "pinned" && (
                  <span className="px-2 py-0.5 bg-yellow/15 text-yellow rounded-full">
                    Pinned notes
                  </span>
                )}
                {selectedCategory && selectedCategory !== "pinned" && (
                  <span className="px-2 py-0.5 bg-purple/15 text-purple rounded-full">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </span>
                )}
                {selectedTag && (
                  <span className="px-2 py-0.5 bg-purple/15 text-purple rounded-full">
                    #{selectedTag}
                  </span>
                )}
                <span className="text-text-secondary/50">
                  ({filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"})
                </span>
              </div>
            )}

            <NoteList
              notes={filteredNotes}
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onTagClick={handleTagClick}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => {
          setEditingNote(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-purple text-white rounded-full shadow-lg hover:bg-purple/90 transition-all flex items-center justify-center z-40 hover:scale-110"
        aria-label="Add note"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? "Edit Note" : "Add New Note"}
        size="lg"
        color="purple"
      >
        <NoteForm
          onNoteAdded={handleNoteAdded}
          categories={categories}
          editingNote={editingNote}
          onCancelEdit={() => {
            setIsModalOpen(false);
            setEditingNote(null);
          }}
        />
      </Modal>
    </>
  );
}
