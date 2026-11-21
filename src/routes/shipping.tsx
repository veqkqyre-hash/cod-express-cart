import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";
import { useInfoPage, INFO_DEFAULTS } from "@/lib/info-content";

export const Route = createFileRoute("/shipping")({
  loader: () => loadSeo("/shipping"),
  component: Shipping,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, metaFor("/shipping", INFO_DEFAULTS.shipping.title_sq, INFO_DEFAULTS.shipping.meta_sq)),
});

function Shipping() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const page = useInfoPage("shipping");

  return (
    <InfoPage
      title={lang === "sq" ? page.title_sq : page.title_en}
      intro={lang === "sq" ? page.intro_sq : page.intro_en}
    >
      <InfoBlock heading={L("Tarifat sipas shtetit", "Shipping by country")}>
        <div className="space-y-2 text-sm">
          <p>{L("Kosovë: 2 € për porosi nën 50 €. Nga 50 € e lart, transporti është falas.", "Kosovo: €2 for orders below €50. Free shipping from €50.")}</p>
          <p>{L("Shqipëri: 5 € për çdo porosi.", "Albania: €5 for every order.")}</p>
          <p>{L("Maqedoni e Veriut: 5 € për çdo porosi.", "North Macedonia: €5 for every order.")}</p>
        </div>
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
