import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => metaFor("/terms", "Kushtet e shërbimit", "Kushtet e blerjes, çmimet, porositë dhe pagesa në dorëzim — Dream Studio."),
});

function Terms() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  return (
    <InfoPage
      title={L("Kushtet e shërbimit", "Terms of service")}
      intro={L("Duke bërë një porosi, pranoni kushtet e mëposhtme.", "By placing an order you accept the following terms.")}
    >
      <InfoBlock heading={L("Porositë", "Orders")}>
        <p>{L("Porosia konsiderohet e vlefshme pas konfirmimit me telefon ose email. Rezervojmë të drejtën të anulojmë porosi me të dhëna të pasakta ose pa stok.", "An order becomes valid after confirmation by phone or email. We may cancel orders with invalid details or unavailable stock.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Çmimet & pagesa", "Prices & payment")}>
        <p>{L("Çmimet janë në euro (€) dhe përfshijnë TVSH. Pagesa e vetme e disponueshme është pagesa në dorëzim (COD) me para në dorë.", "Prices are in euro (€) and include VAT. The only available payment method is cash on delivery (COD).")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Refuzimi i pakos", "Refusing a parcel")}>
        <p>{L("Refuzimi i përsëritur i pakove pa arsye mund të kufizojë porositë e ardhshme me COD.", "Repeatedly refusing parcels without reason may limit future COD orders.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Përgjegjësia", "Liability")}>
        <p>{L("Produktet profesionale duhet të përdoren sipas udhëzimeve të prodhuesit. Nuk mbajmë përgjegjësi për përdorim të gabuar.", "Professional products must be used per manufacturer instructions. We are not liable for misuse.")}</p>
      </InfoBlock>
      <InfoBlock heading={L("Kontakti", "Contact")}>
        <p>Dream Studio · Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com</p>
      </InfoBlock>
    </InfoPage>
  );
}
