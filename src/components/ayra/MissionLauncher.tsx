import { useMemo, useState } from "react";
import { Play, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTION_LABELS,
  INTENTS,
  SAMPLE_PROMPTS,
  classifyIntent,
  detectActions,
  estimateCost,
  evaluateGate,
} from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { ActionKind, Intent } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

const ALL_ACTIONS = Object.keys(ACTION_LABELS) as ActionKind[];

/** Form to give AYRA a task, with a live preview of what the Owner gate will do. */
export function MissionLauncher({ onLaunched }: { onLaunched?: () => void }) {
  const { state, launch } = useAyra();
  const [prompt, setPrompt] = useState("");
  const [intentChoice, setIntentChoice] = useState<"AUTO" | Intent>("AUTO");
  const [manual, setManual] = useState<Partial<Record<ActionKind, boolean>>>({});

  const detected = useMemo(() => detectActions(prompt), [prompt]);
  const actions = ALL_ACTIONS.filter((a) => manual[a] ?? detected.includes(a));
  const intent = intentChoice === "AUTO" ? classifyIntent(prompt) : intentChoice;
  const cost = estimateCost(intent, prompt);
  const gate = evaluateGate(actions, cost, state.gates, state.settings.approvalCostLimit);

  const submit = () => {
    const text = prompt.trim();
    if (!text) {
      toast.error("Type what you want AYRA to do");
      return;
    }
    const code = launch(text, intent, actions);
    toast.success(`Mission ${code} launched`, { description: "Watch it live on the Command Center." });
    setPrompt("");
    setManual({});
    setIntentChoice("AUTO");
    onLaunched?.();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="mission-prompt" className="text-xs uppercase tracking-widest text-muted-foreground">
          What should AYRA do?
        </Label>
        <Textarea
          id="mission-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Research the best GPU rental for training under $1/hour"
          rows={3}
          className="resize-none bg-background/60 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className="rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Type of task</Label>
          <Select value={intentChoice} onValueChange={(v) => setIntentChoice(v as "AUTO" | Intent)}>
            <SelectTrigger className="bg-background/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Auto detect ({classifyIntent(prompt)})</SelectItem>
              {INTENTS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Estimated cost</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-background/60 px-3 font-mono text-sm">
            ${cost.toFixed(2)}
            <span className="ml-2 text-xs text-muted-foreground">
              (limit ${state.settings.approvalCostLimit.toFixed(2)})
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Sensitive actions in this task <span className="normal-case tracking-normal">(tap to change)</span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ACTIONS.map((a) => {
            const on = actions.includes(a);
            return (
              <button
                key={a}
                type="button"
                aria-pressed={on}
                onClick={() => setManual((prev) => ({ ...prev, [a]: !on }))}
                className={cn(
                  "rounded-sm border px-2 py-1 text-[11px] transition-colors",
                  on
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {ACTION_LABELS[a]}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border p-3 text-sm",
          gate.decision === "auto" && "border-success/40 bg-success/5",
          gate.decision === "approval" && "border-warning/40 bg-warning/5",
          gate.decision === "blocked" && "border-destructive/40 bg-destructive/5",
        )}
      >
        {gate.decision === "auto" && <ShieldCheck className="h-5 w-5 text-success" />}
        {gate.decision === "approval" && <ShieldAlert className="h-5 w-5 text-warning" />}
        {gate.decision === "blocked" && <ShieldX className="h-5 w-5 text-destructive" />}
        <div className="min-w-0">
          <p className="font-medium">
            {gate.decision === "auto" && "Runs on its own — safe and under budget"}
            {gate.decision === "approval" && "Will pause and ask you before acting"}
            {gate.decision === "blocked" && "AYRA will refuse this mission"}
          </p>
          {gate.reasons.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">{gate.reasons.join(" · ")}</p>
          )}
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={submit}>
        <Play className="fill-current" /> Launch mission
      </Button>
    </div>
  );
}
