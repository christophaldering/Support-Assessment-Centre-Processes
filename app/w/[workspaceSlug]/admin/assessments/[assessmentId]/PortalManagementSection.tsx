"use client";

import { useEffect, useState, useCallback } from "react";

interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
}

interface PortalDoc {
  id: string;
  assessmentId: string;
  exerciseId: string | null;
  category: string;
  title: string;
  description: string | null;
  objectPath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  releaseStatus: string;
  releasedAt: string | null;
  alwaysAvailable: boolean;
  releaseStart: string | null;
  releaseEnd: string | null;
  downloadAllowed: boolean;
  sortOrder: number;
  createdAt: string;
}

interface SelfAssessmentItem {
  id: string;
  title: string;
  description: string | null;
  schemaJson: any;
  releaseStatus: string;
  alwaysAvailable?: boolean;
  releaseStart?: string | null;
  releaseEnd?: string | null;
  responses?: { id: string; candidateId: string; status: string; submittedAt: string | null }[];
}

const CATEGORIES = [
  { value: "general", label: "Allgemeine Dokumente" },
  { value: "exercise", label: "Übungsbezogen" },
  { value: "preparation", label: "Vorbereitung" },
  { value: "info", label: "Informationsmaterial" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PhaseItem {
  id: string;
  label: string;
  unlocked: boolean;
}

export default function PortalManagementSection({
  workspaceSlug,
  assessmentId,
  exercises,
}: {
  workspaceSlug: string;
  assessmentId: string;
  exercises: ExerciseRecord[];
}) {
  const [portalDocs, setPortalDocs] = useState<PortalDoc[]>([]);
  const [selfAssessments, setSelfAssessments] = useState<SelfAssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [togglingPhase, setTogglingPhase] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadExerciseId, setUploadExerciseId] = useState("");
  const [uploadRelease, setUploadRelease] = useState("locked");
  const [uploadAlwaysAvailable, setUploadAlwaysAvailable] = useState(false);
  const [uploadReleaseStart, setUploadReleaseStart] = useState("");
  const [uploadReleaseEnd, setUploadReleaseEnd] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ alwaysAvailable: false, releaseStart: "", releaseEnd: "", releaseStatus: "locked", downloadAllowed: true });

  const [showCreateSA, setShowCreateSA] = useState(false);
  const [saTitle, setSaTitle] = useState("");
  const [saDescription, setSaDescription] = useState("");
  const [saCreating, setSaCreating] = useState(false);

  const apiBase = `/api/w/${workspaceSlug}/assessments/${assessmentId}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, saRes, phasesRes] = await Promise.all([
        fetch(`${apiBase}/portal-documents`),
        fetch(`${apiBase}/self-assessments`),
        fetch(`${apiBase}/phases`),
      ]);
      if (docsRes.ok) setPortalDocs(await docsRes.json());
      if (saRes.ok) setSelfAssessments(await saRes.json());
      if (phasesRes.ok) {
        const data = await phasesRes.json();
        setPhases(data.phases || []);
      }
    } catch {}
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async () => {
    if (!uploadTitle) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);
      formData.append("description", uploadDescription);
      const effectiveRelease = uploadAlwaysAvailable ? "released" : (uploadReleaseStart ? "scheduled" : "locked");
      formData.append("releaseStatus", effectiveRelease);
      formData.append("alwaysAvailable", String(uploadAlwaysAvailable));
      if (uploadReleaseStart) formData.append("releaseStart", uploadReleaseStart);
      if (uploadReleaseEnd) formData.append("releaseEnd", uploadReleaseEnd);
      if (uploadExerciseId) formData.append("exerciseId", uploadExerciseId);
      if (uploadFile) formData.append("file", uploadFile);

      const res = await fetch(`${apiBase}/portal-documents`, { method: "POST", body: formData });
      if (res.ok) {
        setShowUpload(false);
        setUploadTitle("");
        setUploadDescription("");
        setUploadCategory("general");
        setUploadExerciseId("");
        setUploadRelease("locked");
        setUploadAlwaysAvailable(false);
        setUploadReleaseStart("");
        setUploadReleaseEnd("");
        setUploadFile(null);
        loadData();
      }
    } catch {}
    setUploading(false);
  };

  const openScheduleEditor = (doc: PortalDoc) => {
    setEditingSchedule(doc.id);
    setScheduleForm({
      alwaysAvailable: doc.alwaysAvailable,
      releaseStart: doc.releaseStart ? doc.releaseStart.slice(0, 16) : "",
      releaseEnd: doc.releaseEnd ? doc.releaseEnd.slice(0, 16) : "",
      releaseStatus: doc.releaseStatus,
      downloadAllowed: doc.downloadAllowed !== false,
    });
  };

  const saveSchedule = async (docId: string) => {
    let releaseStatus = "locked";
    if (scheduleForm.alwaysAvailable) releaseStatus = "released";
    else if (scheduleForm.releaseStart) releaseStatus = "scheduled";
    await fetch(`${apiBase}/portal-documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alwaysAvailable: scheduleForm.alwaysAvailable,
        releaseStatus,
        releaseStart: scheduleForm.releaseStart || null,
        releaseEnd: scheduleForm.releaseEnd || null,
        downloadAllowed: scheduleForm.downloadAllowed,
      }),
    });
    setEditingSchedule(null);
    loadData();
  };

  function getScheduleLabel(doc: PortalDoc): { text: string; color: string } {
    if (doc.alwaysAvailable) return { text: "Immer zugänglich", color: "bg-blue-50 text-blue-700" };
    const now = new Date();
    if (doc.releaseStart || doc.releaseEnd) {
      const start = doc.releaseStart ? new Date(doc.releaseStart) : null;
      const end = doc.releaseEnd ? new Date(doc.releaseEnd) : null;
      const afterStart = !start || now >= start;
      const beforeEnd = !end || now <= end;
      if (afterStart && beforeEnd) {
        if (end) return { text: `Aktiv bis ${end.toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`, color: "bg-emerald-50 text-emerald-700" };
        return { text: "Freigegeben (offen)", color: "bg-emerald-50 text-emerald-700" };
      }
      if (start && now < start) return { text: `Ab ${start.toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`, color: "bg-amber-50 text-amber-700" };
      return { text: "Zeitfenster abgelaufen", color: "bg-slate-100 text-slate-500" };
    }
    if (doc.releaseStatus === "released") return { text: "Freigegeben", color: "bg-emerald-50 text-emerald-700" };
    return { text: "Gesperrt", color: "bg-slate-100 text-slate-500" };
  }

  const deleteDoc = async (id: string) => {
    await fetch(`${apiBase}/portal-documents/${id}`, { method: "DELETE" });
    loadData();
  };

  const [editingSASchedule, setEditingSASchedule] = useState<string | null>(null);
  const [saScheduleForm, setSAScheduleForm] = useState({ alwaysAvailable: false, releaseStart: "", releaseEnd: "", releaseStatus: "locked" });

  const openSAScheduleEditor = (sa: SelfAssessmentItem) => {
    setEditingSASchedule(sa.id);
    setSAScheduleForm({
      alwaysAvailable: sa.alwaysAvailable || false,
      releaseStart: sa.releaseStart ? sa.releaseStart.slice(0, 16) : "",
      releaseEnd: sa.releaseEnd ? sa.releaseEnd.slice(0, 16) : "",
      releaseStatus: sa.releaseStatus,
    });
  };

  const saveSASchedule = async (saId: string) => {
    let releaseStatus = "locked";
    if (saScheduleForm.alwaysAvailable) releaseStatus = "released";
    else if (saScheduleForm.releaseStart) releaseStatus = "scheduled";
    await fetch(`${apiBase}/self-assessments/${saId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alwaysAvailable: saScheduleForm.alwaysAvailable,
        releaseStatus,
        releaseStart: saScheduleForm.releaseStart || null,
        releaseEnd: saScheduleForm.releaseEnd || null,
      }),
    });
    setEditingSASchedule(null);
    loadData();
  };

  function getSAScheduleLabel(sa: SelfAssessmentItem): { text: string; color: string } {
    if (sa.alwaysAvailable) return { text: "Immer zugänglich", color: "bg-blue-50 text-blue-700" };
    const now = new Date();
    if (sa.releaseStart || sa.releaseEnd) {
      const start = sa.releaseStart ? new Date(sa.releaseStart) : null;
      const end = sa.releaseEnd ? new Date(sa.releaseEnd) : null;
      const afterStart = !start || now >= start;
      const beforeEnd = !end || now <= end;
      if (afterStart && beforeEnd) {
        if (end) return { text: `Aktiv bis ${end.toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`, color: "bg-emerald-50 text-emerald-700" };
        return { text: "Freigegeben (offen)", color: "bg-emerald-50 text-emerald-700" };
      }
      if (start && now < start) return { text: `Ab ${start.toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`, color: "bg-amber-50 text-amber-700" };
      return { text: "Zeitfenster abgelaufen", color: "bg-slate-100 text-slate-500" };
    }
    if (sa.releaseStatus === "released") return { text: "Freigegeben", color: "bg-emerald-50 text-emerald-700" };
    return { text: "Gesperrt", color: "bg-slate-100 text-slate-500" };
  }

  const handleCreateSA = async () => {
    if (!saTitle) return;
    setSaCreating(true);
    try {
      const res = await fetch(`${apiBase}/self-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saTitle,
          description: saDescription,
          schemaJson: {
            type: "self_assessment",
            sections: [
              {
                title: "Selbsteinschätzung",
                items: [
                  { type: "rating", label: "Wie schätzen Sie Ihre Führungskompetenz ein?", scale: "1-5" },
                  { type: "text", label: "Beschreiben Sie Ihre größte berufliche Herausforderung." },
                  { type: "rating", label: "Wie bewerten Sie Ihre Kommunikationsfähigkeit?", scale: "1-5" },
                ],
              },
            ],
          },
        }),
      });
      if (res.ok) {
        setShowCreateSA(false);
        setSaTitle("");
        setSaDescription("");
        loadData();
      }
    } catch {}
    setSaCreating(false);
  };

  const deleteSA = async (id: string) => {
    await fetch(`${apiBase}/self-assessments/${id}`, { method: "DELETE" });
    loadData();
  };

  const handleTogglePhase = async (phaseId: string, unlocked: boolean) => {
    setTogglingPhase(phaseId);
    try {
      const res = await fetch(`${apiBase}/phases`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: phaseId, unlocked }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhases(data.phases || []);
      }
    } catch {}
    setTogglingPhase(null);
  };

  const phaseDescriptions: Record<string, string> = {
    preparation: "Dokumente, Informationsmaterial und Fragebögen werden für Kandidaten sichtbar",
    execution: "Bausteine (Übungen) werden für Kandidaten sichtbar und zugänglich",
    followup: "Nachbereitungsmaterial und Feedback-Dokumente werden freigeschaltet",
  };

  const phaseIcons: Record<string, string> = {
    preparation: "book",
    execution: "play",
    followup: "check",
  };

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    docs: portalDocs.filter(d => d.category === cat.value),
  })).filter(g => g.docs.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <h3 className="text-sm font-semibold text-brand-navy">Phasen-Steuerung</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Schalten Sie die einzelnen Phasen frei, um Inhalte für Kandidaten schrittweise sichtbar zu machen.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {phases.map((phase, idx) => (
            <div key={phase.id} className="px-5 py-4 flex items-center gap-4" data-testid={`phase-control-${phase.id}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${phase.unlocked ? "bg-emerald-50" : "bg-slate-100"}`}>
                <span className={`text-sm font-bold ${phase.unlocked ? "text-emerald-600" : "text-slate-400"}`}>{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${phase.unlocked ? "text-brand-navy" : "text-slate-600"}`}>{phase.label}</p>
                <p className="text-xs text-slate-400">{phaseDescriptions[phase.id] || ""}</p>
              </div>
              <button
                onClick={() => handleTogglePhase(phase.id, !phase.unlocked)}
                disabled={togglingPhase === phase.id}
                data-testid={`toggle-phase-${phase.id}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${
                  phase.unlocked ? "bg-emerald-500" : "bg-slate-300"
                } ${togglingPhase === phase.id ? "opacity-50" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    phase.unlocked ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
          {phases.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-slate-400">Phasen werden geladen...</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Kandidatenportal</h2>
          <p className="text-sm text-slate-500">Verwalten Sie die Dokumente und Fragebögen, die Kandidaten im Portal sehen</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          data-testid="button-add-portal-doc"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-navy text-white text-sm font-medium px-4 py-2 hover:bg-brand-navy/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Dokument hinzufügen
        </button>
      </div>

      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-brand-navy">Neues Portal-Dokument</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
              <input
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                data-testid="input-portal-doc-title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
                placeholder="z.B. Ablaufplan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kategorie</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                data-testid="select-portal-doc-category"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Übungszuordnung</label>
              <select
                value={uploadExerciseId}
                onChange={e => setUploadExerciseId(e.target.value)}
                data-testid="select-portal-doc-exercise"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
              >
                <option value="">Keine (Allgemein)</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Freigabe</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadAlwaysAvailable}
                    onChange={e => { setUploadAlwaysAvailable(e.target.checked); if (e.target.checked) { setUploadReleaseStart(""); setUploadReleaseEnd(""); } }}
                    data-testid="checkbox-always-available"
                    className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                  />
                  <span className="text-sm text-slate-700">Immer zugänglich</span>
                </label>
                {!uploadAlwaysAvailable && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Von</label>
                      <input type="datetime-local" value={uploadReleaseStart} onChange={e => setUploadReleaseStart(e.target.value)}
                        data-testid="input-release-start"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Bis</label>
                      <input type="datetime-local" value={uploadReleaseEnd} onChange={e => setUploadReleaseEnd(e.target.value)}
                        data-testid="input-release-end"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Beschreibung</label>
            <textarea
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
              data-testid="input-portal-doc-description"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none resize-none"
              rows={2}
              placeholder="Optionale Beschreibung für den Kandidaten"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Datei</label>
            <input
              type="file"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              data-testid="input-portal-doc-file"
              className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleUpload}
              disabled={!uploadTitle || uploading}
              data-testid="button-save-portal-doc"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Wird gespeichert…" : "Speichern"}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {grouped.length === 0 && portalDocs.length === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-slate-500">Noch keine Portal-Dokumente vorhanden.</p>
          <p className="text-xs text-slate-400 mt-1">Fügen Sie Ablaufpläne, Übungsdokumente oder Informationen für Kandidaten hinzu.</p>
        </div>
      )}

      {grouped.map(group => (
        <div key={group.value} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-brand-navy">{group.label}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {group.docs.map(doc => {
              const label = getScheduleLabel(doc);
              return (
                <div key={doc.id} data-testid={`portal-doc-${doc.id}`}>
                  <div className="px-5 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {doc.objectPath ? (
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {doc.fileName && <span>{doc.fileName}</span>}
                        {doc.fileSize && <span>· {formatFileSize(doc.fileSize)}</span>}
                        {doc.exerciseId && (
                          <span>· {exercises.find(e => e.id === doc.exerciseId)?.name || "Übung"}</span>
                        )}
                        {doc.downloadAllowed === false && (
                          <span className="text-amber-500">· Nur Ansicht</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openScheduleEditor(doc)}
                      data-testid={`schedule-${doc.id}`}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer ${label.color} hover:opacity-80`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {label.text}
                    </button>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      data-testid={`delete-portal-doc-${doc.id}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  {editingSchedule === doc.id && (
                    <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          Zeitplan bearbeiten
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scheduleForm.alwaysAvailable}
                            onChange={e => setScheduleForm(f => ({ ...f, alwaysAvailable: e.target.checked, releaseStart: e.target.checked ? "" : f.releaseStart, releaseEnd: e.target.checked ? "" : f.releaseEnd }))}
                            data-testid={`checkbox-always-${doc.id}`}
                            className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                          />
                          <span className="text-sm text-slate-700">Immer zugänglich</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scheduleForm.downloadAllowed}
                            onChange={e => setScheduleForm(f => ({ ...f, downloadAllowed: e.target.checked }))}
                            data-testid={`checkbox-download-${doc.id}`}
                            className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                          />
                          <span className="text-sm text-slate-700">Download erlaubt</span>
                          {!scheduleForm.downloadAllowed && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Nur Ansicht</span>
                          )}
                        </label>
                        {!scheduleForm.alwaysAvailable && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Freigabe von</label>
                              <input type="datetime-local" value={scheduleForm.releaseStart} onChange={e => setScheduleForm(f => ({ ...f, releaseStart: e.target.value }))}
                                data-testid={`input-start-${doc.id}`}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none bg-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Freigabe bis</label>
                              <input type="datetime-local" value={scheduleForm.releaseEnd} onChange={e => setScheduleForm(f => ({ ...f, releaseEnd: e.target.value }))}
                                data-testid={`input-end-${doc.id}`}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none bg-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => saveSchedule(doc.id)} data-testid={`save-schedule-${doc.id}`}
                            className="rounded-lg bg-brand-blue text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-blue/90 transition-colors">
                            Speichern
                          </button>
                          <button onClick={() => setEditingSchedule(null)}
                            className="text-xs text-slate-500 hover:text-slate-700">
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-brand-navy">Fragebögen & Tests</h3>
            <p className="text-xs text-slate-500">Selbsteinschätzungen und Fragebögen für Kandidaten</p>
          </div>
          <button
            onClick={() => setShowCreateSA(true)}
            data-testid="button-add-self-assessment"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Fragebogen erstellen
          </button>
        </div>

        {showCreateSA && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 mb-4">
            <h3 className="text-sm font-semibold text-brand-navy">Neuer Fragebogen</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
              <input
                value={saTitle}
                onChange={e => setSaTitle(e.target.value)}
                data-testid="input-sa-title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
                placeholder="z.B. Selbsteinschätzung"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Beschreibung</label>
              <textarea
                value={saDescription}
                onChange={e => setSaDescription(e.target.value)}
                data-testid="input-sa-description"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateSA}
                disabled={!saTitle || saCreating}
                data-testid="button-save-sa"
                className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
              >
                {saCreating ? "Wird erstellt…" : "Erstellen"}
              </button>
              <button onClick={() => setShowCreateSA(false)} className="text-sm text-slate-500 hover:text-slate-700">
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {selfAssessments.length === 0 && !showCreateSA && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-8 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p className="text-sm text-slate-500">Keine Fragebögen erstellt.</p>
          </div>
        )}

        {selfAssessments.map(sa => {
          const saLabel = getSAScheduleLabel(sa);
          return (
            <div key={sa.id} className="bg-white border border-slate-200 rounded-xl mb-3 overflow-hidden" data-testid={`sa-item-${sa.id}`}>
              <div className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{sa.title}</p>
                  {sa.description && <p className="text-xs text-slate-400">{sa.description}</p>}
                  {sa.responses && sa.responses.length > 0 && (
                    <p className="text-xs text-purple-500 mt-0.5">{sa.responses.filter(r => r.status === "submitted").length} / {sa.responses.length} eingereicht</p>
                  )}
                </div>
                <button
                  onClick={() => openSAScheduleEditor(sa)}
                  data-testid={`sa-schedule-${sa.id}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer ${saLabel.color} hover:opacity-80`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {saLabel.text}
                </button>
                <button
                  onClick={() => deleteSA(sa.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              {editingSASchedule === sa.id && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Zeitplan bearbeiten
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={saScheduleForm.alwaysAvailable}
                        onChange={e => setSAScheduleForm(f => ({ ...f, alwaysAvailable: e.target.checked, releaseStart: e.target.checked ? "" : f.releaseStart, releaseEnd: e.target.checked ? "" : f.releaseEnd }))}
                        data-testid={`sa-checkbox-always-${sa.id}`}
                        className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30" />
                      <span className="text-sm text-slate-700">Immer zugänglich</span>
                    </label>
                    {!saScheduleForm.alwaysAvailable && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Freigabe von</label>
                          <input type="datetime-local" value={saScheduleForm.releaseStart} onChange={e => setSAScheduleForm(f => ({ ...f, releaseStart: e.target.value }))}
                            data-testid={`sa-input-start-${sa.id}`}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Freigabe bis</label>
                          <input type="datetime-local" value={saScheduleForm.releaseEnd} onChange={e => setSAScheduleForm(f => ({ ...f, releaseEnd: e.target.value }))}
                            data-testid={`sa-input-end-${sa.id}`}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none bg-white" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => saveSASchedule(sa.id)} data-testid={`sa-save-schedule-${sa.id}`}
                        className="rounded-lg bg-brand-blue text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-blue/90 transition-colors">
                        Speichern
                      </button>
                      <button onClick={() => setEditingSASchedule(null)} className="text-xs text-slate-500 hover:text-slate-700">
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
