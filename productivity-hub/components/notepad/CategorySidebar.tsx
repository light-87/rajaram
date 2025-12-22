"use client";

import { NoteCategory, NoteCategoryColor } from "@/types/database";
import {
  Folder,
  Briefcase,
  Heart,
  Lightbulb,
  Bookmark,
  StickyNote,
  Pin,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  categories: NoteCategory[];
  selectedCategory: string | null;
  selectedTag: string | null;
  allTags: string[];
  noteCounts: Record<string, number>;
  pinnedCount: number;
  totalCount: number;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onClearFilters: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  briefcase: Briefcase,
  heart: Heart,
  lightbulb: Lightbulb,
  bookmark: Bookmark,
};

const colorClasses: Record<NoteCategoryColor, { bg: string; text: string; activeBg: string }> = {
  purple: { bg: "hover:bg-purple/10", text: "text-purple", activeBg: "bg-purple/15 border-purple/30" },
  sky: { bg: "hover:bg-sky/10", text: "text-sky", activeBg: "bg-sky/15 border-sky/30" },
  pink: { bg: "hover:bg-pink/10", text: "text-pink", activeBg: "bg-pink/15 border-pink/30" },
  yellow: { bg: "hover:bg-yellow/10", text: "text-yellow", activeBg: "bg-yellow/15 border-yellow/30" },
  green: { bg: "hover:bg-green/10", text: "text-green", activeBg: "bg-green/15 border-green/30" },
  coral: { bg: "hover:bg-coral/10", text: "text-coral", activeBg: "bg-coral/15 border-coral/30" },
};

export default function CategorySidebar({
  categories,
  selectedCategory,
  selectedTag,
  allTags,
  noteCounts,
  pinnedCount,
  totalCount,
  onSelectCategory,
  onSelectTag,
  onClearFilters,
}: CategorySidebarProps) {
  const hasActiveFilters = selectedCategory !== null || selectedTag !== null;

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-pink hover:bg-pink/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      )}

      {/* Quick Filters */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
          Quick Filters
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectTag(null);
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors border border-transparent",
              !selectedCategory && !selectedTag
                ? "bg-purple/15 text-purple border-purple/30"
                : "text-text-secondary hover:bg-background-elevated hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              All Notes
            </span>
            <span className="text-xs opacity-60">{totalCount}</span>
          </button>

          <button
            onClick={() => {
              onSelectCategory("pinned");
              onSelectTag(null);
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors border border-transparent",
              selectedCategory === "pinned"
                ? "bg-yellow/15 text-yellow border-yellow/30"
                : "text-text-secondary hover:bg-background-elevated hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Pinned
            </span>
            <span className="text-xs opacity-60">{pinnedCount}</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Folder;
            const colors = colorClasses[category.color as NoteCategoryColor] || colorClasses.purple;
            const isActive = selectedCategory === category.id;
            const count = noteCounts[category.id] || 0;

            return (
              <button
                key={category.id}
                onClick={() => {
                  onSelectCategory(isActive ? null : category.id);
                  onSelectTag(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors border border-transparent",
                  isActive
                    ? `${colors.activeBg} ${colors.text}`
                    : `text-text-secondary ${colors.bg} hover:text-text-primary`
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", isActive && colors.text)} />
                  {category.name}
                </span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5 px-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  onSelectTag(selectedTag === tag ? null : tag);
                  onSelectCategory(null);
                }}
                className={cn(
                  "px-2 py-1 text-xs rounded-full transition-colors",
                  selectedTag === tag
                    ? "bg-purple text-white"
                    : "bg-purple/15 text-purple hover:bg-purple/25"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
