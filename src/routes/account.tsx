import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { Package } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: Account,
  head: () => ({
    meta: [
      { title: "Llogaria juaj — Dreame Beauty Cosmetics L.L.C." },
      { name: "description", content: "Shiko porositë e tua dhe statusin e dërgesave në Dreame Beauty Cosmetics L.L.C.." },
      { property: "og:title", content: "Llogaria juaj — Dreame Beauty Cosmetics L.L.C." },
      { property: "og:description", content: "Shiko porositë e tua dhe statusin e dërgesave në Dreame Beauty Cosmetics L.L.C.." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cod-express-cart.lovable.app/account" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cod-express-cart.lovable.app/account" }],
  }),
});

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-blue-100 text-blue-900",
  processing: "bg-purple-100 text-purple-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

function Account() {
  const { tr, lang } = useI18n();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  if (userId === undefined) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;

  if (!userId) {
    return (
      <div className="container-app py-16 max-w-md text-center">
        <h1 className="font-display text-3xl">{tr("loginRequired")}</h1>
        <Link to="/auth" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          {tr("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{tr("myOrders")}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          {tr("logout")}
        </button>
      </div>

      {orders && orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>
          <p className="mt-4 text-muted-foreground">{tr("noOrders")}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">{tr("shopNow")}</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{tr("date")}</th>
                  <th className="px-4 py-3">{tr("total")}</th>
                  <th className="px-4 py-3">{tr("status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((o: any) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{formatEur(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>{tr(o.status as any)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/order/$number" params={{ number: o.order_number }} className="text-primary hover:underline">
                        {lang === "sq" ? "Shiko" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
