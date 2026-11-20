import { useState, type FormEvent } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/business-whatsapp";

const WORDS = {
  sq: {
    eyebrow: "TERMINE PËR THONJ & PEDIKYR",
    title: "Rezervo termin",
    intro: "Zgjidh shërbimin, datën dhe orën që preferon. Dërgo kërkesën në WhatsApp; termini konfirmohet vetëm pasi të përgjigjemi.",
    service: "Shërbimi", selectService: "Zgjedh shërbimin",
    name: "Emri dhe mbiemri", phone: "Numri yt i telefonit",
    date: "Data e preferuar", time: "Ora e preferuar", notes: "Shënime (opsionale)",
    notesPlaceholder: "P.sh. lloji i trajtimit, pyetje ose kërkesa të veçanta",
    send: "Dërgo kërkesën në WhatsApp",
    note: "Orët janë sipas Kosovës dhe janë vetëm preferencë, jo disponueshmëri e konfirmuar. Në WhatsApp duhet ta shtypësh Dërgo.",
    invalidDate: "Zgjedh një datë të ardhshme.",
  },
  en: {
    eyebrow: "NAIL & PEDICURE APPOINTMENTS",
    title: "Request an appointment",
    intro: "Choose a service, date and preferred time. Send your request via WhatsApp; your appointment is confirmed only after we reply.",
    service: "Service", selectService: "Choose a service",
    name: "Full name", phone: "Your phone number",
    date: "Preferred date", time: "Preferred time", notes: "Notes (optional)",
    notesPlaceholder: "For example, treatment type or special requests",
    send: "Send request via WhatsApp",
    note: "Times are Kosovo local time and are preferences only, not confirmed availability. Press Send in WhatsApp.",
    invalidDate: "Choose a future date.",
  },
  de: {
    eyebrow: "TERMINE FÜR NÄGEL & PEDIKÜRE",
    title: "Termin anfragen",
    intro: "Wählen Sie Behandlung, Datum und Wunschzeit. Senden Sie die Anfrage über WhatsApp; der Termin gilt erst nach unserer Bestätigung.",
    service: "Behandlung", selectService: "Behandlung wählen",
    name: "Vor- und Nachname", phone: "Ihre Telefonnummer",
    date: "Wunschdatum", time: "Wunschzeit", notes: "Anmerkungen (optional)",
    notesPlaceholder: "Zum Beispiel Behandlungswunsch oder Fragen",
    send: "Anfrage per WhatsApp senden",
    note: "Zeiten sind Ortszeit Kosovo und nur Wunschzeiten, keine bestätigte Verfügbarkeit. In WhatsApp auf Senden drücken.",
    invalidDate: "Bitte wählen Sie ein zukünftiges Datum.",
  },
  fr: {
    eyebrow: "RENDEZ-VOUS ONGLES & PÉDICURE",
    title: "Demander un rendez-vous",
    intro: "Choisissez le soin, la date et l'heure souhaitées. Envoyez la demande sur WhatsApp ; le rendez-vous est confirmé après notre réponse.",
    service: "Soin", selectService: "Choisissez un soin",
    name: "Nom et prénom", phone: "Votre numéro de téléphone",
    date: "Date souhaitée", time: "Heure souhaitée", notes: "Remarques (facultatif)",
    notesPlaceholder: "Par exemple, type de soin ou questions",
    send: "Envoyer via WhatsApp",
    note: "Les heures sont celles du Kosovo et restent des préférences, non des disponibilités confirmées. Appuyez sur Envoyer dans WhatsApp.",
    invalidDate: "Choisissez une date à venir.",
  },
} as const;

