"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Assessment {
  id: string;
  name: string;
  status: string;
  candidates?: Candidate[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface Report {
  id: string;
  title: string;
  format: string;
  version: number;
  status: string;
  generatedAt: string | null;
  snapshotData: Record<string, unknown> | null;
  aiSections: string[];
  candidateId: string | null;
  createdAt: string;
}

interface ReportWithUrl extends Report {
  downloadUrl?: string | null;
}

const accentColor = "hsl(14, 48%, 44%)";

const FORMAT_BADGES: Record<string, { bg: string; text: string }> = {
  pdf: { bg: "bg-red-50", text: "text-red-700" },
  docx: { bg: "bg-blue-50", text: "text-blue-700" },
  pptx: { bg: "bg-orange-50", text: "text-orange-700" },
};

export default function ReportsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [includeAi, setIncludeAi] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [snapshotModal, setSnapshotModal] = useState<Record<string, unknown> | null>(null);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) {
        setAssessments(await res.json());
      }
    } catch {}
    setLoading(false);
  }, [workspaceSlug]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleAssessmentChange = async (id: string) => {
    setSelectedAssessmentId(id);
    setSelectedCandidateId("");
    setCandidates([]);
    setReports([]);

    if (!id) return;

    try {
      const [assessmentRes, reportsRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments/${id}`),
        fetch(`/api/w/${workspaceSlug}/assessments/${id}/reports`),
      ]);

      if (assessmentRes.ok) {
        const data = await assessmentRes.json();
        setCandidates(data.candidates || []);
      }
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }
    } catch {}
  };

  const handleGenerate = async (format: string) => {
    if (!selectedAssessmentId || !selectedCandidateId) {
      setError("Bitte Assessment und Kandidat auswählen.");
      return;
    }
    setError("");
    setGenerating(format);

    try {
      const res = await fetch(
        `/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/reports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: selectedCandidateId,
            format,
            includeAiRecommendations: includeAi,
          }),
        }
      );

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Berichterstellung fehlgeschlagen.");
        return;
      }

      const reportsRes = await fetch(
        `/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/reports`
      );
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }
    } catch {
      setError("Berichterstellung fehlgeschlagen.");
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const res = await fetch(
        `/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/reports/${reportId}`
      );
      if (res.ok) {
        const data: ReportWithUrl = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      }
    } catch {}
  };

  const handleDelete = async (reportId: string) => {
    try {
      const res = await fetch(
        `/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/reports/${reportId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="text-white" style={{ backgroundColor: accentColor }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
              Berichte
            </span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back-dashboard"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Berichte
          </h1>
          <p className="text-sm text-slate-500">
            Assessment-Berichte erstellen, herunterladen und verwalten
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Bericht erstellen
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessment</label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => handleAssessmentChange(e.target.value)}
                data-testid="select-assessment"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
              >
                <option value="">Assessment auswählen…</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kandidat</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                disabled={!selectedAssessmentId || candidates.length === 0}
                data-testid="select-candidate"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Kandidat auswählen…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="includeAi"
              checked={includeAi}
              onChange={(e) => setIncludeAi(e.target.checked)}
              data-testid="checkbox-include-ai"
              className="rounded border-slate-300"
            />
            <label htmlFor="includeAi" className="text-sm text-slate-700">
              KI-Empfehlungen einbeziehen
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4" data-testid="text-error">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            {(["pdf", "docx", "pptx"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleGenerate(fmt)}
                disabled={!selectedAssessmentId || !selectedCandidateId || generating !== null}
                data-testid={`button-generate-${fmt}`}
                className="rounded-lg text-white text-sm font-medium px-5 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: generating === fmt ? "#999" : accentColor }}
              >
                {generating === fmt
                  ? "Wird erstellt…"
                  : `${fmt.toUpperCase()} erstellen`}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Vorhandene Berichte
          </h2>
          <p className="text-xs text-slate-400">
            {reports.length} {reports.length === 1 ? "Bericht" : "Berichte"}
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400">Laden…</p>}

        {!loading && reports.length === 0 && selectedAssessmentId && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Berichte vorhanden. Erstellen Sie einen oben.
          </div>
        )}

        {!loading && !selectedAssessmentId && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Bitte wählen Sie ein Assessment aus, um Berichte anzuzeigen.
          </div>
        )}

        <div className="space-y-3">
          {reports.map((report) => {
            const badge = FORMAT_BADGES[report.format] || FORMAT_BADGES.pdf;
            return (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between"
                data-testid={`card-report-${report.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-slate-900 text-sm">{report.title}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                      data-testid={`badge-format-${report.id}`}
                    >
                      {report.format.toUpperCase()}
                    </span>
                    {report.aiSections && report.aiSections.length > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        KI-generiert
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Version {report.version}</span>
                    {report.generatedAt && (
                      <span>
                        Erstellt:{" "}
                        {new Date(report.generatedAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.snapshotData && (
                    <button
                      onClick={() => setSnapshotModal(report.snapshotData)}
                      data-testid={`button-snapshot-${report.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Snapshot ansehen
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(report.id)}
                    data-testid={`button-download-${report.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: accentColor }}
                  >
                    Herunterladen
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    data-testid={`button-delete-${report.id}`}
                    className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1.5"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {snapshotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
              >
                Bericht-Snapshot
              </h3>
              <button
                onClick={() => setSnapshotModal(null)}
                data-testid="button-close-snapshot"
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            <SnapshotView data={snapshotModal} />
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 py-6">
        <p className="text-center text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function SnapshotView({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    candidateName?: string;
    assessmentName?: string;
    workspaceName?: string;
    generatedAt?: string;
    consolidatedScores?: Array<{
      competencyName: string;
      consolidatedValue: number;
      normalizedValue: number;
      exerciseName?: string;
    }>;
    evidenceNotes?: Array<{
      exerciseName: string;
      competencyName: string;
      observerName: string;
      notes: string;
      rating?: number;
    }>;
    aiRecommendations?: string;
  };

  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-4">
        {d.candidateName && (
          <div>
            <span className="text-xs text-slate-400">Kandidat</span>
            <p className="font-medium">{d.candidateName}</p>
          </div>
        )}
        {d.assessmentName && (
          <div>
            <span className="text-xs text-slate-400">Assessment</span>
            <p className="font-medium">{d.assessmentName}</p>
          </div>
        )}
        {d.workspaceName && (
          <div>
            <span className="text-xs text-slate-400">Workspace</span>
            <p className="font-medium">{d.workspaceName}</p>
          </div>
        )}
        {d.generatedAt && (
          <div>
            <span className="text-xs text-slate-400">Erstellt</span>
            <p className="font-medium">
              {new Date(d.generatedAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        )}
      </div>

      {d.consolidatedScores && d.consolidatedScores.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Konsolidierte Werte</h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Kompetenz</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Wert</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Normalisiert</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Übung</th>
                </tr>
              </thead>
              <tbody>
                {d.consolidatedScores.map((s, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2">{s.competencyName}</td>
                    <td className="px-3 py-2 font-mono">{s.consolidatedValue.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{s.normalizedValue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-400">{s.exerciseName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.evidenceNotes && d.evidenceNotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Evidenznotizen</h4>
          <div className="space-y-2">
            {d.evidenceNotes.map((n, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="flex gap-3 text-xs text-slate-400 mb-1">
                  <span>{n.exerciseName}</span>
                  <span>{n.competencyName}</span>
                  <span>{n.observerName}</span>
                  {n.rating != null && <span>Bewertung: {n.rating}</span>}
                </div>
                <p className="text-slate-700">{n.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.aiRecommendations && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-slate-700">KI-Empfehlungen</h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              KI-generiert
            </span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-slate-700 whitespace-pre-wrap">
            {d.aiRecommendations}
          </div>
        </div>
      )}
    </div>
  );
}
