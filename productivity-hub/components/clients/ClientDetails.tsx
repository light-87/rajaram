import { Client } from "@/types/database";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Edit, Phone, Mail, Building2, DollarSign, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface ClientDetailsProps {
  client: Client;
  onEdit: () => void;
}

export default function ClientDetails({ client, onEdit }: ClientDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: string): "success" | "warning" | "danger" | "default" => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "inactive":
        return "default";
      default:
        return "default";
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "annual":
        return "Annual";
      case "one-time":
        return "One-time";
      default:
        return frequency;
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">{client.name}</h2>
          {client.company && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Building2 className="w-4 h-4" />
              <span>{client.company}</span>
            </div>
          )}
        </div>
        <Badge variant={getStatusVariant(client.status)}>
          {client.status.toUpperCase()}
        </Badge>
      </div>

      {/* Contact Information */}
      <div className="mb-6 space-y-3">
        {client.email && (
          <div className="flex items-center gap-3 text-text-secondary">
            <Mail className="w-4 h-4" />
            <a
              href={`mailto:${client.email}`}
              className="hover:text-accent-secondary transition-colors"
            >
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-3 text-text-secondary">
            <Phone className="w-4 h-4" />
            <a
              href={`tel:${client.phone}`}
              className="hover:text-accent-secondary transition-colors"
            >
              {client.phone}
            </a>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-6 mb-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Contract Details
        </h3>

        <div className="space-y-4">
          {/* Product/Service */}
          {client.product_service && (
            <div>
              <div className="text-text-secondary text-sm mb-1">Product/Service</div>
              <div className="text-text-primary font-medium">{client.product_service}</div>
            </div>
          )}

          {/* Contract Value */}
          {client.contract_value && (
            <div>
              <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Contract Value</span>
              </div>
              <div className="text-text-primary font-bold text-xl">
                {formatCurrency(client.contract_value)}
                <span className="text-sm text-text-secondary font-normal ml-2">
                  ({getFrequencyLabel(client.payment_frequency)})
                </span>
              </div>
            </div>
          )}

          {/* Next Payment */}
          {client.next_payment_date && client.status !== "inactive" && (
            <div>
              <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Next Payment</span>
              </div>
              <div className="text-text-primary font-medium">
                {format(new Date(client.next_payment_date), "MMMM dd, yyyy")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="border-t border-gray-700 pt-6 mb-6">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-3">
            <FileText className="w-4 h-4" />
            <h3 className="font-semibold uppercase tracking-wider">Notes</h3>
          </div>
          <p className="text-text-primary whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Payment History Placeholder */}
      <div className="border-t border-gray-700 pt-6 mb-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Payment History
        </h3>
        <div className="text-text-secondary text-sm">
          Payment tracking coming soon...
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-700 pt-6 flex flex-wrap gap-3">
        <Button onClick={onEdit} variant="secondary">
          <Edit className="w-4 h-4 mr-2" />
          Edit Client
        </Button>

        {client.phone && (
          <Button variant="ghost" onClick={() => window.open(`tel:${client.phone}`)}>
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        )}

        {client.email && (
          <Button variant="ghost" onClick={() => window.open(`mailto:${client.email}`)}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        )}
      </div>
    </div>
  );
}
