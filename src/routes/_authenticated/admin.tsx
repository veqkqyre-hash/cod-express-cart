import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import {
  LogOut, Printer, X, Package, LayoutGrid, TrendingUp, BarChart3, Boxes,
  Tag, ShoppingCart, Truck, Users, Ticket, Home, Newspaper, Inbox, Settings,
  Menu, ExternalLink, Euro, ShoppingBag,
} from "lucide-react";
import { ProductsPanel } from "@/components/admin-products-panel";
import { AdminsPanel } from "@/components/admin-admins-panel";

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

type NavKey =
  | "dashboard" | "sales" | "stats" | "products" | "inventory" | "catalog"
  | "orders" | "shipping" | "customers" | "marketing" | "homepage" | "blog"
  | "messages" | "settings" | "admins";

function Admin() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function checkAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setIsAdmin(false); return; }
    setCurrentEmail(userData.user.email ?? null);
    // Server-side role check (security definer) — cannot be spoofed client-side
    const { data, error } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    setIsAdmin(!error && data === true);
  }


  useEffect(() => { checkAdmin(); }, []);

  async function claimAdmin() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_admin_if_none");
    setClaiming(false);
    if (error) return toast.error(error.message);
    if ((data as any)?.granted) {
      toast.success(lang === "sq" ? "Ju jeni admini i parë!" : "You are now admin!");
      checkAdmin();
    } else {
      toast.error(lang === "sq" ? "Ekziston tashmë një admin." : "An admin already exists.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) return <div className="grid min-h-screen place-items-center text-muted-foreground">…</div>;

  if (!isAdmin) {
    return (
      <div className="container-app py-20 max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-2xl">{lang === "sq" ? "Nuk keni akses admin" : "No admin access"}</h1>
        {currentEmail && <p className="mt-2 text-xs text-muted-foreground">{lang === "sq" ? "Të kyçur si" : "Signed in as"}: <strong>{currentEmail}</strong></p>}
        <p className="mt-3 text-sm text-muted-foreground">
          {lang === "sq" ? "Nëse nuk ka ende asnjë admin, mund të bëheni ju i pari." : "If no admin exists yet, you can claim it."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={claimAdmin} disabled={claiming} className="rounded-full bg-[var(--pink-deep)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pink)] disabled:opacity-50">
            {claiming ? "…" : lang === "sq" ? "Bëhu admini i parë" : "Claim first admin"}
          </button>
          <button onClick={signOut} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">{tr("logout")}</button>
        </div>
      </div>
    );
  }

  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const navItems: { key: NavKey; label: string; icon: any }[] = [
    { key: "dashboard", label: L("Paneli", "Dashboard"), icon: LayoutGrid },
    { key: "sales", label: L("Shitjet", "Sales"), icon: TrendingUp },
    { key: "stats", label: L("Statistika", "Statistics"), icon: BarChart3 },
    { key: "products", label: L("Produktet", "Products"), icon: Package },
    { key: "inventory", label: L("Inventari", "Inventory"), icon: Boxes },
    { key: "catalog", label: L("Katalogu", "Catalog"), icon: Tag },
    { key: "orders", label: L("Porositë", "Orders"), icon: ShoppingCart },
    { key: "shipping", label: L("Transporti", "Shipping"), icon: Truck },
    { key: "customers", label: L("Klientët", "Customers"), icon: Users },
    { key: "marketing", label: L("Marketing", "Marketing"), icon: Ticket },
    { key: "homepage", label: L("Ballina", "Homepage"), icon: Home },
    { key: "blog", label: L("Blog", "Blog"), icon: Newspaper },
    { key: "messages", label: L("Mesazhet", "Messages"), icon: Inbox },
    { key: "settings", label: L("Cilësimet", "Settings"), icon: Settings },
    { key: "admins", label: L("Adminët", "Admins"), icon: Users },
  ];

  const currentLabel = navItems.find((n) => n.key === nav)?.label ?? "";

  return (
    <div className="fixed inset-0 flex bg-neutral-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-neutral-950 text-neutral-200 flex flex-col transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-900 font-display text-sm font-semibold">D</div>
          <div className="font-display text-xl text-white">Dream Studio</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = nav === it.key;
            return (
              <button
                key={it.key}
                onClick={() => { setNav(it.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--pink-deep,#e91e63)] text-white shadow-lg shadow-pink-500/20"
                    : "text-neutral-300 hover:bg-neutral-800/70 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" /> {it.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-neutral-800 p-3">
          <button onClick={signOut} className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <LogOut className="h-4 w-4" /> {tr("logout")}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl lg:text-2xl truncate">{currentLabel}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100" title={L("Shiko faqen", "View site")}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {nav === "dashboard" && <Dashboard lang={lang} />}
          {nav === "orders" && <OrdersView lang={lang} tr={tr} />}
          {nav === "sales" && <SalesView lang={lang} />}
          {nav === "stats" && <StatsView lang={lang} />}
          {nav === "products" && <ProductsPanel />}
          {nav === "inventory" && <InventoryView lang={lang} />}
          {nav === "catalog" && <CatalogView lang={lang} />}
          {nav === "customers" && <CustomersView lang={lang} />}
          {nav === "shipping" && <ComingSoon label={L("Transporti", "Shipping")} />}
          {nav === "marketing" && <ComingSoon label={L("Marketing", "Marketing")} />}
          {nav === "homepage" && <ComingSoon label={L("Ballina", "Homepage")} />}
          {nav === "blog" && <ComingSoon label={L("Blog", "Blog")} />}
          {nav === "messages" && <ComingSoon label={L("Mesazhet", "Messages")} />}
          {nav === "settings" && <ComingSoon label={L("Cilësimet", "Settings")} />}
          {nav === "admins" && <AdminsPanel />}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "pink" }: { icon: any; label: string; value: string; sub?: string; tone?: "pink" | "green" | "blue" | "amber" }) {
  const tones: Record<string, string> = {
    pink: "bg-pink-50 text-pink-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-neutral-500">{label}</div>
          <div className="mt-2 font-display text-3xl">{value}</div>
          {sub && <div className="mt-1 text-xs text-green-600">{sub}</div>}
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders").select("id,total,created_at,status");
      const list = orders ?? [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayList = list.filter((o) => new Date(o.created_at) >= today);
      const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
      const revenueToday = todayList.reduce((s, o) => s + Number(o.total || 0), 0);
      const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true });
      return {
        totalOrders: list.length,
        todayOrders: todayList.length,
        revenue,
        revenueToday,
        products: productCount ?? 0,
        recent: [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-dashboard-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);
      return (data ?? []) as Order[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label={L("Porosi totale", "Total orders")} value={String(stats?.totalOrders ?? 0)} sub={`${stats?.todayOrders ?? 0} ${L("sot", "today")}`} tone="pink" />
        <StatCard icon={Euro} label={L("Të ardhura", "Revenue")} value={formatEur(stats?.revenue ?? 0)} sub={`${formatEur(stats?.revenueToday ?? 0)} ${L("sot", "today")}`} tone="green" />
        <StatCard icon={Package} label={L("Produkte", "Products")} value={String(stats?.products ?? 0)} tone="blue" />
        <StatCard icon={Users} label={L("Klientë", "Customers")} value={String(stats?.totalOrders ?? 0)} tone="amber" />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-display text-lg">{L("Porositë e fundit", "Recent orders")}</h2>
          <span className="text-sm text-[var(--pink-deep,#e91e63)]">{L("Të gjitha", "View all")} →</span>
        </div>
        <div className="divide-y divide-neutral-100">
          {(recentOrders ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium">{o.customer_name}</div>
                <div className="text-xs text-neutral-500">{o.order_number} · {new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                <span className="font-medium text-[var(--pink-deep,#e91e63)]">{formatEur(Number(o.total))}</span>
              </div>
            </div>
          ))}
          {recentOrders && recentOrders.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-neutral-500">{L("Asnjë porosi", "No orders")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersView({ lang, tr }: { lang: string; tr: (k: any) => string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [status, setStatus] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: orders, refetch, isLoading } = useQuery({
    queryKey: ["admin-orders", status, city, from, to],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status as any);
      if (city) q = q.eq("city", city);
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const cities = Array.from(new Set((orders ?? []).map((o) => o.city).filter(Boolean))).sort();

  const s = search.trim().toLowerCase();
  const filtered = (orders ?? []).filter((o) => {
    if (!s) return true;
    return (
      o.order_number.toLowerCase().includes(s) ||
      o.customer_name.toLowerCase().includes(s) ||
      (o.email ?? "").toLowerCase().includes(s) ||
      o.phone.replace(/\s/g, "").includes(s.replace(/\s/g, "")) ||
      o.city.toLowerCase().includes(s)
    );
  });

  const hasFilters = !!(status || city || search || from || to);
  function clearFilters() { setStatus(""); setCity(""); setSearch(""); setFrom(""); setTo(""); }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(lang === "sq" ? "Statusi u përditësua" : "Status updated"); refetch(); }
  }

  const openOrder = filtered.find((o) => o.id === openId) ?? null;
  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder={L("Numri i porosisë, emri, email ose telefon…", "Order number, name, email or phone…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 min-w-56 ${inputCls}`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">{tr("allStatuses")}</option>
            {STATUSES.map((st) => <option key={st} value={st}>{tr(st as any)}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}>
            <option value="">{L("Të gjitha qytetet", "All cities")}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} aria-label={L("Nga", "From")} />
            <span className="text-neutral-400">–</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} aria-label={L("Deri", "To")} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
              {L("Pastro filtrat", "Clear filters")}
            </button>
          )}
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          {isLoading ? "…" : `${filtered.length} ${L("porosi", "orders")}`}
          {filtered.length > 0 && ` · ${formatEur(filtered.reduce((a, o) => a + Number(o.total), 0))}`}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{tr("customer")}</th>
                <th className="px-4 py-3 hidden lg:table-cell">Email</th>
                <th className="px-4 py-3 hidden md:table-cell">{tr("city")}</th>
                <th className="px-4 py-3 hidden sm:table-cell">{tr("date")}</th>
                <th className="px-4 py-3">{tr("total")}</th>
                <th className="px-4 py-3">{tr("status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="text-xs text-neutral-500">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">{o.email ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{o.city}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{formatEur(Number(o.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>{tr(o.status as any)}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">{lang === "sq" ? "Asnjë porosi" : "No orders"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openOrder && <OrderModal order={openOrder} onClose={() => setOpenId(null)} onStatus={(st) => updateStatus(openOrder.id, st)} />}
    </div>
  );
}


function SalesView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data } = useQuery({
    queryKey: ["admin-sales"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("total,created_at,status");
      return data ?? [];
    },
  });
  const list = data ?? [];
  const paid = list.filter((o) => o.status !== "cancelled");
  const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
  const avg = paid.length ? revenue / paid.length : 0;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon={Euro} label={L("Xhiro totale", "Total revenue")} value={formatEur(revenue)} tone="green" />
      <StatCard icon={ShoppingBag} label={L("Porosi të paguara", "Paid orders")} value={String(paid.length)} tone="pink" />
      <StatCard icon={TrendingUp} label={L("Vlera mesatare", "Average order")} value={formatEur(avg)} tone="blue" />
    </div>
  );
}

function StatsView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("status");
      return data ?? [];
    },
  });
  const counts: Record<string, number> = {};
  (data ?? []).forEach((o: any) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg mb-4">{L("Porositë sipas statusit", "Orders by status")}</h2>
      <div className="space-y-3">
        {STATUSES.map((s) => {
          const n = counts[s] ?? 0;
          const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
          const pct = Math.round((n / total) * 100);
          return (
            <div key={s}>
              <div className="flex justify-between text-sm mb-1"><span className="capitalize">{s}</span><span className="text-neutral-500">{n}</span></div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full bg-[var(--pink-deep,#e91e63)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data: products } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name_sq,name_en,stock,active").order("stock", { ascending: true });
      return data ?? [];
    },
  });
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr><th className="px-4 py-3">{L("Produkti", "Product")}</th><th className="px-4 py-3">{L("Stoku", "Stock")}</th><th className="px-4 py-3">{L("Statusi", "Status")}</th></tr>
        </thead>
        <tbody>
          {(products ?? []).map((p: any) => (
            <tr key={p.id} className="border-t border-neutral-100">
              <td className="px-4 py-3 font-medium">{lang === "sq" ? p.name_sq : p.name_en}</td>
              <td className="px-4 py-3">
                <span className={p.stock === 0 ? "text-red-600 font-medium" : p.stock < 5 ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
              </td>
              <td className="px-4 py-3">
                {p.stock === 0 ? <span className="rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs">{L("Pa stok", "Out")}</span>
                  : p.stock < 5 ? <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs">{L("Pak", "Low")}</span>
                  : <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-xs">OK</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CatalogView({ lang }: { lang: string }) {
  const { data: categories } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(categories ?? []).map((c: any) => (
        <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="font-display text-lg">{lang === "sq" ? c.name_sq : c.name_en}</div>
          <div className="text-xs text-neutral-500 mt-1">/{c.slug}</div>
        </div>
      ))}
    </div>
  );
}

function CustomersView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("customer_name,phone,email,city,total");
      const map = new Map<string, { name: string; phone: string; email: string | null; city: string; orders: number; total: number }>();
      (data ?? []).forEach((o: any) => {
        const key = o.phone;
        const cur = map.get(key) ?? { name: o.customer_name, phone: o.phone, email: o.email, city: o.city, orders: 0, total: 0 };
        cur.orders += 1; cur.total += Number(o.total || 0);
        map.set(key, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">{L("Klienti", "Customer")}</th>
            <th className="px-4 py-3">{L("Telefoni", "Phone")}</th>
            <th className="px-4 py-3 hidden md:table-cell">{L("Qyteti", "City")}</th>
            <th className="px-4 py-3">{L("Porosi", "Orders")}</th>
            <th className="px-4 py-3">{L("Totali", "Total")}</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c) => (
            <tr key={c.phone} className="border-t border-neutral-100">
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">{c.phone}</td>
              <td className="px-4 py-3 hidden md:table-cell">{c.city}</td>
              <td className="px-4 py-3">{c.orders}</td>
              <td className="px-4 py-3 font-medium">{formatEur(c.total)}</td>
            </tr>
          ))}
          {data && data.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">{L("Asnjë klient", "No customers")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-100">
        <Settings className="h-6 w-6 text-neutral-400" />
      </div>
      <h2 className="mt-4 font-display text-xl">{label}</h2>
      <p className="mt-2 text-sm text-neutral-500">Së shpejti / Coming soon</p>
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 print:static print:block print:bg-transparent print:p-0" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-background shadow-elev print:max-w-none print:rounded-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="print-area p-8">
          <div className="flex items-start justify-between gap-4 no-print">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{tr("invoice")}</div>
              <h2 className="font-display text-2xl">{order.order_number}</h2>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          <div className="hidden print:block mb-6 border-b border-black/20 pb-4">
            <h1 className="print-brand font-display text-3xl tracking-tight">Dream Studio</h1>
            <div className="print-brand text-xs">Rr. Nëna Terezë, Prishtinë 10000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com</div>
            <div className="mt-2 text-sm font-medium">{tr("invoice")} #{order.order_number}</div>
            <div className="text-xs">{new Date(order.created_at).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB")}</div>
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
              <select defaultValue={order.status} onChange={(e) => onStatus(e.target.value)} className="rounded-full border border-input bg-background px-3 py-1.5 text-sm">
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
