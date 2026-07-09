import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { tr, lang, setLang } = useI18n();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="container-app flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg">D</span>
          <span className="font-display text-lg tracking-tight hidden sm:block">Dream Studio</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm ml-6">
          <Link to="/" className="hover:text-primary transition-colors">{tr("home")}</Link>
          <Link to="/shop" className="hover:text-primary transition-colors">{tr("shop")}</Link>
          {signedIn && <Link to="/account" className="hover:text-primary transition-colors">{tr("myOrders")}</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5 text-xs">
            <button onClick={() => setLang("sq")} className={`px-2 py-1 rounded-full transition ${lang === "sq" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>SQ</button>
            <button onClick={() => setLang("en")} className={`px-2 py-1 rounded-full transition ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
          </div>

          <Link to={signedIn ? "/account" : "/auth"} className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition" aria-label={tr("account")}>
            <User className="h-5 w-5" />
          </Link>

          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <button className="md:hidden grid h-10 w-10 place-items-center rounded-full hover:bg-muted" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="container-app flex flex-col py-3 text-sm">
            <Link to="/" className="py-2" onClick={() => setOpen(false)}>{tr("home")}</Link>
            <Link to="/shop" className="py-2" onClick={() => setOpen(false)}>{tr("shop")}</Link>
            {signedIn ? (
              <Link to="/account" className="py-2" onClick={() => setOpen(false)}>{tr("myOrders")}</Link>
            ) : (
              <Link to="/auth" className="py-2" onClick={() => setOpen(false)}>{tr("login")}</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
