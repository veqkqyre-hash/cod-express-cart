import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  loader: () => loadSeo("/auth"),
  component: AuthPage,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, {
    meta: [
      { title: "Kyçu ose regjistrohu — Dreame Beauty Cosmetics" },
      { name: "description", content: "Krijo llogari në Dreame Beauty Cosmetics për të porositur produkte profesionale për sallon me pagesë në dorëzim." },
      { property: "og:title", content: "Kyçu ose regjistrohu — Dreame Beauty Cosmetics" },
      { property: "og:description", content: "Krijo llogari në Dreame Beauty Cosmetics për të porositur produkte profesionale për sallon me pagesë në dorëzim." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dreamebeautycosmetics.com/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://dreamebeautycosmetics.com/auth" }],
  }),
});

function AuthPage() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function signInWithGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      // The Supabase Google provider must be enabled in the dashboard with
      // Google Cloud OAuth credentials before this can complete successfully.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/account" },
      });
      if (error) throw error;
      // Browser will redirect to Google. The signed-in user keeps normal,
      // existing database permissions; Google auth never grants an admin role.
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(/provider.*(not enabled|disabled|not supported)|unsupported provider/i.test(msg)
        ? (lang === "sq"
          ? "Hyrja me Google duhet aktivizuar te Supabase → Authentication → Providers."
          : "Enable Google under Supabase → Authentication → Providers first.")
        : msg);
      setGoogleLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/account" },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirmation(true);
          toast.message(lang === "sq"
            ? "Nëse regjistrimi u pranua, kontrollo emailin për konfirmim."
            : "If signup was accepted, check your email for a confirmation link.");
          return;
        }
        toast.success(lang === "sq" ? "Llogaria u krijua!" : "Account created!");
      }
      navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error(lang === "sq" ? "Shkruaj një email të vlefshëm" : "Enter a valid email");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: address,
        options: { emailRedirectTo: window.location.origin + "/account" },
      });
      if (error) throw error;
      setAwaitingConfirmation(true);
      toast.success(lang === "sq"
        ? "Kërkesa për ridërgim u pranua. Kontrollo Inbox dhe Spam."
        : "Resend request accepted. Check your Inbox and Spam.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request confirmation email");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="container-app py-16 max-w-md">
      <h1 className="font-display text-3xl mb-2">{tr("admin")}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {mode === "signin"
          ? (lang === "sq" ? "Kyçu në panelin administrativ" : "Sign in to the admin dashboard")
          : (lang === "sq" ? "Krijo llogari të re" : "Create a new account")}
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading || loading}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pink)] disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" width="21" height="21" role="img" aria-label="Google">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.3 5.48-4.88 7.18l7.73 6C44.3 38.03 46.98 31.89 46.98 24.55z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.3 14.3 0 0 1 9.75 24c0-1.59.28-3.13.77-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading
            ? (lang === "sq" ? "Duke u lidhur me Google…" : "Connecting to Google…")
            : (lang === "sq" ? "Vazhdo me Google" : "Continue with Google")}
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>{lang === "sq" ? "ose me email" : "or with email"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{tr("password")}</label>
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button disabled={loading} className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? "…" : mode === "signin" ? tr("login") : (lang === "sq" ? "Regjistrohu" : "Sign Up")}
        </button>
        {awaitingConfirmation && (
          <p role="status" className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm">
            {lang === "sq"
              ? "Llogaria pret konfirmimin. Kontrollo Inbox, Spam/Junk dhe adresën e shkruar."
              : "Your account awaits confirmation. Check Inbox, Spam/Junk, and the entered address."}
          </p>
        )}
        {(mode === "signup" || awaitingConfirmation) && <button
          type="button"
          onClick={resendConfirmation}
          disabled={resending || loading}
          className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {resending ? "…" : (lang === "sq" ? "Ridërgo emailin e konfirmimit" : "Resend confirmation email")}
        </button>}
        <button type="button" onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))} className="w-full text-sm text-muted-foreground hover:text-primary">
          {mode === "signin"
            ? (lang === "sq" ? "Nuk keni llogari? Regjistrohuni" : "No account? Sign up")
            : (lang === "sq" ? "Keni llogari? Kyçuni" : "Have an account? Sign in")}
        </button>
      </form>
    </div>
  );
}
