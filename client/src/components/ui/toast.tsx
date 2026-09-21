import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastVariant = "default" | "success" | "destructive" | "info";

export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;
let globalAddToast: ((toast: Omit<ToastItem, "id">) => string) | null = null;

export const toast = {
  show: (options: Omit<ToastItem, "id">) => {
    if (globalAddToast) {
      return globalAddToast(options);
    }
    return "";
  },
  success: (title: string, description?: string) => {
    return toast.show({ title, description, variant: "success" });
  },
  error: (title: string, description?: string) => {
    return toast.show({ title, description, variant: "destructive" });
  },
  info: (title: string, description?: string) => {
    return toast.show({ title, description, variant: "info" });
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `toast-${++toastCount}`;
      const duration = item.duration ?? 4000;
      const newToast: ToastItem = { ...item, id };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  React.useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const Toaster: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-h-screen w-full max-w-sm flex-col gap-2 p-4 pointer-events-none sm:bottom-4 sm:right-4"
      tabIndex={-1}
    >
      {toasts.map((item) => {
        const variantStyles = {
          default: "border-border bg-card text-card-foreground dark:bg-card/80 dark:border-border",
          success: "border-emerald-500/30 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-50 dark:border-emerald-500/40",
          destructive: "border-destructive/30 bg-destructive/10 text-destructive-foreground dark:bg-destructive/20 dark:text-destructive-foreground",
          info: "border-sky-500/30 bg-sky-50/90 text-sky-950 dark:bg-sky-950/90 dark:text-sky-50 dark:border-sky-500/40",
        };

        const icons = {
          default: null,
          success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          destructive: <AlertCircle className="h-5 w-5 text-destructive shrink-0" />,
          info: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />,
        };

        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200",
              variantStyles[item.variant || "default"]
            )}
            role="alert"
          >
            {icons[item.variant || "default"]}
            <div className="flex-1 space-y-1">
              {item.title && <div className="text-sm font-semibold">{item.title}</div>}
              {item.description && (
                <div className="text-xs text-muted-foreground opacity-90 leading-relaxed">
                  {item.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
