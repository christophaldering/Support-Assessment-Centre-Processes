"use client";

import Link from "next/link";
import { AssessmentRecord, ExerciseRecord, CandidateRecord, DocumentRecord, ObservationSheetRecord, SectionKey } from "./types";
import { STATUS_BADGES } from "./utils";

interface ActivationSectionProps {
  assessment: AssessmentRecord | null;
  exercises: ExerciseRecord[];
  candidates: CandidateRecord[];
  documents: DocumentRecord[];
  observationSheets: ObservationSheetRecord[];
  editStatus: string;
  saving: boolean;
  hasExercises: boolean;
  hasDates: boolean;
  hasDescription: boolean;
  hasMtmm: boolean;
  hasSheets: boolean;
  workspaceSlug: string;
  assessmentId: string;
  setEditStatus: (val: string) => void;
  handleActivateAssessment: () => void;
  setActiveSection: (section: SectionKey) => void;
}

export default function ActivationSection({
  assessment,
  exercises,
  candidates,
  documents,
  observationSheets,
  editStatus,
  saving,
  hasExercises,
  hasDates,
  hasDescription,
  hasMtmm,
  hasSheets,
  workspaceSlug,
  assessmentId,
  setEditStatus,
  handleActivateAssessment,
  setActiveSection,
}: ActivationSectionProps) {
  return (
    <>
      {(!hasExercises || !hasDates || !hasDescription) && (
        <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl p-4" data-testid="activation-warnings">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--eds-status-amber)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--eds-status-amber)]">Fehlende Elemente</h3>
              <ul className="text-sm text-[var(--eds-status-amber)] mt-1 space-y-0.5">
                {!hasExercises && <li>• Keine Übungen definiert</li>}
                {!hasDates && <li>• Kein Datum festgelegt</li>}
                {!hasDescription && <li>• Keine Beschreibung vorhanden</li>}
                {!hasMtmm && <li>• Keine MTMM-Zuordnungen</li>}
                {!hasSheets && <li>• Keine Beobachtungsbögen</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-4" data-testid="heading-activation">Assessment-Status</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--eds-text-tertiary)]">Aktueller Status</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGES[assessment?.status || "draft"]?.bg} ${STATUS_BADGES[assessment?.status || "draft"]?.text}`}>
                {STATUS_BADGES[assessment?.status || "draft"]?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--eds-text-tertiary)]">Übungen</span>
              <span className="font-medium text-[var(--eds-text-primary)]">{exercises.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--eds-text-tertiary)]">Teilnehmer</span>
              <span className="font-medium text-[var(--eds-text-primary)]">{candidates.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--eds-text-tertiary)]">Dokumente</span>
              <span className="font-medium text-[var(--eds-text-primary)]">{documents.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--eds-text-tertiary)]">Beobachtungsbögen</span>
              <span className="font-medium text-[var(--eds-text-primary)]">{observationSheets.length}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Status ändern</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                data-testid="select-activation-status"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              >
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
                <option value="completed">Abgeschlossen</option>
                <option value="archived">Archiviert</option>
              </select>
            </div>
            <button
              onClick={handleActivateAssessment}
              disabled={saving || assessment?.status === "active"}
              data-testid="button-activate-assessment"
              className="w-full rounded-lg bg-emerald-600 text-white text-sm font-semibold px-6 py-3 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {assessment?.status === "active" ? "Assessment ist aktiv" : saving ? "Wird aktiviert…" : "Assessment freischalten"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">Portal-Links</h2>
        <div className="space-y-3">
          <button
            onClick={() => { setActiveSection("portal"); }}
            className="w-full flex items-center justify-between border border-[var(--eds-border)] rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-[var(--eds-status-blue-bg)]/20 transition-colors text-left"
            data-testid="link-candidate-portal-manage"
          >
            <div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">Portal verwalten</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">Dokumente und Fragebögen für Kandidaten konfigurieren</p>
            </div>
            <svg className="w-5 h-5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.083 1.168-.142l.748-.56a1.125 1.125 0 011.588.135l.773.773a1.125 1.125 0 01.135 1.588l-.56.748c-.225.324-.258.77-.142 1.168s.506.71.93.78l.894.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.384-.93.78s-.084.844.141 1.168l.56.748a1.125 1.125 0 01-.134 1.588l-.773.773a1.125 1.125 0 01-1.588.135l-.748-.56c-.324-.225-.77-.258-1.168-.142s-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.109.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93s-.844-.083-1.168.142l-.748.56a1.125 1.125 0 01-1.588-.135l-.773-.773a1.125 1.125 0 01-.135-1.588l.56-.748c.225-.324.258-.77.142-1.168s-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78s.083-.844-.142-1.168l-.56-.748a1.125 1.125 0 01.135-1.588l.773-.773a1.125 1.125 0 011.588-.135l.748.56c.324.225.77.258 1.168.142s.71-.506.78-.93l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <Link
            href={`/w/${workspaceSlug}/assessment`}
            target="_blank"
            className="flex items-center justify-between border border-[var(--eds-border)] rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-[var(--eds-status-blue-bg)]/20 transition-colors"
            data-testid="link-candidate-portal"
          >
            <div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">Kandidatenportal-Vorschau</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">Portal in neuem Tab öffnen (Kandidaten-Ansicht)</p>
            </div>
            <svg className="w-5 h-5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
          <Link
            href={`/w/${workspaceSlug}/admin/consent`}
            className="flex items-center justify-between border border-[var(--eds-border)] rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-[var(--eds-status-blue-bg)]/20 transition-colors"
            data-testid="link-consent-management"
          >
            <div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">Einwilligungen (DSGVO)</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">Einwilligungsvorlagen verwalten und Einwilligungsstatus einsehen</p>
            </div>
            <svg className="w-5 h-5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </Link>
          <div className="flex items-center justify-between border border-[var(--eds-border)] rounded-lg px-4 py-3 opacity-60">
            <div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">Beobachterportal</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">Zugang für Beobachter zur Bewertung</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)] font-medium">Bald verfügbar</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/w/${workspaceSlug}/admin/intelligence?assessmentId=${assessmentId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
          data-testid="link-intelligence"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Advanced Intelligence
        </Link>
      </div>
    </>
  );
}
