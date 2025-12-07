import { Search, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { ClientStatus } from "@/types/database";

interface ClientsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  productFilter: string;
  onProductFilterChange: (product: string) => void;
  statusFilter: ClientStatus | "all";
  onStatusFilterChange: (status: ClientStatus | "all") => void;
  onAddClient: () => void;
}

export default function ClientsFilters({
  searchQuery,
  onSearchChange,
  productFilter,
  onProductFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAddClient,
}: ClientsFiltersProps) {
  return (
    <div className="bg-card rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Add Client Button */}
        <Button onClick={onAddClient} className="md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
          />
        </div>

        {/* Product Filter */}
        <select
          value={productFilter}
          onChange={(e) => onProductFilterChange(e.target.value)}
          className="px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none cursor-pointer"
        >
          <option value="all">All Products</option>
          <option value="solar">Solar App</option>
          <option value="factory">Factory App</option>
          <option value="other">Other</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as ClientStatus | "all")}
          className="px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
