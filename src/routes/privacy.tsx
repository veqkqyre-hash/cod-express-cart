import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => metaFor("/privacy", "Privatësia", "Si mbledhim dhe mbrojmë të dhënat tuaja personale — Dream Studio."),
});

function Privacy() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  return (
    <InfoPage
      title={L("Politika e privatësisë", "Privacy policy")}
      intro={L("Të dhënat tuaja përdoren vetëm për përpunimin e porosive.", "Your data is used only to process your orders.")}
    >
      <InfoBlock heading={L("Çfarë mbledhim", "What we collect")}>
        <p>{L("Emrin, numrin e telefonit, email-in, adresën e dërgesës dhe historikun e porosive. Mbledhim edhe statistika anonime të vizitave (faqe, pajisje, shtet) për të përmirësuar dyqanin.", "Name, phone number, email, delivery address and order history. We also collect anonymous visit statistics (page, device, country) to improve the store.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Si i përdorim", "How we use it")}>
        <p>{L("Vetëm për konfirmimin, dërgimin dhe mbështetjen e porosive tuaja. Nuk shitet dhe nuk ndahet me palë të treta për marketing.", "Only to confirm, deliver and support your orders. We never sell or share it with third parties for marketing.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Ruajtja & siguria", "Storage & security")}>
        <p>{L("Të dhënat ruhen në serverë të sigurt me akses të kufizuar vetëm për personelin e autorizuar.", "Data is stored on secure servers with access limited to authorized staff only.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Të drejtat tuaja", "Your rights")}>
        <p>{L("Mund të kërkoni në çdo kohë qasje, korrigjim ose fshirje të të dhënave tuaja në hello@dreamstudio-ks.com.", "You may request access, correction or deletion of your data at any time at hello@dreamstudio-ks.com.")}</p>
      </InfoBlock>
    </InfoPage>
  );
}
