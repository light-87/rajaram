"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Client, ClientStatus } from "@/types/database";
import { Users } from "lucide-react";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import KeyMetrics from "@/components/clients/KeyMetrics";
import UpcomingPayments from "@/components/clients/UpcomingPayments";
import ClientsFilters from "@/components/clients/ClientsFilters";
import ClientsList from "@/components/clients/ClientsList";
import ClientDetails from "@/components/clients/ClientDetails";
import ClientModal from "@/components/clients/ClientModal";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Convert numeric string values to actual numbers
        const normalizedClients = data.map((client: any) => ({
          ...client,
          setup_fee: client.setup_fee ? parseFloat(client.setup_fee) : null,
          contract_value: client.contract_value ? parseFloat(client.contract_value) : null,
        })) as Client[];
        setClients(normalizedClients);

        // Auto-select first client if none selected
        if (!selectedClientId && normalizedClients.length > 0) {
          setSelectedClientId(normalizedClients[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter clients based on search and filters
  const filteredClients = clients.filter((client) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Product filter
    if (productFilter !== "all") {
      const productLower = client.product_service?.toLowerCase() || "";
      if (productFilter === "solar" && !productLower.includes("solar")) return false;
      if (productFilter === "factory" && !productLower.includes("factory") && !productLower.includes("pmr")) return false;
      if (productFilter === "other" && (productLower.includes("solar") || productLower.includes("factory"))) return false;
    }

    // Status filter
    if (statusFilter !== "all" && client.status !== statusFilter) return false;

    return true;
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = () => {
    if (selectedClient) {
      setEditingClient(selectedClient);
      setIsModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    fetchClients();
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading clients..." />
      </div>
    );
  }

  // Empty state when no clients exist
  if (clients.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-accent-secondary" />
          <h1 className="text-3xl font-bold text-text-primary">Clients</h1>
        </div>

        <EmptyState
          icon={Users}
          title="No Clients Yet"
          description="Start by adding your first client to track contracts and payments."
          action={{
            label: "Add Client",
            onClick: handleAddClient,
          }}
        />

        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          client={editingClient}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Clients</h1>
      </div>

      {/* Key Metrics */}
      <KeyMetrics clients={clients} />

      {/* Upcoming Payments */}
      <UpcomingPayments clients={clients} onClientClick={handleClientClick} />

      {/* Filters */}
      <ClientsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        productFilter={productFilter}
        onProductFilterChange={setProductFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddClient={handleAddClient}
      />

      {/* Main Content: List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clients List (Left Sidebar) */}
        <div className="lg:col-span-4">
          {filteredClients.length > 0 ? (
            <ClientsList
              clients={filteredClients}
              selectedClientId={selectedClientId}
              onClientSelect={handleClientClick}
            />
          ) : (
            <div className="bg-card rounded-lg p-6 text-center text-text-secondary">
              No clients match your filters
            </div>
          )}
        </div>

        {/* Client Details (Right Pane) */}
        <div className="lg:col-span-8">
          {selectedClient ? (
            <ClientDetails client={selectedClient} onEdit={handleEditClient} />
          ) : (
            <div className="bg-card rounded-lg p-6 text-center text-text-secondary">
              Select a client to view details
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        client={editingClient}
      />
    </div>
  );
}
