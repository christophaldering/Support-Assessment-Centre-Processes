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
  sortOrder: number;
  createdAt: string;
}

interface SelfAssessmentItem {
  id: string;
  title: string;
  description: string | null;
  schemaJson: any;
  releaseStatus: string;
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

  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadExerciseId, setUploadExerciseId] = useState("");
  const [uploadRelease, setUploadRelease] = useState("locked");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showCreateSA, setShowCreateSA] = useState(false);
  const [saTitle, setSaTitle] = useState("");
  const [saDescription, setSaDescription] = useState("");
  const [saCreating, setSaCreating] = useState(false);

  const apiBase = `/api/w/${workspaceSlug}/assessments/${assessmentId}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, saRes] = await Promise.all([
        fetch(`${apiBase}/portal-documents`),
        fetch(`${apiBase}/self-assessments`),
      ]);
      if (docsRes.ok) setPortalDocs(await docsRes.json());
      if (saRes.ok) setSelfAssessments(await saRes.json());
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
      formData.append("releaseStatus", uploadRelease);
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
        setUploadFile(null);
        loadData();
      }
    } catch {}
    setUploading(false);
  };

  const toggleRelease = async (doc: PortalDoc) => {
    const newStatus = doc.releaseStatus === "released" ? "locked" : "released";
    await fetch(`${apiBase}/portal-documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseStatus: newStatus }),
    });
    loadData();
  };

  const deleteDoc = async (id: string) => {
    await fetch(`${apiBase}/portal-documents/${id}`, { method: "DELETE" });
    loadData();
  };

  const toggleSARelease = async (sa: SelfAssessmentItem) => {
    const newStatus = sa.releaseStatus === "released" ? "locked" : "released";
    await fetch(`${apiBase}/self-assessments/${sa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseStatus: newStatus }),
    });
    loadData();
  };

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
              <label className="block text-xs font-medium text-slate-600 mb-1">Freigabestatus</label>
              <select
                value={uploadRelease}
                onChange={e => setUploadRelease(e.target.value)}
                data-testid="select-portal-doc-release"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
              >
                <option value="locked">Gesperrt</option>
                <option value="released">Freigegeben</option>
              </select>
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
            {group.docs.map(doc => (
              <div key={doc.id} className="px-5 py-3 flex items-center gap-4" data-testid={`portal-doc-${doc.id}`}>
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
                  </div>
                </div>
                <button
                  onClick={() => toggleRelease(doc)}
                  data-testid={`toggle-release-${doc.id}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    doc.releaseStatus === "released"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {doc.releaseStatus === "released" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Freigegeben
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Gesperrt
                    </>
                  )}
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
            ))}
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

        {selfAssessments.map(sa => (
          <div key={sa.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-4 mb-3" data-testid={`sa-item-${sa.id}`}>
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
              onClick={() => toggleSARelease(sa)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                sa.releaseStatus === "released"
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {sa.releaseStatus === "released" ? "Freigegeben" : "Gesperrt"}
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
        ))}
      </div>
    </div>
  );
}
