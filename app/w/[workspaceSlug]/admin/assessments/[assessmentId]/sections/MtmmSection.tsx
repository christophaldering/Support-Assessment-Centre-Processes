"use client";

import { ExerciseRecord, MtmmMapping, AssessmentRecord, SectionKey, CompetencyNodeLike, MtmmCompetencyModel, MtmmRationale, MtmmGrid } from "./types";

interface MtmmSectionProps {
  hasExercises: boolean;
  assessment: AssessmentRecord | null;
  exercises: ExerciseRecord[];
  setActiveSection: (section: SectionKey) => void;
  mtmmCompetencyModel: MtmmCompetencyModel | null;
  mtmmMappings: MtmmMapping[];
  mtmmLoading: boolean;
  showInlineMtmm: boolean;
  setShowInlineMtmm: (val: boolean) => void;
  initInlineMtmmGrid: () => void;
  mtmmAiRationale: MtmmRationale[];
  setMtmmAiRationale: (val: MtmmRationale[]) => void;
  mtmmAiSummary: string;
  setMtmmAiSummary: (val: string) => void;
  mtmmAiLoading: boolean;
  handleMtmmAiSuggest: () => void;
  mtmmSaveMsg: string;
  mtmmSaving: boolean;
  handleSaveInlineMtmm: () => void;
  mtmmInlineGrid: MtmmGrid;
  setMtmmInlineGrid: (fn: (prev: MtmmGrid) => MtmmGrid) => void;
}

