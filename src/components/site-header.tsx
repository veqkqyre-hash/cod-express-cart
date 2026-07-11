import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, Heart, Search, ChevronDown, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { supabase } from "@/integrations/supabase/client";

type Category = { id: string; slug: string; name_sq: string; name_en: string };

export function SiteHeader() {
  const { tr, lang, setLang } = useI18n();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [q, setQ] = useState("");
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,slug,name_sq,name_en").order("sort_order");
      return (data ?? []) as Category[];
    },
    staleTime: 5 * 60_000,
  });

  function openMega() { if (megaTimer.current) clearTimeout(megaTimer.current); setMegaOpen(true); }
  function closeMegaSoon() { megaTimer.current = setTimeout(() => setMegaOpen(false), 120); }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/shop", search: q.trim() ? { q: q.trim() } : {} });
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-black text-white text-xs">
        <div className="container-app flex h-9 items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="hidden sm:inline">✦</span>
            <span className="truncate">{tr("announcementBar")}</span>
          </div>
          <a href="tel:+38344123456" className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-white transition">
            <Phone className="h-3 w-3" /> +383 44 123 456
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container-app flex h-16 md:h-20 items-center gap-3 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-white font-display text-lg tracking-tight shadow-pink">
              D
            </span>
            <span className="font-display text-xl md:text-2xl tracking-tight font-semibold">Dream Studio</span>
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <Link to="/" className="hover:text-[var(--pink-deep)] transition-colors">{tr("home")}</Link>
            <div
              onMouseEnter={openMega}
              onMouseLeave={closeMegaSoon}
              className="relative"
            >
              <button className="inline-flex items-center gap-1 hover:text-[var(--pink-deep)] transition-colors">
                {tr("shop")} <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link to="/shop" search={{}} className="hover:text-[var(--pink-deep)] transition-colors">{tr("newArrivals")}</Link>
            <a href="#brands" className="hover:text-[var(--pink-deep)] transition-colors">{tr("brands")}</a>
            {signedIn && <Link to="/account" className="hover:text-[var(--pink-deep)] transition-colors">{tr("myOrders")}</Link>}
          </nav>

          {/* Search */}
          <form onSubmit={onSearchSubmit} className="ml-auto hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-full border border-border bg-[var(--pink-soft)]/50 px-4 py-2 focus-within:border-[var(--pink-deep)] transition">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr("searchProducts")}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>

          {/* Icons */}
          <div className="md:ml-0 ml-auto flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-border px-1 py-0.5 text-[10px] mr-1">
              <button onClick={() => setLang("sq")} className={`px-2 py-1 rounded-full transition ${lang === "sq" ? "bg-black text-white" : "text-muted-foreground"}`}>SQ</button>
              <button onClick={() => setLang("en")} className={`px-2 py-1 rounded-full transition ${lang === "en" ? "bg-black text-white" : "text-muted-foreground"}`}>EN</button>
              <button onClick={() => setLang("de")} className={`px-2 py-1 rounded-full transition ${lang === "de" ? "bg-black text-white" : "text-muted-foreground"}`}>DE</button>
            </div>

            <Link to={signedIn ? "/account" : "/auth"} className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--pink-soft)] transition" aria-label={tr("account")}>
              <User className="h-5 w-5" />
            </Link>

            <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--pink-soft)] transition" aria-label={tr("wishlist")}>
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--pink-deep)] px-1 text-[10px] font-semibold text-white">
                  {wishCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--pink-soft)] transition" aria-label={tr("cart")}>
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--pink-deep)] px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>

            <button className="lg:hidden grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--pink-soft)]" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mega menu (desktop) */}
        {megaOpen && categories && categories.length > 0 && (
          <div
            onMouseEnter={openMega}
            onMouseLeave={closeMegaSoon}
            className="hidden lg:block absolute left-0 right-0 border-t border-border bg-background shadow-elev animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="container-app grid grid-cols-4 gap-8 py-8">
              <div className="col-span-3 grid grid-cols-3 gap-x-8 gap-y-3">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/shop"
                    search={{ category: c.slug }}
                    onClick={() => setMegaOpen(false)}
                    className="group flex items-center justify-between text-sm py-1.5 border-b border-transparent hover:border-[var(--pink-deep)] transition"
                  >
                    <span className="font-medium">{lang === "sq" ? c.name_sq : c.name_en}</span>
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground group-hover:text-[var(--pink-deep)] transition" />
                  </Link>
                ))}
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[var(--pink-soft)] to-white p-5 border border-border">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--pink-deep)]">{tr("newIn")}</div>
                <div className="mt-2 font-display text-xl leading-tight">{tr("megaPromoTitle")}</div>
                <p className="mt-2 text-xs text-muted-foreground">{tr("megaPromoSub")}</p>
                <Link
                  to="/shop"
                  onClick={() => setMegaOpen(false)}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-black hover:text-[var(--pink-deep)] transition"
                >
                  {tr("shopNow")} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden border-t border-border/60 bg-background">
            <div className="container-app py-4 space-y-3">
              <form onSubmit={onSearchSubmit} className="flex items-center gap-2 rounded-full border border-border bg-[var(--pink-soft)]/50 px-4 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tr("searchProducts")}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </form>
              <nav className="flex flex-col text-sm">
                <Link to="/" className="py-2 font-medium" onClick={() => setOpen(false)}>{tr("home")}</Link>
                <Link to="/shop" className="py-2 font-medium" onClick={() => setOpen(false)}>{tr("shop")}</Link>
                <Link to="/wishlist" className="py-2 font-medium" onClick={() => setOpen(false)}>{tr("wishlist")}</Link>
                {signedIn ? (
                  <Link to="/account" className="py-2 font-medium" onClick={() => setOpen(false)}>{tr("myOrders")}</Link>
                ) : (
                  <Link to="/auth" className="py-2 font-medium" onClick={() => setOpen(false)}>{tr("login")}</Link>
                )}
              </nav>
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{tr("categories")}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories?.map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug }}
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-[var(--pink-soft)]/50 px-3 py-2 text-xs font-medium hover:bg-[var(--pink-soft)]"
                    >
                      {lang === "sq" ? c.name_sq : c.name_en}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
