"use client";

import { DocumentRecord, PortalDocRecord, ExerciseRecord } from "./types";

interface DocumentsSectionProps {
  documents: DocumentRecord[];
  portalDocs: PortalDocRecord[];
  exercises: ExerciseRecord[];
  EXERCISE_TYPE_LABELS: Record<string, string>;
  docUploadSection: string | null;
  setDocUploadSection: (val: string | null) => void;
  docName: string;
  setDocName: (val: string) => void;
  docFile: File | null;
  setDocFile: (val: File | null) => void;
  uploadError: string;
  setUploadError: (val: string) => void;
  uploading: boolean;
  handleUploadPortalDoc: (exerciseId: string | null, category: string) => void;
  handleViewDocument: (id: string, name: string) => void;
  handleDownloadDocument: (id: string) => void;
  handleTogglePortalDocRelease: (doc: PortalDocRecord) => void;
  handleDeletePortalDoc: (id: string) => void;
  handleDeleteDocument: (id: string) => void;
  formatFileSize: (bytes: number) => string;
}

const exerciseTypeIcons: Record<string, string> = {
  presentation: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  interview: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  interview_guide: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  group_discussion: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  case_study: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  role_play: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  behavior_simulation: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  fact_finding: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  in_tray: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  psychometric: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  psychometric_test: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  self_reflection: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  other: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
};

