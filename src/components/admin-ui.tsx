import type { ReactNode } from "react";
import { X, Plus } from "lucide-react";

export function Field({
  label, name, type = "text", defaultValue, required, step, placeholder,
}: {
  label: string; name: string; type?: string; defaultValue?: string | number | null;
  required?: boolean; step?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

export function TextArea({
  label, name, defaultValue, rows = 3,
}: { label: string; name: string; defaultValue?: string | null; rows?: number }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-background shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep,#e91e63)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}

export function FormActions({ saving, cancelLabel, saveLabel, onCancel }: {
  saving?: boolean; cancelLabel: string; saveLabel: string; onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">
        {cancelLabel}
      </button>
      <button
        disabled={saving}
        className="rounded-full bg-[var(--pink-deep,#e91e63)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "…" : saveLabel}
      </button>
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">{children}</div>;
}

export function Empty({ label }: { label: string }) {
  return <div className="px-5 py-10 text-center text-sm text-neutral-500">{label}</div>;
}
