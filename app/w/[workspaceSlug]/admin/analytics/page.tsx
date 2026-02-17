"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ACCENT = "hsl(14, 48%, 44%)";

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

interface AnalyticsData {
  totalAssessments: number;
  totalCandidates: number;
  totalRatings: number;
  averageScore: number;
  competencyAverages: CompetencyAverage[];
  candidateScores: CandidateScore[];
}

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) {
        setAssessments(await res.json());
      }
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
        const data = await res.json();
        setError(data.error || "Fehler beim Laden der Analysen.");
        return;
      }
      setAnalytics(await res.json());
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, selectedAssessment]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxAvg =
    analytics && analytics.competencyAverages.length > 0
      ? Math.max(...analytics.competencyAverages.map((c) => c.averageNormalized))
      : 100;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="text-white sticky top-0 z-50" style={{ backgroundColor: ACCENT }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-module-overview">Modul-Übersicht</Link>
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="link-workspace"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Analysen</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
              data-testid="heading-analytics"
            >
              Analyse-Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Übersicht über Assessments, Bewertungen und Kompetenzwerte
            </p>
          </div>
          <div>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
              data-testid="select-assessment-filter"
            >
              <option value="">Alle Assessments</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800" data-testid="text-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Laden…</p>
          </div>
        )}

        {analytics && !loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Assessments gesamt"
                value={analytics.totalAssessments}
                testId="card-total-assessments"
              />
              <SummaryCard
                label="Kandidaten gesamt"
                value={analytics.totalCandidates}
                testId="card-total-candidates"
              />
              <SummaryCard
                label="Bewertungen gesamt"
                value={analytics.totalRatings}
                testId="card-total-ratings"
              />
              <SummaryCard
                label="Durchschnittswert"
                value={analytics.averageScore}
                testId="card-average-score"
              />
            </div>

            {analytics.competencyAverages.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
                >
                  Durchschnittliche Kompetenzwerte
                </h2>
                <div className="space-y-3" data-testid="chart-competency-averages">
                  {analytics.competencyAverages.map((c) => (
                    <div key={c.competencyName} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-48 shrink-0 truncate" title={c.competencyName}>
                        {c.competencyName}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max((c.averageNormalized / (maxAvg || 100)) * 100, 2)}%`,
                            backgroundColor: ACCENT,
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {c.averageNormalized}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">n={c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.candidateScores.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200">
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
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Kandidat</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Kompetenz</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Normalisiert (0–100)</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600">Ausreißer</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600">Moderator-Überschr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.candidateScores.map((candidate) =>
                        candidate.competencies.map((comp, idx) => (
                          <tr
                            key={`${candidate.candidateId}-${comp.name}-${idx}`}
                            className={`border-b border-slate-100 hover:bg-slate-50 ${
                              comp.outlier ? "bg-red-50" : ""
                            }`}
                            data-testid={`row-score-${candidate.candidateId}-${idx}`}
                          >
                            {idx === 0 && (
                              <td
                                className="px-4 py-3 font-medium text-slate-900"
                                rowSpan={candidate.competencies.length}
                              >
                                {candidate.candidateName}
                              </td>
                            )}
                            <td className="px-4 py-3 text-slate-700">{comp.name}</td>
                            <td className={`px-4 py-3 text-right font-mono ${comp.outlier ? "text-red-600 font-semibold" : "text-slate-900"}`}>
                              {Math.round(comp.normalized * 100) / 100}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {comp.outlier && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                  Ja
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {comp.overridden && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  Überschrieben
                                </span>
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
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                Keine konsolidierten Bewertungsdaten vorhanden.
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-5"
      data-testid={testId}
    >
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
      >
        {value}
      </p>
    </div>
  );
}
