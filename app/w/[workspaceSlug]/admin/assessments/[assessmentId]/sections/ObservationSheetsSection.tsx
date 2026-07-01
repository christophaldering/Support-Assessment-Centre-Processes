"use client";

import { ExerciseRecord, ObservationSheetRecord, MtmmMapping } from "./types";

interface ObservationSheetsSectionProps {
  exercises: ExerciseRecord[];
  observationSheets: ObservationSheetRecord[];
  showAiSheetDialog: boolean;
  setShowAiSheetDialog: (val: boolean) => void;
  handleCreateAISheet: () => void;
  aiSheetExerciseId: string;
  setAiSheetExerciseId: (val: string) => void;
  getMtmmForExercise: (id: string) => MtmmMapping[];
  aiSheetType: string;
  setAiSheetType: (val: string) => void;
  aiSheetInstructions: string;
  setAiSheetInstructions: (val: string) => void;
  aiSheetError: string;
  aiSheetGenerating: boolean;
  handleSubmitAISheet: () => void;
  showCreateSheet: boolean;
  setShowCreateSheet: (val: boolean) => void;
  sheetName: string;
  setSheetName: (val: string) => void;
  sheetDesc: string;
  setSheetDesc: (val: string) => void;
  sheetExerciseId: string;
  setSheetExerciseId: (val: string) => void;
  sheetType: string;
  setSheetType: (val: string) => void;
  sheetCreating: boolean;
  sheetError: string;
  handleCreateObservationSheet: (e: React.FormEvent) => void;
  formatDate: (d: string) => string;
  handleDownloadSheetPdf: (sheet: ObservationSheetRecord) => void;
  setSelectedSheet: (sheet: ObservationSheetRecord) => void;
}

