"use client";

import { Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function ClientsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Clients</h1>
      </div>

      <EmptyState
        icon={Users}
        title="Client Management Coming Soon"
        description="Track your business clients, contracts, and payment schedules. This feature will be available shortly."
      />
    </div>
  );
}
