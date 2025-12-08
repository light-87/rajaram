import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "pink" | "purple" | "sky" | "coral" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-background-elevated text-text-primary border-border",
    success: "bg-green/15 text-green border-green/30",
    warning: "bg-yellow/15 text-yellow border-yellow/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    info: "bg-sky/15 text-sky border-sky/30",
    pink: "bg-pink/15 text-pink border-pink/30",
    purple: "bg-purple/15 text-purple border-purple/30",
    sky: "bg-sky/15 text-sky border-sky/30",
    coral: "bg-coral/15 text-coral border-coral/30",
    gradient: "bg-gradient-pink-purple text-white border-transparent",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
