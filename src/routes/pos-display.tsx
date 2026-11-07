import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { POS_CHANNEL } from "@/components/admin-pos-panel";

export const Route = createFileRoute("/pos-display")({
  component: PosDisplay,
  head: () => ({
    meta: [
      { title: "Ekrani i klientit · Dreame Beauty Cosmetics" },
      { name: "description", content: "Ekrani i klientit për arkën e Dreame Beauty Cosmetics — produktet, sasitë dhe totali i shitjes." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ekrani i klientit · Dreame Beauty Cosmetics" },
      { property: "og:description", content: "Ekran i dytë për arkën e Dreame Beauty Cosmetics" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Line = { name: string; qty: number; price: number; image?: string | null };
type Done = { total: number; sale_number: string; change: number | null };
const money = (n: number) => `${n.toFixed(2)} €`;

function PosDisplay() {
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const apply = (d: any) => {
      if (!d || typeof d !== "object") return;
      if (d.type === "cart") {
        const next = (d.lines ?? []) as Line[];
        setLines(next);
        setTotal(Number(d.total ?? 0));
        setSubtotal(Number(d.subtotal ?? d.total ?? 0));
        setDiscount(Number(d.discount ?? 0));
        setConnected(true);
        if (next.length > 0) setDone(null);
      } else if (d.type === "done") {
        setDone({ total: Number(d.total ?? 0), sale_number: String(d.sale_number ?? ""), change: d.change ?? null });
        setConnected(true);
      }
    };
    // 1) last known state
    try { const raw = localStorage.getItem(POS_CHANNEL); if (raw) apply(JSON.parse(raw)); } catch { /* ignore */ }
    // 2) BroadcastChannel
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(POS_CHANNEL);
      ch.onmessage = (e) => apply(e.data);
      ch.postMessage({ type: "hello" });
    } catch { /* ignore */ }
    // 3) localStorage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === POS_CHANNEL && e.newValue) { try { apply(JSON.parse(e.newValue)); } catch { /* ignore */ } }
    };
    window.addEventListener("storage", onStorage);
    // 4) direct window messaging with the POS that opened us
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if ((e.data as any)?.channel === POS_CHANNEL) apply(e.data);
    };
    window.addEventListener("message", onMsg);
    const hello = () => {
      try { window.opener?.postMessage({ type: "hello", channel: POS_CHANNEL }, window.location.origin); } catch { /* ignore */ }
    };
    hello();
    const t = setInterval(hello, 3000);
    setNow(new Date());
    const clock = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => {
      ch?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMsg);
      clearInterval(t);
      clearInterval(clock);
    };
  }, []);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const last = lines[lines.length - 1];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-foreground text-background">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-3xl" />

      <header className="relative flex items-center justify-between px-10 py-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Dreame Beauty Cosmetics</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-background/50">Nail Supplies · Fushë Kosovë</p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl tabular-nums">
            {now ? now.toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" }) : ""}
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 text-xs uppercase tracking-widest text-background/50">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-background/30"}`} />
            {connected ? "Arka e lidhur" : "Duke u lidhur me arkën…"}
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 gap-8 px-10 pb-8">
        {done ? (
          <div className="grid flex-1 place-items-center rounded-3xl border border-background/10 bg-background/5 text-center backdrop-blur">
            <div>
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary text-5xl text-primary-foreground">✓</div>
              <div className="mt-6 text-sm uppercase tracking-[0.4em] text-background/60">Faleminderit për blerjen!</div>
              <div className="mt-4 font-display text-8xl tabular-nums">{money(done.total)}</div>
              {done.sale_number && <div className="mt-3 text-background/50">Nr. {done.sale_number}</div>}
              {done.change != null && done.change > 0 && (
                <div className="mt-6 inline-block rounded-2xl bg-primary px-8 py-4 text-3xl font-semibold text-primary-foreground">
                  Kusuri: {money(done.change)}
                </div>
              )}
              <div className="mt-8 text-background/50">Ju mirëpresim sërish ♡</div>
            </div>
          </div>
        ) : lines.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-3xl border border-background/10 bg-background/5 text-center backdrop-blur">
            <div>
              <div className="font-display text-6xl md:text-7xl">Mirë se vini</div>
              <div className="mt-4 text-lg text-background/60">Welcome · Produktet do të shfaqen këtu gjatë skanimit</div>
              <div className="mx-auto mt-10 flex w-fit gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-3 w-3 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="flex min-w-0 flex-1 flex-col rounded-3xl border border-background/10 bg-background/5 backdrop-blur">
              <div className="flex items-center justify-between border-b border-background/10 px-6 py-4 text-xs uppercase tracking-[0.3em] text-background/50">
                <span>Produktet</span>
                <span>{count} copë</span>
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-background/10 overflow-y-auto">
                {lines.map((l, i) => (
                  <li key={i} className={`flex items-center gap-4 px-6 py-4 ${i === lines.length - 1 ? "bg-primary/10" : ""}`}>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-background/10">
                      {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xl font-medium">{l.name}</div>
                      <div className="text-background/50 tabular-nums">{l.qty} × {money(l.price)}</div>
                    </div>
                    <div className="shrink-0 text-2xl font-semibold tabular-nums">{money(l.qty * l.price)}</div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="flex w-[38%] max-w-md shrink-0 flex-col gap-6">
              {last && (
                <div className="overflow-hidden rounded-3xl border border-background/10 bg-background/5 backdrop-blur">
                  <div className="aspect-square bg-background/10">
                    {last.image && <img src={last.image} alt={last.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-[0.3em] text-primary">Sapo u shtua</div>
                    <div className="mt-1 truncate font-display text-2xl">{last.name}</div>
                    <div className="mt-1 text-xl tabular-nums text-background/70">{money(last.price)}</div>
                  </div>
                </div>
              )}
              <div className="mt-auto rounded-3xl bg-primary p-6 text-primary-foreground">
                {discount > 0 && (
                  <div className="mb-3 space-y-1 text-lg tabular-nums">
                    <div className="flex justify-between opacity-80"><span>Nëntotali</span><span>{money(subtotal)}</span></div>
                    <div className="flex justify-between"><span>Zbritja</span><span>− {money(discount)}</span></div>
                  </div>
                )}
                <div className="text-xs uppercase tracking-[0.4em] opacity-80">Totali për pagesë</div>
                <div className="mt-2 font-display text-6xl tabular-nums md:text-7xl">{money(total)}</div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
