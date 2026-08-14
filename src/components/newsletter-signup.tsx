import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function NewsletterSignup({ dark = false }: { dark?: boolean }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim(), lang });
    setBusy(false);
    if (error) {
      if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
        toast.success(L("Ju jeni tashmë i regjistruar.", "You are already subscribed."));
      } else {
        toast.error(error.message);
      }
      return;
    }
    setEmail("");
    toast.success(L("Faleminderit! Ju u regjistruat.", "Thanks! You are subscribed."));
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-[var(--pink)]" : "text-[var(--pink-deep)]"}`}>
        {L("Newsletter", "Newsletter")}
      </div>
      <p className={`text-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>
        {L("Ofertat & produktet e reja në email.", "New arrivals & offers in your inbox.")}
      </p>
      <div className="flex gap-2">
        <div className={`flex flex-1 items-center gap-2 rounded-full border px-3 py-2 ${dark ? "border-white/20" : "border-border"}`}>
          <Mail className="h-4 w-4 opacity-60" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
          />
        </div>
        <button
          disabled={busy}
          className="rounded-full bg-[var(--pink-deep)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
        >
          {busy ? "…" : L("Regjistrohu", "Subscribe")}
        </button>
      </div>
    </form>
  );
}

export function StockAlertForm({ productId, productName }: { productId: string; productName: string }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("stock_alerts").insert({ product_id: productId, product_name: productName, email: email.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success(L("Do të njoftoheni kur produkti kthehet në stok.", "We'll notify you when it's back in stock."));
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-[var(--pink-soft)]/50 p-5 text-sm">
        {L("Kërkesa u regjistrua. Faleminderit!", "Request saved. Thank you!")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-[var(--pink-soft)]/40 p-5">
      <div className="font-medium">{L("Njoftomë kur ka stok", "Notify me when back in stock")}</div>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm"
        />
        <button disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "…" : L("Dërgo", "Send")}
        </button>
      </div>
    </form>
  );
}
