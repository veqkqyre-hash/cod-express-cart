import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ChevronDown, Package, ScanLine, ShoppingCart, Boxes, Users, AlertTriangle, LifeBuoy } from "lucide-react";

type Topic = {
  icon: any;
  titleSq: string;
  titleEn: string;
  stepsSq: string[];
  stepsEn: string[];
};

const TOPICS: Topic[] = [
  {
    icon: Package,
    titleSq: "Si regjistrohet një produkt",
    titleEn: "How to add a product",
    stepsSq: [
      "Hapni seksionin «Produktet» nga menuja majtas.",
      "Klikoni «Shto produkt» dhe plotësoni emrin shqip e anglisht, çmimin dhe stokun.",
      "Zgjidhni kategorinë. Nëse mungon, shtojeni te «Katalogu».",
      "Shtoni foto me butonin «Ngarko nga kompjuteri» — fotoja e parë është kryesore dhe del në dyqan.",
      "Nëse produkti ka barkod, skanojeni ose shkruajeni te fusha «Barkodi». Enter-i nuk e dërgon formën.",
      "Klikoni «Ruaj». Produkti del menjëherë në dyqan nëse është i aktivizuar.",
    ],
    stepsEn: [
      "Open the «Products» section from the left menu.",
      "Click «Add product» and fill in the Albanian and English name, price and stock.",
      "Choose a category. If missing, add it under «Catalog».",
      "Add photos with «Upload from computer» — the first photo is the main one shown in the shop.",
      "If the product has a barcode, scan or type it in the «Barcode» field. Enter does not submit the form.",
      "Click «Save». The product appears in the shop immediately if it is active.",
    ],
  },
  {
    icon: ScanLine,
    titleSq: "Si përdoret ARKA (POS)",
    titleEn: "How to use the register (POS)",
    stepsSq: [
      "Hapni «ARKA / SHITJE». Nëse nuk ka sesion të hapur, hapeni një me shumën fillestare të parasë.",
      "Skanoni barkodin e produktit ose kërkojeni me emër. Produkti shtohet në shportë.",
      "Ndryshoni sasinë me + / −. Mund të shtoni zbritje (€) dhe emrin e klientit.",
      "Zgjidhni mënyrën e pagesës: cash ose kartelë. Për cash shkruani shumën e marrë — kusuri llogaritet vetë.",
      "Klikoni «Përfundo shitjen». Stoku ulet automatikisht dhe fatura printohet (58/80mm).",
      "Në fund të ditës mbyllni sesionin te «Sesionet e punës» dhe numëroni parasë në kasë.",
    ],
    stepsEn: [
      "Open «POS / Register». If no shift is open, open one with the starting cash amount.",
      "Scan the product barcode or search by name. The product is added to the cart.",
      "Change quantity with + / −. You can add a discount (€) and the customer name.",
      "Choose the payment method: cash or card. For cash enter the amount received — change is calculated automatically.",
      "Click «Complete sale». Stock decreases automatically and the receipt prints (58/80mm).",
      "At the end of the day close the shift under «Work shifts» and count the cash.",
    ],
  },
  {
    icon: ShoppingCart,
    titleSq: "Si përpunohet një porosi online",
    titleEn: "How to process an online order",
    stepsSq: [
      "Porositë e reja dalin te «Porositë» me status «Në pritje» (të verdha).",
      "Hapni porosinë për të parë produktet, adresën dhe telefonin e klientit.",
      "Konfirmojeni me klientin (telefon ose WhatsApp) dhe ndryshoni statusin në «Konfirmuar».",
      "Kur paketohet: «Në përpunim». Kur jepet te posta: «Dërguar». Kur mbërrin: «Dorëzuar».",
      "Nëse klienti anulon, zgjidhni «Anuluar» — stoku kthehet automatikisht.",
      "Faturën e printoni nga dritarja e porosisë me butonin e printimit.",
    ],
    stepsEn: [
      "New orders appear under «Orders» with status «Pending» (yellow).",
      "Open the order to see the products, address and customer phone.",
      "Confirm with the customer (phone or WhatsApp) and set the status to «Confirmed».",
      "When packed: «Processing». When handed to the post: «Shipped». When delivered: «Delivered».",
      "If the customer cancels, choose «Cancelled» — stock is returned automatically.",
      "Print the invoice from the order modal with the print button.",
    ],
  },
  {
    icon: Boxes,
    titleSq: "Si kontrollohet inventari",
    titleEn: "How to manage inventory",
    stepsSq: [
      "Te «Inventari» shihni stokun e çdo produkti. Produktet me stok ≤5 dalin me paralajmërim.",
      "Për të shtuar stok, hapni produktin te «Produktet» dhe ndryshoni numrin e stokut.",
      "Çdo mbushje stoku regjistrohet automatikisht te «Mbushjet e stokut» (poshtë Inventarit).",
      "Shitjet nga ARKA dhe porositë online e ulin stokun vetë — nuk duhet ndryshuar me dorë.",
      "Eksportoni inventarin si CSV/PDF me butonat lart për kontabilitet.",
    ],
    stepsEn: [
      "Under «Inventory» you see each product's stock. Products with stock ≤5 show a warning.",
      "To add stock, open the product under «Products» and change the stock number.",
      "Every stock refill is logged automatically under «Stock refills» (below Inventory).",
      "POS sales and online orders lower the stock automatically — no manual change needed.",
      "Export the inventory as CSV/PDF with the buttons at the top for accounting.",
    ],
  },
  {
    icon: Users,
    titleSq: "Si menaxhohen punonjësit dhe rolet",
    titleEn: "How to manage staff and roles",
    stepsSq: [
      "Te «Rolet & Adminët» shihni të gjithë stafin. Vetëm admini e sheh këtë seksion.",
      "Për të shtuar një punonjës: ai/ajo regjistrohet në faqe, pastaj ju ia jepni rolin me email-in e tij/saj.",
      "Rolet: Admin (gjithçka), Menaxher (porosi, produkte, ARKA, raporte), Editor (përmbajtje, blog, ballina).",
      "Roli ndryshohet nga lista me menynë zbritëse pranë emrit.",
      "Kurrë mos ia jepni rolin Admin dikujt që s'ka nevojë — ai mund të fshijë të dhëna.",
    ],
    stepsEn: [
      "Under «Roles & Admins» you see all staff. Only admins see this section.",
      "To add a staff member: they register on the site, then you grant their role using their email.",
      "Roles: Admin (everything), Manager (orders, products, POS, reports), Editor (content, blog, homepage).",
      "Change a role from the list with the dropdown next to the name.",
      "Never give the Admin role to someone who doesn't need it — they can delete data.",
    ],
  },
  {
    icon: AlertTriangle,
    titleSq: "Si kuptohen mesazhet e gabimeve",
    titleEn: "How to understand error messages",
    stepsSq: [
      "«Barkodi nuk u gjet» — produkti me atë barkod nuk ekziston ose është joaktiv. Kontrolloni te «Produktet».",
      "«Stok i pamjaftueshëm» — stoku është më i ulët se sasia e kërkuar. Kontrolloni inventarin.",
      "«Nuk keni akses» — roli juaj nuk e lejon atë veprim. Kërkoni ndihmë nga admini.",
      "«Nuk u ruajt / gabim në ruajtje» — kontrolloni që të gjitha fushat e detyrueshme (*) janë plotësuar.",
      "Nëse gabimi përsëritet, shikoni «Regjistrin e aktivitetit» për detaje ose kontaktoni mbështetjen.",
    ],
    stepsEn: [
      "«Barcode not found» — no product with that barcode exists or it is inactive. Check under «Products».",
      "«Insufficient stock» — stock is lower than the requested quantity. Check inventory.",
      "«No access» — your role does not allow that action. Ask the admin for help.",
      "«Could not save» — make sure all required fields (*) are filled in.",
      "If the error repeats, check the «Activity log» for details or contact support.",
    ],
  },
];

export function HelpPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-pink-100 bg-pink-50/60 p-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--pink-deep,#e91e63)] text-white">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg">{L("Qendra e ndihmës", "Help center")}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {L(
              "Udhëzime të shkurtra për përdorimin e Admin Panelit. Klikoni një temë për ta hapur.",
              "Short guides for using the Admin Panel. Click a topic to open it."
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {TOPICS.map((t, i) => {
          const Icon = t.icon;
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-50 text-pink-600">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 font-medium">{L(t.titleSq, t.titleEn)}</span>
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <ol className="space-y-2 border-t border-neutral-100 px-5 py-4">
                  {(lang === "sq" ? t.stepsSq : t.stepsEn).map((s, j) => (
                    <li key={j} className="flex gap-3 text-sm text-neutral-700">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-500">
                        {j + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
