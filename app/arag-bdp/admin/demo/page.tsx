"use client";

import { useState } from "react";
import { useBdp } from "../../bdp-context";

export default function DemoAdminPage() {
  const { user } = useBdp();
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  if (!user?.isAdmin) {
    return (
      <div className="py-12 text-center text-black/50">Keine Admin-Berechtigung</div>
    );
  }

  const handleReset = async () => {
    if (!confirm("DEMO-Daten werden komplett gelöscht und neu erstellt. LIVE-Daten bleiben unberührt. Fortfahren?")) return;
    setResetting(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/arag-bdp/admin/demo-reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler beim Zurücksetzen");
      } else {
        setResult(data);
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-black mb-2">Demo-Umgebung</h1>
      <p className="text-sm text-black/60 mb-6">
        Hier können Sie die DEMO-Umgebung zurücksetzen. Dabei werden alle Demo-Daten gelöscht und ein vollständiger Demo-Datensatz neu erstellt (3 Sessions, 6 Teams, 21 Teilnehmer, Scores, Tie-Break, Notizen). LIVE-Daten werden dabei nicht verändert.
      </p>

      <div className="bg-white border border-black/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
          <span className="font-semibold text-black">Demo zurücksetzen</span>
        </div>

        <button
          data-testid="bdp-demo-reset"
          onClick={handleReset}
          disabled={resetting}
          className="w-full rounded-lg bg-[#FFD700] text-black font-bold py-3 text-sm hover:bg-[#e6c200] disabled:opacity-50 transition-colors"
        >
          {resetting ? "Wird zurückgesetzt…" : "DEMO zurücksetzen"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="text-demo-error">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm" data-testid="text-demo-result">
            <div className="font-semibold text-green-800 mb-2">Demo erfolgreich zurückgesetzt</div>
            <div className="grid grid-cols-2 gap-1 text-green-700 text-xs">
              <span>Beobachter:</span><span className="font-mono">{result.observers}</span>
              <span>Teams:</span><span className="font-mono">{result.teams}</span>
              <span>Teilnehmer:</span><span className="font-mono">{result.participants}</span>
              <span>Sessions:</span><span className="font-mono">{result.sessions}</span>
              <span>Kriterien:</span><span className="font-mono">{result.criteria}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
