import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { ScanLine, Search, Trash2, Plus, Minus, Printer, Monitor, X, Eraser } from "lucide-react";
import { printReceipt, type ReceiptSale } from "@/lib/pos-receipt";
import { ShiftBar, useCurrentShift } from "@/components/admin-shift-panel";
import { getCashierName, setCashierName, cashierDisplay } from "@/lib/cashier";
import { logAction } from "@/lib/audit";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";


export type PosProduct = {
  id: string;
  name_sq: string;
  name_en: string;
  price: number;
  cost_price: number;
  stock: number;
  barcode: string | null;
  sku: string | null;
  image_url: string | null;
  active: boolean;
};

type Line = { product: PosProduct; qty: number };

export const POS_CHANNEL = "dream-studio-pos";

function broadcast(payload: unknown) {
  try {
    new BroadcastChannel(POS_CHANNEL).postMessage(payload);
  } catch {
    /* unsupported browser — customer screen simply stays idle */
  }
}

export function PosPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const nameOf = (p: PosProduct) => (lang === "sq" ? p.name_sq : p.name_en);

  const [lines, setLines] = useState<Line[]>([]);
  const [code, setCode] = useState("");
  const [term, setTerm] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "other">("cash");
  const [paid, setPaid] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ sale: ReceiptSale; items: { name: string; qty: number; price: number }[] } | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [receiptWidth, setReceiptWidth] = useState<58 | 80>(80);
  const [cashier, setCashier] = useState("");
  type ScanEntry = {
    id: string;
    code: string;
    ok: boolean;
    label: string;
    hint?: string;
    qty?: number;
    sale?: string;
    at: string;
  };
  const [scanLog, setScanLog] = useState<ScanEntry[]>([]);
  useEffect(() => {
    setCashier(getCashierName());
    void loadBusinessInfo();
  }, []);

  const scanRef = useRef<HTMLInputElement>(null);
  const { data: shift, refetch: refetchShift } = useCurrentShift();

  function pushScan(code: string, ok: boolean, label: string, hint?: string) {
    setScanLog((prev) =>
      [
        { id: `${Date.now()}-${Math.random()}`, code, ok, label, hint, at: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 40),
    );
  }

  const scanColumns: Column<ScanEntry>[] = [
    { key: "at", label: L("Ora", "Time"), get: (s) => s.at },
    { key: "code", label: L("Kodi", "Code"), get: (s) => s.code },
    { key: "status", label: L("Statusi", "Status"), get: (s) => (s.ok ? L("Sukses", "Success") : L("Gabim", "Error")) },
    { key: "label", label: L("Produkti / Gabimi", "Product / Error"), get: (s) => s.label },
    { key: "hint", label: L("Sqarim", "Detail"), get: (s) => s.hint ?? "" },
    { key: "sale", label: L("Shitja", "Sale"), get: (s) => s.sale ?? "" },
  ];



  /** Përkthe gabimet e serverit në mesazhe të qarta (titull + zgjidhje), pa e bllokuar arkën. */
  function scanErrorMessage(raw: string, code: string): { msg: string; hint: string } {
    const m = (raw || "").toLowerCase();
    if (m.includes("invalid") || m.includes("pavlefsh"))
      return {
        msg: L(`Barkod i pavlefshëm: ${code}`, `Invalid barcode: ${code}`),
        hint: L(
          "Duhet 4–32 karaktere, pa zbrazëti (A-Z, 0-9, . _ -). Kontrollo layout-in US të skanerit.",
          "Needs 4–32 characters, no spaces (A-Z, 0-9, . _ -). Check the scanner's US layout.",
        ),
      };
    if (m.includes("duplicate") || m.includes("unique"))
      return {
        msg: L(`Barkodi ${code} është dublikat`, `Barcode ${code} is a duplicate`),
        hint: L(
          "I njëjti barkod është në më shumë produkte — rregulloje në Katalogu → Produktet.",
          "The same barcode exists on several products — fix it in Catalog → Products.",
        ),
      };
    if (m.includes("not authenticated") || m.includes("jwt") || m.includes("not authorized"))
      return {
        msg: L("Sesioni skadoi", "Session expired"),
        hint: L("Kyçu përsëri për të vazhduar skanimin.", "Sign in again to keep scanning."),
      };
    if (m.includes("failed to fetch") || m.includes("network") || m.includes("timeout") || m.includes("fetch"))
      return {
        msg: L("Serveri nuk u arrit", "Server unreachable"),
        hint: L(
          "Kontrollo internetin — arka vazhdon, shto produktin nga kërkimi manual.",
          "Check your connection — the register keeps working, add the product from manual search.",
        ),
      };
    return {
      msg: L("Skanimi dështoi", "Scan failed"),
      hint: raw || L("Provo përsëri ose kërko produktin manualisht.", "Try again or search the product manually."),
    };
  }



  const { data: products, refetch } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name_sq,name_en,price,cost_price,stock,barcode,sku,image_url,active")
        .eq("active", true)
        .order("name_sq");
      if (error) throw error;
      return (data ?? []) as unknown as PosProduct[];
    },
  });

  const total = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const change = method === "cash" && paid !== "" ? Number(paid) - total : null;

  // keep the customer screen in sync
  useEffect(() => {
    broadcast({
      type: "cart",
      lines: lines.map((l) => ({ name: nameOf(l.product), qty: l.qty, price: Number(l.product.price) })),
      total,
    });
  }, [lines, total, lang]);

  // scanner input should always be focused
  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  function add(p: PosProduct) {
    if (p.stock <= 0) {
      toast.error(L("Ky produkt nuk është në stok.", "This product is out of stock."));
      return;
    }
    setLines((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i === -1) return [...prev, { product: p, qty: 1 }];
      if (prev[i]!.qty + 1 > p.stock) {
        toast.error(L(`Vetëm ${p.stock} në stok.`, `Only ${p.stock} in stock.`));
        return prev;
      }
      const next = [...prev];
      next[i] = { ...next[i]!, qty: next[i]!.qty + 1 };
      return next;
    });
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.product.id !== id) return [l];
        if (qty <= 0) return [];
        if (qty > l.product.stock) {
          toast.error(L(`Vetëm ${l.product.stock} në stok.`, `Only ${l.product.stock} in stock.`));
          return [l];
        }
        return [{ ...l, qty }];
      }),
    );
  }

  async function onScan(e: React.FormEvent) {
    e.preventDefault();
    const v = code.trim();
    setCode("");
    if (!v) {
      toast.error(L("Skanimi nuk prodhoi vlerë", "The scan produced no value"), {
        description: L("Skano përsëri ose shkruaj barkodin me dorë.", "Scan again or type the barcode manually."),
      });
      pushScan("—", false, L("Skanim i zbrazët", "Empty scan"), L("Nuk arriti kod nga skaneri.", "No code arrived from the scanner."));
      scanRef.current?.focus();
      return;
    }
    // Validim + regjistrim i skanimit në server (RPC pos_scan)
    let res: { found: boolean; code: string; product?: PosProduct } | null = null;
    try {
      const { data, error } = await supabase.rpc("pos_scan", { _code: v });
      if (error) throw new Error(error.message);
      res = data as unknown as { found: boolean; code: string; product?: PosProduct };
    } catch (err) {
      const { msg, hint } = scanErrorMessage(err instanceof Error ? err.message : String(err), v);
      toast.error(msg, { description: hint });
      pushScan(v, false, msg, hint);
      setTerm(v); // arka vazhdon: kërko manualisht
      scanRef.current?.focus();
      return;
    }
    scanRef.current?.focus();
    if (!res?.found || !res.product) {
      const msg = `${L("Barkodi nuk u njoh", "Barcode not recognised")}: ${res?.code ?? v}`;
      const hint = L(
        "Kërkimi manual u hap me këtë kod — ose regjistroje produktin në Katalogu → Produktet.",
        "Manual search opened with this code — or register the product in Catalog → Products.",
      );
      toast.error(msg, { description: hint });
      pushScan(v, false, msg, hint);
      setTerm(v);
      return;
    }
    const live = (products ?? []).find((p) => p.id === res.product!.id) ?? res.product;
    add(live);
    pushScan(v, true, nameOf(live));
    toast.success(`${L("U skanua", "Scanned")}: ${nameOf(live)}`, {
      description: `${formatEur(Number(live.price))} · ${L("stok", "stock")}: ${live.stock}`,
    });
  }



  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return (products ?? [])
      .filter(
        (p) =>
          p.name_sq.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q),
      )
      .slice(0, 24);
  }, [term, products]);

  async function finish() {
    if (lines.length === 0) return toast.error(L("Shporta është e zbrazët.", "Cart is empty."));
    if (!shift) return toast.error(L("Hap sesionin e punës para shitjes.", "Open a work shift before selling."));
    if (method === "cash" && paid !== "" && Number(paid) < total)
      return toast.error(L("Shuma e paguar është më e vogël se totali.", "Paid amount is below the total."));
    setSaving(true);
    const { data, error } = await supabase.rpc("create_pos_sale", {
      _items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })) as never,
      _payment_method: method,
      ...(method === "cash" && paid !== "" ? { _paid_amount: Number(paid) } : {}),
    });
    setSaving(false);
    if (error) return toast.error(error.message);

    const raw = data as unknown as ReceiptSale;
    const sale: ReceiptSale = { ...raw, cashier_name: cashierDisplay(raw.cashier_email, cashier) };
    const items = lines.map((l) => ({ name: nameOf(l.product), qty: l.qty, price: Number(l.product.price) }));
    setDone({ sale, items });
    if (autoPrint) printReceipt(sale, items, receiptWidth);
    broadcast({ type: "done", total: Number(sale.total), sale_number: sale.sale_number, change: sale.change_amount });

    // Lidh skanimet/artikujt me shitjen konkrete në audit log
    const saleId = (raw as unknown as { id?: string }).id ?? null;
    for (const l of lines) {
      void logAction("pos.scan_sold", "pos_sales", saleId, {
        code: l.product.barcode ?? l.product.sku ?? null,
        product: nameOf(l.product),
        quantity: l.qty,
        sale_id: saleId,
        sale_number: sale.sale_number,
      });
    }
    setScanLog((prev) => prev.map((s) => (s.ok && !s.sale ? { ...s, sale: sale.sale_number } : s)));

    setLines([]);
    setPaid("");
    setTerm("");
    refetch();
    refetchShift();
    toast.success(`${L("Shitja u regjistrua", "Sale recorded")} · ${sale.sale_number}`, {
      description: `${formatEur(Number(sale.total))} · ${count} ${L("artikuj", "items")}${
        sale.change_amount != null ? ` · ${L("kusuri", "change")} ${formatEur(Number(sale.change_amount))}` : ""
      }`,
    });
    scanRef.current?.focus();
  }


  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Left: scan + search */}
      <div className="space-y-4">
        <ShiftBar compact />
        <form onSubmit={onScan} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <ScanLine className="h-4 w-4" /> {L("Skano ose shkruaj barkodin", "Scan or type the barcode")}
          </label>
          <div className="flex gap-2">
            <input
              ref={scanRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={() => {
                // Rikthe fokusin vetëm kur nuk ka shkuar në një fushë/buton tjetër
                setTimeout(() => {
                  const el = document.activeElement as HTMLElement | null;
                  const tag = el?.tagName;
                  const interactive =
                    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || el?.isContentEditable;
                  if (!interactive) scanRef.current?.focus();
                }, 150);
              }}
              autoComplete="off"
              placeholder="⌨ 1234567890123"
              className="flex-1 rounded-xl border-2 border-neutral-300 px-4 py-4 text-2xl font-mono tracking-wider focus:border-[var(--pink-deep,#e91e63)] focus:outline-none"
            />
            <button className="rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white">OK</button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {L(
              "Barkodi: 4–32 karaktere, pa zbrazëti (A-Z, 0-9, . _ -). Çdo skanim regjistrohet në Audit log.",
              "Barcode: 4–32 characters, no spaces (A-Z, 0-9, . _ -). Every scan is recorded in the audit log.",
            )}
          </p>
        </form>

        <details className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm shadow-sm">
          <summary className="cursor-pointer font-semibold">{L("Udhëzime për skanim", "Scanning guide")}</summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-neutral-600">
            <li>{L("Lidh skanerin USB/Bluetooth — punon si tastierë (HID), pa driver.", "Connect the USB/Bluetooth scanner — it works as a keyboard (HID), no driver needed.")}</li>
            <li>{L("Skaneri duhet të dërgojë Enter (CR) në fund të skanimit dhe layout US.", "The scanner must send Enter (CR) after each scan and use the US layout.")}</li>
            <li>{L("Kliko në fushën e madhe të barkodit — fokusi mbahet automatikisht.", "Click the large barcode field — focus is kept automatically.")}</li>
            <li>{L("Skano: produkti hyn në shportë; sasia rritet automatikisht për skanim të përsëritur.", "Scan: the product enters the cart; repeated scans increase quantity.")}</li>
            <li>{L("Produkt i re: Katalogu → Produktet → Shto produkt → skano në fushën Barkodi.", "New product: Catalog → Products → Add product → scan into the Barcode field.")}</li>
            <li>{L("Nëse barkodi nuk njihet, kërkimi hapet automatikisht me atë kod.", "If the barcode is unknown, the search opens automatically with that code.")}</li>
            <li>{L("Skanim i dyfishtë/gabim rrjeti? Arka nuk bllokohet — shto produktin nga kërkimi manual.", "Duplicate scan or network error? The register never blocks — add the product from manual search.")}</li>
            <li>{L("Pas përfundimit të shitjes, skanimet lidhen me numrin e shitjes (POS-…).", "After the sale is finished, scans are linked to the sale number (POS-…).")}</li>
            <li>{L("Të gjitha skanimet ruhen në SISTEMI → Regjistri i aktivitetit (filtro 'Skanimet').", "Every scan is stored in SYSTEM → Activity log (use the 'Scans' filter).")}</li>
          </ol>
        </details>

        {/* Historiku i skanimeve (sesioni aktual) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {L("Historik skanimesh", "Scan history")}
            </span>
            <div className="flex items-center gap-2">
              <ExportButtons
                entity="pos_scans"
                filename={`skanime-${new Date().toISOString().slice(0, 10)}`}
                title={L("Historik skanimesh", "Scan history")}
                subtitle={`${scanLog.length} ${L("skanime", "scans")}`}
                columns={scanColumns}
                rows={scanLog}
                labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka skanime", "No scans") }}
              />
              {scanLog.length > 0 && (
                <button onClick={() => setScanLog([])} className="text-xs text-neutral-500 hover:text-neutral-900">
                  {L("Fshij listën", "Clear list")}
                </button>
              )}
            </div>
          </div>
          {scanLog.length === 0 ? (
            <p className="py-3 text-sm text-neutral-500">{L("Asnjë skanim në këtë sesion.", "No scans in this session yet.")}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {scanLog.map((s) => (
                <li key={s.id} className="flex items-start gap-3 py-2">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      s.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.ok ? "✓" : "!"}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">{s.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className={s.ok ? "" : "font-medium text-red-700"}>{s.label}</span>
                    {s.hint && <span className="block text-xs text-neutral-500">{s.hint}</span>}
                    {s.sale && (
                      <span className="mt-0.5 inline-block rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {s.sale}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">{s.at}</span>
                </li>
              ))}
            </ul>
          )}
        </div>



        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={L("Kërko me emër, barkod ose SKU…", "Search by name, barcode or SKU…")}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            {term && (
              <button onClick={() => setTerm("")} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {term && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {results.length === 0 && (
                <div className="col-span-full py-6 text-center text-sm text-neutral-500">
                  {L("Produkti nuk u gjet.", "Product not found.")}
                </div>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 text-left hover:border-neutral-400"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-lg bg-neutral-100" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{nameOf(p)}</div>
                    <div className="text-xs text-neutral-500">
                      {formatEur(Number(p.price))} · {L("stok", "stock")} {p.stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">{L("Produkti", "Product")}</th>
                <th className="px-4 py-3">{L("Çmimi", "Price")}</th>
                <th className="px-4 py-3">{L("Sasia", "Qty")}</th>
                <th className="px-4 py-3 text-right">{L("Totali", "Total")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    {L("Skano produktin e parë…", "Scan the first product…")}
                  </td>
                </tr>
              )}
              {lines.map((l) => (
                <tr key={l.product.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{nameOf(l.product)}</td>
                  <td className="px-4 py-3">{formatEur(Number(l.product.price))}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setQty(l.product.id, l.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 hover:bg-neutral-50">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={l.product.stock}
                        value={l.qty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isNaN(v)) setQty(l.product.id, v);
                        }}
                        className="w-14 rounded-lg border border-neutral-200 px-2 py-1 text-center font-semibold focus:outline-none"
                      />
                      <button onClick={() => setQty(l.product.id, l.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 hover:bg-neutral-50">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatEur(Number(l.product.price) * l.qty)}</td>
                  <td className="px-2 py-3 text-right">
                    <button onClick={() => setQty(l.product.id, 0)} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
              <button
                onClick={() => setLines([])}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <Eraser className="h-3.5 w-3.5" /> {L("Zbraz shportën", "Clear cart")}
              </button>
              <div className="text-sm text-neutral-500">
                {count} {L("artikuj", "items")} · <span className="font-semibold text-neutral-900">{formatEur(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: payment */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">TOTAL</span>
            <span className="font-display text-4xl">{formatEur(total)}</span>
          </div>
          <div className="mt-1 text-right text-xs text-neutral-500">
            {count} {L("artikuj", "items")}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {(["cash", "card", "other"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  method === m ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {m === "cash" ? "Cash" : m === "card" ? "Card" : L("Tjetër", "Other")}
              </button>
            ))}
          </div>

          {method === "cash" && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {L("Paguar nga klienti", "Paid by customer")}
              </label>
              <input
                type="number"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <div className="flex items-baseline justify-between rounded-xl bg-neutral-50 px-4 py-3">
                <span className="text-sm font-medium">{L("KUSURI", "CHANGE")}</span>
                <span className={`font-display text-2xl ${change != null && change < 0 ? "text-red-600" : ""}`}>
                  {change == null ? "—" : formatEur(change)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={finish}
            disabled={saving || lines.length === 0}
            className="mt-5 w-full rounded-xl bg-[var(--pink-deep,#e91e63)] px-6 py-4 text-base font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "…" : L("PËRFUNDO SHITJEN", "COMPLETE SALE")}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
          <label className="inline-flex items-center gap-2 font-medium">
            <input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
            {L("Printo faturën automatikisht", "Auto-print receipt")}
          </label>
          <div className="inline-flex overflow-hidden rounded-lg border border-neutral-200">
            {([80, 58] as const).map((w) => (
              <button
                key={w}
                onClick={() => setReceiptWidth(w)}
                className={`px-2.5 py-1 text-xs font-semibold ${receiptWidth === w ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}
              >
                {w}mm
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {L("Emri i arkëtarit (del në faturë)", "Cashier name (printed on receipt)")}
          </label>
          <input
            value={cashier}
            onChange={(e) => {
              setCashier(e.target.value);
              setCashierName(e.target.value);
            }}
            placeholder={L("p.sh. Arta Krasniqi", "e.g. Arta Krasniqi")}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <button
          onClick={() => window.open("/pos-display", "pos-display", "width=900,height=700")}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:bg-neutral-50"
        >
          <Monitor className="h-4 w-4" /> {L("Hap ekranin e klientit", "Open customer screen")}
        </button>

        {done && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="text-sm font-semibold text-green-900">
              {done.sale.sale_number} · {formatEur(Number(done.sale.total))}
            </div>
            {done.sale.change_amount != null && (
              <div className="mt-1 text-sm text-green-800">
                {L("Kusuri", "Change")}: {formatEur(Number(done.sale.change_amount))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => printReceipt(done.sale, done.items, 80)}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
              >
                <Printer className="h-4 w-4" /> {L("PRINT FATURË", "PRINT RECEIPT")} 80mm
              </button>
              <button
                onClick={() => printReceipt(done.sale, done.items, 58)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
              >
                <Printer className="h-4 w-4" /> 58mm
              </button>
              <button onClick={() => setDone(null)} className="rounded-full px-3 py-2 text-sm text-neutral-600 hover:bg-white">
                {L("Mbyll", "Close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
