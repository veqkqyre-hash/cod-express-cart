import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: Post,
  head: ({ params }) => {
    const url = `https://cod-express-cart.lovable.app/blog/${params.slug}`;
    const title = "Artikull — Dreame Beauty Cosmetics";
    const desc = "Këshilla dhe trende profesionale për sallone bukurie nga Dreame Beauty Cosmetics";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});

function Post() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);

  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;

  if (!data) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl">{L("Artikulli nuk u gjet", "Article not found")}</h1>
        <Link to="/blog" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          {L("Kthehu në blog", "Back to blog")}
        </Link>
      </div>
    );
  }

  const title = lang === "sq" ? data.title_sq : data.title_en;
  const content = (lang === "sq" ? data.content_sq : data.content_en) ?? "";

  return (
    <article className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {L("Blogu", "Blog")}
        </Link>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">{title}</h1>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(data.created_at).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB")}
        </div>
        {data.cover_image && (
          <img src={data.cover_image} alt={title} className="mt-8 w-full rounded-2xl object-cover shadow-soft" />
        )}
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {content.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
