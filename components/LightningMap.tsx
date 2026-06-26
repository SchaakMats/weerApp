export default function LightningMap() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">⚡ Live Bliksemradar</h2>
      <a
        href="https://map.blitzortung.org/#6.6/52.3/5.5"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors p-8 text-center"
      >
        <span className="text-5xl">⚡</span>
        <p className="text-white font-semibold text-lg">Open Bliksemradar</p>
        <p className="text-white/50 text-sm">Live blikseminslagen Nederland — opent in nieuwe tab</p>
      </a>
      <p className="text-white/30 text-xs mt-2 text-right">Bron: Blitzortung.org</p>
    </section>
  );
}
