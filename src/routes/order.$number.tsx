import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { OrderTimeline } from "@/components/order-timeline";

export const Route = createFileRoute("/order/$number")({
  component: OrderConfirmation,
  head: ({ params }) => ({
    meta: [
      { title: `Porosia ${params.number} — Dreame Beauty Cosmetics L.L.C.` },
      { name: "description", content: "Detajet dhe statusi i porosisë tuaj në Dreame Beauty Cosmetics L.L.C., me pagesë në dorëzim." },
      { property: "og:title", content: `Porosia ${params.number} — Dreame Beauty Cosmetics L.L.C.` },
      { property: "og:description", content: "Detajet dhe statusi i porosisë tuaj në Dreame Beauty Cosmetics L.L.C.." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function OrderConfirmation() {
  const { number } = Route.useParams();
  const { tr, lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["order", number],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_by_number", { _order_number: number });
      if (error) throw error;
      return data as { order: any; items: any[] } | null;
    },
  });

  if (isLoading) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;
  const order = data?.order;
  const items = data?.items ?? [];

  return (
    <div className="container-app py-14 max-w-2xl">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-4xl">{tr("orderConfirmed")}</h1>
        <p className="mt-3 text-muted-foreground">{tr("thankYou")}</p>
        <div className="mt-6 inline-block rounded-full bg-accent px-5 py-2 text-sm">
          <span className="text-muted-foreground">{tr("orderNumber")}: </span>
          <span className="font-mono font-semibold">{number}</span>
        </div>
      </div>

      {order && (
        <div className="mt-10">
          <OrderTimeline status={order.status} createdAt={order.created_at} updatedAt={order.updated_at} lang={lang} />
        </div>
      )}

      {order && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">{tr("customer")}</div>
              <div className="mt-1 font-medium">{order.customer_name}</div>
              <div>{order.phone}</div>
              {order.email && <div>{order.email}</div>}
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">{tr("address")}</div>
              <div className="mt-1">{order.address}</div>
              <div>{order.city}{order.postal_code ? `, ${order.postal_code}` : ""}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm border-t border-border pt-4">
            {items.map((it: any) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.product_name} × {it.quantity}</span>
                <span>{formatEur(Number(it.subtotal))}</span>
              </div>
            ))}
            <div className="flex justify-between font-display text-xl pt-3 border-t border-border">
              <span>{tr("total")}</span><span>{formatEur(Number(order.total))}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-accent/40 p-4 text-sm text-center">
            {tr("paymentMethod")}: <span className="font-medium">{tr("cod")}</span>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/shop" className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted">
          {tr("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
