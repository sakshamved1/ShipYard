import * as React from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { cn } from "@/lib/utils";

export const MenuRoot = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuPortal = BaseMenu.Portal;
export const MenuGroup = BaseMenu.Group;

export const MenuPositioner = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseMenu.Positioner>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <BaseMenu.Positioner
    ref={ref}
    sideOffset={sideOffset}
    className={cn("z-50 outline-none", className)}
    {...props}
  />
));
MenuPositioner.displayName = "MenuPositioner";

export const MenuPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseMenu.Popup>
>(({ className, ...props }, ref) => (
  <BaseMenu.Popup
    ref={ref}
    className={cn(
      "min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md transition-all outline-none",
      className
    )}
    {...props}
  />
));
MenuPopup.displayName = "MenuPopup";

export const MenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseMenu.Item>
>(({ className, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
));
MenuItem.displayName = "MenuItem";

export const MenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseMenu.Separator>
>(({ className, ...props }, ref) => (
  <BaseMenu.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
MenuSeparator.displayName = "MenuSeparator";

export const MenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseMenu.GroupLabel>
>(({ className, ...props }, ref) => (
  <BaseMenu.GroupLabel
    ref={ref}
    className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)}
    {...props}
  />
));
MenuGroupLabel.displayName = "MenuGroupLabel";
