// Multi-order printing (invoices / packing slips) for the admin dashboard.

type PrintOrder = {
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  postal_code: string | null;
  notes: string | null;
  subtotal: number;
  shipping_fee?: number;
  total: number;
  status: string;
  created_at: string;
};

type PrintItem = { order_id?: string; product_name: string; quantity: number; unit_price: number; subtotal: number };

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

const eur = (n: number) => `${Number(n || 0).toFixed(2)} €`;

/** Opens one print window containing an invoice page per order. */
export function printOrders(
  orders: (PrintOrder & { id: string })[],
  itemsByOrder: Record<string, PrintItem[]>,
  labels: { invoice: string; order: string; customer: string; address: string; item: string; qty: string; price: string; total: string; status: string; cod: string; notes: string },
) {
  if (orders.length === 0) return false;

  const pages = orders
    .map((o) => {
      const items = itemsByOrder[o.id] ?? [];
      return `<section class="page">
  <header>
    <h1>Dream Studio</h1>
    <div class="addr">Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com</div>
  </header>
  <div class="doc">
    <h2>${esc(labels.invoice)} · ${esc(o.order_number)}</h2>
    <div class="meta">${new Date(o.created_at).toLocaleString()} · ${esc(labels.status)}: ${esc(o.status)} · ${esc(labels.cod)}</div>
  </div>
  <div class="cols">
    <div><strong>${esc(labels.customer)}</strong><br>${esc(o.customer_name)}<br>${esc(o.phone)}${o.email ? `<br>${esc(o.email)}` : ""}</div>
    <div><strong>${esc(labels.address)}</strong><br>${esc(o.address)}<br>${esc(o.city)}${o.postal_code ? `, ${esc(o.postal_code)}` : ""}</div>
  </div>
  <table>
    <thead><tr><th>${esc(labels.item)}</th><th class="r">${esc(labels.qty)}</th><th class="r">${esc(labels.price)}</th><th class="r">${esc(labels.total)}</th></tr></thead>
    <tbody>
      ${items
        .map((it) => `<tr><td>${esc(it.product_name)}</td><td class="r">${it.quantity}</td><td class="r">${eur(it.unit_price)}</td><td class="r">${eur(it.subtotal)}</td></tr>`)
        .join("")}
    </tbody>
  </table>
  <div class="tot">${esc(labels.total)}: ${eur(o.total)}</div>
  ${o.notes ? `<div class="notes"><strong>${esc(labels.notes)}:</strong> ${esc(o.notes)}</div>` : ""}
</section>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dream Studio — ${esc(labels.invoice)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:0}
  .page{padding:26mm 14mm;page-break-after:always}
  .page:last-child{page-break-after:auto}
  h1{font-size:26px;margin:0;letter-spacing:-.5px}
  .addr{font-size:11px;color:#555;margin-top:4px}
  .doc{margin-top:18px;padding-top:12px;border-top:2px solid #111}
  .doc h2{font-size:16px;margin:0 0 2px}
  .doc .meta{font-size:11px;color:#555}
  .cols{display:flex;gap:24px;margin-top:16px;font-size:12px}
  .cols div{flex:1}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;font-family:Helvetica,Arial,sans-serif}
  th{background:#f4f4f5;text-align:left;padding:7px 8px;border-bottom:1px solid #ddd;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:6px 8px;border-bottom:1px solid #eee}
  .r{text-align:right}
  .tot{margin-top:12px;text-align:right;font-size:14px;font-weight:bold}
  .notes{margin-top:10px;font-size:11px;color:#444}
  @page{size:A4;margin:0}
</style></head><body>${pages}</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}
