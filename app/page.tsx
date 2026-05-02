import CurrentWeatherBlock from "@/components/CurrentWeather";
import BuienradarBlock from "@/components/Buienradar";
import ModelComparator from "@/components/ModelComparator";
import ForecastChart from "@/components/ForecastChart";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Weerdashboard Hattem</h1>
      <CurrentWeatherBlock />
      <BuienradarBlock />
      <ModelComparator />
      <ForecastChart />
    </main>
  );
}
