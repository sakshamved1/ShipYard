import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  const variantStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    outline: "bg-transparent text-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium rounded-md",
    md: "px-2.5 py-1 text-xs font-semibold rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
};
Badge.displayName = "Badge";
