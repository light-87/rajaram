"use client";

import { TimeEntry } from "@/types/database";
import { List } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Clock } from "lucide-react";
import { useState } from "react";

interface TimeEntriesListProps {
  entries: TimeEntry[];
  onRefresh: () => void;
}

export default function TimeEntriesList({ entries }: TimeEntriesListProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.category === filter);

  const categories = ["all", "UK Job", "Solar App", "Factory App", "Personal", "Uni", "Gym"];

  if (entries.length === 0) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={Clock}
          title="No Time Entries Yet"
          description="Start logging your time to track your productivity and reach your goals."
        />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <List className="w-6 h-6 text-accent-secondary" />
        Time Entries
      </h2>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === cat
                ? "bg-accent-secondary text-white"
                : "bg-background text-text-secondary hover:bg-background-card"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Category
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Hours
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                Points
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border/50 hover:bg-background/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-text-primary">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="info" size="sm">
                    {entry.category}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm text-right text-text-primary font-mono">
                  {entry.hours}h
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-accent-primary">
                  {entry.effort_points}
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary">
                  {entry.description || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && filter !== "all" && (
        <p className="text-center text-text-secondary py-8">
          No entries found for {filter}
        </p>
      )}

      {/* Summary */}
      {filteredEntries.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-background border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Entries</p>
              <p className="text-lg font-bold text-text-primary">
                {filteredEntries.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Hours</p>
              <p className="text-lg font-bold text-text-primary">
                {filteredEntries.reduce((sum, e) => sum + parseFloat(e.hours.toString()), 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Total Points</p>
              <p className="text-lg font-bold text-accent-primary">
                {filteredEntries.reduce((sum, e) => sum + e.effort_points, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
