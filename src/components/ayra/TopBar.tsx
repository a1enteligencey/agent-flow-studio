import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { MissionLauncher } from "./MissionLauncher";
import { LiveBadge } from "./LiveBadge";
import { useAyra } from "@/lib/ayra/store";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="hidden font-mono text-xs tabular-nums text-muted-foreground md:inline">
      {now ? now.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
    </span>
  );
}

export function TopBar() {
  const { state, updateSettings } = useAyra();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-md md:px-5">
      <SidebarTrigger className="text-primary" />
      <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
      <p className="hidden min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground sm:block">
        Owner console
      </p>
      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <Clock />
        <LiveBadge />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={state.settings.autopilot}
            onCheckedChange={(v) => updateSettings({ autopilot: v })}
            aria-label="Demo autopilot"
          />
          <span className="hidden sm:inline">Demo autopilot</span>
        </label>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Play className="fill-current" /> <span className="hidden sm:inline">New mission</span>
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/30 bg-popover sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-[0.14em]">Launch a mission</DialogTitle>
            <DialogDescription>Tell AYRA what to do. It plans, asks you if needed, then acts.</DialogDescription>
          </DialogHeader>
          <MissionLauncher onLaunched={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