export default function ObservationSheetsSection({
  exercises,
  observationSheets,
  showAiSheetDialog,
  setShowAiSheetDialog,
  handleCreateAISheet,
  aiSheetExerciseId,
  setAiSheetExerciseId,
  getMtmmForExercise,
  aiSheetType,
  setAiSheetType,
  aiSheetInstructions,
  setAiSheetInstructions,
  aiSheetError,
  aiSheetGenerating,
  handleSubmitAISheet,
  showCreateSheet,
  setShowCreateSheet,
  sheetName,
  setSheetName,
  sheetDesc,
  setSheetDesc,
  sheetExerciseId,
  setSheetExerciseId,
  sheetType,
  setSheetType,
  sheetCreating,
  sheetError,
  handleCreateObservationSheet,
  formatDate,
  handleDownloadSheetPdf,
  setSelectedSheet,
}: ObservationSheetsSectionProps) {
  return (
    <div id="observation-sheets" className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-observation-sheets">Beobachtungsbögen</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCreateAISheet}
            data-testid="button-create-ai-sheet"
            className="rounded-lg border border-purple-500 text-purple-600 text-sm font-medium px-4 py-2 hover:bg-purple-500 hover:text-white transition-colors"
          >
            KI-Bogen generieren
          </button>
          <button
            onClick={() => setShowCreateSheet(!showCreateSheet)}
            data-testid="button-create-sheet"
            className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
          >
            {showCreateSheet ? "Abbrechen" : "Neuen Bogen erstellen"}
          </button>
        </div>
      </div>

      {showAiSheetDialog && (
        <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-5 mb-4" data-testid="section-ai-sheet-dialog">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <h3 className="text-sm font-bold text-purple-800">KI-Beobachtungsbogen generieren</h3>
          </div>
          <p className="text-xs text-purple-600 mb-4">Die KI erstellt einen professionellen Beobachtungsbogen auf Basis Ihrer Anforderungen, MTMM-Zuordnungen und Kompetenzen.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-primary)] mb-1">Übung</label>
              <select
                value={aiSheetExerciseId}
                onChange={(e) => setAiSheetExerciseId(e.target.value)}
                data-testid="select-ai-sheet-exercise"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              >
                <option value="">Allgemein (alle Kompetenzen)</option>
                {exercises.map((ex) => {
                  const mappingCount = getMtmmForExercise(ex.id).length;
                  return (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.type}){mappingCount > 0 ? ` — ${mappingCount} Kompetenzen zugeordnet` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {aiSheetExerciseId && getMtmmForExercise(aiSheetExerciseId).length > 0 && (
              <div className="bg-white border border-purple-200 rounded-lg p-3" data-testid="ai-sheet-mtmm-preview">
                <p className="text-xs font-medium text-purple-700 mb-2">MTMM-Kompetenzen (werden automatisch einbezogen):</p>
                <div className="flex flex-wrap gap-1.5">
                  {getMtmmForExercise(aiSheetExerciseId).map(m => (
                    <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                      m.weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                      "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                    }`}>
                      {m.competencyNode.name} ({m.weight.toFixed(1)})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-primary)] mb-1">Bogentyp</label>
              <select
                value={aiSheetType}
                onChange={(e) => setAiSheetType(e.target.value)}
                data-testid="select-ai-sheet-type"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              >
                <option value="verhaltensanker-bogen">Verhaltensanker-Bogen</option>
                <option value="kompetenzmatrix">Kompetenzmatrix</option>
                <option value="freitext-bogen">Freitext-Bogen</option>
                <option value="kombinierter-bogen">Kombinierter Bogen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-primary)] mb-1">Zusätzliche Hinweise (optional)</label>
              <textarea
                value={aiSheetInstructions}
                onChange={(e) => setAiSheetInstructions(e.target.value)}
                rows={2}
                placeholder="z.B. Besonderer Fokus auf Kommunikationsverhalten, Bewertungsskala 1-4 statt 1-5..."
                data-testid="textarea-ai-sheet-instructions"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
            </div>

            {aiSheetError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-ai-sheet-error">{aiSheetError}</p>}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitAISheet}
                disabled={aiSheetGenerating}
                data-testid="button-submit-ai-sheet"
                className="rounded-lg bg-purple-600 text-white text-sm font-medium px-5 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {aiSheetGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    KI generiert...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    Bogen generieren
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAiSheetDialog(false)}
                disabled={aiSheetGenerating}
                className="text-xs text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] transition"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateSheet && (
        <div className="border border-[var(--eds-border)] rounded-lg p-4 mb-4 bg-[var(--eds-bg-sunken)]">
          <form onSubmit={handleCreateObservationSheet} className="space-y-3" data-testid="form-create-sheet">
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                required
                data-testid="input-sheet-name"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Beschreibung</label>
              <textarea
                value={sheetDesc}
                onChange={(e) => setSheetDesc(e.target.value)}
                rows={2}
                data-testid="input-sheet-description"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Übung (optional)</label>
                <select
                  value={sheetExerciseId}
                  onChange={(e) => setSheetExerciseId(e.target.value)}
                  data-testid="select-sheet-exercise"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                >
                  <option value="">Keine Übung</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Typ</label>
                <select
                  value={sheetType}
                  onChange={(e) => setSheetType(e.target.value)}
                  data-testid="select-sheet-type"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                >
                  <option value="manual">Manuell</option>
                  <option value="template">Vorlage</option>
                </select>
              </div>
            </div>
            {sheetExerciseId && getMtmmForExercise(sheetExerciseId).length > 0 && (
              <div className="bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-lg p-3" data-testid="mtmm-competency-hints">
                <p className="text-xs font-medium text-[var(--eds-status-blue)] mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  MTMM-Kompetenzen für diese Übung:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getMtmmForExercise(sheetExerciseId).map(m => (
                    <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                      m.weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                      "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                    }`}>
                      {m.competencyNode.name} ({m.weight.toFixed(1)})
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[var(--eds-status-blue)] mt-1.5">Diese Kompetenzen sollten im Beobachtungsbogen berücksichtigt werden.</p>
              </div>
            )}
            {sheetError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-sheet-error">{sheetError}</p>}
            <button
              type="submit"
              disabled={sheetCreating || !sheetName.trim()}
              data-testid="button-submit-sheet"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {sheetCreating ? "Wird erstellt…" : "Bogen erstellen"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {observationSheets.map((sheet) => (
          <div
            key={sheet.id}
            className="border border-[var(--eds-border)] rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-[var(--eds-status-blue-bg)]/20 transition-colors cursor-pointer"
            data-testid={`row-sheet-${sheet.id}`}
            onClick={() => setSelectedSheet(sheet)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--eds-text-primary)]">{sheet.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                    sheet.type === "template" ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                    "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)]"
                  }`}>
                    {sheet.type === "ai" ? "KI" : sheet.type === "template" ? "Vorlage" : "Manuell"}
                  </span>
                  {sheet.aiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">KI-generiert</span>
                  )}
                </div>
                {sheet.exerciseId && (
                  <div className="mb-1">
                    <p className="text-xs text-brand-blue">
                      Übung: {exercises.find((ex) => ex.id === sheet.exerciseId)?.name || sheet.exerciseId}
                    </p>
                    {getMtmmForExercise(sheet.exerciseId).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getMtmmForExercise(sheet.exerciseId).map(m => (
                          <span key={m.competencyNodeId} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            m.weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                            m.weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                            "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                          }`}>
                            {m.competencyNode.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {sheet.content?.competencies && Array.isArray(sheet.content.competencies) && sheet.content.competencies.length > 0 && !sheet.exerciseId && (
                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                    {sheet.content.competencies.map((c: string, ci: number) => (
                      <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{c}</span>
                    ))}
                  </div>
                )}
                {sheet.content?.exerciseName && (
                  <p className="text-xs text-[var(--eds-text-tertiary)]">{sheet.content.exerciseName}</p>
                )}
                {sheet.description && !sheet.content?.sections && (
                  <p className="text-xs text-[var(--eds-text-tertiary)] line-clamp-2">{sheet.description}</p>
                )}
                {sheet.content?.sections && (
                  <p className="text-xs text-[var(--eds-text-disabled)]">{sheet.content.sections.length} Abschnitte · {sheet.content.sections.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0)} Kriterien</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadSheetPdf(sheet); }}
                  data-testid={`button-download-sheet-${sheet.id}`}
                  className="p-1.5 rounded-lg text-[var(--eds-text-disabled)] hover:text-brand-blue hover:bg-[var(--eds-status-blue-bg)] transition-colors"
                  title="Als PDF herunterladen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
                <span className="text-xs text-[var(--eds-text-disabled)]">{formatDate(sheet.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        {observationSheets.length === 0 && (
          <p className="text-sm text-[var(--eds-text-disabled)] text-center py-6">Keine Beobachtungsbögen vorhanden.</p>
        )}
      </div>
    </div>
  );
}
