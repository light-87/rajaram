"use client";

import { Note, NoteCategory, NoteCategoryColor } from "@/types/database";
import { Pin, Pencil, Trash2, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  category?: NoteCategory;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onTagClick: (tag: string) => void;
}

const colorClasses: Record<NoteCategoryColor, { bg: string; text: string; border: string }> = {
  purple: { bg: "bg-purple/10", text: "text-purple", border: "border-purple/30" },
  sky: { bg: "bg-sky/10", text: "text-sky", border: "border-sky/30" },
  pink: { bg: "bg-pink/10", text: "text-pink", border: "border-pink/30" },
  yellow: { bg: "bg-yellow/10", text: "text-yellow", border: "border-yellow/30" },
  green: { bg: "bg-green/10", text: "text-green", border: "border-green/30" },
  coral: { bg: "bg-coral/10", text: "text-coral", border: "border-coral/30" },
};

export default function NoteCard({
  note,
  category,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: NoteCardProps) {
  const categoryColor = category?.color || "purple";
  const colors = colorClasses[categoryColor as NoteCategoryColor] || colorClasses.purple;

  return (
    <div
      className={`group relative p-4 bg-background-card border ${
        note.is_pinned ? "border-yellow/50" : "border-border"
      } rounded-xl hover:border-border-light transition-all`}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow rounded-full flex items-center justify-center shadow-lg">
          <Pin className="w-3 h-3 text-background" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-text-primary text-lg line-clamp-1 pr-8">
          {note.title}
        </h3>

        {/* Actions (visible on hover) */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(note.id, !note.is_pinned)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.is_pinned
                ? "text-yellow hover:bg-yellow/20"
                : "text-text-secondary hover:bg-background hover:text-yellow"
            }`}
            title={note.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 text-text-secondary hover:bg-background hover:text-sky rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-text-secondary hover:bg-background hover:text-pink rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content preview */}
      {note.content && (
        <p className="text-text-secondary text-sm line-clamp-3 mb-3">
          {note.content}
        </p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="px-2 py-0.5 bg-purple/15 text-purple text-xs rounded-full hover:bg-purple/25 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/50">
        {category ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            <Folder className="w-3 h-3" />
            {category.name}
          </span>
        ) : (
          <span className="text-text-secondary/50">Uncategorized</span>
        )}
        <span>
          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
