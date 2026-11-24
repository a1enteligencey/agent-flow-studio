import { Check, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACTION_LABELS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";

/** Human gate: missions paused until the Owner approves or rejects. */
export function ApprovalQueue() {
  const { state, approve, reject } = useAyra();
  const pending = state.missions.filter((m) => m.status === "awaiting_approval");

  if (pending.length === 0) {
    return (
      <div className="grid h-full min-h-40 place-items-center rounded-md border border-dashed border-border p-6 text-center">
        <div>
          <Check className="mx-auto h-6 w-6 text-success" />
          <p className="mt-2 text-sm text-foreground">Nothing waiting for you</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Risky or costly missions pause here until you say yes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pending.map((m) => (
        <li key={m.id} className="rounded-md border border-warning/40 bg-warning/5 p-4 animate-line-in">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
                {m.code} · {m.intent} · est. ${m.estCost.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-foreground">{m.prompt}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {m.gateReasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              {m.actions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Will do: {m.actions.map((a) => ACTION_LABELS[a]).join(", ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    approve(m.id);
                    toast.success(`${m.code} approved — agents continue`);
                  }}
                >
                  <Check /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reject(m.id);
                    toast(`${m.code} rejected`);
                  }}
                >
                  <X /> Reject
                </Button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
