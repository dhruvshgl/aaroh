"use client";

import { Popover } from "@base-ui/react/popover";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineHelp({
  label = "What does this mean?",
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        openOnHover
        delay={150}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-popup-open:bg-secondary data-popup-open:text-foreground",
          className,
        )}
      >
        <CircleHelp className="size-4" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-50">
          <Popover.Popup className="max-w-72 origin-(--transform-origin) rounded-xl bg-popover p-3 text-small text-popover-foreground shadow-[var(--shadow-raised)] ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
