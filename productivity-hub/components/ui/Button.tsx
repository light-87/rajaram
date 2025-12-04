import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-accent-primary text-background hover:bg-accent-primary/90 shadow-lg shadow-accent-primary/20",
      secondary:
        "bg-accent-secondary text-white hover:bg-accent-secondary/90 shadow-lg shadow-accent-secondary/20",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
      ghost:
        "bg-transparent text-text-primary hover:bg-background-card border border-border",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
