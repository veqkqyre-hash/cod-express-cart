import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { POS_CHANNEL } from "@/components/admin-pos-panel";

export const Route = createFileRoute("/pos-display")({
  component: PosDisplay,
  head: () => ({
    meta: [
      { title: "Ekrani i klientit · Dreame Beauty Cosmetics L.L.C." },
      { name: "description", content: "Ekrani i klientit për arkën e Dreame Beauty Cosmetics L.L.C. — produktet, sasitë dhe totali i shitjes." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ekrani i klientit · Dreame Beauty Cosmetics L.L.C." },
      { property: "og:description", content: "Ekran i dytë për arkën e Dreame Beauty Cosmetics L.L.C.." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Line = { name: string; qty: number; price: number };
const money = (n: number) => `${n.toFixed(2)} €`;

function PosDisplay() {
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState<{ total: number; sale_number: string; change: number | null } | null>(null);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(POS_CHANNEL);
      ch.onmessage = (e) => {
        const d = e.data as any;
        if (d?.type === "cart") {
          setLines(d.lines ?? []);
          setTotal(Number(d.total ?? 0));
          setDone(null);
        } else if (d?.type === "done") {
          setDone({ total: Number(d.total ?? 0), sale_number: String(d.sale_number ?? ""), change: d.change ?? null });
        }
      };
    } catch {
      /* ignore */
    }
    return () => ch?.close();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between border-b border-neutral-800 px-8 py-5">
        <h1 className="font-display text-3xl">Dreame Beauty Cosmetics L.L.C.</h1>
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">Mirë se vini</span>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {done ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-neutral-400">Faleminderit!</div>
              <div className="mt-4 font-display text-7xl">{money(done.total)}</div>
              <div className="mt-3 text-neutral-400">{done.sale_number}</div>
              {done.change != null && <div className="mt-4 text-2xl">Kusuri: {money(done.change)}</div>}
            </div>
          </div>
        ) : lines.length === 0 ? (
          <div className="grid h-full place-items-center text-neutral-500">Në pritje të produkteve…</div>
        ) : (
          <table className="w-full text-xl">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-neutral-800">
                  <td className="py-4 pr-4">{l.name}</td>
                  <td className="py-4 w-32 text-neutral-400">
                    {l.qty} × {money(l.price)}
                  </td>
                  <td className="py-4 w-36 text-right font-semibold">{money(l.qty * l.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!done && (
        <footer className="flex items-baseline justify-between border-t border-neutral-800 bg-black px-8 py-6">
          <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">Total</span>
          <span className="font-display text-6xl">{money(total)}</span>
        </footer>
      )}
    </div>
  );
}
