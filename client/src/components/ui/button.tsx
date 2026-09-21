import * as React from "react";
import { Button as BaseButton, type ButtonProps as BaseButtonProps } from "@base-ui-components/react/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<BaseButtonProps, "size"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variantStyles = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 shadow-xs active:scale-[0.98]",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 shadow-xs active:scale-[0.98]",
      outline:
        "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground dark:border-border dark:hover:bg-accent dark:hover:text-accent-foreground active:scale-[0.98]",
      ghost:
        "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground active:scale-[0.98]",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/90 shadow-xs active:scale-[0.98]",
      link:
        "text-primary underline-offset-4 hover:underline dark:text-primary p-0 h-auto font-normal",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
      md: "h-9 px-4 text-sm gap-2 rounded-lg",
      lg: "h-11 px-6 text-base gap-2.5 rounded-lg",
      icon: "h-9 w-9 p-0 rounded-lg justify-center",
    };

    return (
      <BaseButton
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          variantStyles[variant],
          variant !== "link" && sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </BaseButton>
    );
  }
);
Button.displayName = "Button";
