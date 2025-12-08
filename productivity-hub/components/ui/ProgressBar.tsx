import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  color?: "primary" | "secondary" | "success" | "gradient" | "pink" | "purple" | "sky" | "rainbow";
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

export default function ProgressBar({
  percentage,
  showLabel = true,
  color = "gradient",
  size = "md",
  className,
  animated = false,
}: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getGradientColor = () => {
    if (clampedPercentage < 33) return "bg-gradient-to-r from-red-500 to-coral";
    if (clampedPercentage < 66) return "bg-gradient-to-r from-coral to-yellow";
    return "bg-gradient-to-r from-yellow to-green";
  };

  const colors = {
    primary: "bg-pink",
    secondary: "bg-purple",
    success: "bg-green",
    gradient: getGradientColor(),
    pink: "bg-gradient-to-r from-pink to-pink-light",
    purple: "bg-gradient-to-r from-purple to-purple-light",
    sky: "bg-gradient-to-r from-sky to-sky-light",
    rainbow: "bg-gradient-rainbow",
  };

  const glowColors = {
    primary: "shadow-glow-pink",
    secondary: "shadow-glow-purple",
    success: "shadow-glow-green",
    gradient: clampedPercentage >= 66 ? "shadow-glow-green" : "",
    pink: "shadow-glow-pink",
    purple: "shadow-glow-purple",
    sky: "shadow-glow-sky",
    rainbow: "",
  };

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const labelColors = {
    primary: "text-pink",
    secondary: "text-purple",
    success: "text-green",
    gradient: clampedPercentage < 33 ? "text-red-400" : clampedPercentage < 66 ? "text-yellow" : "text-green",
    pink: "text-pink",
    purple: "text-purple",
    sky: "text-sky",
    rainbow: "text-gradient-rainbow",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className={cn("text-sm font-semibold", labelColors[color])}>
            {clampedPercentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={cn("w-full bg-background rounded-full overflow-hidden", sizes[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colors[color],
            glowColors[color],
            animated && "animate-pulse-slow"
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
