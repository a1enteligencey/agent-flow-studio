import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Radio, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HudPanel } from "@/components/ayra/HudPanel";
import { PageHeader } from "@/components/ayra/PageHeader";
import { useAyra } from "@/lib/ayra/store";
import { checkFeedUrl } from "@/lib/ayra/live";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AYRA Agent OS" },
      { name: "description", content: "Budget, approvals, demo autopilot and the live Agent Flow Studio connection for AYRA." },
      { property: "og:title", content: "Settings — AYRA Agent OS" },
      { property: "og:description", content: "Budget, approvals, demo autopilot and the live Agent Flow Studio connection for AYRA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateSettings, resetAll } = useAyra();
  const [confirmReset, setConfirmReset] = useState(false);
  const { settings } = state;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader kicker="Control" title="System" highlight="Settings" description="Simple controls for money, approvals and the live demo." />
      <div className="space-y-6">
        <HudPanel kicker="Money" title="Budget & approvals">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="limit" className="text-xs uppercase tracking-widest text-muted-foreground">
                Ask me if a mission costs more than ($)
              </Label>
              <Input
                id="limit"
                type="number"
                step={0.05}
                min={0}
                value={settings.approvalCostLimit}
                onChange={(e) => updateSettings({ approvalCostLimit: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget" className="text-xs uppercase tracking-widest text-muted-foreground">
                Total budget ($)
              </Label>
              <Input
                id="budget"
                type="number"
                step={1}
                min={0}
                value={settings.dailyBudget}
                onChange={(e) => updateSettings({ dailyBudget: Math.max(0, Number(e.target.value)) })}
              />
            </div>
          </div>
        </HudPanel>

        <LiveConnection />

        <HudPanel kicker="Demo" title="Autopilot">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm">Run sample missions automatically</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keeps the Command Center alive with example missions so you can see the flow. Turn off to only run your own. Pauses while the live connection is on.
              </p>
            </div>
            <Switch checked={settings.autopilot} onCheckedChange={(v) => updateSettings({ autopilot: v })} aria-label="Autopilot" />
          </div>
        </HudPanel>

        <HudPanel kicker="Data" title="Saved data">
          <p className="text-sm text-muted-foreground">
            Your agents, modules, models, rules and mission history are saved in this browser. Reset brings back the starting setup.
          </p>
          <Button variant="outline" className="mt-4 hover:border-destructive hover:text-destructive" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Reset to starting setup
          </Button>
        </HudPanel>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="border-destructive/40 bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset everything?</AlertDialogTitle>
            <AlertDialogDescription>
              All your edits and mission history will be replaced with the starting setup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                resetAll();
                toast("AYRA reset to starting setup");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const SAMPLE_FEED = `[
  {
    "id": "evt_101",
    "time": "2026-11-24T07:10:00Z",
    "workflow": "Lead finder",
    "agent": "Researcher",
    "step": "execute",
    "status": "success",
    "message": "Found 12 new leads"
  }
]`;

function LiveConnection() {
  const { state, updateSettings } = useAyra();
  const { settings, live } = state;
  const [url, setUrl] = useState(settings.liveUrl);
  const [key, setKey] = useState(settings.liveKey);
  const [touched, setTouched] = useState(false);
  const urlCheck = url.trim() ? checkFeedUrl(url) : null;
  const dirty = url !== settings.liveUrl || key !== settings.liveKey;

  const save = () => {
    setTouched(true);
    if (!urlCheck || !urlCheck.ok) return;
    updateSettings({ liveUrl: url.trim(), liveKey: key.trim(), liveEnabled: true });
    toast("Connecting to your Agent Flow Studio…");
  };

  const statusTone =
    live.state === "connected" ? "text-success" : live.state === "error" ? "text-destructive" : live.state === "connecting" ? "text-warning" : "text-muted-foreground";

  return (
    <HudPanel kicker="Live connection" title="Agent Flow Studio">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Paste the address where your studio shares its activity. AYRA checks it every few seconds and shows the real
          steps in Live activity, instead of the demo.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="live-url" className="text-xs uppercase tracking-widest text-muted-foreground">
            Activity address
          </Label>
          <Input
            id="live-url"
            placeholder="https://your-studio.example.com/api/activity"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && urlCheck && !urlCheck.ok && <p className="text-xs text-destructive">{urlCheck.reason}</p>}
          {touched && !urlCheck && <p className="text-xs text-destructive">Enter the address first.</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="live-key" className="text-xs uppercase tracking-widest text-muted-foreground">
            Access key (only if your studio asks for one)
          </Label>
          <Input id="live-key" type="password" autoComplete="off" placeholder="Optional" value={key} onChange={(e) => setKey(e.target.value)} />
          <p className="text-xs text-muted-foreground">Saved only in this browser.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={!dirty && settings.liveEnabled}>
            <Radio /> {settings.liveEnabled && !dirty ? "Connected" : "Save & connect"}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={settings.liveEnabled}
              disabled={!settings.liveUrl}
              onCheckedChange={(v) => updateSettings({ liveEnabled: v })}
              aria-label="Show real activity"
            />
            Show real activity
          </label>
        </div>

        <div className="rounded-md border border-border bg-background/60 p-3 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Status</p>
          <p className={cn("mt-1", statusTone)} data-testid="live-status">
            {live.state === "off"
              ? "Not connected — dashboard shows demo activity."
              : live.message}
          </p>
          {live.lastSync && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last check {new Date(live.lastSync).toLocaleTimeString([], { hour12: false })}
              {live.eventCount > 0 && ` · ${live.eventCount} events in feed`}
            </p>
          )}
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-primary">What should the address return?</summary>
          <p className="mt-2 text-muted-foreground">
            A list of recent activity in JSON. Each item needs a message; time, workflow, agent, step and status are
            optional. Common names like <span className="font-mono">text</span>, <span className="font-mono">node</span> or{" "}
            <span className="font-mono">level</span> also work.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/80 p-3 font-mono text-xs">{SAMPLE_FEED}</pre>
        </details>
      </div>
    </HudPanel>
  );
}
