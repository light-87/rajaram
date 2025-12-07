import { Client } from "@/types/database";
import { Calendar, Factory, Sun } from "lucide-react";
import { format, isWithinInterval, addDays } from "date-fns";

interface UpcomingPaymentsProps {
  clients: Client[];
  onClientClick: (clientId: string) => void;
}

export default function UpcomingPayments({ clients, onClientClick }: UpcomingPaymentsProps) {
  // Get payments due in next 30 days
  const getUpcomingPayments = () => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    return clients
      .filter((client) => {
        if (!client.next_payment_date || client.status === "inactive") return false;
        const paymentDate = new Date(client.next_payment_date);
        return isWithinInterval(paymentDate, { start: today, end: thirtyDaysFromNow });
      })
      .sort((a, b) => {
        const dateA = new Date(a.next_payment_date!);
        const dateB = new Date(b.next_payment_date!);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const upcomingPayments = getUpcomingPayments();

  const getProductIcon = (productService?: string) => {
    if (!productService) return null;
    const product = productService.toLowerCase();
    if (product.includes("solar")) {
      return <Sun className="w-4 h-4 text-yellow-500" />;
    } else if (product.includes("factory") || product.includes("pmr")) {
      return <Factory className="w-4 h-4 text-gray-400" />;
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  if (upcomingPayments.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">
          Upcoming Payments (Next 30 Days)
        </h2>
      </div>

      <div className="space-y-3">
        {upcomingPayments.map((client) => (
          <div
            key={client.id}
            onClick={() => onClientClick(client.id)}
            className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-background/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-[80px]">
              <span className="text-sm text-text-secondary">
                {format(new Date(client.next_payment_date!), "MMM dd")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {getProductIcon(client.product_service)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-medium">{client.name}</span>
                {client.company && (
                  <span className="text-text-secondary text-sm">({client.company})</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-accent-primary font-semibold">
                {client.contract_value ? formatCurrency(client.contract_value) : "—"}
              </span>
              <span className="text-text-secondary text-sm">
                {client.product_service || "Unknown"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {upcomingPayments.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-accent-secondary text-sm hover:underline">
            View All Payments →
          </button>
        </div>
      )}
    </div>
  );
}
