import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  approved: boolean;
  created_at: string;
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= Math.round(value) ? "fill-[var(--pink-deep)] text-[var(--pink-deep)]" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}

export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,author_name,rating,title,body,approved,created_at")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function ProductReviews({ productId }: { productId: string }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const qc = useQueryClient();
  const { data: reviews } = useReviews(productId);
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const list = (reviews ?? []).filter((r) => r.approved);
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error(L("Kyçu për të lënë vlerësim.", "Sign in to leave a review."));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: userData.user.id,
      author_name: String(fd.get("author_name") || "").trim(),
      rating,
      title: String(fd.get("title") || "").trim() || null,
      body: String(fd.get("body") || "").trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(L("Faleminderit! Vlerësimi pritet të aprovohet.", "Thanks! Your review is awaiting approval."));
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  }

  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">{L("Vlerësimet e klientëve", "Customer reviews")}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={avg} size={16} />
            {list.length > 0 ? (
              <span>
                {avg.toFixed(1)} / 5 · {list.length} {L("vlerësime", "reviews")}
              </span>
            ) : (
              <span>{L("Asnjë vlerësim ende", "No reviews yet")}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-[var(--pink-soft)]"
        >
          {L("Shkruaj vlerësim", "Write a review")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{L("Vlerësimi", "Rating")}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}`}>
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-[var(--pink-deep)] text-[var(--pink-deep)]" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{L("Emri", "Name")}</label>
            <input name="author_name" required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{L("Titulli", "Title")}</label>
            <input name="title" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{L("Komenti", "Comment")}</label>
            <textarea name="body" rows={4} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>
          <button disabled={saving} className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? "…" : L("Dërgo", "Submit")}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-5">
        {list.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{r.author_name}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <div className="mt-1.5"><Stars value={r.rating} /></div>
            {r.title && <div className="mt-2 font-medium">{r.title}</div>}
            {r.body && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
