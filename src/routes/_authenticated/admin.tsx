import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { LogOut, Printer, X, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  postal_code: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  status: string;
  created_at: string;
};

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-blue-100 text-blue-900",
  processing: "bg-purple-100 text-purple-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

function Admin() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  const { data: orders, refetch } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: isAdmin === true,
  });

  const filtered = (orders ?? []).filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(s) ||
      o.customer_name.toLowerCase().includes(s) ||
      o.phone.toLowerCase().includes(s) ||
      o.city.toLowerCase().includes(s)
    );
  });

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "sq" ? "Statusi u përditësua" : "Status updated");
      refetch();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;

  if (!isAdmin) {
    return (
      <div className="container-app py-20 max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-2xl">{lang === "sq" ? "Nuk keni akses admin" : "No admin access"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "sq"
            ? "Kërkoni nga administratori t'ju shtojë rolin 'admin' në panelin e bazës së të dhënave."
            : "Ask the administrator to grant you the 'admin' role in the database dashboard."}
        </p>
        <button onClick={signOut} className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">
          {tr("logout")}
        </button>
      </div>
    );
  }

  const openOrder = filtered.find((o) => o.id === openId) ?? null;

  return (
    <div className="container-app py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{tr("orders")}</h1>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
          <LogOut className="h-4 w-4" /> {tr("logout")}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder={tr("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{tr("allStatuses")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tr(s as any)}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{tr("customer")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{tr("city")}</th>
                <th className="px-4 py-3 hidden sm:table-cell">{tr("date")}</th>
                <th className="px-4 py-3">{tr("total")}</th>
                <th className="px-4 py-3">{tr("status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="border-t border-border hover:bg-muted/40 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{o.city}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{formatEur(Number(o.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                      {tr(o.status as any)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{lang === "sq" ? "Asnjë porosi" : "No orders"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openOrder && <OrderModal order={openOrder} onClose={() => setOpenId(null)} onStatus={(s) => updateStatus(openOrder.id, s)} />}
    </div>
  );
}

function OrderModal({ order, onClose, onStatus }: { order: Order; onClose: () => void; onStatus: (s: string) => void }) {
  const { tr, lang } = useI18n();
  const { data: items } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      return data ?? [];
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 no-print" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-background shadow-elev" onClick={(e) => e.stopPropagation()}>
        <div className="print-area p-8">
          <div className="flex items-start justify-between gap-4 no-print">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{tr("invoice")}</div>
              <h2 className="font-display text-2xl">{order.order_number}</h2>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          <div className="hidden print:block mb-6">
            <h1 className="font-display text-3xl">Bella Salon Supplies</h1>
            <div className="text-sm text-muted-foreground">{tr("invoice")} #{order.order_number}</div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">{tr("customer")}</div>
              <div className="mt-1 font-medium">{order.customer_name}</div>
              <div>{order.phone}</div>
              {order.email && <div>{order.email}</div>}
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{tr("address")}</div>
              <div className="mt-1">{order.address}</div>
              <div>{order.city}{order.postal_code ? `, ${order.postal_code}` : ""}</div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
              <div className="text-xs uppercase text-muted-foreground mb-1">{tr("orderNotes")}</div>
              {order.notes}
            </div>
          )}

          <table className="mt-6 w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="py-2">{tr("items")}</th><th className="py-2 text-right">{tr("quantity")}</th><th className="py-2 text-right">{tr("total")}</th></tr>
            </thead>
            <tbody>
              {items?.map((it: any) => (
                <tr key={it.id} className="border-b border-border/60">
                  <td className="py-2">{it.product_name}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatEur(Number(it.subtotal))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={2} className="pt-4 text-right font-display text-lg">{tr("total")}</td>
                <td className="pt-4 text-right font-display text-lg">{formatEur(Number(order.total))}</td></tr>
            </tfoot>
          </table>

          <div className="mt-4 text-sm text-center rounded-xl bg-accent/40 p-3">
            {tr("paymentMethod")}: <strong>{tr("cod")}</strong>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{tr("updateStatus")}:</label>
              <select
                defaultValue={order.status}
                onChange={(e) => onStatus(e.target.value)}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{tr(s as any)}</option>)}
              </select>
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              <Printer className="h-4 w-4" /> {tr("printInvoice")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
