"use client";

import { AssessmentRecord, ExerciseRecord, ObservationSheetRecord, DocumentRecord, MtmmMapping, SectionKey } from "./types";
import { formatDate, formatFileSize, STATUS_BADGES, EXERCISE_TYPE_LABELS } from "./utils";

interface ValidationSectionProps {
  assessment: AssessmentRecord | null;
  exercises: ExerciseRecord[];
  mtmmMappings: MtmmMapping[];
  observationSheets: ObservationSheetRecord[];
  documents: DocumentRecord[];
  hasExercises: boolean;
  hasMtmm: boolean;
  hasSheets: boolean;
  hasDates: boolean;
  hasDescription: boolean;
  uniqueMtmmExercises: { id: string; name: string }[];
  uniqueCompetencies: { id: string; name: string; description: string | null; sortOrder: number }[];
  setActiveSection: (section: SectionKey) => void;
}

export default function ValidationSection({
  assessment,
  exercises,
  mtmmMappings,
  observationSheets,
  documents,
  hasExercises,
  hasMtmm,
  hasSheets,
  hasDates,
  hasDescription,
  uniqueMtmmExercises,
  uniqueCompetencies,
}: ValidationSectionProps) {
  return (
    <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-brand-navy mb-6" data-testid="heading-validation">Validierung &amp; Übersicht</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Assessment-Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--eds-text-tertiary)]">Name</span>
              <span className="font-medium text-[var(--eds-text-primary)]">{assessment?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--eds-text-tertiary)]">Status</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGES[assessment?.status || "draft"]?.bg} ${STATUS_BADGES[assessment?.status || "draft"]?.text}`}>
                {STATUS_BADGES[assessment?.status || "draft"]?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--eds-text-tertiary)]">Kunde</span>
              <span className="text-[var(--eds-text-primary)]">{assessment?.clientName || "–"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--eds-text-tertiary)]">Standort</span>
              <span className="text-[var(--eds-text-primary)]">{assessment?.location || "–"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--eds-text-tertiary)]">Zeitraum</span>
              <span className="text-[var(--eds-text-primary)]">{formatDate(assessment?.startDate || null)} – {formatDate(assessment?.endDate || null)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Vollständigkeitsprüfung</h3>
          <div className="space-y-2">
            {[
              { label: "Übungen vorhanden", ok: hasExercises },
              { label: "MTMM-Zuordnungen", ok: hasMtmm },
              { label: "Beobachtungsbögen", ok: hasSheets },
              { label: "Datum festgelegt", ok: hasDates },
              { label: "Beschreibung vorhanden", ok: hasDescription },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2" data-testid={`validation-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.ok ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                <span className={`text-sm ${item.ok ? "text-[var(--eds-text-primary)]" : "text-[var(--eds-status-amber)]"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-brand-navy">{exercises.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Übungen</p>
        </div>
        <div className="bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[var(--eds-status-green)]">{mtmmMappings.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">MTMM-Zuordnungen ({uniqueMtmmExercises.length} Übungen × {uniqueCompetencies.length} Kompetenzen)</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{observationSheets.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Beobachtungsbögen</p>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Übungen</h3>
          <div className="flex flex-wrap gap-2">
            {exercises.map((ex) => (
              <div key={ex.id} className="inline-flex items-center gap-2 bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-[var(--eds-text-primary)]">{ex.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]">
                  {EXERCISE_TYPE_LABELS[ex.type] || ex.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {observationSheets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Beobachtungsbögen</h3>
          <div className="space-y-1">
            {observationSheets.map((sheet) => (
              <div key={sheet.id} className="flex items-center gap-2 text-sm text-[var(--eds-text-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--eds-text-tertiary)]"></span>
                <span>{sheet.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  sheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                  sheet.type === "template" ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                  "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
                }`}>
                  {sheet.type === "ai" ? "KI" : sheet.type === "template" ? "Vorlage" : "Manuell"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Dokumente ({documents.length})</h3>
          <div className="space-y-1">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm text-[var(--eds-text-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--eds-text-tertiary)]"></span>
                <span>{doc.name}</span>
                <span className="text-xs text-[var(--eds-text-disabled)]">{formatFileSize(doc.fileSize)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
