import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "pink" | "purple" | "sky" | "green" | "gradient";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary:
        "bg-pink text-white hover:bg-pink-dark shadow-lg shadow-pink/25 hover:shadow-pink/40 focus:ring-pink/50",
      secondary:
        "bg-purple text-white hover:bg-purple-dark shadow-lg shadow-purple/25 hover:shadow-purple/40 focus:ring-purple/50",
      danger:
        "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus:ring-red-500/50",
      ghost:
        "bg-transparent text-text-primary hover:bg-background-elevated border border-border hover:border-border-light",
      pink:
        "bg-pink text-white hover:bg-pink-dark shadow-lg shadow-pink/25 hover:shadow-pink/40 focus:ring-pink/50",
      purple:
        "bg-purple text-white hover:bg-purple-dark shadow-lg shadow-purple/25 hover:shadow-purple/40 focus:ring-purple/50",
      sky:
        "bg-sky text-white hover:bg-sky-dark shadow-lg shadow-sky/25 hover:shadow-sky/40 focus:ring-sky/50",
      green:
        "bg-green text-white hover:bg-green-dark shadow-lg shadow-green/25 hover:shadow-green/40 focus:ring-green/50",
      gradient:
        "bg-gradient-pink-purple text-white shadow-lg shadow-purple/30 hover:shadow-pink/40 focus:ring-pink/50 hover:opacity-90",
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
