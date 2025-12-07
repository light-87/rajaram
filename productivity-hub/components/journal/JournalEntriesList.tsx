"use client";

import { useState } from "react";
import { JournalEntry } from "@/types/database";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

interface JournalEntriesListProps {
  entries: JournalEntry[];
  onRefresh: () => void;
}

const moodEmojis = ["😢", "😕", "😐", "🙂", "😄"];
const moodLabels = ["Very Bad", "Bad", "Neutral", "Good", "Excellent"];
const energyEmojis = ["🔋", "🪫", "⚡", "⚡⚡", "🔥"];
const energyLabels = ["Drained", "Low", "Moderate", "High", "Energized"];

export default function JournalEntriesList({ entries }: JournalEntriesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={BookOpen}
          title="No Journal Entries Yet"
          description="Start journaling to track your daily reflections, mood, and energy levels."
        />
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <List className="w-6 h-6 text-accent-secondary" />
        Past Entries
      </h2>

      <div className="space-y-3">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const preview = entry.content.length > 150
            ? `${entry.content.substring(0, 150)}...`
            : entry.content;

          return (
            <div
              key={entry.id}
              className="border border-border rounded-lg bg-background-card hover:border-accent-secondary/50 transition-all"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {format(parseISO(entry.entry_date), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-accent-secondary/10 rounded-lg border border-accent-secondary/30">
                          <span className="text-lg" title={`Mood: ${moodLabels[entry.mood - 1]}`}>
                            {moodEmojis[entry.mood - 1]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-accent-success/10 rounded-lg border border-accent-success/30">
                          <span className="text-lg" title={`Energy: ${energyLabels[entry.energy - 1]}`}>
                            {energyEmojis[entry.energy - 1]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="text-sm text-text-secondary whitespace-pre-wrap">
                  {isExpanded ? entry.content : preview}
                </div>

                {!isExpanded && entry.content.length > 150 && (
                  <p className="text-xs text-accent-secondary mt-2 font-medium">
                    Click to read more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-background border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Entries</p>
              <p className="text-lg font-bold text-text-primary">
                {entries.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Avg Mood</p>
              <p className="text-lg font-bold text-text-primary">
                {moodEmojis[Math.round(entries.reduce((sum, e) => sum + e.mood, 0) / entries.length) - 1]}{" "}
                {(entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Avg Energy</p>
              <p className="text-lg font-bold text-accent-success">
                {energyEmojis[Math.round(entries.reduce((sum, e) => sum + e.energy, 0) / entries.length) - 1]}{" "}
                {(entries.reduce((sum, e) => sum + e.energy, 0) / entries.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
