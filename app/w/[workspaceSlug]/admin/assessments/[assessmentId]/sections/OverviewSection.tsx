"use client";

import { ExerciseRecord, ObservationSheetRecord, CandidateRecord, DocumentRecord } from "./types";

interface OverviewSectionProps {
  exercises: ExerciseRecord[];
  observationSheets: ObservationSheetRecord[];
  candidates: CandidateRecord[];
  documents: DocumentRecord[];
  editName: string;
  editLocation: string;
  editClientName: string;
  editDescription: string;
  editStartDate: string;
  editEndDate: string;
  editStatus: string;
  saving: boolean;
  saveMsg: string;
  setEditName: (val: string) => void;
  setEditLocation: (val: string) => void;
  setEditClientName: (val: string) => void;
  setEditDescription: (val: string) => void;
  setEditStartDate: (val: string) => void;
  setEditEndDate: (val: string) => void;
  setEditStatus: (val: string) => void;
  handleSaveAssessment: () => void;
}

export default function OverviewSection({
  exercises,
  observationSheets,
  candidates,
  documents,
  editName,
  editLocation,
  editClientName,
  editDescription,
  editStartDate,
  editEndDate,
  editStatus,
  saving,
  saveMsg,
  setEditName,
  setEditLocation,
  setEditClientName,
  setEditDescription,
  setEditStartDate,
  setEditEndDate,
  setEditStatus,
  handleSaveAssessment,
}: OverviewSectionProps) {
  return (
    <>
      <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-overview">Übersicht</h2>
        <p className="text-sm text-[var(--eds-text-secondary)] leading-relaxed">
          Verwalten Sie die Grunddaten des Assessments. Hier finden Sie eine Zusammenfassung aller relevanten Informationen.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="stat-exercises">
          <p className="text-2xl font-bold text-brand-navy">{exercises.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Übungen</p>
        </div>
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="stat-sheets">
          <p className="text-2xl font-bold text-purple-700">{observationSheets.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Beobachtungsbögen</p>
        </div>
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="stat-candidates">
          <p className="text-2xl font-bold text-[var(--eds-status-green)]">{candidates.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Teilnehmer</p>
        </div>
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="stat-documents">
          <p className="text-2xl font-bold text-[var(--eds-status-blue)]">{documents.length}</p>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Dokumente</p>
        </div>
      </div>

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">Assessment-Details</h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-name"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Standort</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                data-testid="input-edit-location"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Kunde</label>
              <input
                type="text"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                placeholder="z.B. REWE Group (optional)"
                data-testid="input-edit-client-name"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Beschreibung</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              data-testid="input-edit-description"
              className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Startdatum</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                data-testid="input-edit-start-date"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Enddatum</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                data-testid="input-edit-end-date"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                data-testid="select-edit-status"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              >
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
                <option value="completed">Abgeschlossen</option>
                <option value="archived">Archiviert</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAssessment}
              disabled={saving || !editName.trim()}
              data-testid="button-save-assessment"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {saving ? "Wird gespeichert…" : "Speichern"}
            </button>
            {saveMsg && <span className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-save-msg">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
