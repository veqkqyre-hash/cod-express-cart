export function ComingSoon() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-foreground px-6 text-background">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="relative max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-primary">Dreame Beauty Cosmetics</p>
        <h1 className="mt-6 font-display text-6xl leading-none sm:text-8xl md:text-9xl">
          Coming <span className="italic text-primary">Soon</span>
        </h1>
        <div className="mx-auto mt-8 h-px w-24 bg-primary/60" />
        <p className="mt-8 text-base opacity-80 sm:text-lg">
          Po përgatisim diçka të bukur për ju. Së shpejti kthehemi me produktet më të mira për thonj.
        </p>
        <p className="mt-2 text-sm opacity-60">We're preparing something beautiful. We'll be back very soon.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href="mailto:info@dreamebeautycosmetics.com" className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90">info@dreamebeautycosmetics.com</a>
        </div>
        <p className="mt-12 text-xs opacity-50">Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë</p>
      </div>
    </div>
  );
}
