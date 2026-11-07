import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  loader: () => loadSeo("/cart"),
  component: CartPage,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, {
    meta: [
      { title: "Shporta — Dreame Beauty Cosmetics" },
      { name: "description", content: "Shiko produktet në shportën tuaj në Dreame Beauty Cosmetics dhe vazhdo drejt porosisë me pagesë në dorëzim." },
      { property: "og:title", content: "Shporta — Dreame Beauty Cosmetics" },
      { property: "og:description", content: "Shiko produktet në shportën tuaj në Dreame Beauty Cosmetics dhe vazhdo drejt porosisë me pagesë në dorëzim." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dreamebeautycosmetics.com/cart" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://dreamebeautycosmetics.com/cart" }],
  }),
});

function CartPage() {
  const { tr } = useI18n();
  const { items, remove, setQty, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl">{tr("emptyCart")}</h1>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          {tr("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <h1 className="font-display text-3xl mb-8">{tr("cart")}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium leading-snug">{it.name}</div>
                  <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-input">
                    <button onClick={() => setQty(it.id, it.quantity - 1)} className="grid h-9 w-9 place-items-center hover:bg-muted rounded-l-full">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{it.quantity}</span>
                    <button onClick={() => setQty(it.id, it.quantity + 1)} className="grid h-9 w-9 place-items-center hover:bg-muted rounded-r-full">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="font-display text-lg">{formatEur(it.price * it.quantity)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>{tr("subtotal")}</span><span className="font-medium">{formatEur(subtotal)}</span></div>
            <div className="flex justify-between"><span>{tr("shipping")}</span><span className="font-medium">{tr("freeShipping")}</span></div>
            <div className="border-t border-border pt-3 flex justify-between font-display text-xl">
              <span>{tr("total")}</span><span>{formatEur(subtotal)}</span>
            </div>
          </div>
          <Link to="/checkout" className="mt-6 block rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {tr("checkout")}
          </Link>
          <div className="mt-4 rounded-xl bg-accent/40 p-3 text-xs text-muted-foreground text-center">
            {tr("cod")} — {tr("codDesc")}
          </div>
        </aside>
      </div>
    </div>
  );
}
