import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  color?: "primary" | "secondary" | "success" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProgressBar({
  percentage,
  showLabel = true,
  color = "gradient",
  size = "md",
  className,
}: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const colors = {
    primary: "bg-accent-primary",
    secondary: "bg-accent-secondary",
    success: "bg-accent-success",
    gradient:
      clampedPercentage < 33
        ? "bg-red-500"
        : clampedPercentage < 66
        ? "bg-yellow-500"
        : "bg-accent-success",
  };

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm font-semibold text-text-primary">
            {clampedPercentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={cn("w-full bg-background rounded-full overflow-hidden", sizes[size])}>
        <div
          className={cn("h-full transition-all duration-500", colors[color])}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