// The MANICURE services are the exact treatments supplied for the
// "Cakto Termin Online" card. The original general services remain available.
const MANICURE_SERVICES = [
  {
    id: "classic-nail-extensions",
    sq: "Classic Nail Extensions — Mbjellje me tipsa klasike",
    en: "Classic Nail Extensions — Classic tip extensions",
    de: "Classic Nail Extensions — Verlängerung mit klassischen Tips",
    fr: "Classic Nail Extensions — Pose avec capsules classiques",
  },
  {
    id: "c-curve-perfection",
    sq: "C-Curve Perfection — Mbjellje me tipsa C-Curve",
    en: "C-Curve Perfection — C-Curve tip extensions",
    de: "C-Curve Perfection — Verlängerung mit C-Curve-Tips",
    fr: "C-Curve Perfection — Pose avec capsules C-Curve",
  },
  {
    id: "sculpted-nails",
    sq: "Sculpted Nails — Zgjatje me letër dhe gel ndërtues",
    en: "Sculpted Nails — Form extensions with builder gel",
    de: "Sculpted Nails — Schablonenverlängerung mit Aufbaugel",
    fr: "Sculpted Nails — Extensions au chablon et gel de construction",
  },
  {
    id: "builder-gel-overlay",
    sq: "Builder Gel Overlay — Përforcim i thonjve natyralë me Builder Gel",
    en: "Builder Gel Overlay — Natural nail strengthening with builder gel",
    de: "Builder Gel Overlay — Naturnagelverstärkung mit Aufbaugel",
    fr: "Builder Gel Overlay — Renforcement des ongles naturels au gel",
  },
  {
    id: "dream-nail-refill",
    sq: "Dream Nail Refill — Mirëmbajtje dhe rimbushje e gelit",
    en: "Dream Nail Refill — Gel maintenance and refill",
    de: "Dream Nail Refill — Gel-Auffüllen und Pflege",
    fr: "Dream Nail Refill — Entretien et remplissage du gel",
  },
  {
    id: "nail-repair",
    sq: "Nail Repair — Riparim i thoit të dëmtuar ose të there",
    en: "Nail Repair — Damaged or broken nail repair",
    de: "Nail Repair — Reparatur beschädigter oder gebrochener Nägel",
    fr: "Nail Repair — Réparation d'un ongle abîmé ou cassé",
  },
  {
    id: "nail-correction-refill",
    sq: "Nail Correction & Refill — Korrigjim dhe riparim i thonjve të punuar nga një sallon tjetër",
    en: "Nail Correction & Refill — Correction of nails done at another salon",
    de: "Nail Correction & Refill — Korrektur von Nägeln aus einem anderen Studio",
    fr: "Nail Correction & Refill — Correction d'ongles réalisés dans un autre salon",
  },
  {
    id: "complete-nail-removal",
    sq: "Complete Nail Removal — Largim i plotë i materialit dhe pastrim i thonjve natyralë",
    en: "Complete Nail Removal — Complete product removal and natural nail cleaning",
    de: "Complete Nail Removal — Vollständige Materialentfernung und Naturnagelreinigung",
    fr: "Complete Nail Removal — Dépose complète et nettoyage des ongles naturels",
  },
] as const;

