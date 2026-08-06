import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Bell, Check, CheckCheck, ShoppingBag, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Notif = {
  id: string;
  order_number: string | null;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

export function useNotifications() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p) => {
        const n = p.new as Notif;
        toast.info(n.title, { description: n.body ?? undefined });
        qc.invalidateQueries({ queryKey: ["admin-notifications"] });
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return q;
}

export function NotificationsBell({ onOpen }: { onOpen: () => void }) {
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.read).length;
  return (
    <button
      onClick={onOpen}
      className="relative grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-[var(--pink-deep,#e91e63)] px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

export function NotificationsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data, refetch, isLoading } = useNotifications();
  const list = data ?? [];
  const unread = list.filter((n) => !n.read);

  async function markRead(id: string) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function markAll() {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) return toast.error(error.message);
    toast.success(L("Të gjitha u shënuan si të lexuara", "All marked as read"));
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-500">
          {isLoading ? "…" : `${list.length} ${L("njoftime", "notifications")} · ${unread.length} ${L("të palexuara", "unread")}`}
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
            <RefreshCw className="h-4 w-4" /> {L("Rifresko", "Refresh")}
          </button>
          <button
            onClick={markAll}
            disabled={unread.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep,#e91e63)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" /> {L("Shëno të gjitha", "Mark all read")}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
        {list.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.read ? "" : "bg-pink-50/40"}`}>
            <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.kind === "new_order" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
              {n.kind === "new_order" ? <ShoppingBag className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{n.title}</div>
              {n.body && <div className="text-xs text-neutral-500">{n.body}</div>}
              <div className="mt-1 text-[11px] text-neutral-400">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read && (
              <button onClick={() => markRead(n.id)} className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50">
                <Check className="h-3.5 w-3.5" /> {L("Lexuar", "Read")}
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">{L("Asnjë njoftim", "No notifications")}</div>
        )}
      </div>
    </div>
  );
}
