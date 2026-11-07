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
  Menu, ExternalLink, Euro, ShoppingBag, Bell, ScrollText, Globe, Printer as PrinterIcon, CalendarDays, FileText, ScanLine, Receipt, Wallet, Clock, Star, Mail, Undo2, AlertTriangle, ClipboardList, LifeBuoy, HardDrive,
} from "lucide-react";
import { ProductsPanel } from "@/components/admin-products-panel";
import { AdminsPanel } from "@/components/admin-admins-panel";
import { CustomersPanel } from "@/components/admin-customers-panel";
import { AuditPanel } from "@/components/admin-audit-panel";
import { VisitorsPanel } from "@/components/admin-visitors-panel";
import { ReportsPanel } from "@/components/admin-reports-panel";
import { CustomerMessage } from "@/components/admin-customer-message";
import { PagesPanel } from "@/components/admin-pages-panel";
import { PosPanel } from "@/components/admin-pos-panel";
import { DashboardCharts } from "@/components/admin-dashboard-charts";
import { PosSalesPanel } from "@/components/admin-sales-history-panel";
import { StockRefillsPanel } from "@/components/admin-stock-refills-panel";
import { PosReportPanel } from "@/components/admin-pos-report-panel";
import { ShiftsPanel } from "@/components/admin-shift-panel";
import { ReviewsPanel } from "@/components/admin-reviews-panel";
import { NewsletterPanel } from "@/components/admin-newsletter-panel";
import { RefundsPanel } from "@/components/admin-refunds-panel";
import { TasksPanel } from "@/components/admin-tasks-panel";
import { HelpPanel } from "@/components/admin-help-panel";
import { SeoPanel } from "@/components/admin-seo-panel";
import { BackupsPanel } from "@/components/admin-backups-panel";
import { AdminGlobalSearch } from "@/components/admin-global-search";
import { OrderTimeline } from "@/components/order-timeline";
import { printOrders } from "@/lib/bulk-print";
import { NotificationsBell, NotificationsPanel } from "@/components/admin-notifications";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { logAction } from "@/lib/audit";
import {
  CatalogPanel, MarketingPanel, HomepagePanel, BlogPanel, MessagesPanel,
  ShippingPanel, SettingsPanel,
} from "@/components/admin-content-panels";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin, head: () => ({ meta: [
  { title: "Admin — Dreame Beauty Cosmetics" },
  { name: "description", content: "Paneli i administrimit të Dreame Beauty Cosmetics." },
  { property: "og:title", content: "Admin — Dreame Beauty Cosmetics" },
  { property: "og:description", content: "Paneli i administrimit të Dreame Beauty Cosmetics." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  { name: "robots", content: "noindex, nofollow" },
] }) });

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
  | "dashboard" | "pos" | "possales" | "posreport" | "shifts" | "sales" | "stats" | "products" | "inventory" | "catalog"
  | "orders" | "shipping" | "customers" | "marketing" | "homepage" | "blog"
  | "messages" | "pages" | "notifications" | "audit" | "visitors" | "reports" | "settings" | "admins"
  | "reviews" | "newsletter" | "refunds" | "tasks" | "help" | "seo" | "backups";

type Role = "admin" | "manager" | "editor";

// Which sections each role can open (admin sees everything)
const MANAGER_NAV: NavKey[] = ["dashboard", "orders", "inventory", "products", "notifications", "sales", "stats", "visitors", "reports", "pos", "possales", "posreport", "shifts", "refunds", "tasks", "help"];
const EDITOR_NAV: NavKey[] = ["dashboard", "homepage", "blog", "messages", "catalog", "products", "pages", "reviews", "tasks", "help"];

