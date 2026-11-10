import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SITE_STATUS_KEY = "site_status";
export type SiteStatus = { active: boolean };

export async function readSiteStatus(): Promise<SiteStatus> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", SITE_STATUS_KEY).maybeSingle();
  const v = (data?.value ?? {}) as { active?: boolean };
  return { active: v.active !== false };
}

/** Returns null while loading. Admins always bypass (seeAsAdmin=true). */
export function useSiteGate() {
  const [state, setState] = useState<{ active: boolean; isAdmin: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await readSiteStatus();
      let isAdmin = false;
      if (!s.active) {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
          isAdmin = !!data;
        }
      }
      if (alive) setState({ active: s.active, isAdmin });
    })().catch(() => alive && setState({ active: true, isAdmin: false }));
    const ch = supabase
      .channel("site-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: `key=eq.${SITE_STATUS_KEY}` }, (p) => {
        const v = ((p.new as { value?: { active?: boolean } })?.value ?? {});
        setState((prev) => ({ active: v.active !== false, isAdmin: prev?.isAdmin ?? false }));
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);
  return state;
}
