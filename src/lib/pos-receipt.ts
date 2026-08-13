// Thermal receipt printing (58mm / 80mm) for POS sales.
import { cashierDisplay } from "@/lib/cashier";
import { businessInfo } from "@/lib/store-info";

export type ReceiptItem = { name: string; qty: number; price: number };
export type ReceiptSale = {
  sale_number: string;
  created_at: string;
  total: number;
  payment_method: string;
  paid_amount?: number | null;
  change_amount?: number | null;
  cashier_email?: string | null;
  cashier_name?: string | null;
};


function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

const money = (n: number) => `${n.toFixed(2)} €`;

/** Opens a print window sized for a thermal roll. width = 58 | 80 (mm) */
export function printReceipt(sale: ReceiptSale, items: ReceiptItem[], width: 58 | 80 = 80) {
  const d = new Date(sale.created_at);
  const B = businessInfo();

  const rows = items
    .map(
      (i) => `<tr><td class="n">${esc(i.name)}<div class="s">${i.qty} × ${money(i.price)}</div></td>
<td class="a">${money(i.qty * i.price)}</td></tr>`,
    )
    .join("");

  const cashier = sale.cashier_email || sale.cashier_name ? cashierDisplay(sale.cashier_email, sale.cashier_name) : "";
  const method = sale.payment_method === "cash" ? "Cash" : sale.payment_method === "card" ? "Card" : "Tjetër";

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sale.sale_number)}</title>
<style>
  @page { size: ${width}mm auto; margin: 0; }
  *{box-sizing:border-box}
  body{width:${width}mm;margin:0;padding:4mm 3mm;font-family:"Courier New",monospace;font-size:${width === 58 ? 10 : 11.5}px;color:#000}
  h1{font-size:${width === 58 ? 14 : 16}px;margin:0;text-align:center;letter-spacing:.5px}
  .c{text-align:center}
  .muted{font-size:9px;line-height:1.35}
  hr{border:none;border-top:1px dashed #000;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  td{vertical-align:top;padding:1.5px 0}
  td.a{text-align:right;white-space:nowrap;padding-left:4px}
  .s{font-size:9px}
  .tot{font-size:${width === 58 ? 13 : 15}px;font-weight:bold}
  .row{display:flex;justify-content:space-between;gap:6px}
</style></head><body>
${B.logo_url ? `<div class="c"><img src="${esc(B.logo_url)}" alt="" style="max-width:70%;max-height:18mm;object-fit:contain"></div>` : ""}
<h1>${esc(B.business_name)}</h1>
<div class="c muted">
  ${esc([B.address, B.city].filter(Boolean).join(", "))}
  ${B.phone ? `<br>Tel: ${esc(B.phone)}` : ""}
  ${B.email ? `<br>${esc(B.email)}` : ""}
  ${B.nui ? `<br>NUI / Nr. fiskal: ${esc(B.nui)}` : ""}
  ${B.vat_number ? `<br>Nr. TVSH: ${esc(B.vat_number)}` : ""}
</div>

<hr>
<div class="muted">
  <div class="row"><span>Nr. shitjes</span><b>${esc(sale.sale_number)}</b></div>
  <div class="row"><span>Data</span><span>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</span></div>
  ${cashier ? `<div class="row"><span>Arkëtari</span><span>${esc(cashier)}</span></div>` : ""}
</div>
<hr>
<table>${rows}</table>
<hr>
<div class="row tot"><span>TOTAL</span><span>${money(sale.total)}</span></div>
<div class="muted" style="margin-top:4px">
  <div class="row"><span>Pagesa</span><span>${esc(method)}</span></div>
  ${sale.paid_amount != null ? `<div class="row"><span>Paguar</span><span>${money(Number(sale.paid_amount))}</span></div>` : ""}
  ${sale.change_amount != null ? `<div class="row"><span>Kusuri</span><span>${money(Number(sale.change_amount))}</span></div>` : ""}
</div>
<hr>
<div class="c muted">Faleminderit! / Thank you!<br>${esc(STORE.name)}</div>
</body></html>`;

  const w = window.open("", "_blank", `width=${width === 58 ? 320 : 420},height=760`);
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
