"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const ComparisonView = dynamic(() => import("./ComparisonView"), { ssr: false });
const RosterView = dynamic(() => import("./RosterView"), { ssr: false });

const ACCENT = "#A6473B";

type Tab = "uebersicht" | "gegenueberstellung" | "teilnehmer";

interface Assessment {
  id: string;
  name: string;
  status: string;
}

interface CompetencyAverage {
  competencyName: string;
  averageNormalized: number;
  count: number;
}

interface CandidateCompetency {
  name: string;
  normalized: number;
  outlier: boolean;
  overridden: boolean;
}

interface CandidateScore {
  candidateId: string;
  candidateName: string;
  competencies: CandidateCompetency[];
}

type CandidateStatus = "ausgewertet" | "in_bearbeitung" | "registriert" | "angelegt";

interface CandidateStatusEntry {
  candidateId: string;
  candidateName: string;
  email: string;
  status: CandidateStatus;
  scoredCompetencies: number;
}

interface AnalyticsData {
  totalAssessments: number;
  totalCandidates: number;
  totalRatings: number;
  averageScore: number;
  competencyAverages: CompetencyAverage[];
  candidateScores: CandidateScore[];
  candidateStatus: CandidateStatusEntry[];
  featureFlags: Record<string, boolean>;
}

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspaceSlug ?? "") as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("uebersicht");

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) setAssessments(await res.json());
    } catch {}
  }, [workspaceSlug]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = selectedAssessment
        ? `/api/w/${workspaceSlug}/analytics?assessmentId=${selectedAssessment}`
        : `/api/w/${workspaceSlug}/analytics`;
      const res = await fetch(url);
      if (!res.ok) {
        setError((await res.json()).error || "Fehler beim Laden der Analysen.");
        return;
      }
      setAnalytics(await res.json());
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, selectedAssessment]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const maxAvg =
    analytics && analytics.competencyAverages.length > 0
      ? Math.max(...analytics.competencyAverages.map((c) => c.averageNormalized))
      : 100;

  const comparisonEnabled = analytics?.featureFlags?.comparison !== false;
  const scoredCandidates = analytics?.candidateScores.filter(
    (c) => c.competencies.length > 0
  ) ?? [];

  const TABS: { key: Tab; label: string; show: boolean }[] = [
    { key: "uebersicht",         label: "Übersicht",          show: true },
    { key: "gegenueberstellung", label: "Gegenüberstellung",  show: comparisonEnabled },
    { key: "teilnehmer",         label: "Teilnehmer",         show: true },
  ];

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
      {/* Header + Assessment selector */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
            data-testid="heading-analytics"
          >
            Analyse-Dashboard
          </h1>
          <p className="text-sm text-[var(--eds-text-tertiary)] mt-0.5">
            Übersicht über Assessments, Bewertungen und Kompetenzwerte
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedAssessment}
            onChange={(e) => { setSelectedAssessment(e.target.value); setActiveTab("uebersicht"); }}
            className="rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#297587]/30"
            data-testid="select-assessment-filter"
          >
            <option value="">Alle Assessments</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-[var(--eds-border)] no-print">
        {TABS.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.key
                ? "text-white"
                : "text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
            }`}
            style={activeTab === t.key ? { backgroundColor: ACCENT } : {}}
            data-testid={`tab-${t.key}`}
          >
            {t.label}
            {t.key === "gegenueberstellung" && scoredCandidates.length >= 2 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-white/20 font-normal">
                {scoredCandidates.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-xl p-4 text-sm text-[var(--eds-status-red)]" data-testid="text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>
        </div>
      )}

      {/* ── Tab: Übersicht ── */}
      {analytics && !loading && activeTab === "uebersicht" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Assessments gesamt" value={analytics.totalAssessments} testId="card-total-assessments" />
            <SummaryCard label="Kandidaten gesamt"  value={analytics.totalCandidates}  testId="card-total-candidates" />
            <SummaryCard label="Bewertungen gesamt" value={analytics.totalRatings}      testId="card-total-ratings" />
            <SummaryCard label="Durchschnittswert"  value={analytics.averageScore}      testId="card-average-score" />
          </div>

          {analytics.competencyAverages.length > 0 && (
            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
              >
                Durchschnittliche Kompetenzwerte
              </h2>
              <div className="space-y-3" data-testid="chart-competency-averages">
                {analytics.competencyAverages.map((c) => (
                  <div key={c.competencyName} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--eds-text-primary)] w-48 shrink-0 truncate" title={c.competencyName}>
                      {c.competencyName}
                    </span>
                    <div className="flex-1 bg-[var(--eds-bg-sunken)] rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max((c.averageNormalized / (maxAvg || 100)) * 100, 2)}%`,
                          backgroundColor: ACCENT,
                        }}
                      >
                        <span className="text-xs font-medium text-white">{c.averageNormalized}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--eds-text-disabled)] w-12 text-right">n={c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.candidateScores.length > 0 && (
            <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[var(--eds-border)]">
                <h2
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
                >
                  Kompetenzwerte nach Kandidat
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-candidate-scores">
                  <thead>
                    <tr className="border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]">
                      <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Kandidat</th>
                      <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Kompetenz</th>
                      <th className="text-right px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Normalisiert (0–100)</th>
                      <th className="text-center px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Ausreißer</th>
                      <th className="text-center px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Moderator-Überschr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.candidateScores.map((candidate) =>
                      candidate.competencies.map((comp, idx) => (
                        <tr
                          key={`${candidate.candidateId}-${comp.name}-${idx}`}
                          className={`border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)] ${comp.outlier ? "bg-[var(--eds-status-red-bg)]" : ""}`}
                          data-testid={`row-score-${candidate.candidateId}-${idx}`}
                        >
                          {idx === 0 && (
                            <td className="px-4 py-3 font-medium text-[var(--eds-text-primary)]" rowSpan={candidate.competencies.length}>
                              {candidate.candidateName}
                            </td>
                          )}
                          <td className="px-4 py-3 text-[var(--eds-text-primary)]">{comp.name}</td>
                          <td className={`px-4 py-3 text-right font-mono ${comp.outlier ? "text-[var(--eds-status-red)] font-semibold" : "text-[var(--eds-text-primary)]"}`}>
                            {Math.round(comp.normalized * 100) / 100}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {comp.outlier && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)]">Ja</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {comp.overridden && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]">Überschrieben</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analytics.competencyAverages.length === 0 && analytics.candidateScores.length === 0 && (
            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
              Keine konsolidierten Bewertungsdaten vorhanden.
            </div>
          )}

          {/* Nudge to comparison tab */}
          {scoredCandidates.length >= 2 && comparisonEnabled && (
            <div
              className="flex items-center justify-between p-4 bg-[#EFF4F5] border border-[#B5D6DE] rounded-xl text-sm cursor-pointer hover:border-[#297587] transition-colors"
              onClick={() => setActiveTab("gegenueberstellung")}
              data-testid="nudge-comparison"
            >
              <div>
                <p className="font-medium text-[#115560]">Gegenüberstellung verfügbar</p>
                <p className="text-xs text-[#297587] mt-0.5">
                  {scoredCandidates.length} Kandidaten mit Scores — Heatmap, Netzdiagramm und Ranking anzeigen
                </p>
              </div>
              <span className="text-[#297587] text-lg">→</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Gegenüberstellung ── */}
      {analytics && !loading && activeTab === "gegenueberstellung" && (
        <ComparisonView
          candidateScores={scoredCandidates}
          workspaceSlug={workspaceSlug}
        />
      )}

      {/* ── Tab: Teilnehmer ── */}
      {analytics && !loading && activeTab === "teilnehmer" && (
        <RosterView
          candidateStatus={analytics.candidateStatus}
          selectedAssessment={selectedAssessment}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid={testId}>
      <p className="text-sm text-[var(--eds-text-tertiary)] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
        {value}
      </p>
    </div>
  );
}
