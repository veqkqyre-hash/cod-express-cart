import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { metaFor } from "@/components/info-page";
import { toast } from "sonner";
import { Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => metaFor("/contact", "Kontakti", "Kontaktoni Dreame Beauty Cosmetics L.L.C. — Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë."),
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  body: z.string().trim().min(5).max(2000),
});

function Contact() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return toast.error(L("Plotësoni emrin dhe mesazhin", "Please fill name and message"));
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      body: parsed.data.body,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success(L("Mesazhi u dërgua!", "Message sent!"));
  }

  const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl tracking-tight">{L("Kontakti", "Contact us")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {L("Jemi këtu për çdo pyetje mbi produktet, porositë ose bashkëpunimet me sallone.", "We're here for any question about products, orders or salon partnerships.")}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
            {sent ? (
              <div className="py-14 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Send className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl">{L("Faleminderit!", "Thank you!")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {L("Mesazhi arriti te ekipi ynë. Ju përgjigjemi brenda 24 orësh.", "Your message reached our team. We reply within 24 hours.")}
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{L("Emri", "Name")} <span className="text-destructive">*</span></label>
                    <input name="name" required maxLength={100} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{L("Telefoni", "Phone")}</label>
                    <input name="phone" type="tel" maxLength={30} className={inputCls} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email</label>
                    <input name="email" type="email" maxLength={255} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{L("Subjekti", "Subject")}</label>
                    <input name="subject" maxLength={150} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{L("Mesazhi", "Message")} <span className="text-destructive">*</span></label>
                  <textarea name="body" rows={5} required maxLength={2000} className={inputCls} />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {sending ? "…" : L("Dërgo mesazhin", "Send message")}
                </button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-2 space-y-4">
            {[
              { icon: MapPin, title: L("Adresa", "Address"), value: "Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë" },
              { icon: Mail, title: "Email", value: "hello@dreamstudio-ks.com" },
              { icon: Clock, title: L("Orari", "Hours"), value: L("Hën–Sht: 09:00 – 19:00", "Mon–Sat: 09:00 – 19:00") },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--pink-soft)]">
                  <c.icon className="h-4 w-4 text-[var(--pink-deep)]" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="text-sm text-muted-foreground">{c.value}</div>
                </div>
              </div>
            ))}
            <a
              href="mailto:hello@dreamstudio-ks.com"
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" /> {L("Shkruaj në email", "Email us")}
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
