"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Note, NoteCategory } from "@/types/database";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { X, Plus } from "lucide-react";

interface NoteFormProps {
  onNoteAdded: () => void;
  categories: NoteCategory[];
  editingNote?: Note | null;
  onCancelEdit?: () => void;
}

export default function NoteForm({
  onNoteAdded,
  categories,
  editingNote,
  onCancelEdit,
}: NoteFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    tags: [] as string[],
    is_pinned: false,
  });

  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.title,
        content: editingNote.content || "",
        category_id: editingNote.category_id || "",
        tags: editingNote.tags || [],
        is_pinned: editingNote.is_pinned,
      });
    }
  }, [editingNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingNote) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: formData.title,
            content: formData.content || null,
            category_id: formData.category_id || null,
            tags: formData.tags,
            is_pinned: formData.is_pinned,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        showToast("Note updated successfully!", "success");
      } else {
        const { error } = await supabase.from("notes").insert({
          title: formData.title,
          content: formData.content || null,
          category_id: formData.category_id || null,
          tags: formData.tags,
          is_pinned: formData.is_pinned,
        });

        if (error) throw error;
        showToast("Note added successfully!", "success");
      }

      setFormData({
        title: "",
        content: "",
        category_id: "",
        tags: [],
        is_pinned: false,
      });
      setTagInput("");
      onNoteAdded();
    } catch (error) {
      console.error("Error saving note:", error);
      showToast("Failed to save note", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Note title..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Content
        </label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="Write your note here..."
          rows={6}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) =>
                setFormData({ ...formData, is_pinned: e.target.checked })
              }
              className="w-4 h-4 rounded border-border bg-background text-purple focus:ring-purple/20"
            />
            <span className="text-sm text-text-primary">Pin this note</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple/20 text-purple text-xs rounded-full"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-pink transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag (press Enter or comma)"
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {editingNote && onCancelEdit && (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="purple"
          disabled={isSubmitting || !formData.title.trim()}
        >
          {isSubmitting
            ? "Saving..."
            : editingNote
            ? "Update Note"
            : "Add Note"}
        </Button>
      </div>
    </form>
  );
}
