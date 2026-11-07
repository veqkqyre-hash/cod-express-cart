import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";
import { useInfoPage, INFO_DEFAULTS } from "@/lib/info-content";

export const Route = createFileRoute("/terms")({
  loader: () => loadSeo("/terms"),
  component: Terms,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, metaFor("/terms", INFO_DEFAULTS.terms.title_sq, INFO_DEFAULTS.terms.meta_sq)),
});

function Terms() {
  const { lang } = useI18n();
  const page = useInfoPage("terms");
  return (
    <InfoPage
      title={lang === "sq" ? page.title_sq : page.title_en}
      intro={lang === "sq" ? page.intro_sq : page.intro_en}
    >
      {page.blocks.map((b, i) => (
        <InfoBlock key={i} heading={lang === "sq" ? b.h_sq : b.h_en}>
          <p className="whitespace-pre-line">{lang === "sq" ? b.b_sq : b.b_en}</p>
        </InfoBlock>
      ))}
    </InfoPage>
  );
}