function Admin() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function checkAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setIsAdmin(false); setRole(null); return; }
    setCurrentEmail(userData.user.email ?? null);
    setCurrentUserId(userData.user.id);
    // Server-side role checks (security definer) — cannot be spoofed client-side
    const uid = userData.user.id;
    const [adminRes, managerRes, editorRes] = await Promise.all([
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: uid, _role: "manager" }),
      supabase.rpc("has_role", { _user_id: uid, _role: "editor" }),
    ]);
    const r: Role | null = adminRes.data === true ? "admin"
      : managerRes.data === true ? "manager"
      : editorRes.data === true ? "editor" : null;
    setRole(r);
    setIsAdmin(r !== null);
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
  const allNav: { key: NavKey; label: string; icon: any }[] = [
    { key: "dashboard", label: L("Paneli", "Dashboard"), icon: LayoutGrid },
    { key: "pos", label: L("ARKA / SHITJE", "POS / Register"), icon: ScanLine },
    { key: "possales", label: L("Historia e shitjeve", "Sales history"), icon: Receipt },
    { key: "posreport", label: L("Raporti i shitjeve", "Sales report"), icon: Wallet },
    { key: "shifts", label: L("Sesionet e punës", "Work shifts"), icon: Clock },
    { key: "sales", label: L("Shitjet online", "Online sales"), icon: TrendingUp },
    { key: "stats", label: L("Statistika", "Statistics"), icon: BarChart3 },
    { key: "products", label: L("Produktet", "Products"), icon: Package },
    { key: "inventory", label: L("Inventari", "Inventory"), icon: Boxes },
    { key: "catalog", label: L("Katalogu", "Catalog"), icon: Tag },
    { key: "orders", label: L("Porositë", "Orders"), icon: ShoppingCart },
    { key: "notifications", label: L("Njoftimet", "Notifications"), icon: Bell },
    { key: "shipping", label: L("Transporti", "Shipping"), icon: Truck },
    { key: "customers", label: L("Klientët", "Customers"), icon: Users },
    { key: "marketing", label: L("Marketing", "Marketing"), icon: Ticket },
    { key: "newsletter", label: L("Newsletter", "Newsletter"), icon: Mail },
    { key: "reviews", label: L("Vlerësimet", "Reviews"), icon: Star },
    { key: "refunds", label: L("Kthimet", "Refunds"), icon: Undo2 },
    { key: "tasks", label: L("Detyrat", "Tasks"), icon: ClipboardList },
    { key: "help", label: L("Ndihma", "Help"), icon: LifeBuoy },
    { key: "homepage", label: L("Ballina", "Homepage"), icon: Home },
    { key: "blog", label: L("Blog", "Blog"), icon: Newspaper },
    { key: "messages", label: L("Mesazhet", "Messages"), icon: Inbox },
    { key: "pages", label: L("Faqet informative", "Info pages"), icon: FileText },
    { key: "seo", label: "SEO Manager", icon: Globe },
    { key: "visitors", label: L("Vizitorët", "Visitors"), icon: Globe },
    { key: "reports", label: L("Raporte", "Reports"), icon: CalendarDays },
    { key: "audit", label: L("Regjistri i aktivitetit", "Activity log"), icon: ScrollText },
    { key: "settings", label: L("Cilësimet", "Settings"), icon: Settings },
    { key: "backups", label: "Backup & Restore", icon: HardDrive },
    { key: "admins", label: L("Rolet & Adminët", "Roles & Admins"), icon: Users },
  ];

  const allowed: NavKey[] | null =
    role === "admin" ? null : role === "manager" ? MANAGER_NAV : EDITOR_NAV;
  const navItems = allowed ? allNav.filter((n) => allowed.includes(n.key)) : allNav;
  const canSee = (k: NavKey) => !allowed || allowed.includes(k);

  // Grupimi i menusë: ARKA lart, pjesa tjetër e adminit poshtë sipas seksioneve
  const navGroups: { title: string; keys: NavKey[] }[] = [
    { title: L("ARKA / DYQANI", "REGISTER / STORE"), keys: ["pos", "possales", "posreport", "refunds", "shifts"] },
    { title: L("SHITJET ONLINE", "ONLINE SALES"), keys: ["dashboard", "orders", "sales", "stats", "notifications"] },
    { title: L("KATALOGU", "CATALOG"), keys: ["products", "inventory", "catalog", "shipping"] },
    { title: L("KLIENTËT & MARKETINGU", "CUSTOMERS & MARKETING"), keys: ["customers", "marketing", "newsletter", "reviews", "messages"] },
    { title: L("PËRMBAJTJA", "CONTENT"), keys: ["homepage", "blog", "pages", "seo"] },
    { title: L("PUNA & NDIHMA", "WORK & HELP"), keys: ["tasks", "help"] },
    { title: L("SISTEMI", "SYSTEM"), keys: ["visitors", "reports", "audit", "settings", "backups", "admins"] },
  ];
  const groupedNav = navGroups
    .map((g) => ({ title: g.title, items: g.keys.map((k) => navItems.find((n) => n.key === k)).filter(Boolean) as typeof navItems }))
    .filter((g) => g.items.length > 0);

  const currentLabel = navItems.find((n) => n.key === nav)?.label ?? "";
  const roleBadge = role === "admin" ? L("Admin", "Admin") : role === "manager" ? L("Menaxher", "Manager") : L("Editor", "Editor");

  return (
    <div className="fixed inset-0 flex bg-neutral-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-neutral-950 text-neutral-200 flex flex-col transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-900 font-display text-sm font-semibold">D</div>
          <div className="min-w-0">
            <div className="font-display text-xl text-white leading-none">Dreame Beauty Cosmetics</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">{roleBadge}</div>
          </div>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-4">
          {groupedNav.map((g) => (
            <div key={g.title} className="space-y-1">
              <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{g.title}</div>
              {g.items.map((it) => {
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
            </div>
          ))}
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
          <AdminGlobalSearch
            lang={lang}
            sections={navItems.map((n) => ({ key: n.key, label: n.label }))}
            canSee={(k) => canSee(k as NavKey)}
            onSelect={(k) => {
              const key = k as NavKey;
              if (canSee(key)) setNav(key);
              else toast.error(L("Roli i juaj nuk ka akses.", "Your role has no access."));
            }}
          />
          <div className="flex items-center gap-1">
            {canSee("notifications") && <NotificationsBell onOpen={() => setNav("notifications")} />}
            <a href="/" target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100" title={L("Shiko faqen", "View site")}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {!canSee(nav) && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              {L("Roli i juaj nuk ka akses në këtë seksion.", "Your role has no access to this section.")}
            </div>
          )}
          {canSee(nav) && (
            <>
              {nav === "dashboard" && <Dashboard lang={lang} onNav={(k) => { if (canSee(k)) { setNav(k); } else { toast.error(L("Roli i juaj nuk ka akses.", "Your role has no access.")); } }} />}
              {nav === "orders" && <OrdersView lang={lang} tr={tr} role={role!} />}
              {nav === "sales" && <SalesView lang={lang} />}
              {nav === "stats" && <StatsView lang={lang} />}
              {nav === "products" && <ProductsPanel />}
              {nav === "inventory" && <InventoryView lang={lang} />}
              {nav === "catalog" && <CatalogPanel />}
              {nav === "customers" && <CustomersPanel />}
              {nav === "shipping" && <ShippingPanel />}
              {nav === "marketing" && <MarketingPanel />}
              {nav === "homepage" && <HomepagePanel />}
              {nav === "blog" && <BlogPanel />}
              {nav === "messages" && <MessagesPanel />}
              {nav === "pages" && <PagesPanel />}
              {nav === "pos" && <PosPanel />}
              {nav === "possales" && <PosSalesPanel />}
              {nav === "posreport" && <PosReportPanel />}
              {nav === "shifts" && <ShiftsPanel />}
              {nav === "notifications" && <NotificationsPanel />}
              {nav === "visitors" && <VisitorsPanel />}
              {nav === "reports" && <ReportsPanel />}
              {nav === "audit" && <AuditPanel />}
              {nav === "settings" && <SettingsPanel />}
              {nav === "admins" && <AdminsPanel />}
              {nav === "reviews" && <ReviewsPanel />}
              {nav === "newsletter" && <NewsletterPanel />}
              {nav === "refunds" && <RefundsPanel />}
              {nav === "tasks" && <TasksPanel role={role!} userId={currentUserId} />}
              {nav === "help" && <HelpPanel />}
              {nav === "seo" && <SeoPanel />}
              {nav === "backups" && role === "admin" && <BackupsPanel role={role} />}
            </>
          )}
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

function Dashboard({ lang, onNav }: { lang: string; onNav: (k: NavKey) => void }) {
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

  const { data: alerts } = useQuery({
    queryKey: ["admin-dashboard-alerts"],
    queryFn: async () => {
      const [low, reviews, msgs, stock] = await Promise.all([
        supabase.from("products").select("id,name_sq,stock").eq("active", true).lte("stock", 5).order("stock").limit(20),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
        supabase.from("stock_alerts").select("id", { count: "exact", head: true }).eq("notified", false),
      ]);
      return {
        lowStock: (low.data ?? []) as { id: string; name_sq: string; stock: number }[],
        pendingReviews: reviews.count ?? 0,
        unreadMessages: msgs.count ?? 0,
        stockRequests: stock.count ?? 0,
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
        <button type="button" onClick={() => onNav("orders")} className="text-left">
          <StatCard icon={ShoppingBag} label={L("Porosi totale", "Total orders")} value={String(stats?.totalOrders ?? 0)} sub={`${stats?.todayOrders ?? 0} ${L("sot", "today")}`} tone="pink" />
        </button>
        <button type="button" onClick={() => onNav("sales")} className="text-left">
          <StatCard icon={Euro} label={L("Të ardhura", "Revenue")} value={formatEur(stats?.revenue ?? 0)} sub={`${formatEur(stats?.revenueToday ?? 0)} ${L("sot", "today")}`} tone="green" />
        </button>
        <button type="button" onClick={() => onNav("products")} className="text-left">
          <StatCard icon={Package} label={L("Produkte", "Products")} value={String(stats?.products ?? 0)} tone="blue" />
        </button>
        <button type="button" onClick={() => onNav("customers")} className="text-left">
          <StatCard icon={Users} label={L("Klientë", "Customers")} value={String(stats?.totalOrders ?? 0)} tone="amber" />
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{L("Lidhje të shpejta", "Quick links")}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["orders", L("Porositë", "Orders")],
            ["pos", L("ARKA / SHITJE", "POS")],
            ["inventory", L("Inventari", "Inventory")],
            ["products", L("Produktet", "Products")],
            ["reviews", L("Vlerësimet", "Reviews")],
            ["messages", L("Mesazhet", "Messages")],
            ["reports", L("Raporte", "Reports")],
          ] as [NavKey, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => onNav(k)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>


      {alerts && (alerts.lowStock.length > 0 || alerts.pendingReviews > 0 || alerts.unreadMessages > 0 || alerts.stockRequests > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> {L("Kërkon vëmendje", "Needs attention")}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            {alerts.pendingReviews > 0 && (
              <button onClick={() => onNav("reviews")} className="rounded-full bg-white px-3 py-1.5 shadow-sm hover:bg-amber-100">{alerts.pendingReviews} {L("vlerësime në pritje", "reviews pending")}</button>
            )}
            {alerts.unreadMessages > 0 && (
              <button onClick={() => onNav("messages")} className="rounded-full bg-white px-3 py-1.5 shadow-sm hover:bg-amber-100">{alerts.unreadMessages} {L("mesazhe të palexuara", "unread messages")}</button>
            )}
            {alerts.stockRequests > 0 && (
              <button onClick={() => onNav("newsletter")} className="rounded-full bg-white px-3 py-1.5 shadow-sm hover:bg-amber-100">{alerts.stockRequests} {L("kërkesa për stok", "back-in-stock requests")}</button>
            )}
            {alerts.lowStock.length > 0 && (
              <button onClick={() => onNav("inventory")} className="rounded-full bg-white px-3 py-1.5 shadow-sm hover:bg-amber-100">{alerts.lowStock.length} {L("produkte me stok të ulët", "products low on stock")}</button>
            )}
          </div>

          {alerts.lowStock.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm text-amber-900 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.lowStock.slice(0, 9).map((p) => (
                <li key={p.id} className="flex justify-between gap-2 rounded-lg bg-white/70 px-3 py-1.5">
                  <span className="truncate">{p.name_sq}</span>
                  <span className={`font-semibold ${p.stock === 0 ? "text-red-600" : ""}`}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DashboardCharts lang={lang} />

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-display text-lg">{L("Porositë e fundit", "Recent orders")}</h2>
          <button onClick={() => onNav("orders")} className="text-sm font-medium text-[var(--pink-deep,#e91e63)] hover:underline">
            {L("Të gjitha porositë", "All orders")} →
          </button>
        </div>
        <div className="divide-y divide-neutral-100">
          {(recentOrders ?? []).map((o) => (
            <button key={o.id} onClick={() => onNav("orders")} className="w-full flex items-center justify-between px-5 py-3 text-sm text-left hover:bg-neutral-50">
              <div>
                <div className="font-medium">{o.customer_name}</div>
                <div className="text-xs text-neutral-500">{o.order_number} · {new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                <span className="font-medium text-[var(--pink-deep,#e91e63)]">{formatEur(Number(o.total))}</span>
              </div>
            </button>
          ))}
          {recentOrders && recentOrders.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-neutral-500">{L("Asnjë porosi", "No orders")}</div>
          )}
        </div>
      </div>

    </div>
  );
}

function OrdersView({ lang, tr, role }: { lang: string; tr: (k: any) => string; role: Role }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const canUpdate = role === "admin" || role === "manager";
  const canCancel = canUpdate;
  const canDelete = role === "admin";
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
    if (!canUpdate) return toast.error(L("Nuk keni leje për ndryshim statusi.", "You are not allowed to change status."));
    const prev = (orders ?? []).find((o) => o.id === id);
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "sq" ? "Statusi u përditësua" : "Status updated");
      logAction("order.status_changed", "orders", id, {
        order_number: prev?.order_number, from: prev?.status, to: newStatus,
      });
      refetch();
    }
  }

  async function deleteOrder(id: string) {
    if (!canDelete) return toast.error(L("Vetëm admini mund të fshijë porosi.", "Only an admin can delete orders."));
    const prev = (orders ?? []).find((o) => o.id === id);
    if (!confirm(L(`Fshi porosinë ${prev?.order_number}? Nuk kthehet.`, `Delete order ${prev?.order_number}? This cannot be undone.`))) return;
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L("Porosia u fshi", "Order deleted"));
    logAction("order.deleted", "orders", id, { order_number: prev?.order_number });
    setOpenId(null);
    refetch();
  }


  const exportColumns: Column<Order>[] = [
    { key: "order_number", label: L("Nr. porosisë", "Order #"), get: (o) => o.order_number },
    { key: "created_at", label: L("Data", "Date"), get: (o) => new Date(o.created_at).toLocaleString() },
    { key: "customer_name", label: L("Klienti", "Customer"), get: (o) => o.customer_name },
    { key: "phone", label: L("Telefoni", "Phone"), get: (o) => o.phone },
    { key: "email", label: "Email", get: (o) => o.email ?? "" },
    { key: "city", label: L("Qyteti", "City"), get: (o) => o.city },
    { key: "address", label: L("Adresa", "Address"), get: (o) => `${o.address}${o.postal_code ? ", " + o.postal_code : ""}` },
    { key: "status", label: L("Statusi", "Status"), get: (o) => o.status },
    { key: "subtotal", label: L("Nëntotali", "Subtotal"), get: (o) => Number(o.subtotal).toFixed(2) },
    { key: "total", label: L("Totali", "Total"), get: (o) => Number(o.total).toFixed(2) },
  ];

  async function printAll() {
    if (filtered.length === 0) return toast.error(L("Nuk ka porosi", "No orders"));
    const ids = filtered.map((o) => o.id);
    const { data: items, error } = await supabase
      .from("order_items")
      .select("order_id,product_name,quantity,unit_price,subtotal")
      .in("order_id", ids);
    if (error) return toast.error(error.message);
    const byOrder: Record<string, any[]> = {};
    for (const it of items ?? []) {
      (byOrder[it.order_id] ??= []).push(it);
    }
    const ok = printOrders(filtered as any, byOrder, {
      invoice: L("Faturë / Fletëdërgesë", "Invoice / Packing slip"),
      order: L("Porosia", "Order"),
      customer: L("Klienti", "Customer"),
      address: L("Adresa", "Address"),
      item: L("Produkti", "Item"),
      qty: L("Sasia", "Qty"),
      price: L("Çmimi", "Price"),
      total: L("Totali", "Total"),
      status: L("Statusi", "Status"),
      cod: L("Pagesa në dorëzim", "Cash on delivery"),
      notes: L("Shënime", "Notes"),
    });
    if (!ok) return toast.error("Pop-up blocked");
    logAction("print.orders", "orders", null, { count: filtered.length, status: status || "all" });
  }

  const openOrder = filtered.find((o) => o.id === openId) ?? null;
  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-neutral-900 px-3 py-1 font-semibold uppercase tracking-wide text-white">
          {role === "admin" ? L("Admin", "Admin") : role === "manager" ? L("Menaxher", "Manager") : L("Editor", "Editor")}
        </span>
        <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-800">{L("Shiko", "View")}</span>
        <span className={`rounded-full px-3 py-1 font-medium ${canUpdate ? "bg-green-50 text-green-800" : "bg-neutral-100 text-neutral-400 line-through"}`}>{L("Përditëso statusin", "Update status")}</span>
        <span className={`rounded-full px-3 py-1 font-medium ${canCancel ? "bg-green-50 text-green-800" : "bg-neutral-100 text-neutral-400 line-through"}`}>{L("Anulo", "Cancel")}</span>
        <span className={`rounded-full px-3 py-1 font-medium ${canDelete ? "bg-green-50 text-green-800" : "bg-neutral-100 text-neutral-400 line-through"}`}>{L("Fshi", "Delete")}</span>
      </div>
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
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            {isLoading ? "…" : `${filtered.length} ${L("porosi", "orders")}`}
            {filtered.length > 0 && ` · ${formatEur(filtered.reduce((a, o) => a + Number(o.total), 0))}`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={printAll}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" /> {L(`Printo ${filtered.length} porosi`, `Print ${filtered.length} orders`)}
          </button>
          <ExportButtons
            entity="orders"
            filename={`dream-studio-porosite-${new Date().toISOString().slice(0, 10)}`}
            title={L("Raport i porosive", "Orders report")}
            subtitle={`${filtered.length} ${L("porosi", "orders")}`}
            columns={exportColumns}
            rows={filtered}
            footer={`${L("Totali", "Total")}: ${formatEur(filtered.reduce((a, o) => a + Number(o.total), 0))}`}
            labels={{ csv: L("Eksport CSV", "Export CSV"), pdf: L("Eksport PDF", "Export PDF"), empty: L("Nuk ka të dhëna", "Nothing to export") }}
          />
          </div>
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
                <th className="px-4 py-3 text-right">{L("Veprime", "Actions")}</th>
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
                  <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setOpenId(o.id)} className="text-xs font-medium text-[var(--pink-deep,#e91e63)] hover:underline">
                      {L("Shiko", "View")}
                    </button>
                    {canCancel && o.status !== "cancelled" && (
                      <button onClick={() => updateStatus(o.id, "cancelled")} className="ml-3 text-xs font-medium text-amber-700 hover:underline">
                        {L("Anulo", "Cancel")}
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteOrder(o.id)} className="ml-3 text-xs font-medium text-red-600 hover:underline">
                        {L("Fshi", "Delete")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">{lang === "sq" ? "Asnjë porosi" : "No orders"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openOrder && (
        <OrderModal
          order={openOrder}
          onClose={() => setOpenId(null)}
          onStatus={(st) => updateStatus(openOrder.id, st)}
          canUpdate={canUpdate}
          onDelete={canDelete ? () => deleteOrder(openOrder.id) : undefined}
        />
      )}
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

type StatRow = { label: string; orders: number; revenue: number; share: string };

function StatsView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("status,total,created_at");
      return (data ?? []) as { status: string; total: number; created_at: string }[];
    },
  });
  const list = data ?? [];
  const counts: Record<string, number> = {};
  const revByStatus: Record<string, number> = {};
  list.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
    revByStatus[o.status] = (revByStatus[o.status] ?? 0) + Number(o.total || 0);
  });
  const total = list.length || 1;

  const statusRows: StatRow[] = STATUSES.map((s) => ({
    label: s,
    orders: counts[s] ?? 0,
    revenue: revByStatus[s] ?? 0,
    share: `${Math.round(((counts[s] ?? 0) / total) * 100)}%`,
  }));

  const byMonth: Record<string, { orders: number; revenue: number }> = {};
  list.forEach((o) => {
    const k = new Date(o.created_at).toISOString().slice(0, 7);
    byMonth[k] = byMonth[k] ?? { orders: 0, revenue: 0 };
    byMonth[k].orders += 1;
    byMonth[k].revenue += Number(o.total || 0);
  });
  const monthRows: StatRow[] = Object.entries(byMonth)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([k, v]) => ({ label: k, orders: v.orders, revenue: v.revenue, share: "" }));

  const cols: Column<StatRow>[] = [
    { key: "label", label: L("Kategoria", "Group"), get: (r) => r.label },
    { key: "orders", label: L("Porosi", "Orders"), get: (r) => r.orders },
    { key: "revenue", label: L("Xhiro (EUR)", "Revenue (EUR)"), get: (r) => r.revenue.toFixed(2) },
    { key: "share", label: L("Pjesa", "Share"), get: (r) => r.share },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">{L("Porositë sipas statusit", "Orders by status")}</h2>
          <ExportButtons
            entity="stats"
            filename={`dream-studio-statistika-status-${new Date().toISOString().slice(0, 10)}`}
            title={L("Raport statistikor — sipas statusit", "Statistics report — by status")}
            columns={cols}
            rows={statusRows}
            labels={{ csv: L("Eksport CSV", "Export CSV"), pdf: L("Eksport PDF", "Export PDF"), empty: L("Nuk ka të dhëna", "Nothing to export") }}
          />
        </div>
        <div className="space-y-3">
          {statusRows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize">{r.label}</span>
                <span className="text-neutral-500">{r.orders} · {formatEur(r.revenue)}</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full bg-[var(--pink-deep,#e91e63)]" style={{ width: r.share || "0%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">{L("Shitjet sipas mujore", "Sales by month")}</h2>
          <ExportButtons
            entity="stats"
            filename={`dream-studio-statistika-mujore-${new Date().toISOString().slice(0, 10)}`}
            title={L("Raport statistikor — sipas mujit", "Statistics report — by month")}
            columns={cols}
            rows={monthRows}
            footer={`${L("Xhiro totale", "Total revenue")}: ${formatEur(monthRows.reduce((a, r) => a + r.revenue, 0))}`}
            labels={{ csv: L("Eksport CSV", "Export CSV"), pdf: L("Eksport PDF", "Export PDF"), empty: L("Nuk ka të dhëna", "Nothing to export") }}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-neutral-500">
            <tr><th className="py-2">{L("Muaji", "Month")}</th><th className="py-2 text-right">{L("Porosi", "Orders")}</th><th className="py-2 text-right">{L("Xhiro", "Revenue")}</th></tr>
          </thead>
          <tbody>
            {monthRows.map((r) => (
              <tr key={r.label} className="border-t border-neutral-100">
                <td className="py-2">{r.label}</td>
                <td className="py-2 text-right">{r.orders}</td>
                <td className="py-2 text-right font-medium">{formatEur(r.revenue)}</td>
              </tr>
            ))}
            {monthRows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-neutral-500">{L("Asnjë porosi", "No orders")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type InvRow = { id: string; name_sq: string; name_en: string; stock: number; active: boolean; price: number };

function InventoryView({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data: products } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name_sq,name_en,stock,active,price").order("stock", { ascending: true });
      return (data ?? []) as InvRow[];
    },
  });
  const rows = products ?? [];
  const cols: Column<InvRow>[] = [
    { key: "name", label: L("Produkti", "Product"), get: (p) => (lang === "sq" ? p.name_sq : p.name_en) },
    { key: "stock", label: L("Stoku", "Stock"), get: (p) => p.stock },
    { key: "price", label: L("Çmimi (EUR)", "Price (EUR)"), get: (p) => Number(p.price).toFixed(2) },
    { key: "value", label: L("Vlera e stokut (EUR)", "Stock value (EUR)"), get: (p) => (Number(p.price) * p.stock).toFixed(2) },
    { key: "state", label: L("Statusi", "Status"), get: (p) => (p.stock === 0 ? L("Pa stok", "Out") : p.stock < 5 ? L("Pak", "Low") : "OK") },
    { key: "active", label: L("Aktiv", "Active"), get: (p) => (p.active ? "yes" : "no") },
  ];
  const stockValue = rows.reduce((a, p) => a + Number(p.price) * p.stock, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-neutral-500">
          {rows.length} {L("produkte", "products")} · {L("vlera e stokut", "stock value")} {formatEur(stockValue)}
        </div>
        <ExportButtons
          entity="inventory"
          filename={`dream-studio-inventari-${new Date().toISOString().slice(0, 10)}`}
          title={L("Raport i inventarit", "Inventory report")}
          subtitle={`${rows.length} ${L("produkte", "products")}`}
          columns={cols}
          rows={rows}
          footer={`${L("Vlera e stokut", "Stock value")}: ${formatEur(stockValue)}`}
          labels={{ csv: L("Eksport CSV", "Export CSV"), pdf: L("Eksport PDF", "Export PDF"), empty: L("Nuk ka të dhëna", "Nothing to export") }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr><th className="px-4 py-3">{L("Produkti", "Product")}</th><th className="px-4 py-3">{L("Stoku", "Stock")}</th><th className="px-4 py-3 hidden sm:table-cell">{L("Vlera", "Value")}</th><th className="px-4 py-3">{L("Statusi", "Status")}</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{lang === "sq" ? p.name_sq : p.name_en}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? "text-red-600 font-medium" : p.stock < 5 ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-neutral-500">{formatEur(Number(p.price) * p.stock)}</td>
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
      <StockRefillsPanel lang={lang} />
    </div>
  );
}


function OrderModal({ order, onClose, onStatus, canUpdate = true, onDelete }: { order: Order; onClose: () => void; onStatus: (s: string) => void; canUpdate?: boolean; onDelete?: () => void }) {
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
            <h1 className="print-brand font-display text-3xl tracking-tight">Dreame Beauty Cosmetics</h1>
            <div className="print-brand text-xs">Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · info@dreamebeautycosmetics.com</div>
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

          <div className="mt-6 no-print">
            <OrderTimeline status={order.status} createdAt={order.created_at} updatedAt={(order as any).updated_at} lang={lang} />
          </div>

          <CustomerMessage order={order} lang={lang} />


          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{tr("updateStatus")}:</label>
              <select
                defaultValue={order.status}
                disabled={!canUpdate}
                onChange={(e) => onStatus(e.target.value)}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{tr(s as any)}</option>)}
              </select>
              {!canUpdate && (
                <span className="text-xs text-muted-foreground">
                  {lang === "sq" ? "Vetëm shikim" : "View only"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onDelete && (
                <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  {lang === "sq" ? "Fshi porosinë" : "Delete order"}
                </button>
              )}
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                <Printer className="h-4 w-4" /> {tr("printInvoice")}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
