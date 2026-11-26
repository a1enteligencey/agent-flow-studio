import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const AccountContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      const { data } = await supabase.auth.getUser();
      if (active && current === generation) { setUser(data.user); setLoading(false); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") { generation++; setUser(null); setLoading(false); }
      else queueMicrotask(() => { void refresh(); });
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void refresh();
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <AccountContext.Provider value={{ user, loading }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);