export default function DocumentsSection({
  documents,
  portalDocs,
  exercises,
  EXERCISE_TYPE_LABELS,
  docUploadSection,
  setDocUploadSection,
  docName,
  setDocName,
  docFile,
  setDocFile,
  uploadError,
  setUploadError,
  uploading,
  handleUploadPortalDoc,
  handleViewDocument,
  handleDownloadDocument,
  handleTogglePortalDocRelease,
  handleDeletePortalDoc,
  handleDeleteDocument,
  formatFileSize,
}: DocumentsSectionProps) {
  const generalLegacy = documents.filter(d => !d.exerciseId);
  const generalPortal = portalDocs.filter(d => d.category === "general" && !d.exerciseId);
  const prepPortal = portalDocs.filter(d => d.category === "preparation");
  const infoPortal = portalDocs.filter(d => d.category === "info");

  const renderUploadForm = (sectionKey: string, exerciseId: string | null, category: string) => {
    if (docUploadSection !== sectionKey) return null;
    return (
      <div className="border border-[var(--eds-border)] rounded-lg p-4 mt-3 bg-[var(--eds-bg-sunken)]" data-testid={`upload-form-${sectionKey}`}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Name *</label>
            <input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              data-testid={`input-doc-name-${sectionKey}`}
              className="w-full border border-[var(--eds-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
              placeholder="z.B. Aufgabenstellung"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Datei *</label>
            <input
              type="file"
              onChange={e => setDocFile(e.target.files?.[0] || null)}
              data-testid={`input-doc-file-${sectionKey}`}
              className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20"
            />
          </div>
        </div>
        {uploadError && <p className="text-sm text-[var(--eds-status-red)] mb-2">{uploadError}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => handleUploadPortalDoc(exerciseId, category)}
            disabled={!docName.trim() || !docFile || uploading}
            data-testid={`button-upload-${sectionKey}`}
            className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Wird hochgeladen…" : "Hochladen"}
          </button>
          <button
            onClick={() => { setDocUploadSection(null); setDocName(""); setDocFile(null); setUploadError(""); }}
            className="text-sm text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  };

  const renderDocRow = (doc: PortalDocRecord | DocumentRecord, isPortal: boolean) => {
    const title = isPortal ? (doc as PortalDocRecord).title : (doc as DocumentRecord).name;
    const fileName = isPortal ? (doc as PortalDocRecord).fileName : (doc as DocumentRecord).fileName;
    const fileSize = isPortal ? (doc as PortalDocRecord).fileSize : (doc as DocumentRecord).fileSize;
    const mimeType = isPortal ? (doc as PortalDocRecord).mimeType : (doc as DocumentRecord).mimeType;
    const releaseStatus = isPortal ? (doc as PortalDocRecord).releaseStatus : null;
    const isPdf = mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");

    return (
      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--eds-bg-sunken)]/50 transition-colors" data-testid={`doc-item-${doc.id}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-[var(--eds-status-red-bg)]" : "bg-[var(--eds-bg-sunken)]"}`}>
          {isPdf ? (
            <svg className="w-4 h-4 text-[var(--eds-status-red)]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/></svg>
          ) : (
            <svg className="w-4 h-4 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--eds-text-primary)] truncate">{title}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--eds-text-disabled)]">
            {fileName && <span>{fileName}</span>}
            {fileSize != null && fileSize > 0 && <span>· {formatFileSize(fileSize)}</span>}
            {isPdf && <span className="text-[var(--eds-status-red)] font-medium">PDF</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isPdf && !isPortal && (
            <button
              onClick={() => handleViewDocument(doc.id, fileName || title || "Dokument")}
              data-testid={`button-view-${doc.id}`}
              className="text-xs text-brand-blue hover:text-brand-navy font-medium px-2 py-1 rounded hover:bg-brand-blue/5 transition-colors"
            >
              Anzeigen
            </button>
          )}
          {isPortal && (
            <button
              onClick={() => handleTogglePortalDocRelease(doc as PortalDocRecord)}
              data-testid={`toggle-release-${doc.id}`}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                releaseStatus === "released"
                  ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] hover:bg-[var(--eds-status-green-bg)]"
                  : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)] hover:bg-[var(--eds-border)]"
              }`}
            >
              {releaseStatus === "released" ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>Freigegeben</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>Gesperrt</>
              )}
            </button>
          )}
          <button
            onClick={() => handleDownloadDocument(doc.id)}
            data-testid={`button-download-${doc.id}`}
            className="text-xs text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] font-medium px-2 py-1 rounded hover:bg-[var(--eds-bg-sunken)] transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => isPortal ? handleDeletePortalDoc(doc.id) : handleDeleteDocument(doc.id)}
            data-testid={`button-delete-${doc.id}`}
            className="text-[var(--eds-text-disabled)] hover:text-[var(--eds-status-red)] transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="section-documents">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy" data-testid="heading-documents">Dokumente & Bausteine</h2>
          <p className="text-sm text-[var(--eds-text-tertiary)]">Alle Dokumente gruppiert nach Baustein. Portal-Dokumente können für Kandidaten freigegeben werden.</p>
        </div>
      </div>

      <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-[var(--eds-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <h3 className="text-sm font-semibold text-brand-navy">Allgemeine Dokumente</h3>
            <span className="text-xs text-[var(--eds-text-disabled)] ml-1">{generalLegacy.length + generalPortal.length}</span>
          </div>
          <button
            onClick={() => { setDocUploadSection(docUploadSection === "general" ? null : "general"); setDocName(""); setDocFile(null); setUploadError(""); }}
            data-testid="button-add-general-doc"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Hinzufügen
          </button>
        </div>
        <div className="divide-y divide-[var(--eds-border)]">
          {generalPortal.map(d => renderDocRow(d, true))}
          {generalLegacy.map(d => renderDocRow(d, false))}
          {generalLegacy.length === 0 && generalPortal.length === 0 && (
            <p className="px-5 py-6 text-sm text-[var(--eds-text-disabled)] text-center">Keine allgemeinen Dokumente vorhanden</p>
          )}
        </div>
        {renderUploadForm("general", null, "general")}
      </div>

      {exercises.map(ex => {
        const exPortalDocs = portalDocs.filter(d => d.exerciseId === ex.id);
        const exLegacyDocs = documents.filter(d => d.exerciseId === ex.id);
        const total = exPortalDocs.length + exLegacyDocs.length;
        const released = exPortalDocs.filter(d => d.releaseStatus === "released").length;
        const sectionKey = `exercise-${ex.id}`;

        return (
          <div key={ex.id} className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden" data-testid={`doc-section-${ex.id}`}>
            <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-[var(--eds-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={exerciseTypeIcons[ex.type] || exerciseTypeIcons.other} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-navy">{ex.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--eds-text-disabled)]">
                    <span>{EXERCISE_TYPE_LABELS[ex.type] || ex.type}</span>
                    {ex.duration && <span>· {ex.duration} Min.</span>}
                    <span>· {total} Dok.</span>
                    {released > 0 && <span className="text-emerald-500">· {released} freigegeben</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setDocUploadSection(docUploadSection === sectionKey ? null : sectionKey); setDocName(""); setDocFile(null); setUploadError(""); }}
                data-testid={`button-add-doc-${ex.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Hinzufügen
              </button>
            </div>
            <div className="divide-y divide-[var(--eds-border)]">
              {exPortalDocs.map(d => renderDocRow(d, true))}
              {exLegacyDocs.map(d => renderDocRow(d, false))}
              {total === 0 && (
                <p className="px-5 py-6 text-sm text-[var(--eds-text-disabled)] text-center">Keine Dokumente für diesen Baustein</p>
              )}
            </div>
            {renderUploadForm(sectionKey, ex.id, "exercise")}
          </div>
        );
      })}

      {prepPortal.length > 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-[var(--eds-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <h3 className="text-sm font-semibold text-brand-navy">Vorbereitungsdokumente</h3>
              <span className="text-xs text-[var(--eds-text-disabled)] ml-1">{prepPortal.length}</span>
            </div>
          </div>
          <div className="divide-y divide-[var(--eds-border)]">
            {prepPortal.map(d => renderDocRow(d, true))}
          </div>
        </div>
      )}

      {infoPortal.length > 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-[var(--eds-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <h3 className="text-sm font-semibold text-brand-navy">Informationsmaterial</h3>
              <span className="text-xs text-[var(--eds-text-disabled)] ml-1">{infoPortal.length}</span>
            </div>
          </div>
          <div className="divide-y divide-[var(--eds-border)]">
            {infoPortal.map(d => renderDocRow(d, true))}
          </div>
        </div>
      )}

      {exercises.length === 0 && generalLegacy.length === 0 && generalPortal.length === 0 && (
        <div className="bg-white border border-[var(--eds-border)] border-dashed rounded-xl py-12 text-center">
          <svg className="w-12 h-12 text-[var(--eds-text-disabled)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-[var(--eds-text-tertiary)]">Erstellen Sie zunächst Übungen unter "Bausteine", um hier Dokumente zuzuordnen.</p>
        </div>
      )}
    </div>
  );
}
