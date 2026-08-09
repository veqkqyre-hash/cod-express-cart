import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { InfoPage, InfoBlock, metaFor } from "@/components/info-page";
import { formatEur } from "@/lib/cart";

export const Route = createFileRoute("/shipping")({
  component: Shipping,
  head: () => metaFor("/shipping", "Transporti", "Tarifat e transportit, kohëzgjatja e dërgesës dhe pagesa në dorëzim në Kosovë — Dream Studio."),
});

function Shipping() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);

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
      title={L("Transporti & dërgesa", "Shipping & delivery")}
      intro={L("Dërgojmë në të gjithë Kosovën me pagesë në dorëzim.", "We deliver across Kosovo with cash on delivery.")}
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

      <InfoBlock heading={L("Kohëzgjatja", "Delivery time")}>
        <p>{L("Prishtinë: 1 ditë pune. Qytetet e tjera: 1–2 ditë pune. Porositë e bëra pas orës 16:00 përpunohen ditën e nesërme.", "Prishtina: 1 working day. Other cities: 1–2 working days. Orders after 16:00 are processed the next day.")}</p>
      </InfoBlock>

      <InfoBlock heading={L("Pagesa në dorëzim (COD)", "Cash on delivery (COD)")}>
        <p>{L("Paguani me para në dorë kuririn kur pako arrin. Kontrolloni pakon para pagesës.", "Pay the courier in cash when the parcel arrives. You may inspect the parcel before paying.")}</p>
        <p>
          <Link to="/faq" className="text-[var(--pink-deep)] hover:underline">{L("Shiko pyetjet e shpeshta", "See the FAQ")}</Link>
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
