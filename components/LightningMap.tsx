export default function LightningMap() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">⚡ Live Bliksemradar</h2>
      <iframe
        src="https://www.lightningmaps.org/?lang=nl#m=oss;t=3;s=0;o=0;b=;ts=0;"
        className="w-full rounded-xl border-0"
        style={{ height: "400px" }}
        title="Live bliksemradar"
        loading="lazy"
      />
      <p className="text-white/30 text-xs mt-2 text-right">Bron: Lightningmaps.org · live bliksemdetectie</p>
    </section>
  );
}
