import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogPortal = BaseDialog.Portal;
export const DialogClose = BaseDialog.Close;

export const DialogBackdrop = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
      className
    )}
    {...props}
  />
));
DialogBackdrop.displayName = "DialogBackdrop";

export const DialogPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseDialog.Popup>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdrop />
    <BaseDialog.Popup
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background dark:bg-card/80 p-6 shadow-xl transition-all duration-200 focus:outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
      <BaseDialog.Close
        render={
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        }
      />
    </BaseDialog.Popup>
  </DialogPortal>
));
DialogPopup.displayName = "DialogPopup";

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1.5", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
