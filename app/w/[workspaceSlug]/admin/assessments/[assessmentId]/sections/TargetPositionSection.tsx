"use client";

interface TargetPositionSectionProps {
  editTargetPosition: string;
  saving: boolean;
  saveMsg: string;
  analysisTargetRole: string | null;
  setEditTargetPosition: (val: string) => void;
  handleSaveAssessment: () => void;
}

export default function TargetPositionSection({
  editTargetPosition,
  saving,
  saveMsg,
  analysisTargetRole,
  setEditTargetPosition,
  handleSaveAssessment,
}: TargetPositionSectionProps) {
  return (
    <>
      <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-target-position">Zielposition</h2>
        <p className="text-sm text-[var(--eds-text-secondary)] leading-relaxed">
          Definieren Sie die Zielposition für dieses Assessment. Dies hilft bei der Zuordnung passender Übungen und Kompetenzen.
        </p>
      </div>

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-brand-navy mb-4">Zielposition definieren</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Position / Rolle</label>
            <input
              type="text"
              value={editTargetPosition}
              onChange={(e) => setEditTargetPosition(e.target.value)}
              placeholder="z.B. CEO, CFO, Bereichsleitung, Head of Sales"
              data-testid="input-target-position"
              className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
            <p className="text-xs text-[var(--eds-text-disabled)] mt-1.5">
              Geben Sie die Zielposition ein, für die das Assessment durchgeführt wird. Diese Information wird für die KI-gestützte Übungsgenerierung und Kompetenzempfehlungen verwendet.
            </p>
          </div>
          {analysisTargetRole && analysisTargetRole !== editTargetPosition && (
            <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-lg p-3 flex items-center gap-3">
              <svg className="w-4 h-4 text-[var(--eds-status-amber)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--eds-status-amber)]">
                  Aus Anforderungsanalyse: <span className="font-semibold">{analysisTargetRole}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTargetPosition(analysisTargetRole)}
                data-testid="button-adopt-target-from-analysis"
                className="rounded-lg border border-[var(--eds-status-amber)] bg-white text-[var(--eds-status-amber)] text-xs font-medium px-3 py-1.5 hover:bg-[var(--eds-status-amber-bg)] transition-colors flex-shrink-0"
              >
                Übernehmen
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              data-testid="button-save-target-position"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {saving ? "Wird gespeichert…" : "Speichern"}
            </button>
            {saveMsg && <span className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-save-msg-target">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
