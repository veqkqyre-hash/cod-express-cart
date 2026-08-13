import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Banknote, Tag, X as XIcon, Truck } from "lucide-react";
import { useShipping, validateCoupon } from "@/lib/checkout-extras";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "Përfundo porosinë — Dreame Beauty Cosmetics L.L.C." },
      { name: "description", content: "Plotëso të dhënat e dërgesës dhe porosit me pagesë në dorëzim (COD) në Dreame Beauty Cosmetics L.L.C.." },
      { property: "og:title", content: "Përfundo porosinë — Dreame Beauty Cosmetics L.L.C." },
      { property: "og:description", content: "Plotëso të dhënat e dërgesës dhe porosit me pagesë në dorëzim (COD) në Dreame Beauty Cosmetics L.L.C.." },
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
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const { fee: shippingFee, zone, freeOver, isFree } = useShipping(city, subtotal);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  async function applyCoupon() {
    setChecking(true);
    const res = await validateCoupon(code, subtotal);
    setChecking(false);
    if ("coupon" in res && res.coupon) {
      setCoupon(res.coupon);
      toast.success(lang === "sq" ? `Kuponi ${res.coupon.code} u aplikua` : `Coupon ${res.coupon.code} applied`);
      return;
    }
    const msgs: Record<string, string> = {
      empty: lang === "sq" ? "Shkruani kodin" : "Enter a code",
      invalid: lang === "sq" ? "Kod i pavlefshëm" : "Invalid code",
      expired: lang === "sq" ? "Kuponi ka skaduar" : "Coupon expired",
      min: lang === "sq" ? "Porosia nuk arrin minimumin e kuponit" : "Order below coupon minimum",
    };
    setCoupon(null);
    toast.error(msgs[(res as { error: string }).error] ?? msgs.invalid);
  }

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
          notes: [parsed.data.notes || null, coupon ? `Kupon: ${coupon.code} (-${discount.toFixed(2)} EUR)` : null]
            .filter(Boolean)
            .join(" | ") || null,
          subtotal,
          shipping_fee: shippingFee,
          total,
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
            <div>
              <label className="mb-1.5 block text-sm font-medium">{tr("city")}<span className="text-destructive"> *</span></label>
              <input
                name="city"
                required
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
          <div className="mt-4 border-t border-border pt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Tag className="h-3.5 w-3.5" /> {lang === "sq" ? "Kupon zbritje" : "Discount coupon"}
            </label>
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2 text-sm">
                <span className="font-medium">{coupon.code}</span>
                <button type="button" onClick={() => { setCoupon(null); setCode(""); }} className="grid h-6 w-6 place-items-center rounded-full hover:bg-muted">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={lang === "sq" ? "KODI" : "CODE"}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={applyCoupon} disabled={checking} className="shrink-0 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                  {checking ? "…" : lang === "sq" ? "Apliko" : "Apply"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span>{tr("subtotal")}</span><span>{formatEur(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600"><span>{lang === "sq" ? "Zbritja" : "Discount"}</span><span>-{formatEur(discount)}</span></div>
            )}
            <div className="flex justify-between">
              <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> {tr("shipping")}{zone ? ` · ${zone}` : ""}</span>
              <span>{shippingFee === 0 ? tr("freeShipping") : formatEur(shippingFee)}</span>
            </div>
            {!isFree && (
              <div className="text-xs text-muted-foreground">
                {lang === "sq"
                  ? `Shto ${formatEur(Math.max(0, freeOver - subtotal))} për transport falas`
                  : `Add ${formatEur(Math.max(0, freeOver - subtotal))} for free shipping`}
              </div>
            )}
            <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
              <span>{tr("total")}</span><span>{formatEur(total)}</span>
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
