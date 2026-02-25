"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../bdp-context";

export default function BdpAuswertungPage() {
  const { user } = useBdp();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "individuals">("overview");

  useEffect(() => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoading(true);
    setActiveTab("overview");
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

  const releasedSessions = sessions.filter(s => s.state === "RELEASED" || s.state === "CLOSED");
  const isDemoEnv = user?.environment === "demo";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-auswertung-title">Auswertung</h1>

      {releasedSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-gray-500" data-testid="text-no-results">
            {isDemoEnv
              ? "Noch keine abgeschlossenen Sessions vorhanden."
              : "Noch keine Ergebnisse verfügbar. Ergebnisse werden sichtbar, sobald eine Session abgeschlossen ist."}
          </p>
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
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {loading && <div className="text-center py-8 text-gray-400">Laden...</div>}

          {results?.error && (
            <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-sm">{results.error}</div>
          )}

          {results && !results.error && (
            <div className="space-y-4">
              {results.session?.summary && (
                <div className="bg-gradient-to-r from-[#FFFBF0] to-white rounded-2xl p-6 shadow-sm border border-[#FFD700]/30" data-testid="text-session-summary">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📝</span>
                    <h2 className="font-bold text-lg">Executive Summary</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">{results.session.summary}</p>
                </div>
              )}

              <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm">
                {[
                  { key: "overview" as const, label: "Gesamtergebnis" },
                  { key: "teams" as const, label: "Team-Feedback" },
                  { key: "individuals" as const, label: "Einzelbewertungen" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    data-testid={`tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-[#FFD700] text-black shadow-sm"
                        : "text-gray-500 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
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
                          Sieger (nach Tie-Break): <strong>{results.ranked.find((r: any) => r.teamId === results.tieBreak.winnerTeamId)?.teamCode || "–"}</strong>
                        </p>
                        {results.tieBreak.rationale && <p className="text-sm text-blue-600 mt-2 italic">{results.tieBreak.rationale}</p>}
                      </div>
                    )}
                    {results.isTie && !results.tieBreak && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl" data-testid="text-tie-pending">
                        <p className="font-bold text-amber-800">Gleichstand</p>
                        <p className="text-sm text-amber-700 mt-1">Tie-Break Entscheidung steht noch aus.</p>
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
                                <span className="w-24 font-medium truncate">{r.teamCode.split(" (")[0]}</span>
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
                      <h2 className="font-bold text-lg mb-4">Beobachter-Aufschlüsselung</h2>
                      {Object.entries(results.perObserver).map(([observerCode, teamData]: [string, any]) => (
                        <div key={observerCode} className="mb-4 p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-bold mb-2 text-sm">{observerCode}</h3>
                          <div className="space-y-1">
                            {Object.entries(teamData).map(([teamId, criterionScores]: [string, any]) => {
                              const teamCode = results.ranked.find((r: any) => r.teamId === teamId)?.teamCode || teamId;
                              return (
                                <div key={teamId} className="text-xs">
                                  <span className="font-medium">{teamCode.split(" (")[0]}:</span>{" "}
                                  {Object.entries(criterionScores).map(([cId, pts]) => {
                                    const cName = results.criteria.find((c: any) => c.id === cId)?.name || cId;
                                    return <span key={cId} className="mr-2 text-gray-600">{cName}: {pts as number}</span>;
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "teams" && (
                <div className="space-y-4">
                  {Object.keys(results.teamFeedbacks || {}).length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <p className="text-gray-400">Noch keine Team-Feedbacks vorhanden.</p>
                    </div>
                  ) : (
                    Object.entries(results.teamFeedbacks).map(([teamName, feedback]: [string, any]) => (
                      <div key={teamName} className="bg-white rounded-2xl p-6 shadow-sm" data-testid={`feedback-team-${teamName}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center font-bold text-sm">
                            {teamName.charAt(0)}
                          </span>
                          <h3 className="font-bold text-lg">{teamName}</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{feedback}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "individuals" && (
                <div className="space-y-4">
                  {(results.individualNotes || []).length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <p className="text-gray-400">Noch keine Einzelbewertungen vorhanden.</p>
                    </div>
                  ) : (
                    (results.individualNotes || []).map((note: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm" data-testid={`individual-note-${idx}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold">{note.participantName}</h3>
                            {note.teamName && (
                              <span className="text-xs text-gray-400">Team {note.teamName}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {note.contribution > 0 && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg" data-testid={`badge-contribution-${idx}`}>
                                Beitrag: {note.contribution}/5
                              </span>
                            )}
                            {note.presence > 0 && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg" data-testid={`badge-presence-${idx}`}>
                                Präsenz: {note.presence}/5
                              </span>
                            )}
                          </div>
                        </div>
                        {note.note && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 font-medium mb-1">Beobachtung</p>
                            <p className="text-gray-700 text-sm leading-relaxed">{note.note}</p>
                          </div>
                        )}
                        {note.generalNote && (
                          <div className="bg-[#FFFBF0] rounded-xl p-3 mt-2">
                            <p className="text-sm text-gray-500 font-medium mb-1">Gesamteinschätzung</p>
                            <p className="text-gray-700 text-sm leading-relaxed italic">{note.generalNote}</p>
                          </div>
                        )}
                        <div className="mt-2 text-right">
                          <span className="text-xs text-gray-400">Beobachter: {note.observerName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
