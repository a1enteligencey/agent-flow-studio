import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Angled-corner glowing frame from the AYRA workspace design. */
export function HudFrame({
  children,
  className,
  innerClassName,
  small = false,
  accents = false,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  small?: boolean;
  accents?: boolean;
}) {
  const chamfer = small ? "clip-chamfer-sm" : "clip-chamfer";
  return (
    <div className={cn("hud-glow relative", className)}>
      <div className={cn(chamfer, "h-full bg-primary/45 p-px")}>
        <div className={cn(chamfer, "relative h-full bg-card", innerClassName)}>{children}</div>
      </div>
      {accents && (
        <>
          <span aria-hidden className="pointer-events-none absolute -left-px top-1/4 h-16 w-1 bg-primary" />
          <span aria-hidden className="pointer-events-none absolute -right-px bottom-1/4 h-16 w-1 bg-primary" />
          <span aria-hidden className="pointer-events-none absolute -bottom-px left-12 h-1 w-40 bg-primary" />
          <span aria-hidden className="pointer-events-none absolute -top-px right-16 h-1 w-10 bg-primary/70" />
        </>
      )}
    </div>
  );
}
