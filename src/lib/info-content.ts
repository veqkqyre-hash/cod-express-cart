import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InfoBlockData = { h_sq: string; h_en: string; b_sq: string; b_en: string };
export type InfoPageData = {
  title_sq: string;
  title_en: string;
  intro_sq: string;
  intro_en: string;
  meta_sq: string;
  blocks: InfoBlockData[];
};

export type InfoSlug = "faq" | "shipping" | "returns" | "privacy" | "terms";

export const INFO_SLUGS: InfoSlug[] = ["faq", "shipping", "returns", "privacy", "terms"];

export const INFO_LABELS: Record<InfoSlug, { sq: string; en: string }> = {
  faq: { sq: "Pyetje të shpeshta", en: "FAQ" },
  shipping: { sq: "Transporti", en: "Shipping" },
  returns: { sq: "Kthimet", en: "Returns" },
  privacy: { sq: "Privatësia", en: "Privacy" },
  terms: { sq: "Kushtet", en: "Terms" },
};

export const INFO_SETTINGS_KEY = "info_pages";

export const INFO_DEFAULTS: Record<InfoSlug, InfoPageData> = {
  faq: {
    title_sq: "Pyetje të shpeshta",
    title_en: "Frequently asked questions",
    intro_sq: "",
    intro_en: "",
    meta_sq: "Përgjigje për porositë, pagesën në dorëzim (COD), transportin dhe kthimet — Dream Studio.",
    blocks: [
      {
        h_sq: "Si funksionon pagesa në dorëzim (COD)?",
        h_en: "How does Cash on Delivery work?",
        b_sq: "Porositni online pa paguar asgjë paraprakisht. Paguani me para në dorë kuririn kur produkti arrin në adresën tuaj.",
        b_en: "Order online without paying upfront. You pay the courier in cash when the parcel arrives at your address.",
      },
      {
        h_sq: "Sa kohë zgjat dërgesa?",
        h_en: "How long does delivery take?",
        b_sq: "Brenda Prishtinës 1 ditë pune, në qytetet e tjera të Kosovës 1–2 ditë pune.",
        b_en: "1 working day within Prishtina and 1–2 working days elsewhere in Kosovo.",
      },
      {
        h_sq: "Sa është çmimi i transportit?",
        h_en: "What does shipping cost?",
        b_sq: "Transporti është falas për porosi mbi 50€. Nën këtë vlerë aplikohet tarifa e zonës suaj, e cila shfaqet gjatë përfundimit të porosisë.",
        b_en: "Shipping is free over €50. Below that, your zone fee applies and is shown at checkout.",
      },
      {
        h_sq: "A mund të anuloj porosinë?",
        h_en: "Can I cancel my order?",
        b_sq: "Po. Kontaktoni në +383 44 123 456 ose në WhatsApp para se porosia të dërgohet.",
        b_en: "Yes. Call +383 44 123 456 or message us on WhatsApp before the order ships.",
      },
      {
        h_sq: "Si e ndjek statusin e porosisë?",
        h_en: "How do I track my order?",
        b_sq: "Në faqen e konfirmimit të porosisë shfaqet një timeline me statusin aktual. Të njëjtën gjë e shihni edhe në 'Porositë e Mia'.",
        b_en: "The order confirmation page shows a status timeline. You can also see it under 'My Orders'.",
      },
      {
        h_sq: "A janë produktet origjinale?",
        h_en: "Are the products authentic?",
        b_sq: "Të gjitha produktet janë 100% origjinale, të furnizuara nga distributorë të autorizuar.",
        b_en: "All products are 100% authentic, sourced from authorized distributors.",
      },
      {
        h_sq: "Ofroni çmime për sallone?",
        h_en: "Do you offer salon pricing?",
        b_sq: "Po. Për blerje me shumicë shkruani në hello@dreamstudio-ks.com për ofertë të personalizuar.",
        b_en: "Yes. For wholesale orders email hello@dreamstudio-ks.com for a custom quote.",
      },
    ],
  },
  shipping: {
    title_sq: "Transporti & dërgesa",
    title_en: "Shipping & delivery",
    intro_sq: "Dërgojmë në të gjithë Kosovën me pagesë në dorëzim.",
    intro_en: "We deliver across Kosovo with cash on delivery.",
    meta_sq: "Tarifat e transportit, kohëzgjatja e dërgesës dhe pagesa në dorëzim në Kosovë — Dream Studio.",
    blocks: [
      {
        h_sq: "Kohëzgjatja",
        h_en: "Delivery time",
        b_sq: "Prishtinë: 1 ditë pune. Qytetet e tjera: 1–2 ditë pune. Porositë e bëra pas orës 16:00 përpunohen ditën e nesërme.",
        b_en: "Prishtina: 1 working day. Other cities: 1–2 working days. Orders after 16:00 are processed the next day.",
      },
      {
        h_sq: "Pagesa në dorëzim (COD)",
        h_en: "Cash on delivery (COD)",
        b_sq: "Paguani me para në dorë kuririn kur pako arrin. Kontrolloni pakon para pagesës.",
        b_en: "Pay the courier in cash when the parcel arrives. You may inspect the parcel before paying.",
      },
    ],
  },
  returns: {
    title_sq: "Kthimet & ndërrimet",
    title_en: "Returns & exchanges",
    intro_sq: "Nëse nuk jeni i kënaqur, kthimi është i mundur brenda 14 ditësh.",
    intro_en: "Not happy with your order? Returns are accepted within 14 days.",
    meta_sq: "Politika e kthimit dhe ndërrimit të produkteve brenda 14 ditësh — Dream Studio.",
    blocks: [
      {
        h_sq: "Afati",
        h_en: "Timeframe",
        b_sq: "Kthimi pranohet brenda 14 ditëve nga data e dorëzimit.",
        b_en: "Returns are accepted within 14 days of delivery.",
      },
      {
        h_sq: "Kushtet",
        h_en: "Conditions",
        b_sq: "Produkti duhet të jetë i pahapur, i papërdorur dhe në paketimin origjinal. Produktet higjienike të hapura (brusha, tehe, kozmetikë e hapur) nuk kthehen.",
        b_en: "Items must be unopened, unused and in original packaging. Opened hygiene items (brushes, blades, opened cosmetics) cannot be returned.",
      },
      {
        h_sq: "Si të kthej një produkt",
        h_en: "How to return",
        b_sq: "1. Shkruani në hello@dreamstudio-ks.com ose telefononi +383 44 123 456 me numrin e porosisë.\n2. Ekipi ju konfirmon kthimin dhe organizon marrjen e pakos.\n3. Rimbursimi bëhet brenda 7 ditëve pune pas pranimit të produktit.",
        b_en: "1. Email hello@dreamstudio-ks.com or call +383 44 123 456 with your order number.\n2. Our team confirms the return and arranges pickup.\n3. Refund is issued within 7 working days after we receive the item.",
      },
      {
        h_sq: "Produkt i dëmtuar",
        h_en: "Damaged item",
        b_sq: "Nëse produkti arrin i dëmtuar, njoftoni brenda 48 orësh me foto — e zëvendësojmë pa kosto.",
        b_en: "If an item arrives damaged, notify us within 48 hours with photos — we replace it free of charge.",
      },
    ],
  },
  privacy: {
    title_sq: "Politika e privatësisë",
    title_en: "Privacy policy",
    intro_sq: "Të dhënat tuaja përdoren vetëm për përpunimin e porosive.",
    intro_en: "Your data is used only to process your orders.",
    meta_sq: "Si mbledhim dhe mbrojmë të dhënat tuaja personale — Dream Studio.",
    blocks: [
      {
        h_sq: "Çfarë mbledhim",
        h_en: "What we collect",
        b_sq: "Emrin, numrin e telefonit, email-in, adresën e dërgesës dhe historikun e porosive. Mbledhim edhe statistika anonime të vizitave (faqe, pajisje, shtet) për të përmirësuar dyqanin.",
        b_en: "Name, phone number, email, delivery address and order history. We also collect anonymous visit statistics (page, device, country) to improve the store.",
      },
      {
        h_sq: "Si i përdorim",
        h_en: "How we use it",
        b_sq: "Vetëm për konfirmimin, dërgimin dhe mbështetjen e porosive tuaja. Nuk shitet dhe nuk ndahet me palë të treta për marketing.",
        b_en: "Only to confirm, deliver and support your orders. We never sell or share it with third parties for marketing.",
      },
      {
        h_sq: "Ruajtja & siguria",
        h_en: "Storage & security",
        b_sq: "Të dhënat ruhen në serverë të sigurt me akses të kufizuar vetëm për personelin e autorizuar.",
        b_en: "Data is stored on secure servers with access limited to authorized staff only.",
      },
      {
        h_sq: "Të drejtat tuaja",
        h_en: "Your rights",
        b_sq: "Mund të kërkoni në çdo kohë qasje, korrigjim ose fshirje të të dhënave tuaja në hello@dreamstudio-ks.com.",
        b_en: "You may request access, correction or deletion of your data at any time at hello@dreamstudio-ks.com.",
      },
    ],
  },
  terms: {
    title_sq: "Kushtet e shërbimit",
    title_en: "Terms of service",
    intro_sq: "Duke bërë një porosi, pranoni kushtet e mëposhtme.",
    intro_en: "By placing an order you accept the following terms.",
    meta_sq: "Kushtet e blerjes, çmimet, porositë dhe pagesa në dorëzim — Dream Studio.",
    blocks: [
      {
        h_sq: "Porositë",
        h_en: "Orders",
        b_sq: "Porosia konsiderohet e vlefshme pas konfirmimit me telefon ose email. Rezervojmë të drejtën të anulojmë porosi me të dhëna të pasakta ose pa stok.",
        b_en: "An order becomes valid after confirmation by phone or email. We may cancel orders with invalid details or unavailable stock.",
      },
      {
        h_sq: "Çmimet & pagesa",
        h_en: "Prices & payment",
        b_sq: "Çmimet janë në euro (€) dhe përfshijnë TVSH. Pagesa e vetme e disponueshme është pagesa në dorëzim (COD) me para në dorë.",
        b_en: "Prices are in euro (€) and include VAT. The only available payment method is cash on delivery (COD).",
      },
      {
        h_sq: "Refuzimi i pakos",
        h_en: "Refusing a parcel",
        b_sq: "Refuzimi i përsëritur i pakove pa arsye mund të kufizojë porositë e ardhshme me COD.",
        b_en: "Repeatedly refusing parcels without reason may limit future COD orders.",
      },
      {
        h_sq: "Përgjegjësia",
        h_en: "Liability",
        b_sq: "Produktet profesionale duhet të përdoren sipas udhëzimeve të prodhuesit. Nuk mbajmë përgjegjësi për përdorim të gabuar.",
        b_en: "Professional products must be used per manufacturer instructions. We are not liable for misuse.",
      },
      {
        h_sq: "Kontakti",
        h_en: "Contact",
        b_sq: "Dream Studio · Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com",
        b_en: "Dream Studio · Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë · +383 44 123 456 · hello@dreamstudio-ks.com",
      },
    ],
  },
};

/** Reads editable info-page content from the database, falling back to defaults. */
export function useInfoPage(slug: InfoSlug): InfoPageData {
  const { data } = useQuery({
    queryKey: ["info-pages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", INFO_SETTINGS_KEY)
        .maybeSingle();
      return (data?.value ?? {}) as Partial<Record<InfoSlug, InfoPageData>>;
    },
  });
  const saved = data?.[slug];
  if (!saved) return INFO_DEFAULTS[slug];
  return {
    ...INFO_DEFAULTS[slug],
    ...saved,
    blocks: saved.blocks?.length ? saved.blocks : INFO_DEFAULTS[slug].blocks,
  };
}
