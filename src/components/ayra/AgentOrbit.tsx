import type { Agent } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Sci-fi "core" with every agent orbiting it; working agents beam to the core. */
export function AgentOrbit({ agents }: { agents: Agent[] }) {
  const size = 340;
  const c = size / 2;
  const r = 132;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="core-glow">
            <stop offset="0%" stopColor="var(--primary-glow)" stopOpacity="0.95" />
            <stop offset="40%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" />
        <circle cx={c} cy={c} r={r - 40} fill="none" stroke="var(--border)" strokeDasharray="2 6" />
        <g className="animate-spin-slow" style={{ transformOrigin: "center", transformBox: "view-box" }}>
          <circle cx={c} cy={c} r={58} fill="none" stroke="var(--primary)" strokeOpacity="0.5" strokeDasharray="40 14 4 14" />
        </g>
        <g className="animate-spin-reverse" style={{ transformOrigin: "center", transformBox: "view-box" }}>
          <circle cx={c} cy={c} r={72} fill="none" stroke="var(--primary)" strokeOpacity="0.25" strokeDasharray="1 5" />
        </g>
        {agents.map((a, i) => {
          const angle = (i / Math.max(agents.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const x = Math.round((c + Math.cos(angle) * r) * 100) / 100;
          const y = Math.round((c + Math.sin(angle) * r) * 100) / 100;
          if (a.status !== "working" && a.status !== "waiting") return null;
          return (
            <line
              key={a.id}
              x1={x}
              y1={y}
              x2={c}
              y2={c}
              stroke={a.status === "waiting" ? "var(--warning)" : "var(--primary)"}
              strokeWidth="1.5"
              strokeDasharray="4 8"
              className="animate-flow"
            />
          );
        })}
        <circle cx={c} cy={c} r={50} fill="url(#core-glow)" />
        <circle cx={c} cy={c} r={26} fill="var(--background)" stroke="var(--primary)" strokeWidth="1.5" />
        <text
          x={c}
          y={c + 4}
          textAnchor="middle"
          className="fill-primary font-display"
          style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700 }}
        >
          AYRA
        </text>
      </svg>
      {agents.map((a, i) => {
        const angle = (i / Math.max(agents.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + (Math.cos(angle) * r * 100) / size;
        const top = 50 + (Math.sin(angle) * r * 100) / size;
        const active = a.status === "working";
        const waiting = a.status === "waiting";
        return (
          <div
            key={a.id}
            title={`${a.name} — ${a.currentAction}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left.toFixed(2)}%`, top: `${top.toFixed(2)}%` }}
          >
            <span
              className={cn(
                "relative grid h-9 w-9 place-items-center rounded-full border font-display text-[10px] font-bold transition-all duration-500",
                active && "border-primary bg-primary text-primary-foreground glow",
                waiting && "border-warning bg-background text-warning",
                a.status === "idle" && "border-primary/30 bg-background text-primary/80",
                a.status === "offline" && "border-border bg-muted text-muted-foreground opacity-50",
              )}
            >
              {active && <span aria-hidden className="absolute inset-0 rounded-full border border-primary animate-pulse-ring" />}
              {initials(a.name)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
