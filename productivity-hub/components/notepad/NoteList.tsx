"use client";

import { Note, NoteCategory } from "@/types/database";
import NoteCard from "./NoteCard";
import EmptyState from "@/components/ui/EmptyState";
import { StickyNote } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  categories: NoteCategory[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onTagClick: (tag: string) => void;
}

export default function NoteList({
  notes,
  categories,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="No notes yet"
        description="Create your first note to get started"
      />
    );
  }

  // Sort notes: pinned first, then by created_at desc
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pinnedNotes = sortedNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = sortedNotes.filter((n) => !n.is_pinned);

  const getCategoryForNote = (note: Note) => {
    return categories.find((c) => c.id === note.category_id);
  };

  return (
    <div className="space-y-6">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-yellow mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow rounded-full"></span>
            Pinned ({pinnedNotes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                category={getCategoryForNote(note)}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Notes Section */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              All Notes ({unpinnedNotes.length})
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                category={getCategoryForNote(note)}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
