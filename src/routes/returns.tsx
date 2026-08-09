import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";

export const Route = createFileRoute("/returns")({
  component: Returns,
  head: () => metaFor("/returns", "Kthimet", "Politika e kthimit dhe ndërrimit të produkteve brenda 14 ditësh — Dream Studio."),
});

function Returns() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  return (
    <InfoPage
      title={L("Kthimet & ndërrimet", "Returns & exchanges")}
      intro={L("Nëse nuk jeni i kënaqur, kthimi është i mundur brenda 14 ditësh.", "Not happy with your order? Returns are accepted within 14 days.")}
    >
      <InfoBlock heading={L("Afati", "Timeframe")}>
        <p>{L("Kthimi pranohet brenda 14 ditëve nga data e dorëzimit.", "Returns are accepted within 14 days of delivery.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Kushtet", "Conditions")}>
        <p>{L("Produkti duhet të jetë i pahapur, i papërdorur dhe në paketimin origjinal. Produktet higjienike të hapura (brusha, tehe, kozmetikë e hapur) nuk kthehen.", "Items must be unopened, unused and in original packaging. Opened hygiene items (brushes, blades, opened cosmetics) cannot be returned.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Si të kthej një produkt", "How to return")}>
        <p>{L("1. Shkruani në hello@dreamstudio-ks.com ose telefononi +383 44 123 456 me numrin e porosisë.", "1. Email hello@dreamstudio-ks.com or call +383 44 123 456 with your order number.")}</p>
        <p>{L("2. Ekipi ju konfirmon kthimin dhe organizon marrjen e pakos.", "2. Our team confirms the return and arranges pickup.")}</p>
        <p>{L("3. Rimbursimi bëhet brenda 7 ditëve pune pas pranimit të produktit.", "3. Refund is issued within 7 working days after we receive the item.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Produkt i dëmtuar", "Damaged item")}>
        <p>{L("Nëse produkti arrin i dëmtuar, njoftoni brenda 48 orësh me foto — e zëvendësojmë pa kosto.", "If an item arrives damaged, notify us within 48 hours with photos — we replace it free of charge.")}</p>
      </InfoBlock>
    </InfoPage>
  );
}