export default function MtmmSection({
  hasExercises,
  assessment,
  exercises,
  setActiveSection,
  mtmmCompetencyModel,
  mtmmMappings,
  mtmmLoading,
  showInlineMtmm,
  setShowInlineMtmm,
  initInlineMtmmGrid,
  mtmmAiRationale,
  setMtmmAiRationale,
  mtmmAiSummary,
  setMtmmAiSummary,
  mtmmAiLoading,
  handleMtmmAiSuggest,
  mtmmSaveMsg,
  mtmmSaving,
  handleSaveInlineMtmm,
  mtmmInlineGrid,
  setMtmmInlineGrid,
}: MtmmSectionProps) {
  return (
    <div id="mtmm-matrix" className="space-y-4">
      {(!hasExercises || !assessment?.sourceAnalysisId) && (
        <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl p-5" data-testid="mtmm-prereq-hints">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--eds-status-amber)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--eds-status-amber)] mb-2">Voraussetzungen für die MTMM-Matrix</h3>
              <p className="text-xs text-[var(--eds-status-amber)] mb-3">
                Für eine vollständige Zuordnung benötigen Sie ein Kompetenzmodell (aus der Anforderungsanalyse) und definierte Übungen.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {assessment?.sourceAnalysisId ? (
                    <svg className="w-4 h-4 text-[var(--eds-status-green)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--eds-status-amber)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  )}
                  <span className="text-xs text-[var(--eds-status-amber)]">Anforderungsanalyse / Kompetenzmodell</span>
                  {!assessment?.sourceAnalysisId && (
                    <button onClick={() => setActiveSection("requirements")} className="text-xs text-brand-blue hover:underline font-medium ml-auto" data-testid="link-prereq-requirements">
                      Zur Anforderungsanalyse →
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasExercises ? (
                    <svg className="w-4 h-4 text-[var(--eds-status-green)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--eds-status-amber)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  )}
                  <span className="text-xs text-[var(--eds-status-amber)]">Übungen definiert ({exercises.length})</span>
                  {!hasExercises && (
                    <button onClick={() => setActiveSection("exercises")} className="text-xs text-brand-blue hover:underline font-medium ml-auto" data-testid="link-prereq-exercises">
                      Zu den Übungen →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-mtmm">MTMM-Matrix</h2>
            <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">Multi-Trait-Multi-Method — Zuordnung Übungen × Kompetenzen</p>
            {mtmmCompetencyModel && (
              <p className="text-xs text-[var(--eds-text-disabled)] mt-1">
                Kompetenzmodell: <span className="font-medium text-[var(--eds-text-secondary)]">{mtmmCompetencyModel.name}</span>
                <span className="text-[var(--eds-text-disabled)] mx-1">·</span>
                {mtmmCompetencyModel.nodes.filter((n: CompetencyNodeLike) => n.nodeType === "competency" || n.nodeType === "domain").length} Kompetenzen × {exercises.length} Übungen
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {mtmmMappings.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] font-medium" data-testid="text-mtmm-count">
                {mtmmMappings.length} Zuordnung{mtmmMappings.length !== 1 ? "en" : ""}
              </span>
            )}
            {mtmmCompetencyModel && exercises.length > 0 && (
              <>
                <button
                  onClick={() => {
                    if (!showInlineMtmm) initInlineMtmmGrid();
                    setShowInlineMtmm(!showInlineMtmm);
                    setMtmmAiRationale([]);
                    setMtmmAiSummary("");
                  }}
                  data-testid="button-toggle-inline-mtmm"
                  className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue/5 transition-colors"
                >
                  {showInlineMtmm ? "Zuordnung schließen" : "Manuelle Zuordnung"}
                </button>
                <button
                  onClick={handleMtmmAiSuggest}
                  disabled={mtmmAiLoading}
                  data-testid="button-mtmm-ai-suggest"
                  className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {mtmmAiLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      KI analysiert…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      KI-Vorschlag
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-3 mb-4" data-testid="mtmm-weight-legend">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[var(--eds-text-disabled)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            <div>
              <p className="text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Gewichtungen erklärt</p>
              <p className="text-[11px] text-[var(--eds-text-tertiary)] leading-relaxed">
                Die Zahl in jeder Zelle gibt die <span className="font-semibold">Gewichtung</span> an, mit der eine Übung eine Kompetenz misst.
                <span className="font-semibold"> 1.0 = Standard</span> (Normalgewichtung).
                Werte <span className="font-semibold">&gt; 1.0</span> bedeuten, dass die Übung diese Kompetenz besonders gut erfasst.
                Werte <span className="font-semibold">&lt; 1.0</span> stehen für eine sekundäre/ergänzende Messung.
                Standardmäßig sind alle Gewichtungen auf 1.0 gesetzt.
              </p>
            </div>
          </div>
        </div>

        {showInlineMtmm && mtmmCompetencyModel && exercises.length > 0 && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">
                  {mtmmAiRationale.length > 0 ? "KI-Vorschlag — Zuordnung prüfen & anpassen" : "Manuelle Zuordnung"}
                </h3>
                <p className="text-xs text-[var(--eds-text-disabled)] mt-0.5">
                  Setzen Sie Häkchen, um Kompetenzen Übungen zuzuordnen. Gewichtung 1.0 = Standard.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {mtmmSaveMsg && <span className="text-xs text-[var(--eds-status-green)] font-medium">{mtmmSaveMsg}</span>}
                <button
                  onClick={handleSaveInlineMtmm}
                  disabled={mtmmSaving}
                  data-testid="button-save-inline-mtmm"
                  className="rounded-lg bg-brand-blue text-white text-xs font-medium px-4 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                >
                  {mtmmSaving ? "Speichert…" : "Zuordnungen speichern"}
                </button>
                <button
                  onClick={() => { setShowInlineMtmm(false); setMtmmAiRationale([]); setMtmmAiSummary(""); }}
                  data-testid="button-close-inline-mtmm"
                  className="rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] text-xs font-medium px-3 py-2 hover:bg-[var(--eds-bg-sunken)] transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>

            {mtmmAiSummary && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4" data-testid="mtmm-ai-summary">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  <p className="text-xs text-purple-700">{mtmmAiSummary}</p>
                </div>
              </div>
            )}

            {mtmmAiRationale.length > 0 && (
              <details className="mb-4 group" data-testid="mtmm-ai-rationale-details">
                <summary className="cursor-pointer text-xs font-semibold text-purple-700 hover:text-purple-900 select-none flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  KI-Begründungen anzeigen ({mtmmAiRationale.length} Zuordnungen)
                  <span className="text-[10px] text-purple-400 font-normal ml-2">— Originalvorschlag der KI, manuelle Änderungen nicht enthalten</span>
                </summary>
                <div className="mt-2 bg-purple-50/50 border border-purple-100 rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="mtmm-ai-rationale-list">
                  <div className="space-y-2">
                    {mtmmAiRationale.map((r: MtmmRationale, i: number) => {
                      const exName = exercises.find((e) => e.id === r.exerciseId)?.name || r.exerciseId;
                      const nodeName = mtmmCompetencyModel.nodes.find((n: CompetencyNodeLike) => n.id === r.nodeId)?.name || r.nodeId;
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                              r.weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                              r.weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                              "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)] border border-[var(--eds-status-amber-bg)]"
                            }`}>{r.weight.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--eds-text-primary)]">{exName}</span>
                            <span className="text-[var(--eds-text-disabled)] mx-1">→</span>
                            <span className="font-medium text-[var(--eds-text-secondary)]">{nodeName}</span>
                            {r.rationale && <p className="text-[var(--eds-text-tertiary)] mt-0.5">{r.rationale}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            )}
            <div className="overflow-x-auto" data-testid="mtmm-inline-grid">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="border-b border-[var(--eds-border)]">
                    <th className="text-left py-2 px-3 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] sticky left-0 z-10 min-w-[150px]">Übung</th>
                    {mtmmCompetencyModel.nodes
                      .filter((n: CompetencyNodeLike) => n.nodeType === "competency" || n.nodeType === "domain")
                      .sort((a: CompetencyNodeLike, b: CompetencyNodeLike) => a.sortOrder - b.sortOrder)
                      .map((node: CompetencyNodeLike) => (
                        <th key={node.id} className="text-center py-2 px-1 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] min-w-[80px]" title={node.description || node.name}>
                          <span className="text-[10px] leading-tight block whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{node.name}</span>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {exercises.map(ex => (
                    <tr key={ex.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50">
                      <td className="py-2 px-3 font-medium text-[var(--eds-text-primary)] sticky left-0 bg-white z-10 text-xs">{ex.name}</td>
                      {mtmmCompetencyModel.nodes
                        .filter((n: CompetencyNodeLike) => n.nodeType === "competency" || n.nodeType === "domain")
                        .sort((a: CompetencyNodeLike, b: CompetencyNodeLike) => a.sortOrder - b.sortOrder)
                        .map((node: CompetencyNodeLike) => {
                          const cell = mtmmInlineGrid[ex.id]?.[node.id];
                          return (
                            <td key={node.id} className="text-center py-1 px-1">
                              <div className="flex flex-col items-center gap-0.5">
                                <input
                                  type="checkbox"
                                  checked={cell?.mapped || false}
                                  onChange={() => {
                                    setMtmmInlineGrid((prev: MtmmGrid) => ({
                                      ...prev,
                                      [ex.id]: {
                                        ...prev[ex.id],
                                        [node.id]: { ...prev[ex.id]?.[node.id], mapped: !cell?.mapped, weight: cell?.weight ?? 1.0 },
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4 rounded border-[var(--eds-border-strong)] text-brand-blue focus:ring-brand-blue/30"
                                  data-testid={`mtmm-check-${ex.id}-${node.id}`}
                                />
                                {cell?.mapped && (
                                  <input
                                    type="number"
                                    min="0.1"
                                    max="3.0"
                                    step="0.1"
                                    value={cell.weight}
                                    onChange={(e) => {
                                      const w = parseFloat(e.target.value) || 1.0;
                                      setMtmmInlineGrid((prev: MtmmGrid) => ({
                                        ...prev,
                                        [ex.id]: {
                                          ...prev[ex.id],
                                          [node.id]: { mapped: prev[ex.id]?.[node.id]?.mapped ?? false, weight: w },
                                        },
                                      }));
                                    }}
                                    className="w-12 text-center text-[10px] rounded border border-[var(--eds-border)] px-0.5 py-0.5"
                                    data-testid={`mtmm-weight-${ex.id}-${node.id}`}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mtmmLoading ? (
          <p className="text-sm text-[var(--eds-text-disabled)] text-center py-4">Laden...</p>
        ) : mtmmMappings.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[var(--eds-border)] rounded-lg" data-testid="mtmm-empty-state">
            <svg className="w-10 h-10 text-[var(--eds-text-disabled)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
            </svg>
            <p className="text-sm text-[var(--eds-text-tertiary)] mb-2">Noch keine MTMM-Zuordnung definiert</p>
            <p className="text-xs text-[var(--eds-text-disabled)] mb-4">Nutzen Sie „Manuelle Zuordnung" oder „KI-Vorschlag", um Kompetenzen den Übungen zuzuordnen.</p>
            {mtmmCompetencyModel && exercises.length > 0 && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { initInlineMtmmGrid(); setShowInlineMtmm(true); }}
                  data-testid="button-empty-manual-mtmm"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline font-medium"
                >
                  Manuelle Zuordnung starten
                </button>
                <span className="text-[var(--eds-text-disabled)]">oder</span>
                <button
                  onClick={handleMtmmAiSuggest}
                  disabled={mtmmAiLoading}
                  data-testid="button-empty-ai-mtmm"
                  className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  KI-Vorschlag generieren
                </button>
              </div>
            )}
          </div>
        ) : (() => {
          const uniqueExercisesTable = Array.from(new Map(mtmmMappings.map(m => [m.exercise.id, m.exercise])).values());
          const uniqueNodes = Array.from(new Map(mtmmMappings.map(m => [m.competencyNode.id, m.competencyNode])).values())
            .sort((a, b) => a.sortOrder - b.sortOrder);
          const mappingLookup = new Map(mtmmMappings.map(m => [`${m.exerciseId}:${m.competencyNodeId}`, m.weight]));

          return (
            <div className="overflow-x-auto" data-testid="mtmm-overview-table">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="border-b border-[var(--eds-border)]">
                    <th className="text-left py-2 px-3 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] rounded-tl-lg sticky left-0 z-10 min-w-[160px]">Übung (Methode)</th>
                    {uniqueNodes.map((node) => (
                      <th key={node.id} className="text-center py-2 px-2 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] min-w-[100px]" title={node.description || node.name}>
                        <span className="text-xs leading-tight block">{node.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueExercisesTable.map((ex) => (
                    <tr key={ex.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50">
                      <td className="py-2 px-3 font-medium text-[var(--eds-text-primary)] sticky left-0 bg-white z-10">{ex.name}</td>
                      {uniqueNodes.map((node) => {
                        const weight = mappingLookup.get(`${ex.id}:${node.id}`);
                        return (
                          <td key={node.id} className="text-center py-2 px-2">
                            {weight !== undefined ? (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                                weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                                weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                                "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                              }`}>
                                {weight.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-[var(--eds-border)]">–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--eds-text-disabled)]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-green-bg)] inline-block"></span> ≥ 1.5 Primär</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-blue-bg)] inline-block"></span> 1.0–1.4 Standard</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] inline-block"></span> &lt; 1.0 Sekundär</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
