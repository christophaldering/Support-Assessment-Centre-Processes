"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useBdp } from "../../bdp-context";
import CaseModal from "../../components/CaseModal";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpScoringPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user } = useBdp();
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [existingScores, setExistingScores] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, any>>({});
  const [expandedTN, setExpandedTN] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sponsorFlags, setSponsorFlags] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"scoring" | "individual">("scoring");
  const [caseModal, setCaseModal] = useState<{ type: "slides" | "pdf" | "none"; teamName: string; slides?: any[]; pdfUrl?: string } | null>(null);
  const [loadingCase, setLoadingCase] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/abcd-bdp/sessions").then(r => r.json()),
      fetch("/api/abcd-bdp/criteria").then(r => r.json()),
      fetch(`/api/abcd-bdp/scores?sessionId=${sessionId}`).then(r => r.json()),
      fetch("/api/abcd-bdp/participants").then(r => r.json()),
      fetch(`/api/abcd-bdp/notes?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/abcd-bdp/sponsor?sessionId=${sessionId}`).then(r => r.json()),
    ]).then(([sessions, criteria, existScores, parts, notesData, sponsors]) => {
      const s = sessions.find((s: any) => s.id === sessionId);
      setSession(s);
      setCriteria(criteria);
      setTeams(s?.sessionTeams?.map((st: any) => st.team) || []);
      setExistingScores(existScores);
      setParticipants(parts);

      const scoreMap: Record<string, Record<string, number>> = {};
      for (const sc of existScores) {
        if (!scoreMap[sc.criterionId]) scoreMap[sc.criterionId] = {};
        scoreMap[sc.criterionId][sc.teamId] = sc.points;
      }
      setScores(scoreMap);

      const noteMap: Record<string, any> = {};
      for (const n of notesData) {
        const key = `${n.participantId}_${n.criterionId || "general"}`;
        noteMap[key] = n;
      }
      setNotes(noteMap);

      const sFlags: Record<string, boolean> = {};
      for (const sf of sponsors) {
        sFlags[sf.teamId] = sf.isSponsor;
      }
      setSponsorFlags(sFlags);
    }).catch(() => {});
  }, [sessionId]);

  const isDemoEnv = user?.environment === "demo";
  const isReadOnly = session?.state === "DRAFT" || (!isDemoEnv && (session?.state === "CLOSED" || session?.state === "RELEASED"));

  const setScore = (criterionId: string, teamId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: { ...(prev[criterionId] || {}), [teamId]: value },
    }));
  };

  const getSum = (criterionId: string) => {
    const critScores = scores[criterionId] || {};
    return Object.values(critScores).reduce((a, b) => a + b, 0);
  };

  const handleSubmitScores = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    const scoreArray: any[] = [];
    for (const criterionId of Object.keys(scores)) {
      for (const teamId of Object.keys(scores[criterionId])) {
        scoreArray.push({ criterionId, teamId, points: scores[criterionId][teamId] });
      }
    }

    try {
      const res = await fetch("/api/abcd-bdp/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, scores: scoreArray }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage(t("ratingSaved"));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setError(t("ratingError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async (participantId: string, criterionId: string | null, note: string, generalNote: string, contribution?: number, presence?: number) => {
    try {
      await fetch("/api/abcd-bdp/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, participantId, criterionId, note, generalNote, contribution, presence }),
      });
    } catch {}
  };

  const handleSponsorToggle = async (teamId: string) => {
    const newVal = !sponsorFlags[teamId];
    setSponsorFlags(prev => ({ ...prev, [teamId]: newVal }));
    await fetch("/api/abcd-bdp/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, teamId, isSponsor: newVal }),
    });
  };

  if (!session) return <div className="text-center py-8 text-gray-400">{t("loading")}</div>;

  const openBusinessCase = async (teamId: string) => {
    setLoadingCase(teamId);
    try {
      const res = await fetch(`/api/abcd-bdp/business-case?teamId=${teamId}`);
      const data = await res.json();
      setCaseModal({ type: data.type, teamName: data.teamName, slides: data.slides, pdfUrl: data.url });
    } catch {}
    setLoadingCase(null);
  };

  const teamParticipants = (teamId: string) =>
    participants.filter(p => p.teamParticipants?.some((tp: any) => tp.team.id === teamId));

  return (
    <div className="space-y-4">
      {caseModal && (
        <CaseModal
          onClose={() => setCaseModal(null)}
          type={caseModal.type}
          teamName={caseModal.teamName}
          slides={caseModal.slides}
          pdfUrl={caseModal.pdfUrl}
        />
      )}

      <Link href="/abcd-bdp/bewertung" className="text-gray-400 hover:text-black text-sm">{t("back")}</Link>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold" data-testid="text-scoring-session">{session.name}</h1>
        {isReadOnly && (
          <div className="mt-2 px-3 py-2 bg-orange-50 rounded-lg text-orange-700 text-sm" data-testid="text-scoring-locked">
            {session.state === "DRAFT" ? t("sessionNotOpen") : t("sessionLocked")}
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        <button data-testid="tab-scoring" onClick={() => setActiveTab("scoring")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "scoring" ? "bg-[#0071e3] text-black" : "text-gray-500"}`}>
          {t("teamRating")}
        </button>
        <button data-testid="tab-individual" onClick={() => setActiveTab("individual")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "individual" ? "bg-[#0071e3] text-black" : "text-gray-500"}`}>
          {t("individualRating")}
        </button>
      </div>

      {activeTab === "scoring" && (
        <div className="space-y-4">
          {criteria.map(criterion => {
            const sum = getSum(criterion.id);
            const isValid = sum === 100;
            return (
              <div key={criterion.id} className="bg-white rounded-2xl p-5 shadow-sm" data-testid={`criterion-${criterion.id}`}>
                <h3 className="font-bold mb-1">{criterion.name}</h3>
                <div className={`text-xs mb-3 ${isValid ? "text-green-600" : sum > 0 ? "text-orange-600" : "text-gray-400"}`}>
                  {t("pointsAssigned", { sum: String(sum) })} {isValid && "✓"}
                </div>
                <div className="space-y-3">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">
                        {team.displayName || team.code}
                        {criterion === criteria[0] && (
                          <button
                            data-testid={`bdp-open-case-${team.id}`}
                            onClick={() => openBusinessCase(team.id)}
                            disabled={loadingCase === team.id}
                            className="block text-[10px] text-[#0058b0] hover:text-[#0071e3] mt-0.5 font-normal"
                          >
                            {loadingCase === team.id ? "..." : "Case"}
                          </button>
                        )}
                      </div>
                      <input
                        data-testid={`input-score-${criterion.id}-${team.id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={scores[criterion.id]?.[team.id] ?? ""}
                        onChange={e => setScore(criterion.id, team.id, parseInt(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-[#0071e3] disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <div className="w-12 text-right text-sm text-gray-400">{scores[criterion.id]?.[team.id] ?? 0}P</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${isValid ? "bg-green-400" : sum > 100 ? "bg-red-400" : "bg-[#0071e3]"}`} style={{ width: `${Math.min(sum, 100)}%` }} />
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-3">{t("sponsorLabel")}</h3>
            <p className="text-xs text-gray-400 mb-3">{t("sponsorHint")}</p>
            {teams.map(team => (
              <label key={team.id} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={!!sponsorFlags[team.id]}
                  onChange={() => handleSponsorToggle(team.id)}
                  disabled={isReadOnly}
                  data-testid={`bdp-sponsor-flag-${team.id}`}
                  className="w-5 h-5 accent-[#0071e3]"
                />
                <span className="text-sm">{team.displayName || team.code} — {t("iAmSponsor")}</span>
              </label>
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm" data-testid="text-score-error">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm" data-testid="text-score-success">{message}</div>}

          {!isReadOnly && (() => {
            const allValid = criteria.every(c => getSum(c.id) === 100);
            const anyScored = criteria.some(c => getSum(c.id) > 0);
            return (
              <>
                {anyScored && !allValid && (
                  <div className="bg-orange-50 text-orange-700 p-3 rounded-xl text-sm" data-testid="text-sum-warning">
                    {t("sumWarning")}
                  </div>
                )}
                <button
                  data-testid="bdp-score-save"
                  onClick={handleSubmitScores}
                  disabled={saving || !allValid}
                  className="w-full bg-[#0071e3] text-black font-bold py-4 rounded-2xl hover:bg-[#005bb5] transition-colors disabled:opacity-50"
                >
                  {saving ? t("saving") : t("saveRating")}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === "individual" && (
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-3">{team.displayName || team.code} — {t("participants")}</h3>
              <div className="space-y-2">
                {teamParticipants(team.id).map(p => (
                  <div key={p.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      data-testid={`accordion-${p.code}`}
                      onClick={() => setExpandedTN(expandedTN === p.id ? null : p.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <span className="font-medium">{p.displayName || p.code}</span>
                      <span className="text-gray-400">{expandedTN === p.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedTN === p.id && (
                      <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
                        {criteria.map(c => {
                          const noteKey = `${p.id}_${c.id}`;
                          const existing = notes[noteKey];
                          return (
                            <div key={c.id}>
                              <label className="text-xs font-medium text-gray-500">{c.name}</label>
                              <textarea
                                data-testid={`note-${p.id}-${c.id}`}
                                defaultValue={existing?.note || ""}
                                onBlur={e => handleSaveNote(p.id, c.id, e.target.value, "", existing?.contribution, existing?.presence)}
                                disabled={isReadOnly}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 disabled:bg-gray-50"
                                placeholder={t("note")}
                              />
                            </div>
                          );
                        })}

                        <div>
                          <label className="text-xs font-medium text-gray-500">{t("generalNote")}</label>
                          <textarea
                            data-testid={`note-general-${p.id}`}
                            defaultValue={notes[`${p.id}_general`]?.generalNote || ""}
                            onBlur={e => handleSaveNote(p.id, null, "", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 disabled:bg-gray-50"
                            placeholder={t("generalObservations")}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t("contribution")}</label>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              defaultValue={notes[`${p.id}_general`]?.contribution || 3}
                              onMouseUp={(e: any) => handleSaveNote(p.id, null, "", notes[`${p.id}_general`]?.generalNote || "", parseInt(e.target.value))}
                              disabled={isReadOnly}
                              className="w-full accent-[#0071e3]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t("presence")}</label>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              defaultValue={notes[`${p.id}_general`]?.presence || 3}
                              onMouseUp={(e: any) => handleSaveNote(p.id, null, "", notes[`${p.id}_general`]?.generalNote || "", undefined, parseInt(e.target.value))}
                              disabled={isReadOnly}
                              className="w-full accent-[#0071e3]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {teamParticipants(team.id).length === 0 && (
                  <p className="text-gray-400 text-sm">{t("noParticipantsAssigned")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
