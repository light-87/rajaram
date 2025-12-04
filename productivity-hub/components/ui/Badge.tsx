import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
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
    default: "bg-gray-700 text-text-primary",
    success: "bg-accent-success/20 text-accent-success border-accent-success/30",
    warning: "bg-accent-primary/20 text-accent-primary border-accent-primary/30",
    danger: "bg-red-600/20 text-red-500 border-red-600/30",
    info: "bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
