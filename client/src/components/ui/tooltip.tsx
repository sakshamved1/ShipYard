import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = BaseTooltip.Provider;
export const TooltipRoot = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = "top",
  sideOffset = 6,
  className,
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        render={(props) => React.cloneElement(children, props)}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
          <BaseTooltip.Popup
            className={cn(
              "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md animate-in fade-in-0 zoom-in-95",
              className
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
