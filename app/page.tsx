"use client";
import { useState } from "react";
import TabBar from "@/components/TabBar";
import KnmiWarnings from "@/components/KnmiWarnings";
import Hero from "@/components/Hero";
import HourlyStrip from "@/components/HourlyStrip";
import DayCards from "@/components/DayCards";
import ForecastChart from "@/components/ForecastChart";
import BuienradarBlock from "@/components/Buienradar";
import LightningMap from "@/components/LightningMap";
import CurrentWeatherBlock from "@/components/CurrentWeather";
import AirQuality from "@/components/AirQuality";
import ModelComparator from "@/components/ModelComparator";
import Historical from "@/components/Historical";
import Advanced from "@/components/Advanced";

type Tab = "weer" | "geavanceerd";

export default function Home() {
  const [tab, setTab] = useState<Tab>("weer");

  return (
    <>
      <main className="max-w-xl mx-auto px-4 py-6 pb-24 space-y-4">
        {tab === "weer" && (
          <>
            <KnmiWarnings />
            <Hero />
            <HourlyStrip />
            <DayCards />
            <ForecastChart />
            <BuienradarBlock />
            <LightningMap />
            <CurrentWeatherBlock />
            <AirQuality />
          </>
        )}
        {tab === "geavanceerd" && (
          <>
            <ModelComparator />
            <Historical />
            <Advanced />
          </>
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
