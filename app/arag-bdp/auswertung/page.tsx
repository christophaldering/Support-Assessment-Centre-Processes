"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../bdp-context";

export default function BdpAuswertungPage() {
  const { user } = useBdp();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoading(true);
    fetch(`/api/arag-bdp/results?sessionId=${selectedSession}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setResults({ error: data.error });
        } else {
          setResults(data);
        }
      })
      .catch(() => setResults({ error: "Verbindungsfehler" }))
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const releasedSessions = sessions.filter(s => s.state === "RELEASED" || (user?.isAdmin && s.state !== "DRAFT"));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-auswertung-title">Auswertung</h1>

      {releasedSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">🔒</span>
          <p className="text-gray-500">Noch keine Ergebnisse freigegeben.</p>
          <p className="text-gray-400 text-sm mt-1">Ergebnisse werden erst nach Admin-Freigabe sichtbar.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Session auswählen</label>
            <select
              data-testid="select-session"
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
            >
              <option value="">Bitte wählen...</option>
              {releasedSessions.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.state})</option>
              ))}
            </select>
          </div>

          {loading && <div className="text-center py-8 text-gray-400">Laden...</div>}

          {results?.error && (
            <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-sm">{results.error}</div>
          )}

          {results && !results.error && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Gesamtergebnis</h2>
                <div className="space-y-3">
                  {results.ranked?.map((r: any, idx: number) => {
                    const maxTotal = results.ranked[0]?.total || 1;
                    const pct = (r.total / maxTotal) * 100;
                    const isWinner = idx === 0;
                    const isTied = results.isTie && idx <= 1;

                    return (
                      <div key={r.teamId} data-testid={`result-team-${r.teamCode}`} className={`p-4 rounded-xl ${isWinner && !isTied ? "bg-[#FFD700]/10 border-2 border-[#FFD700]" : "bg-gray-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isWinner && !isTied ? "bg-[#FFD700] text-black" : "bg-gray-200"}`}>
                              {idx + 1}
                            </span>
                            <span className="font-bold">{r.teamCode}</span>
                            {isWinner && !isTied && <span className="text-xs bg-[#FFD700] px-2 py-0.5 rounded-full font-bold">Sieger</span>}
                            {isTied && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Gleichstand</span>}
                          </div>
                          <span className="font-bold text-lg">{r.total} P</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFD700] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {results.isTie && results.tieBreak && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl" data-testid="text-tiebreak-result">
                    <p className="font-bold text-blue-800">Tie-Break Entscheidung</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Sieger: {results.ranked.find((r: any) => r.teamId === results.tieBreak.winnerTeamId)?.teamCode || "–"} (Entscheidung durch Board)
                    </p>
                    {results.tieBreak.rationale && <p className="text-xs text-blue-600 mt-1">Begründung: {results.tieBreak.rationale}</p>}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Kriterien-Detail</h2>
                {results.criteria?.map((c: any) => (
                  <div key={c.id} className="mb-4">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">{c.name}</h3>
                    <div className="space-y-1">
                      {results.ranked?.map((r: any) => {
                        const pts = r.byCriterion[c.id] || 0;
                        const maxPts = Math.max(...results.ranked.map((rr: any) => rr.byCriterion[c.id] || 0), 1);
                        return (
                          <div key={r.teamId} className="flex items-center gap-2 text-sm">
                            <span className="w-16 font-medium">{r.teamCode}</span>
                            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                              <div className="h-full bg-[#FFD700] rounded transition-all" style={{ width: `${(pts / maxPts) * 100}%` }} />
                            </div>
                            <span className="w-12 text-right text-gray-600">{pts}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {results.perObserver && user?.isAdmin && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-lg mb-4">Beobachter-Aufschlüsselung (Admin)</h2>
                  {Object.entries(results.perObserver).map(([observerCode, teamData]: [string, any]) => (
                    <div key={observerCode} className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <h3 className="font-medium mb-2">{observerCode}</h3>
                      {Object.entries(teamData).map(([teamId, criterionScores]: [string, any]) => {
                        const teamCode = results.ranked.find((r: any) => r.teamId === teamId)?.teamCode || teamId;
                        return (
                          <div key={teamId} className="text-sm ml-4">
                            <span className="font-medium">{teamCode}:</span>{" "}
                            {Object.entries(criterionScores).map(([cId, pts]) => {
                              const cName = results.criteria.find((c: any) => c.id === cId)?.name || cId;
                              return <span key={cId} className="mr-2">{cName}: {pts as number}P</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
