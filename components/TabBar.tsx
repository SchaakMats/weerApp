type Tab = "weer" | "geavanceerd";

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20"
      style={{ background: "rgba(12,20,69,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="max-w-xl mx-auto flex">
        {([["weer", "🌤️", "Weer"], ["geavanceerd", "📊", "Geavanceerd"]] as [Tab, string, string][]).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${active === key ? "text-white" : "text-white/40"}`}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
