import type { ReactNode } from "react";

export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl tracking-tight">{title}</h1>
        {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function InfoBlock({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl">{heading}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function metaFor(path: string, titleSq: string, descSq: string) {
  const url = `https://cod-express-cart.lovable.app${path}`;
  const title = `${titleSq} — Dreame Beauty Cosmetics`;
  return {
    meta: [
      { title },
      { name: "description", content: descSq },
      { property: "og:title", content: title },
      { property: "og:description", content: descSq },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: descSq },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
