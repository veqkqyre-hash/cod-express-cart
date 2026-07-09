import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/account" },
        });
        if (error) throw error;
        toast.success(lang === "sq" ? "Llogaria u krijua!" : "Account created!");
      }
      navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
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
        <button type="button" onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))} className="w-full text-sm text-muted-foreground hover:text-primary">
          {mode === "signin"
            ? (lang === "sq" ? "Nuk keni llogari? Regjistrohuni" : "No account? Sign up")
            : (lang === "sq" ? "Keni llogari? Kyçuni" : "Have an account? Sign in")}
        </button>
      </form>
    </div>
  );
}
