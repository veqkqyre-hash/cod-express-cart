import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Pencil, Trash2, Mail, MailOpen } from "lucide-react";
import { AddButton, Check, Empty, Field, FormActions, Modal, Panel, TextArea } from "@/components/admin-ui";
import { ImageUploadField } from "@/components/admin-image-field";
import { loadBusinessInfo } from "@/lib/store-info";


function useL() {
  const { lang } = useI18n();
  return {
    lang,
    L: (sq: string, en: string) => (lang === "sq" ? sq : en),
  };
}

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm";

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ------------------------------- CATALOG ------------------------------- */

export function CatalogPanel() {
  const { lang, L } = useL();
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: categories, refetch } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-category-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("category_id");
      const map: Record<string, number> = {};
      (data ?? []).forEach((p: any) => { if (p.category_id) map[p.category_id] = (map[p.category_id] ?? 0) + 1; });
      return map;
    },
  });

  async function onDelete(id: string) {
    if (!confirm(L("Fshij këtë kategori?", "Delete this category?"))) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L("U fshi", "Deleted"));
    refetch();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEn = String(fd.get("name_en") || "").trim();
    const payload = {
      name_sq: String(fd.get("name_sq") || "").trim(),
      name_en: nameEn,
      slug: slugify(String(fd.get("slug") || "") || nameEn),
      image_url: String(fd.get("image_url") || "") || null,
      sort_order: Number(fd.get("sort_order") || 0),
    };
    if (!payload.name_sq || !payload.name_en) return toast.error(L("Plotësoni emrat", "Fill the names"));
    const { error } = editing && editing !== "new"
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L("U ruajt", "Saved"));
    setEditing(null);
    refetch();
  }

  const cat = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <AddButton label={L("Shto kategori", "Add category")} onClick={() => setEditing("new")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((c: any) => (
          <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg">{lang === "sq" ? c.name_sq : c.name_en}</div>
                <div className="mt-1 text-xs text-neutral-500">/{c.slug} · {counts?.[c.id] ?? 0} {L("produkte", "products")}</div>
              </div>
              <div className="flex shrink-0">
                <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(c.id)} className="grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={cat ? L("Modifiko kategorinë", "Edit category") : L("Shto kategori", "Add category")} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Emri (SQ)", "Name (SQ)")} name="name_sq" defaultValue={cat?.name_sq} required />
              <Field label={L("Emri (EN)", "Name (EN)")} name="name_en" defaultValue={cat?.name_en} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" name="slug" defaultValue={cat?.slug} />
              <Field label={L("Radhitja", "Sort order")} name="sort_order" type="number" defaultValue={cat?.sort_order ?? 0} />
            </div>
            <ImageUploadField label={L("Foto", "Image")} name="image_url" defaultValue={cat?.image_url} folder="categories" />
            <FormActions cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ MARKETING ------------------------------ */