// PEDICURE options provided by the salon for the "Për Këmbët e Tua" booking card.
const PEDICURE_SERVICES = [
  {
    id: "classic-gel-pedicure",
    sq: "Classic Gel Pedicure — Pastrim i thonjve + kutikulat + Llak Gel",
    en: "Classic Gel Pedicure — Nail and cuticle cleaning + gel polish",
    de: "Classic Gel Pedicure — Nagel- und Nagelhautpflege + Gel-Lack",
    fr: "Classic Gel Pedicure — Nettoyage des ongles et cuticules + vernis gel",
  },
  {
    id: "velvet-gel-spa",
    sq: "Velvet Gel Spa — Pedikyr + pastrim i thembrave + skrab + Llak Gel",
    en: "Velvet Gel Spa — Pedicure + heel care + scrub + gel polish",
    de: "Velvet Gel Spa — Pediküre + Fersenpflege + Peeling + Gel-Lack",
    fr: "Velvet Gel Spa — Pédicure + soin des talons + gommage + vernis gel",
  },
  {
    id: "flex-perfect-toes",
    sq: "Flex Perfect Toes — Pedikyr + përforcim i thonjve me Flex Base",
    en: "Flex Perfect Toes — Pedicure + nail reinforcement with Flex Base",
    de: "Flex Perfect Toes — Pediküre + Nagelverstärkung mit Flex Base",
    fr: "Flex Perfect Toes — Pédicure + renforcement des ongles avec Flex Base",
  },
  {
    id: "dream-flex-spa",
    sq: "Dream Flex Spa — Pedikyr + pastrim i shputave + skrab + Flex Base-m",
    en: "Dream Flex Spa — Pedicure + sole care + scrub + Flex Base",
    de: "Dream Flex Spa — Pediküre + Fußsohlenpflege + Peeling + Flex Base",
    fr: "Dream Flex Spa — Pédicure + soin de la plante des pieds + gommage + Flex Base",
  },
  {
    id: "royal-dream-pedicure",
    sq: "Royal Dream Pedicure — Pedikyr komplet + skrab + maskë + masazh + Flex Base dhe ngjyre sipas dëshires",
    en: "Royal Dream Pedicure — Full pedicure + scrub + mask + massage + Flex Base and chosen colour",
    de: "Royal Dream Pedicure — Komplette Pediküre + Peeling + Maske + Massage + Flex Base und Wunschfarbe",
    fr: "Royal Dream Pedicure — Pédicure complète + gommage + masque + massage + Flex Base et couleur au choix",
  },
] as const;

const OTHER_SERVICES = [
  { id: "manicure", sq: "Manikyr", en: "Manicure", de: "Maniküre", fr: "Manucure" },
  { id: "gel-polish", sq: "Gel lak", en: "Gel polish", de: "Gel-Lack", fr: "Vernis gel" },
  { id: "nail-extensions", sq: "Ndërtim / zgjatje thonjsh", en: "Nail extensions / builder gel", de: "Nagelverlängerung / Aufbaugel", fr: "Extensions / gel de construction" },
  { id: "nail-art", sq: "Nail art & dekorim", en: "Nail art & decoration", de: "Nail Art & Dekoration", fr: "Nail art & décoration" },
  { id: "pedicure", sq: "Pedikyr", en: "Pedicure", de: "Pediküre", fr: "Pédicure" },
  { id: "nail-care", sq: "Trajtim / kujdes për thonj", en: "Nail treatment / care", de: "Nagelpflege / Behandlung", fr: "Soin des ongles" },
  { id: "other", sq: "Shërbim tjetër (shkruaj te shënimet)", en: "Other service (describe in notes)", de: "Andere Behandlung (in Anmerkungen beschreiben)", fr: "Autre soin (précisez en remarques)" },
] as const;

const SERVICES = [...MANICURE_SERVICES, ...PEDICURE_SERVICES, ...OTHER_SERVICES];
export type AppointmentMode = "all" | "manicure" | "pedicure";
const BOOKING_MODE_WORDS = {
  sq: {
    manicure: { eyebrow: "MANICURE", title: "Rezervo termin për manikyr" },
    pedicure: { eyebrow: "PEDICURE", title: "Rezervo termin për pedikyr" },
  },
  en: {
    manicure: { eyebrow: "MANICURE", title: "Book a manicure appointment" },
    pedicure: { eyebrow: "PEDICURE", title: "Book a pedicure appointment" },
  },
  de: {
    manicure: { eyebrow: "MANIKÜRE", title: "Maniküre-Termin buchen" },
    pedicure: { eyebrow: "PEDIKÜRE", title: "Pediküre-Termin buchen" },
  },
  fr: {
    manicure: { eyebrow: "MANUCURE", title: "Prendre rendez-vous pour une manucure" },
    pedicure: { eyebrow: "PÉDICURE", title: "Prendre rendez-vous pour une pédicure" },
  },
} as const;
const OTHER_GROUP = {
  sq: "Shërbime tjera",
  en: "Other services",
  de: "Weitere Behandlungen",
  fr: "Autres soins",
} as const;

