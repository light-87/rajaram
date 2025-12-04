"use client";

import { BookOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function JournalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Journal</h1>
      </div>

      <EmptyState
        icon={BookOpen}
        title="Daily Journal Coming Soon"
        description="Track your daily reflections, mood, and energy levels. This feature will be available shortly."
      />
    </div>
  );
}