export function MarketingPanel() {
  const { L } = useL();
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: coupons, refetch } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onDelete(id: string) {
    if (!confirm(L("Fshij kuponin?", "Delete coupon?"))) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") || "").trim().toUpperCase(),
      discount_type: String(fd.get("discount_type") || "percent"),
      discount_value: Number(fd.get("discount_value") || 0),
      min_order: Number(fd.get("min_order") || 0),
      expires_at: String(fd.get("expires_at") || "") ? new Date(String(fd.get("expires_at"))).toISOString() : null,
      active: fd.get("active") === "on",
    };
    if (!payload.code) return toast.error(L("Shkruani kodin", "Enter a code"));
    const { error } = editing && editing !== "new"
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L("U ruajt", "Saved"));
    setEditing(null);
    refetch();
  }

  const c = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <AddButton label={L("Shto kupon", "Add coupon")} onClick={() => setEditing("new")} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">{L("Kodi", "Code")}</th>
                <th className="px-4 py-3">{L("Zbritja", "Discount")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{L("Min. porosia", "Min. order")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{L("Skadon", "Expires")}</th>
                <th className="px-4 py-3">{L("Aktiv", "Active")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(coupons ?? []).map((x: any) => (
                <tr key={x.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{x.code}</td>
                  <td className="px-4 py-3">{x.discount_type === "percent" ? `${x.discount_value}%` : formatEur(Number(x.discount_value))}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{formatEur(Number(x.min_order))}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{x.expires_at ? new Date(x.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">{x.active ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(x)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100 inline-grid"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(x.id)} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {coupons && coupons.length === 0 && (
                <tr><td colSpan={6}><Empty label={L("Asnjë kupon", "No coupons")} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal title={c ? L("Modifiko kuponin", "Edit coupon") : L("Shto kupon", "Add coupon")} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Kodi", "Code")} name="code" defaultValue={c?.code} required />
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Tipi", "Type")}</label>
                <select name="discount_type" defaultValue={c?.discount_type ?? "percent"} className={inputCls}>
                  <option value="percent">%</option>
                  <option value="fixed">€</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={L("Vlera", "Value")} name="discount_value" type="number" step="0.01" defaultValue={c?.discount_value ?? 0} />
              <Field label={L("Min. porosia (€)", "Min. order (€)")} name="min_order" type="number" step="0.01" defaultValue={c?.min_order ?? 0} />
              <Field label={L("Skadon", "Expires")} name="expires_at" type="date" defaultValue={c?.expires_at ? String(c.expires_at).slice(0, 10) : ""} />
            </div>
            <Check label={L("Aktiv", "Active")} name="active" defaultChecked={c ? c.active : true} />
            <FormActions cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ HOMEPAGE ------------------------------- */

export function HomepagePanel() {
  const { lang, L } = useL();
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: slides, refetch } = useQuery({
    queryKey: ["admin-slides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("homepage_slides").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onDelete(id: string) {
    if (!confirm(L("Fshij sllajdin?", "Delete slide?"))) return;
    const { error } = await supabase.from("homepage_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title_sq: String(fd.get("title_sq") || ""),
      title_en: String(fd.get("title_en") || ""),
      subtitle_sq: String(fd.get("subtitle_sq") || "") || null,
      subtitle_en: String(fd.get("subtitle_en") || "") || null,
      image_url: String(fd.get("image_url") || "") || null,
      link_url: String(fd.get("link_url") || "") || null,
      sort_order: Number(fd.get("sort_order") || 0),
      active: fd.get("active") === "on",
    };
    const { error } = editing && editing !== "new"
      ? await supabase.from("homepage_slides").update(payload).eq("id", editing.id)
      : await supabase.from("homepage_slides").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L("U ruajt", "Saved"));
    setEditing(null);
    refetch();
  }

  const s = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <AddButton label={L("Shto sllajd", "Add slide")} onClick={() => setEditing("new")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(slides ?? []).map((x: any) => (
          <div key={x.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {x.image_url
              ? <img src={x.image_url} alt="" className="h-32 w-full object-cover" />
              : <div className="h-32 w-full bg-neutral-100" />}
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <div className="font-medium">{lang === "sq" ? x.title_sq : x.title_en}</div>
                <div className="text-xs text-neutral-500">#{x.sort_order} · {x.active ? L("aktiv", "active") : L("fshehur", "hidden")}</div>
              </div>
              <div className="flex shrink-0">
                <button onClick={() => setEditing(x)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(x.id)} className="grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {slides && slides.length === 0 && <Empty label={L("Asnjë sllajd", "No slides")} />}
      </div>

      {editing && (
        <Modal title={s ? L("Modifiko sllajdin", "Edit slide") : L("Shto sllajd", "Add slide")} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Titulli (SQ)", "Title (SQ)")} name="title_sq" defaultValue={s?.title_sq} required />
              <Field label={L("Titulli (EN)", "Title (EN)")} name="title_en" defaultValue={s?.title_en} required />
            </div>
            <TextArea label={L("Nëntitulli (SQ)", "Subtitle (SQ)")} name="subtitle_sq" defaultValue={s?.subtitle_sq} rows={2} />
            <TextArea label={L("Nëntitulli (EN)", "Subtitle (EN)")} name="subtitle_en" defaultValue={s?.subtitle_en} rows={2} />
            <ImageUploadField label={L("Foto", "Image")} name="image_url" defaultValue={s?.image_url} folder="slides" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Linku", "Link")} name="link_url" defaultValue={s?.link_url ?? "/shop"} />
              <Field label={L("Radhitja", "Sort order")} name="sort_order" type="number" defaultValue={s?.sort_order ?? 0} />
            </div>
            <Check label={L("Aktiv", "Active")} name="active" defaultChecked={s ? s.active : true} />
            <FormActions cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- BLOG -------------------------------- */

export function BlogPanel() {
  const { lang, L } = useL();
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: posts, refetch } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onDelete(id: string) {
    if (!confirm(L("Fshij artikullin?", "Delete post?"))) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const titleEn = String(fd.get("title_en") || "").trim();
    const payload = {
      title_sq: String(fd.get("title_sq") || "").trim(),
      title_en: titleEn,
      slug: slugify(String(fd.get("slug") || "") || titleEn),
      excerpt_sq: String(fd.get("excerpt_sq") || "") || null,
      excerpt_en: String(fd.get("excerpt_en") || "") || null,
      content_sq: String(fd.get("content_sq") || "") || null,
      content_en: String(fd.get("content_en") || "") || null,
      cover_image: String(fd.get("cover_image") || "") || null,
      published: fd.get("published") === "on",
    };
    if (!payload.title_sq || !payload.title_en) return toast.error(L("Plotësoni titullin", "Fill the title"));
    const { error } = editing && editing !== "new"
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L("U ruajt", "Saved"));
    setEditing(null);
    refetch();
  }

  const p = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <AddButton label={L("Shto artikull", "Add post")} onClick={() => setEditing("new")} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">{L("Titulli", "Title")}</th>
                <th className="px-4 py-3 hidden md:table-cell">Slug</th>
                <th className="px-4 py-3">{L("Publikuar", "Published")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).map((x: any) => (
                <tr key={x.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{lang === "sq" ? x.title_sq : x.title_en}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500">/{x.slug}</td>
                  <td className="px-4 py-3">{x.published ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(x)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(x.id)} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {posts && posts.length === 0 && <tr><td colSpan={4}><Empty label={L("Asnjë artikull", "No posts")} /></td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal title={p ? L("Modifiko artikullin", "Edit post") : L("Shto artikull", "Add post")} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Titulli (SQ)", "Title (SQ)")} name="title_sq" defaultValue={p?.title_sq} required />
              <Field label={L("Titulli (EN)", "Title (EN)")} name="title_en" defaultValue={p?.title_en} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" name="slug" defaultValue={p?.slug ?? ""} />
              <ImageUploadField label={L("Foto kryesore", "Cover image")} name="cover_image" defaultValue={p?.cover_image} folder="blog" />
            </div>
            <TextArea label={L("Përmbledhja (SQ)", "Excerpt (SQ)")} name="excerpt_sq" defaultValue={p?.excerpt_sq} rows={2} />
            <TextArea label={L("Përmbledhja (EN)", "Excerpt (EN)")} name="excerpt_en" defaultValue={p?.excerpt_en} rows={2} />
            <TextArea label={L("Përmbajtja (SQ)", "Content (SQ)")} name="content_sq" defaultValue={p?.content_sq} rows={6} />
            <TextArea label={L("Përmbajtja (EN)", "Content (EN)")} name="content_en" defaultValue={p?.content_en} rows={6} />
            <Check label={L("Publikuar", "Published")} name="published" defaultChecked={p?.published ?? false} />
            <FormActions cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- MESSAGES ------------------------------ */

export function MessagesPanel() {
  const { L } = useL();
  const [open, setOpen] = useState<any | null>(null);

  const { data: messages, refetch } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function toggleRead(m: any) {
    const { error } = await supabase.from("messages").update({ read: !m.read }).eq("id", m.id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function onDelete(id: string) {
    if (!confirm(L("Fshij mesazhin?", "Delete message?"))) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setOpen(null);
    refetch();
  }

  return (
    <div>
      <Panel>
        <div className="divide-y divide-neutral-100">
          {(messages ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <button onClick={() => toggleRead(m)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-neutral-100">
                {m.read ? <MailOpen className="h-4 w-4 text-neutral-400" /> : <Mail className="h-4 w-4 text-[var(--pink-deep,#e91e63)]" />}
              </button>
              <button onClick={() => setOpen(m)} className="flex-1 text-left">
                <div className={m.read ? "font-normal" : "font-semibold"}>{m.name} · {m.subject || L("Pa subjekt", "No subject")}</div>
                <div className="truncate text-xs text-neutral-500">{m.email || m.phone} · {new Date(m.created_at).toLocaleString()}</div>
              </button>
              <button onClick={() => onDelete(m.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {messages && messages.length === 0 && <Empty label={L("Asnjë mesazh", "No messages")} />}
        </div>
      </Panel>

      {open && (
        <Modal title={open.subject || L("Mesazh", "Message")} onClose={() => setOpen(null)}>
          <div className="space-y-3 p-6 text-sm">
            <div className="text-neutral-500">{open.name} · {open.email || "—"} · {open.phone || "—"}</div>
            <p className="whitespace-pre-wrap">{open.body}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- SHIPPING ------------------------------ */

export function ShippingPanel() {
  const { L } = useL();
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: rates, refetch } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_rates").select("*").order("zone");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onDelete(id: string) {
    if (!confirm(L("Fshij tarifën?", "Delete rate?"))) return;
    const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const freeOver = String(fd.get("free_over") || "");
    const payload = {
      zone: String(fd.get("zone") || "").trim(),
      fee: Number(fd.get("fee") || 0),
      free_over: freeOver ? Number(freeOver) : null,
      active: fd.get("active") === "on",
    };
    if (!payload.zone) return toast.error(L("Shkruani zonën", "Enter a zone"));
    const { error } = editing && editing !== "new"
      ? await supabase.from("shipping_rates").update(payload).eq("id", editing.id)
      : await supabase.from("shipping_rates").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L("U ruajt", "Saved"));
    setEditing(null);
    refetch();
  }

  const r = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <AddButton label={L("Shto tarifë", "Add rate")} onClick={() => setEditing("new")} />
      <Panel>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">{L("Zona / Qyteti", "Zone / City")}</th>
              <th className="px-4 py-3">{L("Tarifa", "Fee")}</th>
              <th className="px-4 py-3 hidden md:table-cell">{L("Falas mbi", "Free over")}</th>
              <th className="px-4 py-3">{L("Aktiv", "Active")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(rates ?? []).map((x: any) => (
              <tr key={x.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{x.zone}</td>
                <td className="px-4 py-3">{formatEur(Number(x.fee))}</td>
                <td className="px-4 py-3 hidden md:table-cell">{x.free_over ? formatEur(Number(x.free_over)) : "—"}</td>
                <td className="px-4 py-3">{x.active ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(x)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(x.id)} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {rates && rates.length === 0 && <tr><td colSpan={5}><Empty label={L("Asnjë tarifë", "No rates")} /></td></tr>}
          </tbody>
        </table>
      </Panel>

      {editing && (
        <Modal title={r ? L("Modifiko tarifën", "Edit rate") : L("Shto tarifë", "Add rate")} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-4 p-6">
            <Field label={L("Zona / Qyteti", "Zone / City")} name="zone" defaultValue={r?.zone} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Tarifa (€)", "Fee (€)")} name="fee" type="number" step="0.01" defaultValue={r?.fee ?? 0} />
              <Field label={L("Transport falas mbi (€)", "Free over (€)")} name="free_over" type="number" step="0.01" defaultValue={r?.free_over ?? ""} />
            </div>
            <Check label={L("Aktiv", "Active")} name="active" defaultChecked={r ? r.active : true} />
            <FormActions cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- SETTINGS ------------------------------ */

const SETTINGS_KEY = "store";

export function SettingsPanel() {
  const { L } = useL();
  const [saving, setSaving] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", SETTINGS_KEY).maybeSingle();
      return (data?.value ?? {}) as Record<string, any>;
    },
  });

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value = {
      ...(data ?? {}),
      business_name: String(fd.get("business_name") || ""),
      store_name: String(fd.get("business_name") || ""),
      nui: String(fd.get("nui") || ""),
      vat_number: String(fd.get("vat_number") || ""),
      city: String(fd.get("city") || ""),
      logo_url: String(fd.get("logo_url") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
      instagram: String(fd.get("instagram") || ""),
      facebook: String(fd.get("facebook") || ""),
      shipping_fee: Number(fd.get("shipping_fee") || 0),
      free_shipping_over: Number(fd.get("free_shipping_over") || 0),
      announcement_sq: String(fd.get("announcement_sq") || ""),
      announcement_en: String(fd.get("announcement_en") || ""),
    };
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ key: SETTINGS_KEY, value }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    await loadBusinessInfo();
    toast.success(L("Cilësimet u ruajtën", "Settings saved"));
    refetch();
  }

  return (
    <Panel>
      <form onSubmit={onSave} className="space-y-4 p-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {L("Të dhënat e biznesit", "Business details")}
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            {L("Këto të dhëna printohen automatikisht në faturat e arkës.", "These details are printed automatically on POS receipts.")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("Emri i biznesit", "Business name")} name="business_name" defaultValue={data?.business_name ?? data?.store_name ?? "Dreame Beauty Cosmetics"} />
          <Field label={L("NUI / Numri fiskal", "Business / fiscal number")} name="nui" defaultValue={data?.nui ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("Numri i TVSH-së (nëse aplikohet)", "VAT number (if applicable)")} name="vat_number" defaultValue={data?.vat_number ?? ""} />
          <Field label={L("Qyteti", "City")} name="city" defaultValue={data?.city ?? "Fushë Kosovë 12000, Kosovë"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("Adresa", "Address")} name="address" defaultValue={data?.address ?? "Rr. Nëna Terezë"} />
          <ImageUploadField label={L("Logoja", "Logo")} name="logo_url" defaultValue={data?.logo_url ?? ""} folder="logo" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("Telefoni", "Phone")} name="phone" defaultValue={data?.phone ?? ""} />
          <Field label="Email" name="email" defaultValue={data?.email ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" name="instagram" defaultValue={data?.instagram ?? ""} />
          <Field label="Facebook" name="facebook" defaultValue={data?.facebook ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("Tarifa e transportit (€)", "Shipping fee (€)")} name="shipping_fee" type="number" step="0.01" defaultValue={data?.shipping_fee ?? 0} />
          <Field label={L("Transport falas mbi (€)", "Free shipping over (€)")} name="free_shipping_over" type="number" step="0.01" defaultValue={data?.free_shipping_over ?? 0} />
        </div>
        <TextArea label={L("Shiriti i lajmërimeve (SQ)", "Announcement bar (SQ)")} name="announcement_sq" defaultValue={data?.announcement_sq ?? ""} rows={2} />
        <TextArea label={L("Shiriti i lajmërimeve (EN)", "Announcement bar (EN)")} name="announcement_en" defaultValue={data?.announcement_en ?? ""} rows={2} />
        <div className="flex justify-end">
          <button disabled={saving} className="rounded-full bg-[var(--pink-deep,#e91e63)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "…" : L("Ruaj", "Save")}
          </button>
        </div>
      </form>
    </Panel>
  );
}
