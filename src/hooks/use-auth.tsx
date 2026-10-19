import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { session: Session | null; user: User | null; ready: boolean };
const Ctx = createContext<AuthCtx>({ session: null, user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={{ session, user: session?.user ?? null, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export type Role = "super_admin" | "ops_admin" | "support_agent" | "user";

/** UI-only convenience; every privileged action is re-checked by the database. */
export function useRoles() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role as Role);
    },
  });
  const roles = q.data ?? [];
  return {
    roles,
    loading: q.isLoading,
    isStaff: roles.some((r) => r !== "user"),
    isAdmin: roles.includes("super_admin") || roles.includes("ops_admin"),
    isSuper: roles.includes("super_admin"),
  };
}
