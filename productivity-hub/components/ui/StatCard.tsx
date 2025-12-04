import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  onClick,
  className,
  children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card p-6 hover:border-accent-secondary/50 transition-all",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-text-secondary font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-accent-secondary/10">
            <Icon className="w-6 h-6 text-accent-secondary" />
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "font-medium",
              trend.positive ? "text-accent-success" : "text-red-500"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-text-secondary">from last month</span>
        </div>
      )}

      {children}
    </div>
  );
}
