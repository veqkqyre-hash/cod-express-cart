import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readSiteStatus, SITE_STATUS_KEY } from "@/lib/site-status";

export function SiteStatusToggle() {
  const [active, setActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { readSiteStatus().then((s) => setActive(s.active)); }, []);
  if (active === null) return null;
  const toggle = async () => {
    const next = !active;
    if (!next && !confirm("Ta çaktivizoj website-in? Klientët do të shohin faqen COMING SOON.")) return;
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key: SITE_STATUS_KEY, value: { active: next }, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return toast.error("Vetëm administratori mund ta ndryshojë statusin.");
    setActive(next);
    toast.success(next ? "Website-i është AKTIV" : "Website-i është çaktivizuar (Coming Soon)");
  };
  return (
    <button onClick={toggle} disabled={busy}
      title={active ? "Kliko për ta çaktivizuar website-in" : "Kliko për ta aktivizuar website-in"}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
      <span className={`relative inline-flex h-4 w-7 rounded-full transition ${active ? "bg-emerald-500" : "bg-neutral-300"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${active ? "left-3.5" : "left-0.5"}`} />
      </span>
      <span className="hidden sm:inline">{active ? "Website Aktiv" : "Coming Soon"}</span>
    </button>
  );
}
