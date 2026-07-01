"use client";

import { DocumentOriginBadge } from "@/components/shared/DocumentOriginBadge";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";


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
  pdf: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]" },
  docx: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]" },
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
    <div className="py-8 px-6 lg:px-10 space-y-6">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Berichte
          </h1>
          <p className="text-sm text-[var(--eds-text-tertiary)]">
            Assessment-Berichte erstellen, herunterladen und verwalten
          </p>
        </div>

        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 mb-8">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Bericht erstellen
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Assessment</label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => handleAssessmentChange(e.target.value)}
                data-testid="select-assessment"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:border-transparent"
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
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Kandidat</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                disabled={!selectedAssessmentId || candidates.length === 0}
                data-testid="select-candidate"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="rounded border-[var(--eds-border-strong)]"
            />
            <label htmlFor="includeAi" className="text-sm text-[var(--eds-text-primary)]">
              KI-Empfehlungen einbeziehen
            </label>
          </div>

          {error && (
            <p className="text-sm text-[var(--eds-status-red)] mb-4" data-testid="text-error">
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
// no-eds-token: loading-disabled-gray — kein exaktes EDS-Token vorhanden
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
          <p className="text-xs text-[var(--eds-text-disabled)]">
            {reports.length} {reports.length === 1 ? "Bericht" : "Berichte"}
          </p>
        </div>

        {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

        {!loading && reports.length === 0 && selectedAssessmentId && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
            Keine Berichte vorhanden. Erstellen Sie einen oben.
          </div>
        )}

        {!loading && !selectedAssessmentId && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
            Bitte wählen Sie ein Assessment aus, um Berichte anzuzeigen.
          </div>
        )}

        <div className="space-y-3">
          {reports.map((report) => {
            const badge = FORMAT_BADGES[report.format] || FORMAT_BADGES.pdf;
            return (
              <div
                key={report.id}
                className="bg-white border border-[var(--eds-border)] rounded-xl p-5 flex items-center justify-between"
                data-testid={`card-report-${report.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-[var(--eds-text-primary)] text-sm">{report.title}</h3>
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
                    <DocumentOriginBadge origin="GENERATED" />
                  </div>
                  <div className="flex gap-4 text-xs text-[var(--eds-text-disabled)]">
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
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
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
                    className="text-xs font-medium text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] px-2 py-1.5"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
                className="text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] text-xl"
              >
                ✕
              </button>
            </div>
            <SnapshotView data={snapshotModal} />
          </div>
        </div>
      )}
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
            <span className="text-xs text-[var(--eds-text-disabled)]">Kandidat</span>
            <p className="font-medium">{d.candidateName}</p>
          </div>
        )}
        {d.assessmentName && (
          <div>
            <span className="text-xs text-[var(--eds-text-disabled)]">Assessment</span>
            <p className="font-medium">{d.assessmentName}</p>
          </div>
        )}
        {d.workspaceName && (
          <div>
            <span className="text-xs text-[var(--eds-text-disabled)]">Workspace</span>
            <p className="font-medium">{d.workspaceName}</p>
          </div>
        )}
        {d.generatedAt && (
          <div>
            <span className="text-xs text-[var(--eds-text-disabled)]">Erstellt</span>
            <p className="font-medium">
              {new Date(d.generatedAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        )}
      </div>

      {d.consolidatedScores && d.consolidatedScores.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--eds-text-primary)] mb-2">Konsolidierte Werte</h4>
          <div className="border border-[var(--eds-border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--eds-bg-sunken)]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--eds-text-tertiary)]">Kompetenz</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--eds-text-tertiary)]">Wert</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--eds-text-tertiary)]">Normalisiert</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--eds-text-tertiary)]">Übung</th>
                </tr>
              </thead>
              <tbody>
                {d.consolidatedScores.map((s, i) => (
                  <tr key={i} className="border-t border-[var(--eds-border)]">
                    <td className="px-3 py-2">{s.competencyName}</td>
                    <td className="px-3 py-2 font-mono">{s.consolidatedValue.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{s.normalizedValue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-[var(--eds-text-disabled)]">{s.exerciseName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.evidenceNotes && d.evidenceNotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--eds-text-primary)] mb-2">Evidenznotizen</h4>
          <div className="space-y-2">
            {d.evidenceNotes.map((n, i) => (
              <div key={i} className="bg-[var(--eds-bg-sunken)] rounded-lg p-3">
                <div className="flex gap-3 text-xs text-[var(--eds-text-disabled)] mb-1">
                  <span>{n.exerciseName}</span>
                  <span>{n.competencyName}</span>
                  <span>{n.observerName}</span>
                  {n.rating != null && <span>Bewertung: {n.rating}</span>}
                </div>
                <p className="text-[var(--eds-text-primary)]">{n.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.aiRecommendations && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-[var(--eds-text-primary)]">KI-Empfehlungen</h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              KI-generiert
            </span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-[var(--eds-text-primary)] whitespace-pre-wrap">
            {d.aiRecommendations}
          </div>
        </div>
      )}
    </div>
  );
}
