import CurrentWeatherBlock from "@/components/CurrentWeather";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Weerdashboard Hattem</h1>
      <CurrentWeatherBlock />
    </main>
  );
}
