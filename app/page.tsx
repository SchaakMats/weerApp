import Hero from "@/components/Hero";
import HourlyStrip from "@/components/HourlyStrip";
import DayCards from "@/components/DayCards";
import CurrentWeatherBlock from "@/components/CurrentWeather";
import BuienradarBlock from "@/components/Buienradar";
import ModelComparator from "@/components/ModelComparator";
import ForecastChart from "@/components/ForecastChart";
import Historical from "@/components/Historical";
import Advanced from "@/components/Advanced";

export default function Home() {
  return (
    <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <Hero />
      <HourlyStrip />
      <DayCards />
      <BuienradarBlock />
      <CurrentWeatherBlock />
      <ModelComparator />
      <ForecastChart />
      <Historical />
      <Advanced />
    </main>
  );
}
