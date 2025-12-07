import { Client } from "@/types/database";
import { Sun, Factory, Package, Star, Pause, Square } from "lucide-react";
import { format } from "date-fns";

interface ClientsListProps {
  clients: Client[];
  selectedClientId: string | null;
  onClientSelect: (clientId: string) => void;
}

export default function ClientsList({
  clients,
  selectedClientId,
  onClientSelect,
}: ClientsListProps) {
  const getProductIcon = (productService?: string) => {
    if (!productService) return <Package className="w-4 h-4 text-blue-500" />;
    const product = productService.toLowerCase();
    if (product.includes("solar")) {
      return <Sun className="w-4 h-4 text-yellow-500" />;
    } else if (product.includes("factory") || product.includes("pmr")) {
      return <Factory className="w-4 h-4 text-gray-400" />;
    }
    return <Package className="w-4 h-4 text-blue-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Star className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case "inactive":
        return <Square className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  const getContractDisplay = (client: Client) => {
    if (!client.contract_value) return "—";

    const baseValue = formatCurrency(client.contract_value);
    const frequency = client.payment_frequency;

    if (frequency === "annual") {
      return `${baseValue}/year`;
    } else if (frequency === "monthly") {
      return `${baseValue}/mo`;
    } else if (frequency === "quarterly") {
      return `${baseValue}/qtr`;
    } else {
      return baseValue;
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 text-center text-text-secondary">
        No clients found
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Clients ({clients.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-700 overflow-y-auto max-h-[600px]">
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => onClientSelect(client.id)}
            className={`p-4 cursor-pointer transition-colors ${
              selectedClientId === client.id
                ? "bg-accent-secondary/10 border-l-4 border-accent-secondary"
                : "hover:bg-background/50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Status & Product Icons */}
              <div className="flex flex-col gap-1 mt-1">
                {getStatusIcon(client.status)}
                {getProductIcon(client.product_service)}
              </div>

              {/* Client Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-text-primary font-medium truncate">
                      {client.name}
                    </h3>
                    {client.company && (
                      <p className="text-text-secondary text-sm truncate">
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-accent-primary font-semibold text-sm">
                      {getContractDisplay(client)}
                    </span>
                  </div>

                  {client.next_payment_date && client.status !== "inactive" && (
                    <div className="text-text-secondary text-xs">
                      Next: {format(new Date(client.next_payment_date), "MMM dd, yyyy")}
                    </div>
                  )}

                  {client.status === "pending" && (
                    <div className="text-yellow-500 text-xs font-medium">
                      PENDING
                    </div>
                  )}

                  {client.status === "inactive" && (
                    <div className="text-gray-500 text-xs font-medium">
                      INACTIVE
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
