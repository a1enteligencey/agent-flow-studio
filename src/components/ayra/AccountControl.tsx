import { Link, useNavigate } from "@tanstack/react-router";
import { Cloud, LoaderCircle, LogOut, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/ayra/account";
import { useAyra } from "@/lib/ayra/store";
import { supabase } from "@/integrations/supabase/client";
export function AccountControl() {
  const { user, loading } = useAccount();
  const { syncStatus } = useAyra();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Couldn't sign out. Try again."); return; }
    await navigate({ to: "/auth", replace: true });
  };
  if (loading) return <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!user) return <Button size="sm" variant="outline" asChild><Link to="/auth"><UserRound /><span className="hidden sm:inline">Sign in</span></Link></Button>;
  return <div className="flex items-center gap-2">
    <span title={user.email} className="hidden max-w-32 truncate text-xs text-muted-foreground lg:block">{user.email}</span>
    <span title={syncStatus} aria-label={syncStatus} className="flex items-center gap-1 text-xs text-primary">{syncStatus === "Syncing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}<span className="hidden xl:inline">{syncStatus}</span></span>
    <Button size="icon" variant="ghost" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><LogOut /></Button>
  </div>;
}
