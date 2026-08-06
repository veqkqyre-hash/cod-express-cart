import { Download, FileText } from "lucide-react";
import { downloadCsv, printPdf, type Column } from "@/lib/export";
import { logAction } from "@/lib/audit";
import { toast } from "sonner";

export function ExportButtons<T>({
  filename,
  title,
  subtitle,
  columns,
  rows,
  footer,
  entity,
  labels,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  footer?: string;
  entity: string;
  labels: { csv: string; pdf: string; empty: string };
}) {
  const disabled = rows.length === 0;

  function csv() {
    if (disabled) return toast.error(labels.empty);
    downloadCsv(filename, columns, rows);
    logAction("export.csv", entity, null, { rows: rows.length });
  }

  function pdf() {
    if (disabled) return toast.error(labels.empty);
    const ok = printPdf({ title, subtitle, columns, rows, footer });
    if (!ok) return toast.error("Pop-up blocked");
    logAction("export.pdf", entity, null, { rows: rows.length });
  }

  const cls =
    "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={csv} disabled={disabled} className={cls}>
        <Download className="h-4 w-4" /> {labels.csv}
      </button>
      <button onClick={pdf} disabled={disabled} className={cls}>
        <FileText className="h-4 w-4" /> {labels.pdf}
      </button>
    </div>
  );
}
