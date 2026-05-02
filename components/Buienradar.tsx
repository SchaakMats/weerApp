export default function BuienradarBlock() {
  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Live Radar</h2>
      <iframe
        src="https://www.buienradar.nl/nederland/weerbericht/actueel-weer/buienradar?w=800&h=400&lat=52.4833&lon=6.0667"
        width="100%"
        height="400"
        className="rounded-xl"
        title="Buienradar"
      />
    </section>
  );
}
