import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { metaFor } from "@/components/info-page";
import { CalendarDays, ArrowRight, Newspaper } from "lucide-react";

export const Route = createFileRoute("/blog")({
  component: Blog,
  head: () => metaFor("/blog", "Blogu", "Këshilla profesionale për sallone bukurie, trendet e flokëve, grimit dhe thonjve — Dream Studio."),
});

function Blog() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug,title_sq,title_en,excerpt_sq,excerpt_en,cover_image,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const posts = data ?? [];

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-5xl">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--pink-deep)]">
          {L("Magazina", "Magazine")}
        </span>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{L("Blogu", "Blog")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {L("Këshilla, trende dhe udhëzues profesional për sallonin tuaj.", "Tips, trends and professional guides for your salon.")}
        </p>

        {isLoading && <div className="mt-12 text-center text-muted-foreground">…</div>}

        {!isLoading && posts.length === 0 && (
          <div className="mt-12 rounded-2xl border border-border bg-card p-14 text-center shadow-soft">
            <Newspaper className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{L("Së shpejti artikuj të rinj.", "New articles coming soon.")}</p>
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elev"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt={lang === "sq" ? p.title_sq : p.title_en}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><Newspaper className="h-6 w-6" /></div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(p.created_at).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB")}
                </div>
                <h2 className="mt-2 font-display text-lg leading-snug">{lang === "sq" ? p.title_sq : p.title_en}</h2>
                {(lang === "sq" ? p.excerpt_sq : p.excerpt_en) && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{lang === "sq" ? p.excerpt_sq : p.excerpt_en}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pink-deep)]">
                  {L("Lexo më shumë", "Read more")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
