import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Panel } from "@/components/admin-ui";
import { logAction } from "@/lib/audit";
import {
  INFO_DEFAULTS, INFO_LABELS, INFO_SETTINGS_KEY, INFO_SLUGS,
  type InfoPageData, type InfoSlug,
} from "@/lib/info-content";

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function PagesPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [slug, setSlug] = useState<InfoSlug>("faq");
  const [draft, setDraft] = useState<InfoPageData | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: all, refetch } = useQuery({
    queryKey: ["info-pages-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", INFO_SETTINGS_KEY).maybeSingle();
      return (data?.value ?? {}) as Partial<Record<InfoSlug, InfoPageData>>;
    },
  });

  useEffect(() => {
    if (!all) return;
    const saved = all[slug];
    setDraft(saved ? { ...INFO_DEFAULTS[slug], ...saved, blocks: saved.blocks ?? INFO_DEFAULTS[slug].blocks } : INFO_DEFAULTS[slug]);
  }, [all, slug]);

  function patch(p: Partial<InfoPageData>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function patchBlock(i: number, p: Partial<InfoPageData["blocks"][number]>) {
    setDraft((d) => (d ? { ...d, blocks: d.blocks.map((b, idx) => (idx === i ? { ...b, ...p } : b)) } : d));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    const value = { ...(all ?? {}), [slug]: draft };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: INFO_SETTINGS_KEY, value: value as never }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(L("Faqja u ruajt", "Page saved"));
    logAction("page.updated", "site_settings", slug, { page: slug });
    refetch();
  }

  const isFaq = slug === "faq";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INFO_SLUGS.map((s) => (
          <button
            key={s}
            onClick={() => setSlug(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              slug === s
                ? "bg-[var(--pink-deep,#e91e63)] text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {L(INFO_LABELS[s].sq, INFO_LABELS[s].en)}
          </button>
        ))}
      </div>

      <Panel>
        {!draft ? (
          <div className="p-8 text-center text-sm text-neutral-500">…</div>
        ) : (
          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">
                {L("Modifiko përmbajtjen e faqes publike", "Edit the public page content")} · <code>/{slug}</code>
              </p>
              <a href={`/${slug}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--pink-deep,#e91e63)] hover:underline">
                {L("Shiko faqen", "View page")}
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Titulli (SQ)", "Title (SQ)")}</label>
                <input className={inputCls} value={draft.title_sq} onChange={(e) => patch({ title_sq: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Titulli (EN)", "Title (EN)")}</label>
                <input className={inputCls} value={draft.title_en} onChange={(e) => patch({ title_en: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Hyrja (SQ)", "Intro (SQ)")}</label>
                <textarea rows={2} className={inputCls} value={draft.intro_sq} onChange={(e) => patch({ intro_sq: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Hyrja (EN)", "Intro (EN)")}</label>
                <textarea rows={2} className={inputCls} value={draft.intro_en} onChange={(e) => patch({ intro_en: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">{L("Përshkrimi SEO", "SEO description")}</label>
              <textarea rows={2} className={inputCls} value={draft.meta_sq} onChange={(e) => patch({ meta_sq: e.target.value })} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {isFaq ? L("Pyetjet & përgjigjet", "Questions & answers") : L("Seksionet", "Sections")}
                </h3>
                <button
                  onClick={() => patch({ blocks: [...draft.blocks, { h_sq: "", h_en: "", b_sq: "", b_en: "" }] })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                >
                  <Plus className="h-3.5 w-3.5" /> {L("Shto", "Add")}
                </button>
              </div>

              {draft.blocks.map((b, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">#{i + 1}</span>
                    <button
                      onClick={() => patch({ blocks: draft.blocks.filter((_, idx) => idx !== i) })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      title={L("Fshij", "Delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputCls}
                      placeholder={isFaq ? L("Pyetja (SQ)", "Question (SQ)") : L("Titulli (SQ)", "Heading (SQ)")}
                      value={b.h_sq}
                      onChange={(e) => patchBlock(i, { h_sq: e.target.value })}
                    />
                    <input
                      className={inputCls}
                      placeholder={isFaq ? L("Pyetja (EN)", "Question (EN)") : L("Titulli (EN)", "Heading (EN)")}
                      value={b.h_en}
                      onChange={(e) => patchBlock(i, { h_en: e.target.value })}
                    />
                    <textarea
                      rows={3}
                      className={inputCls}
                      placeholder={isFaq ? L("Përgjigja (SQ)", "Answer (SQ)") : L("Teksti (SQ)", "Text (SQ)")}
                      value={b.b_sq}
                      onChange={(e) => patchBlock(i, { b_sq: e.target.value })}
                    />
                    <textarea
                      rows={3}
                      className={inputCls}
                      placeholder={isFaq ? L("Përgjigja (EN)", "Answer (EN)") : L("Teksti (EN)", "Text (EN)")}
                      value={b.b_en}
                      onChange={(e) => patchBlock(i, { b_en: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={() => setDraft(INFO_DEFAULTS[slug])}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2 text-sm hover:bg-neutral-50"
              >
                <RotateCcw className="h-4 w-4" /> {L("Rikthe origjinalin", "Reset to default")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-[var(--pink-deep,#e91e63)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "…" : L("Ruaj", "Save")}
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
