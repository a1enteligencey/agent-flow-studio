import { Link } from "@tanstack/react-router";
import { useAyra } from "@/lib/ayra/store";
import { cn } from "@/lib/utils";

/** Shows whether the dashboard shows real studio activity or the demo. */
export function LiveBadge({ className }: { className?: string }) {
  const { state } = useAyra();
  const { live, settings } = state;
  const on = settings.liveEnabled && settings.liveUrl.trim() !== "";
  const label = !on ? "Demo" : live.state === "connected" ? "Live" : live.state === "error" ? "Offline" : "Linking";
  const tone = !on
    ? "border-border text-muted-foreground"
    : live.state === "connected"
      ? "border-success/50 text-success"
      : live.state === "error"
        ? "border-destructive/50 text-destructive"
        : "border-warning/50 text-warning";
  const dot = !on ? "bg-muted-foreground" : live.state === "connected" ? "bg-success animate-pulse" : live.state === "error" ? "bg-destructive" : "bg-warning animate-pulse";
  return (
    <Link
      to="/settings"
      title={on ? live.message || "Agent Flow Studio connection" : "Showing demo activity — connect your studio in Settings"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest hover:bg-primary/10",
        tone,
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </Link>
  );
}
