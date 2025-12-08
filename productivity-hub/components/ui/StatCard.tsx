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
  color?: "pink" | "purple" | "sky" | "yellow" | "green" | "coral";
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  onClick,
  className,
  children,
  color = "purple",
}: StatCardProps) {
  const colorStyles = {
    pink: {
      border: "hover:border-pink/40",
      iconBg: "bg-pink/15",
      iconColor: "text-pink",
      glow: "hover:shadow-glow-pink",
    },
    purple: {
      border: "hover:border-purple/40",
      iconBg: "bg-purple/15",
      iconColor: "text-purple",
      glow: "hover:shadow-glow-purple",
    },
    sky: {
      border: "hover:border-sky/40",
      iconBg: "bg-sky/15",
      iconColor: "text-sky",
      glow: "hover:shadow-glow-sky",
    },
    yellow: {
      border: "hover:border-yellow/40",
      iconBg: "bg-yellow/15",
      iconColor: "text-yellow",
      glow: "hover:shadow-glow-yellow",
    },
    green: {
      border: "hover:border-green/40",
      iconBg: "bg-green/15",
      iconColor: "text-green",
      glow: "hover:shadow-glow-green",
    },
    coral: {
      border: "hover:border-coral/40",
      iconBg: "bg-coral/15",
      iconColor: "text-coral",
      glow: "",
    },
  };

  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "card p-6 transition-all duration-300 hover:-translate-y-1",
        styles.border,
        styles.glow,
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
          <div className={cn("p-3 rounded-xl", styles.iconBg)}>
            <Icon className={cn("w-6 h-6", styles.iconColor)} />
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "text-green bg-green/10"
                : "text-red-400 bg-red-500/10"
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
