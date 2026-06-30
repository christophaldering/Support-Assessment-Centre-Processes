"use client";

import { DocumentOriginBadge } from "@/components/shared/DocumentOriginBadge";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

interface Assessment {
  id: string;
  name: string;
}

interface Exercise {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  name: string;
}

interface AudioRecording {
  id: string;
  originalFileName: string | null;
  status: string;
  duration: number | null;
  transcript: string | null;
  aiSummary: string | null;
  aiSummaryMeta: { model?: string; timestamp?: string; aiGenerated?: boolean } | null;
  assessmentId: string | null;
  exerciseId: string | null;
  candidateId: string | null;
  retentionDays: number;
  createdAt: string;
}

const accentColor = "hsl(14, 48%, 44%)";

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  uploaded: { bg: "bg-slate-100", text: "text-slate-600", label: "Hochgeladen" },
  transcribed: { bg: "bg-blue-50", text: "text-blue-700", label: "Transkribiert" },
  summarized: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Zusammengefasst" },
  error: { bg: "bg-red-50", text: "text-red-700", label: "Fehler" },
};

const ACCEPTED_AUDIO = ".mp3,.wav,.m4a";

export default function AudioRecordingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadAssessmentId, setUploadAssessmentId] = useState("");
  const [uploadExerciseId, setUploadExerciseId] = useState("");
  const [uploadCandidateId, setUploadCandidateId] = useState("");
  const [retentionDays, setRetentionDays] = useState("90");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [transcriptModal, setTranscriptModal] = useState<{ title: string; content: string } | null>(null);
  const [summaryModal, setSummaryModal] = useState<{ title: string; content: string; meta: AudioRecording["aiSummaryMeta"] } | null>(null);

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/audio-recordings`);
      if (res.ok) setRecordings(await res.json());
    } catch {}
    setLoading(false);
  }, [workspaceSlug]);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) setAssessments(await res.json());
    } catch {}
  }, [workspaceSlug]);

  useEffect(() => {
    fetchRecordings();
    fetchAssessments();
  }, [fetchRecordings, fetchAssessments]);

  const handleAssessmentSelect = async (id: string) => {
    setUploadAssessmentId(id);
    setUploadExerciseId("");
    setUploadCandidateId("");
    setExercises([]);
    setCandidates([]);

    if (!id) return;

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
        setCandidates(data.candidates || []);
      }
    } catch {}
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Bitte wählen Sie eine Datei aus.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const createRes = await fetch(`/api/w/${workspaceSlug}/audio-recordings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFileName: file.name,
          assessmentId: uploadAssessmentId || undefined,
          exerciseId: uploadExerciseId || undefined,
          candidateId: uploadCandidateId || undefined,
          retentionDays: parseInt(retentionDays) || 90,
        }),
      });

      if (!createRes.ok) {
        const d = await createRes.json();
        setUploadError(d.error || "Fehler beim Erstellen der Aufnahme.");
        return;
      }

      const { uploadUrl } = await createRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });

      if (!uploadRes.ok) {
        setUploadError("Datei-Upload fehlgeschlagen.");
        return;
      }

      setUploadSuccess(`"${file.name}" erfolgreich hochgeladen.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchRecordings();
    } catch {
      setUploadError("Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (recordingId: string, action: "transcribe" | "summarize") => {
    setProcessingId(recordingId);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/audio-recordings/${recordingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchRecordings();
      }
    } catch {}
    setProcessingId(null);
  };

  const handleDelete = async (recordingId: string) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/audio-recordings/${recordingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
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
            Audioaufnahmen
          </h1>
          <p className="text-sm text-slate-500">
            Audioaufnahmen hochladen, transkribieren und zusammenfassen
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Audio hochladen
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Audiodatei *</label>
              <input
                type="file"
                accept={ACCEPTED_AUDIO}
                ref={fileInputRef}
                data-testid="input-audio-file"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white file:cursor-pointer"
                style={{ "--file-bg": accentColor } as React.CSSProperties}
              />
              <style>{`input[type="file"]::file-selector-button { background-color: ${accentColor}; }`}</style>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aufbewahrung (Tage)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                min={1}
                max={365}
                data-testid="input-retention-days"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessment (optional)</label>
              <select
                value={uploadAssessmentId}
                onChange={(e) => handleAssessmentSelect(e.target.value)}
                data-testid="select-upload-assessment"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2"
              >
                <option value="">Kein Assessment</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Übung (optional)</label>
              <select
                value={uploadExerciseId}
                onChange={(e) => setUploadExerciseId(e.target.value)}
                disabled={!uploadAssessmentId}
                data-testid="select-upload-exercise"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 disabled:opacity-50"
              >
                <option value="">Keine Übung</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kandidat (optional)</label>
              <select
                value={uploadCandidateId}
                onChange={(e) => setUploadCandidateId(e.target.value)}
                disabled={!uploadAssessmentId}
                data-testid="select-upload-candidate"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 disabled:opacity-50"
              >
                <option value="">Kein Kandidat</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {uploadError && (
            <p className="text-sm text-red-500 mb-3" data-testid="text-upload-error">
              {uploadError}
            </p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-emerald-600 mb-3" data-testid="text-upload-success">
              {uploadSuccess}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            data-testid="button-upload"
            className="rounded-lg text-white text-sm font-medium px-5 py-2 transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {uploading ? "Wird hochgeladen…" : "Hochladen"}
          </button>
        </div>

        <div className="mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
          >
            Aufnahmen
          </h2>
          <p className="text-xs text-slate-400">
            {recordings.length} {recordings.length === 1 ? "Aufnahme" : "Aufnahmen"}
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400">Laden…</p>}

        {!loading && recordings.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Aufnahmen vorhanden.
          </div>
        )}

        <div className="space-y-3">
          {recordings.map((rec) => {
            const badge = STATUS_BADGES[rec.status] || STATUS_BADGES.uploaded;
            const isProcessing = processingId === rec.id;

            return (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-xl p-5"
                data-testid={`card-recording-${rec.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-slate-900 text-sm">
                        {rec.originalFileName || "Unbenannt"}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                        data-testid={`badge-status-${rec.id}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      {rec.duration != null && <span>{rec.duration}s</span>}
                      <span>
                        {new Date(rec.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span>Aufbewahrung: {rec.retentionDays} Tage</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleProcess(rec.id, "transcribe")}
                      disabled={isProcessing}
                      data-testid={`button-transcribe-${rec.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? "…" : "Transkribieren"}
                    </button>
                    {rec.transcript && (
                      <button
                        onClick={() => handleProcess(rec.id, "summarize")}
                        disabled={isProcessing}
                        data-testid={`button-summarize-${rec.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        Zusammenfassen
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rec.id)}
                      data-testid={`button-delete-${rec.id}`}
                      className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1.5"
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {rec.transcript && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">Transkript</span>
                      <button
                        onClick={() =>
                          setTranscriptModal({
                            title: rec.originalFileName || "Transkript",
                            content: rec.transcript!,
                          })
                        }
                        data-testid={`button-view-transcript-${rec.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Vollständig anzeigen
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 line-clamp-2">
                      {rec.transcript.substring(0, 200)}
                      {rec.transcript.length > 200 ? "…" : ""}
                    </p>
                  </div>
                )}

                {rec.aiSummary && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">Zusammenfassung</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        KI-generiert
                      </span>
                      <button
                        onClick={() =>
                          setSummaryModal({
                            title: rec.originalFileName || "Zusammenfassung",
                            content: rec.aiSummary!,
                            meta: rec.aiSummaryMeta,
                          })
                        }
                        data-testid={`button-view-summary-${rec.id}`}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Vollständig anzeigen
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 bg-purple-50 rounded-lg p-2 line-clamp-2">
                      {rec.aiSummary.substring(0, 200)}
                      {rec.aiSummary.length > 200 ? "…" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      {transcriptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
              >
                Transkript: {transcriptModal.title}
              </h3>
              <button
                onClick={() => setTranscriptModal(null)}
                data-testid="button-close-transcript"
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-4">
              {transcriptModal.content}
            </div>
          </div>
        </div>
      )}

      {summaryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}
                >
                  Zusammenfassung: {summaryModal.title}
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  KI-generiert
                </span>
              </div>
              <button
                onClick={() => setSummaryModal(null)}
                data-testid="button-close-summary"
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            {summaryModal.meta && (
              <div className="flex gap-4 text-xs text-slate-400 mb-3">
                {summaryModal.meta.model && <span>Modell: {summaryModal.meta.model}</span>}
                {summaryModal.meta.timestamp && (
                  <span>
                    Erstellt: {new Date(summaryModal.meta.timestamp).toLocaleDateString("de-DE")}
                  </span>
                )}
              </div>
            )}
            <div className="text-sm text-slate-700 whitespace-pre-wrap bg-purple-50 rounded-lg p-4">
              {summaryModal.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
