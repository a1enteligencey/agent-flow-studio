import {
  BrainCircuit, Bug, Code2, Database, FileText, Gauge, Handshake, Headset,
  HeartHandshake, Layers, Megaphone, Microscope, Scale, Search, Server,
  ShieldCheck, Target, Users, Wallet, Workflow,
} from "lucide-react";
import { factoryGroup, type FactoryGroupId } from "@/lib/ayra/factory";
import { cn } from "@/lib/utils";

const ICONS = { BrainCircuit, Bug, Code2, Database, FileText, Gauge, Handshake, Headset, HeartHandshake, Layers, Megaphone, Microscope, Scale, Search, Server, ShieldCheck, Target, Users, Wallet, Workflow };

export function FactoryIdentity({ group, small = false }: { group: FactoryGroupId; small?: boolean }) {
  const identity = factoryGroup(group);
  const Icon = ICONS[identity.icon];
  return <span data-factory={group} title={identity.name} className={cn("factory-identity relative inline-grid shrink-0 place-items-center rounded-md", small ? "h-6 w-6" : "h-8 w-8")}>
    <Icon aria-hidden className={small ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.75} />
    {!small && <span aria-hidden className="factory-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" />}
  </span>;
}