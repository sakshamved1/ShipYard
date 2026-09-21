import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Failed to load data. Please check your connection and try again.",
  onRetry,
  isRetrying = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
            <span>Retry</span>
          </Button>
        </div>
      )}
    </div>
  );
};
