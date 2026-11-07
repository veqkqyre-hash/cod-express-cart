import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, RefreshCw, ExternalLink, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEO_DOMAIN, SEO_KEY, SEO_PAGES, canonicalFor, productGaps, validateSeo, type SeoEntry, type SeoSettings } from "@/lib/seo";
import type { Json } from "@/integrations/supabase/types";

export function SeoPanel() {
  const queryClient = useQueryClient();
  const [path, setPath] = useState("/");
  const [draft, setDraft] = useState<SeoEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const settings = useQuery({ queryKey: ["admin-seo"], queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", SEO_KEY).maybeSingle();
    if (error) throw error;
    return (data?.value ?? {}) as SeoSettings;
  } });
  const catalog = useQuery({ queryKey: ["admin-seo-catalog"], queryFn: async () => {
    const products = [];
    const posts = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("products").select("id,slug,name_sq,image_url,images,description_sq,description_en,active").order("id").range(offset, offset + 499);
      if (error) throw error;
      products.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("blog_posts").select("slug,title_sq,published").order("id").range(offset, offset + 499);
      if (error) throw error;
      posts.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    return { products, posts };
  } });
  const entry = draft ?? settings.data?.[path] ?? {};
  const change = (key: keyof SeoEntry, value: string | boolean) => setDraft({ ...entry, [key]: value });
  const gaps = (catalog.data?.products ?? []).filter((product) => Object.values(productGaps(product)).some(Boolean));
  async function save() {
    setSaving(true);
    try {
      const checked = validateSeo(path, entry);
      // Merge the latest row so edits to other pages are not overwritten by a stale panel.
      const { data, error: readError } = await supabase.from("site_settings").select("value").eq("key", SEO_KEY).maybeSingle();
      if (readError) throw readError;
      const value = { ...((data?.value ?? {}) as SeoSettings), [path]: checked };
      const { error } = await supabase.from("site_settings").upsert({ key: SEO_KEY, value: value as Json }, { onConflict: "key" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      setDraft(null);
      toast.success("SEO u ruajt. HTML në cPanel përditësohet pas publikimit të radhës nga GitHub.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Ruajtja dështoi."); }
    finally { setSaving(false); }
  }
  function downloadSettings() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(settings.data ?? {}, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "dreame-seo.json"; link.click(); URL.revokeObjectURL(url);
  }
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  if (settings.error || catalog.error) return <div role="alert" className="text-destructive">SEO nuk u ngarkua. <Button variant="outline" onClick={() => { settings.refetch(); catalog.refetch(); }}>Provo përsëri</Button></div>;
  if (settings.isPending || catalog.isPending) return <p className="text-muted-foreground">Duke ngarkuar SEO…</p>;
  return <div className="space-y-8 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">SEO Manager</h2><p className="text-sm text-muted-foreground">{SEO_DOMAIN}</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={downloadSettings}><Download /> Eksporto SEO</Button><Button variant="outline" asChild><a href={`${SEO_DOMAIN}/sitemap.xml`} target="_blank" rel="noreferrer"><ExternalLink /> Sitemap</a></Button></div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="space-y-4">
        <label className="block space-y-1 text-sm font-medium">Faqja<select aria-label="Faqja SEO" className={input} value={path} onChange={(event) => { setPath(event.target.value); setDraft(null); }}>
          {SEO_PAGES.map((page) => <option key={page}>{page}</option>)}
          {catalog.data?.products.map((product) => <option key={product.id} value={`/product/${product.slug}`}>{product.name_sq} {product.active ? "" : "(joaktiv)"}</option>)}
          {catalog.data?.posts.map((post) => <option key={post.slug} value={`/blog/${post.slug}`}>{post.title_sq} {post.published ? "" : "(draft)"}</option>)}
        </select></label>
        <label className="block space-y-1 text-sm font-medium">Titulli SEO<input aria-label="Titulli SEO" maxLength={120} className={input} value={entry.title ?? ""} onChange={(e) => change("title", e.target.value)} placeholder="Titulli ekzistues i faqes" /><span className="text-xs text-muted-foreground">{entry.title?.length ?? 0} / 120</span></label>
        <label className="block space-y-1 text-sm font-medium">Meta description<textarea aria-label="Meta description" maxLength={320} className={input} rows={3} value={entry.description ?? ""} onChange={(e) => change("description", e.target.value)} /><span className="text-xs text-muted-foreground">{entry.description?.length ?? 0} / 320</span></label>
        <label className="block space-y-1 text-sm font-medium">Canonical URL<input aria-label="Canonical URL" className={input} value={entry.canonical ?? canonicalFor(path)} onChange={(e) => change("canonical", e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium">Open Graph — titulli<input className={input} value={entry.ogTitle ?? ""} onChange={(e) => change("ogTitle", e.target.value)} /></label><label className="space-y-1 text-sm font-medium">Open Graph — përshkrimi<textarea className={input} value={entry.ogDescription ?? ""} onChange={(e) => change("ogDescription", e.target.value)} /></label></div>
        <label className="block space-y-1 text-sm font-medium">Open Graph — foto (1200 × 630)<input className={input} type="url" value={entry.image ?? ""} onChange={(e) => change("image", e.target.value)} placeholder={`${SEO_DOMAIN}/…`} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={entry.sitemap !== false} onChange={(e) => change("sitemap", e.target.checked)} /> Përfshi në sitemap</label>
        <Button disabled={saving} onClick={save}><Save /> {saving ? "Duke ruajtur…" : "Ruaj SEO"}</Button>
      </section>
      <aside className="space-y-4 min-w-0"><h3 className="text-sm font-semibold">Pamja në kërkim</h3><div className="rounded-md border border-border bg-background p-4 break-words"><p className="text-xs text-muted-foreground">{canonicalFor(path)}</p><p className="mt-2 text-lg text-primary">{entry.title || "Dreame Beauty Cosmetics"}</p><p className="mt-2 text-sm text-muted-foreground">{entry.description || "Përshkrimi ekzistues i faqes"}</p></div><div className="border-l-2 border-primary pl-4 text-sm"><p className="font-medium">cPanel: pret publikimin nga GitHub</p><p className="mt-1 text-muted-foreground">Ruajtja nuk ndryshon menjëherë HTML-në e publikuar. Sitemap-i dhe titujt eksportohen gjatë publikimit.</p></div></aside>
    </div>
    <section className="border-t border-border pt-6 space-y-4"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">Produkte pa foto ose përshkrim · {gaps.length}</h3><Button variant="outline" onClick={() => catalog.refetch()}><RefreshCw /> Kontrollo përsëri</Button></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="Kërko produktin" className={`${input} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kërko produktin" /></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="p-3">Produkti</th><th>Foto</th><th>Përshkrimi SQ</th><th>Përshkrimi EN</th><th>SEO</th></tr></thead><tbody>{gaps.filter((p) => p.name_sq.toLowerCase().includes(search.toLowerCase())).map((product) => { const gap = productGaps(product); return <tr key={product.id} className="border-t border-border"><td className="p-3">{product.name_sq}</td><td>{gap.image ? "Mungon" : "✓"}</td><td>{gap.sq ? "Mungon" : "✓"}</td><td>{gap.en ? "Mungon" : "✓"}</td><td><Button variant="ghost" onClick={() => { setPath(`/product/${product.slug}`); setDraft(null); window.scrollTo(0, 0); }}>Hap SEO</Button></td></tr>; })}</tbody></table></div>
      {!gaps.length && <p className="text-muted-foreground">Të gjitha produktet kanë foto dhe përshkrime në të dyja gjuhët.</p>}
    </section>
  </div>;
}