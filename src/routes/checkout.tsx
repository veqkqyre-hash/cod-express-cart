import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Banknote } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "Përfundo porosinë — Dream Studio" },
      { name: "description", content: "Plotëso të dhënat e dërgesës dhe porosit me pagesë në dorëzim (COD) në Dream Studio." },
      { property: "og:title", content: "Përfundo porosinë — Dream Studio" },
      { property: "og:description", content: "Plotëso të dhënat e dërgesës dhe porosit me pagesë në dorëzim (COD) në Dream Studio." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cod-express-cart.lovable.app/checkout" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cod-express-cart.lovable.app/checkout" }],
  }),
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(300),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function Checkout() {
  const { tr, lang } = useI18n();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/checkout" } as any });
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? "");
    });
  }, [navigate]);

  if (userId === undefined || userId === null) {
    return <div className="container-app py-20 text-center text-muted-foreground">{tr("redirecting")}</div>;
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl">{tr("emptyCart")}</h1>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          {tr("continueShopping")}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(lang === "sq" ? "Ju lutem plotësoni fushat e kërkuara" : "Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          customer_name: parsed.data.customer_name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          city: parsed.data.city,
          address: parsed.data.address,
          postal_code: parsed.data.postal_code || null,
          notes: parsed.data.notes || null,
          subtotal,
          shipping_fee: 0,
          total: subtotal,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const itemsPayload = items.map((it) => ({
        order_id: order.id,
        product_id: it.id,
        product_name: it.name,
        unit_price: it.price,
        quantity: it.quantity,
        subtotal: it.price * it.quantity,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(itemsPayload);
      if (e2) throw e2;

      clear();
      navigate({ to: "/order/$number", params: { number: order.order_number } });
    } catch (err) {
      console.error(err);
      toast.error(lang === "sq" ? "Ndodhi një gabim. Provoni përsëri." : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container-app py-10">
      <h1 className="font-display text-3xl mb-8">{tr("checkout")}</h1>
      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <Field label={tr("fullName")} name="customer_name" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("phone")} name="phone" required type="tel" />
              <Field label={tr("email")} name="email" type="email" defaultValue={userEmail} />
            </div>
            <Field label={tr("city")} name="city" required />
            <Field label={tr("address")} name="address" required />
            <Field label={tr("postalCode")} name="postal_code" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">{tr("orderNotes")}</label>
              <textarea name="notes" rows={3} maxLength={500} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-accent/30 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{tr("cod")}</div>
                <div className="text-sm text-muted-foreground">{tr("codDesc")}</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg mb-4">{tr("items")}</h2>
          <div className="space-y-2 max-h-64 overflow-auto text-sm">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between gap-2">
                <span className="truncate">{it.name} × {it.quantity}</span>
                <span className="shrink-0 font-medium">{formatEur(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span>{tr("subtotal")}</span><span>{formatEur(subtotal)}</span></div>
            <div className="flex justify-between"><span>{tr("shipping")}</span><span>{tr("freeShipping")}</span></div>
            <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
              <span>{tr("total")}</span><span>{formatEur(subtotal)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "…" : tr("placeOrder")}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, name, required, type = "text", defaultValue }: { label: string; name: string; required?: boolean; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input name={name} required={required} type={type} defaultValue={defaultValue} maxLength={300} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
