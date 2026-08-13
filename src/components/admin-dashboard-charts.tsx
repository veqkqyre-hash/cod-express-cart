import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#e91e63", "#f06292", "#f8bbd0", "#9c27b0", "#673ab7", "#3f51b5", "#009688", "#607d8b"];
const money = (n: number) => `${n.toFixed(2)} €`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{title}</div>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function DashboardCharts({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);

  const { data } = useQuery({
    queryKey: ["admin-dashboard-charts"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);

      const [orders, posSales, posItems, onlineItems] = await Promise.all([
        supabase.from("orders").select("total,status,created_at").gte("created_at", since.toISOString()),
        supabase.from("pos_sales").select("total,payment_method,created_at").gte("created_at", since.toISOString()),
        supabase.from("pos_sale_items").select("product_name,quantity,subtotal").gte("created_at", since.toISOString()),
        supabase.from("order_items").select("product_name,quantity,subtotal").gte("created_at", since.toISOString()),
      ]);

      // Xhiroja e 14 ditëve të fundit (arka + online)
      const days: { day: string; pos: number; online: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, pos: 0, online: 0 });
      }
      const idx = (iso: string) => {
        const d = new Date(iso);
        return days.findIndex((x) => x.day === `${d.getDate()}/${d.getMonth() + 1}`);
      };
      for (const s of posSales.data ?? []) {
        const i = idx(s.created_at as string);
        if (i >= 0) days[i]!.pos += Number(s.total || 0);
      }
      for (const o of orders.data ?? []) {
        const i = idx(o.created_at as string);
        if (i >= 0) days[i]!.online += Number(o.total || 0);
      }

      // Top produkte sipas xhiros
      const byProduct = new Map<string, number>();
      for (const it of [...(posItems.data ?? []), ...(onlineItems.data ?? [])]) {
        const name = String(it.product_name);
        byProduct.set(name, (byProduct.get(name) ?? 0) + Number(it.subtotal || 0));
      }
      const topProducts = [...byProduct.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

      // Metodat e pagesës (arka) + online COD
      const methods = new Map<string, number>();
      for (const s of posSales.data ?? []) {
        const k = String(s.payment_method ?? "cash");
        methods.set(k, (methods.get(k) ?? 0) + Number(s.total || 0));
      }
      const onlineTotal = (orders.data ?? []).reduce((a, o) => a + Number(o.total || 0), 0);
      if (onlineTotal > 0) methods.set("online (COD)", onlineTotal);
      const methodData = [...methods.entries()].map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

      return { days, topProducts, methodData };
    },
  });

  const days = data?.days ?? [];
  const topProducts = data?.topProducts ?? [];
  const methodData = data?.methodData ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title={L("Xhiroja — 14 ditët e fundit", "Revenue — last 14 days")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#999" />
              <YAxis tick={{ fontSize: 11 }} stroke="#999" />
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar name={L("Arka", "Register")} dataKey="pos" fill="#e91e63" radius={[4, 4, 0, 0]} />
              <Bar name={L("Online", "Online")} dataKey="online" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={L("Metodat e pagesës", "Payment methods")}>
        {methodData.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-neutral-500">{L("Pa të dhëna", "No data")}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={methodData} dataKey="value" nameKey="name" outerRadius={80} label={false}>
                {methodData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="xl:col-span-3">
        <Panel title={L("Top produktet sipas xhiros", "Top products by revenue")}>
          {topProducts.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-neutral-500">{L("Pa të dhëna", "No data")}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} stroke="#999" />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Bar dataKey="value" name={L("Xhiro", "Revenue")} fill="#e91e63" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}
