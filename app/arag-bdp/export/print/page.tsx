"use client";

import { useState, useEffect } from "react";

export default function BdpPrintPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions")
      .then(r => r.json())
      .then(async (sessions: any[]) => {
        setSessions(sessions);
        const results: Record<string, any> = {};
        for (const s of sessions.filter(s => s.state === "RELEASED")) {
          try {
            const res = await fetch(`/api/arag-bdp/results?sessionId=${s.id}`);
            results[s.id] = await res.json();
          } catch {}
        }
        setAllResults(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Laden...</div>;

  const releasedSessions = sessions.filter(s => s.state === "RELEASED");

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-4" data-testid="print-view">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="text-center mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-black">ARAG Business Development Pitch</h1>
        <p className="text-gray-500 mt-1">Ergebnisbericht</p>
        <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <button onClick={() => window.print()} className="no-print mb-6 bg-[#FFD700] text-black px-6 py-2 rounded-lg font-bold">
        Drucken
      </button>

      {releasedSessions.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Keine freigegebenen Sessions.</p>
      ) : (
        releasedSessions.map(s => {
          const result = allResults[s.id];
          if (!result || result.error) return null;

          return (
            <div key={s.id} className="mb-12 break-inside-avoid">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">{s.name}</h2>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Platz</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-right p-2">Gesamt</th>
                    {result.criteria?.map((c: any) => (
                      <th key={c.id} className="text-right p-2 text-xs">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.ranked?.map((r: any, idx: number) => (
                    <tr key={r.teamId} className={idx === 0 ? "bg-yellow-50 font-bold" : ""}>
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{r.teamCode}</td>
                      <td className="p-2 text-right">{r.total}</td>
                      {result.criteria?.map((c: any) => (
                        <td key={c.id} className="p-2 text-right">{r.byCriterion[c.id] || 0}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.isTie && result.tieBreak && (
                <div className="p-3 bg-blue-50 rounded text-sm mb-4">
                  <strong>Tie-Break:</strong> Sieger {result.ranked.find((r: any) => r.teamId === result.tieBreak.winnerTeamId)?.teamCode || "–"}
                  {result.tieBreak.rationale && ` — ${result.tieBreak.rationale}`}
                </div>
              )}
            </div>
          );
        })
      )}

      <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 print:fixed print:bottom-0 print:left-0 print:right-0 print:py-2">
        <div className="flex items-center justify-center gap-2">
          <svg width="80" height="16" viewBox="0 0 80 16" className="inline-block">
            <text x="0" y="12" fontSize="11" fontWeight="bold" fill="#A6473B" fontFamily="sans-serif">aestimamus</text>
          </svg>
        </div>
        <p className="mt-1">Powered by aestimamus · © Christoph Aldering · Private initiative / concept</p>
      </footer>
    </div>
  );
}
