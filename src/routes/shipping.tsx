import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";
import { useInfoPage, INFO_DEFAULTS } from "@/lib/info-content";
import { formatEur } from "@/lib/cart";

export const Route = createFileRoute("/shipping")({
  loader: () => loadSeo("/shipping"),
  component: Shipping,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, metaFor("/shipping", INFO_DEFAULTS.shipping.title_sq, INFO_DEFAULTS.shipping.meta_sq)),
});

function Shipping() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const page = useInfoPage("shipping");

  const { data } = useQuery({
    queryKey: ["shipping-rates-public"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_rates").select("*").eq("active", true).order("fee");
      return data ?? [];
    },
  });

  const rates = data ?? [];

  return (
    <InfoPage
      title={lang === "sq" ? page.title_sq : page.title_en}
      intro={lang === "sq" ? page.intro_sq : page.intro_en}
    >
      <InfoBlock heading={L("Tarifat", "Rates")}>
        {rates.length === 0 ? (
          <p>{L("Transport falas për porosi mbi 50€. Nën këtë vlerë tarifa standarde është 2.00 €.", "Free shipping over €50. Below that a standard €2.00 fee applies.")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">{L("Zona", "Zone")}</th><th className="py-2">{L("Tarifa", "Fee")}</th><th className="py-2">{L("Falas mbi", "Free over")}</th></tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="py-2 text-foreground">{r.zone}</td>
                  <td className="py-2">{Number(r.fee) === 0 ? L("Falas", "Free") : formatEur(Number(r.fee))}</td>
                  <td className="py-2">{r.free_over ? formatEur(Number(r.free_over)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </InfoBlock>

      {page.blocks.map((b, i) => (
        <InfoBlock key={i} heading={lang === "sq" ? b.h_sq : b.h_en}>
          <p className="whitespace-pre-line">{lang === "sq" ? b.b_sq : b.b_en}</p>
        </InfoBlock>
      ))}

      <p className="text-sm">
        <Link to="/faq" className="text-[var(--pink-deep)] hover:underline">{L("Shiko pyetjet e shpeshta", "See the FAQ")}</Link>
      </p>
    </InfoPage>
  );
}
