import { Client } from "@/types/database";
import StatCard from "@/components/ui/StatCard";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface KeyMetricsProps {
  clients: Client[];
}

export default function KeyMetrics({ clients }: KeyMetricsProps) {
  // Calculate Total ARR (Annual Recurring Revenue)
  const calculateARR = () => {
    return clients.reduce((total, client) => {
      if (!client.contract_value || client.status === "inactive") return total;

      const value = client.contract_value;
      switch (client.payment_frequency) {
        case "monthly":
          return total + (value * 12);
        case "quarterly":
          return total + (value * 4);
        case "annual":
          return total + value;
        case "one-time":
          return total; // One-time doesn't contribute to recurring revenue
        default:
          return total;
      }
    }, 0);
  };

  // Calculate revenue for current month
  const calculateMonthlyRevenue = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return clients.reduce((total, client) => {
      if (!client.contract_value || !client.next_payment_date || client.status === "inactive") {
        return total;
      }

      const paymentDate = new Date(client.next_payment_date);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return total + client.contract_value;
      }
      return total;
    }, 0);
  };

  // Count payments this month
  const countMonthlyPayments = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return clients.filter((client) => {
      if (!client.next_payment_date || client.status === "inactive") return false;
      const paymentDate = new Date(client.next_payment_date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    }).length;
  };

  const totalARR = calculateARR();
  const activeClients = clients.filter((c) => c.status === "active").length;
  const pendingClients = clients.filter((c) => c.status === "pending").length;
  const monthlyRevenue = calculateMonthlyRevenue();
  const monthlyPayments = countMonthlyPayments();

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={TrendingUp}
        title="Total ARR"
        value={formatCurrency(totalARR)}
      >
        <p className="text-sm text-text-secondary mt-2">Annual Recurring Revenue</p>
      </StatCard>
      <StatCard
        icon={Users}
        title="Clients"
        value={activeClients.toString()}
      >
        <p className="text-sm text-text-secondary mt-2">{pendingClients} pending</p>
      </StatCard>
      <StatCard
        icon={DollarSign}
        title="This Month"
        value={formatCurrency(monthlyRevenue)}
      >
        <p className="text-sm text-text-secondary mt-2">
          {monthlyPayments} payment{monthlyPayments !== 1 ? 's' : ''}
        </p>
      </StatCard>
    </div>
  );
}
