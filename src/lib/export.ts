// CSV + printable PDF export helpers for the admin dashboard.

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export type Column<T> = { key: string; label: string; get: (row: T) => unknown };

export function downloadCsv<T>(filename: string, columns: Column<T>[], rows: T[]) {
  const head = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.get(r))).join(",")).join("\n");
  // BOM so Excel reads UTF-8 (ë, ç) correctly
  const blob = new Blob(["\uFEFF" + head + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

/** Opens a print window with a branded table — user saves as PDF. */
export function printPdf<T>(opts: {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  footer?: string;
}) {
  const { title, subtitle, columns, rows, footer } = opts;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:32px}
  h1{font-size:26px;margin:0;letter-spacing:-.5px}
  .addr{font-size:11px;color:#555;margin-top:4px}
  .doc{margin-top:18px;padding-top:12px;border-top:2px solid #111}
  .doc h2{font-size:16px;margin:0 0 2px}
  .doc .meta{font-size:11px;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;font-family:Helvetica,Arial,sans-serif}
  th{background:#f4f4f5;text-align:left;padding:7px 8px;border-bottom:1px solid #ddd;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top}
  tr:nth-child(even) td{background:#fafafa}
  .foot{margin-top:14px;font-size:12px;font-weight:bold}
  @page{size:A4;margin:14mm}
</style></head><body>
<h1>Dream Studio</h1>
<div class="addr">Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com</div>
<div class="doc"><h2>${esc(title)}</h2>
<div class="meta">${esc(subtitle ?? "")}${subtitle ? " · " : ""}${new Date().toLocaleString()}</div></div>
<table><thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(c.get(r))}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
${footer ? `<div class="foot">${esc(footer)}</div>` : ""}
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
  return true;
}
