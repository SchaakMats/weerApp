export function aqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: "Goed", color: "#34d399" };
  if (aqi <= 40) return { label: "Redelijk", color: "#a3e635" };
  if (aqi <= 60) return { label: "Matig", color: "#fbbf24" };
  if (aqi <= 80) return { label: "Slecht", color: "#f97316" };
  if (aqi <= 100) return { label: "Zeer slecht", color: "#ef4444" };
  return { label: "Gevaarlijk", color: "#7c3aed" };
}

export function pollenLabel(value: number): string {
  if (value === 0) return "Geen";
  if (value <= 10) return "Laag";
  if (value <= 30) return "Matig";
  if (value <= 80) return "Hoog";
  return "Zeer hoog";
}
