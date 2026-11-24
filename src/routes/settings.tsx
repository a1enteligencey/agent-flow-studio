import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AYRA Agent OS" },
      { name: "description", content: "Budget, approval limit and demo autopilot for AYRA." },
      { property: "og:title", content: "Settings — AYRA Agent OS" },
      { property: "og:description", content: "Budget, approval limit and demo autopilot for AYRA." },
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

        <HudPanel kicker="Demo" title="Autopilot">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm">Run sample missions automatically</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keeps the Command Center alive with example missions so you can see the flow. Turn off to only run your own.
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