const TIMES = Array.from({ length: 21 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  return `${String(h).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
});

function todayLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function AppointmentBooking({ embedded = false, mode = "all" }: { embedded?: boolean; mode?: AppointmentMode }) {
  const { lang } = useI18n();
  const w = WORDS[lang];
  const heading = mode === "all" ? { eyebrow: w.eyebrow, title: w.title } : BOOKING_MODE_WORDS[lang][mode];
  const availableServices = mode === "manicure" ? MANICURE_SERVICES
    : mode === "pedicure" ? PEDICURE_SERVICES : SERVICES;
  const [warning, setWarning] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const serviceId = String(form.get("service") || "");
    const date = String(form.get("date") || "");
    const time = String(form.get("time") || "");
    const notes = String(form.get("notes") || "").trim();
    const service = availableServices.find(item => item.id === serviceId);
    if (!service || !name || !phone || !date || !time) return;
    if (date < todayLocal()) { setWarning(w.invalidDate); return; }
    setWarning("");
    const message = [
      "DREAMÈ Beauty Cosmetics — KËRKESË PËR TERMIN",
      `Emri: ${name}`,
      `Telefoni: ${phone}`,
      `Shërbimi: ${service.sq}`,
      `Data e preferuar: ${date}`,
      `Ora e preferuar (Kosovë): ${time}`,
      notes ? `Shënime: ${notes}` : "",
      "Ju lutem më konfirmoni nëse termini është i lirë.",
    ].filter(Boolean).join("\n");
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--pink-deep)]";
  return (
    <section id={embedded ? undefined : "rezervo-termin"} className={embedded ? "w-full py-4 sm:py-5" : "container-app scroll-mt-28 py-10 sm:py-14"}>
      <div className={embedded ? "w-full" : "rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8"}>
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pink-deep)]">{heading.eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">{heading.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{w.intro}</p>
        </div>
        <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="sm:col-span-2 text-sm font-medium">{w.service} *
            <select required name="service" defaultValue="" className={`mt-1.5 ${field}`}>
              <option value="" disabled>{w.selectService}</option>
              {mode !== "pedicure" && (
                <optgroup label="MANICURE">
                  {MANICURE_SERVICES.map(service => (
                    <option key={service.id} value={service.id}>{service[lang]}</option>
                  ))}
                </optgroup>
              )}
              {mode !== "manicure" && (
                <optgroup label="PEDICURE">
                  {PEDICURE_SERVICES.map(service => (
                    <option key={service.id} value={service.id}>{service[lang]}</option>
                  ))}
                </optgroup>
              )}
              {mode === "all" && (
                <optgroup label={OTHER_GROUP[lang]}>
                  {OTHER_SERVICES.map(service => (
                    <option key={service.id} value={service.id}>{service[lang]}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <label className="text-sm font-medium">{w.name} *
            <input required name="name" type="text" autoComplete="name" maxLength={120} className={`mt-1.5 ${field}`} />
          </label>
          <label className="text-sm font-medium">{w.phone} *
            <input required name="phone" type="tel" autoComplete="tel" maxLength={30} className={`mt-1.5 ${field}`} />
          </label>
          <label className="text-sm font-medium">{w.date} *
            <span className="mt-1.5 flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /></span>
            <input required name="date" type="date" min={todayLocal()} className={`mt-1.5 ${field}`} />
          </label>
          <label className="text-sm font-medium">{w.time} *
            <span className="mt-1.5 flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" /></span>
            <select required name="time" defaultValue="" className={`mt-1.5 ${field}`}>
              <option value="" disabled>--:--</option>
              {TIMES.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2 text-sm font-medium">{w.notes}
            <textarea name="notes" rows={3} maxLength={750} placeholder={w.notesPlaceholder} className={`mt-1.5 ${field}`} />
          </label>
          {warning && <p role="alert" className="sm:col-span-2 text-sm text-red-600">{warning}</p>}
          <div className="sm:col-span-2 flex flex-col items-start gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
              <MessageCircle className="h-4 w-4" /> {w.send}
            </button>
            <p className="text-xs text-muted-foreground">{w.note}</p>
          </div>
        </form>
      </div>
    </section>
  );
}
