import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  Cpu,
  Gauge,
  ListChecks,
  Rocket,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AyraLogo } from "./AyraLogo";
import { useAyra } from "@/lib/ayra/store";

const MAIN = [
  { title: "Command Center", url: "/", icon: Gauge },
  { title: "Missions", url: "/missions", icon: Rocket },
  { title: "Roadmap", url: "/roadmap", icon: ListChecks },
] as const;

const BUILD = [
  { title: "Agents", url: "/agents", icon: Users },
  { title: "Modules", url: "/modules", icon: Boxes },
  { title: "Model Router", url: "/models", icon: Cpu },
  { title: "Safety Gates", url: "/gates", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: Settings2 },
] as const;

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useAyra();
  const pending = state.missions.filter((m) => m.status === "awaiting_approval").length;
  const running = state.missions.filter((m) => m.status === "running").length;

  const renderItems = (items: readonly { title: string; url: string; icon: typeof Gauge }[]) =>
    items.map((item) => {
      const active = path === item.url;
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.title}
            className="h-10 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_2px_0_0_var(--primary)]"
          >
            <Link to={item.url}>
              <item.icon />
              <span className="text-sm tracking-wide">{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {item.url === "/" && pending > 0 && (
            <SidebarMenuBadge className="bg-warning text-warning-foreground">{pending}</SidebarMenuBadge>
          )}
          {item.url === "/missions" && running > 0 && (
            <SidebarMenuBadge className="text-primary">{running}</SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-1 py-1.5">
          <AyraLogo className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-display text-base font-bold tracking-[0.3em] text-foreground">AYRA</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Frontier Agent OS</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.25em]">Operate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(MAIN)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.25em]">Build & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(BUILD)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="rounded-md border border-sidebar-border p-3">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> System online
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Hostinger KVM 8 · 8 vCPU · 32 GB · no GPU</p>
          </div>
        ) : (
          <span className="mx-auto h-2 w-2 animate-pulse rounded-full bg-success" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
