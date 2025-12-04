import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin text-accent-secondary", sizes[size])} />
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        {content}
      </div>
    );
  }

  return content;
}
