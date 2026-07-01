"use client";

import Link from "next/link";
import { ExerciseRecord } from "./types";

interface ExercisesSectionProps {
  linkedAnalysis: any;
  exercises: ExerciseRecord[];
  apiBase: string;
  fetchExercises: () => void;
  fetchLibraryItems: () => void;
  TYPE_MAP_DE_TO_KEY: Record<string, string>;
  EXERCISE_TYPE_LABELS: Record<string, string>;
  EXERCISE_TYPES: string[];
  workspaceSlug: string;
  showLibrary: boolean;
  setShowLibrary: (val: boolean) => void;
  handleToggleLibrary: () => void;
  libraryItems: any[];
  libraryLoading: boolean;
  specForLibrarySearch: any;
  setSpecForLibrarySearch: (val: any) => void;
  showCreateExercise: boolean;
  setShowCreateExercise: (val: boolean) => void;
  handleSeedVarexia: () => void;
  seedingVarexia: boolean;
  varexiaSeeded: boolean;
  basisExercise: any;
  setBasisExercise: (val: any) => void;
  basisChanges: string;
  setBasisChanges: (val: string) => void;
  showBasisPicker: boolean;
  setShowBasisPicker: (val: boolean) => void;
  activeModuleSpec: any;
  setActiveModuleSpec: (val: any) => void;
  exName: string;
  setExName: (val: string) => void;
  exType: string;
  setExType: (val: string) => void;
  exInstructions: string;
  setExInstructions: (val: string) => void;
  exDuration: string;
  setExDuration: (val: string) => void;
  exSortOrder: string;
  setExSortOrder: (val: string) => void;
  exError: string;
  aiError: string;
  aiGenerating: boolean;
  aiProgress: number;
  aiProgressLabel: string;
  exCreating: boolean;
  handleCreateExercise: (e: React.FormEvent) => void;
  handleAIGenerateExercise: () => void;
  handleImportFromLibrary: (item: any) => void;
  handleAIVariantImport: (item: any) => void;
  editingExId: string | null;
  setEditingExId: (val: string | null) => void;
  editExName: string;
  setEditExName: (val: string) => void;
  editExType: string;
  setEditExType: (val: string) => void;
  editExInstructions: string;
  setEditExInstructions: (val: string) => void;
  editExDuration: string;
  setEditExDuration: (val: string) => void;
  editExSortOrder: string;
  setEditExSortOrder: (val: string) => void;
  handleUpdateExercise: (id: string) => void;
  handleDeleteExercise: (id: string) => void;
  exerciseDocUpload: string | null;
  setExerciseDocUpload: (val: string | null) => void;
  exerciseDocName: string;
  setExerciseDocName: (val: string) => void;
  exerciseDocFile: File | null;
  setExerciseDocFile: (val: File | null) => void;
  exerciseDocError: string;
  setExerciseDocError: (val: string) => void;
  exerciseDocUploading: boolean;
  handleUploadExerciseDoc: (exerciseId: string) => void;
  handleDeleteExerciseDoc: (docId: string) => void;
  handleViewDocument: (id: string, name: string) => void;
  handleDownloadDocument: (id: string) => void;
}

export default function ExercisesSection({
  linkedAnalysis,
  exercises,
  apiBase,
  fetchExercises,
  fetchLibraryItems,
  TYPE_MAP_DE_TO_KEY,
  EXERCISE_TYPE_LABELS,
  EXERCISE_TYPES,
  workspaceSlug,
  showLibrary,
  setShowLibrary,
  handleToggleLibrary,
  libraryItems,
  libraryLoading,
  specForLibrarySearch,
  setSpecForLibrarySearch,
  showCreateExercise,
  setShowCreateExercise,
  handleSeedVarexia,
  seedingVarexia,
  varexiaSeeded,
  basisExercise,
  setBasisExercise,
  basisChanges,
  setBasisChanges,
  showBasisPicker,
  setShowBasisPicker,
  activeModuleSpec,
  setActiveModuleSpec,
  exName,
  setExName,
  exType,
  setExType,
  exInstructions,
  setExInstructions,
  exDuration,
  setExDuration,
  exSortOrder,
  setExSortOrder,
  exError,
  aiError,
  aiGenerating,
  aiProgress,
  aiProgressLabel,
  exCreating,
  handleCreateExercise,
  handleAIGenerateExercise,
  handleImportFromLibrary,
  handleAIVariantImport,
  editingExId,
  setEditingExId,
  editExName,
  setEditExName,
  editExType,
  setEditExType,
  editExInstructions,
  setEditExInstructions,
  editExDuration,
  setEditExDuration,
  editExSortOrder,
  setEditExSortOrder,
  handleUpdateExercise,
  handleDeleteExercise,
  exerciseDocUpload,
  setExerciseDocUpload,
  exerciseDocName,
  setExerciseDocName,
  exerciseDocFile,
  setExerciseDocFile,
  exerciseDocError,
  setExerciseDocError,
  exerciseDocUploading,
  handleUploadExerciseDoc,
  handleDeleteExerciseDoc,
  handleViewDocument,
  handleDownloadDocument,
}: ExercisesSectionProps) {
  return (
    <>
      {linkedAnalysis?.proposal && (() => {
        const recExercises = Array.isArray(linkedAnalysis.proposal.exercises) ? linkedAnalysis.proposal.exercises : [];
        const recModules = Array.isArray(linkedAnalysis.proposal.assessmentModules)
          ? linkedAnalysis.proposal.assessmentModules.filter((m: any) => m && m.selected !== false)
          : [];
        const allRecs = [
          ...recExercises.map((ex: any) => ({
            name: ex.name || ex.title || (typeof ex === "string" ? ex : ""),
            type: ex.type || "",
            duration: ex.duration || null,
            description: ex.description || "",
            source: "exercise" as const,
          })),
          ...recModules.map((mod: any) => ({
            name: mod.name || "",
            type: mod.type || "",
            duration: null,
            description: mod.description || "",
            adaptationNotes: mod.adaptationNotes || "",
            generationPrompt: mod.generationPrompt || "",
            source: "module" as const,
          })),
        ].filter(r => r.name);
        const adoptedNames = exercises.map(e => e.name.toLowerCase());
        const unadopted = allRecs.filter(r => !adoptedNames.includes(r.name.toLowerCase()));
        if (unadopted.length === 0) return null;
        return (
          <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl p-5 mb-4" data-testid="section-exercise-recommendations">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[var(--eds-status-amber)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              <h3 className="text-sm font-semibold text-[var(--eds-status-amber)]">Empfehlungen aus der Anforderungsanalyse ({unadopted.length})</h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--eds-status-amber)]">Die KI hat folgende Übungen vorgeschlagen. Klicken Sie auf &quot;Übernehmen&quot;, um eine Übung in dieses Assessment aufzunehmen.</p>
              <button
                onClick={async () => {
                  for (const rec of unadopted) {
                    const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                    await fetch(`${apiBase}/exercises`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: rec.name, type: mappedType, instructions: rec.description || null, duration: rec.duration ? parseInt(String(rec.duration)) : null, sortOrder: exercises.length }),
                    });
                  }
                  fetchExercises();
                }}
                className="shrink-0 ml-3 text-xs font-semibold text-[var(--eds-status-amber)] bg-[var(--eds-status-amber-bg)] hover:bg-amber-200 border border-[var(--eds-status-amber)] rounded-lg px-3 py-1.5 transition-colors"
                data-testid="button-adopt-all-recommendations"
              >
                Alle übernehmen
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unadopted.map((rec, i) => (
                <div key={i} className="bg-white border border-[var(--eds-status-amber-bg)] rounded-lg p-4 flex flex-col" data-testid={`card-recommendation-${i}`}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-navy mb-1">{rec.name}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rec.type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">{rec.type}</span>
                      )}
                      {rec.duration && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]">{rec.duration} Min.</span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]">
                        {rec.source === "module" ? "Modul" : "Übung"}
                      </span>
                    </div>
                    {rec.description && <p className="text-xs text-[var(--eds-text-tertiary)] line-clamp-2 mb-2">{rec.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      onClick={async () => {
                        try {
                          const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                          await fetch(`${apiBase}/exercises`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: rec.name,
                              type: mappedType,
                              instructions: rec.description || null,
                              duration: rec.duration ? parseInt(String(rec.duration)) : null,
                              sortOrder: exercises.length + i,
                            }),
                          });
                          fetchExercises();
                        } catch {}
                      }}
                      className="flex-1 min-w-0 text-[11px] font-semibold text-[var(--eds-status-amber)] bg-[var(--eds-status-amber-bg)] hover:bg-amber-200 border border-[var(--eds-status-amber)] rounded-lg px-2 py-1.5 transition-colors"
                      data-testid={`button-adopt-recommendation-${i}`}
                    >
                      Direkt übernehmen
                    </button>
                    <button
                      onClick={() => {
                        const spec = {
                          name: rec.name,
                          type: rec.type,
                          description: rec.description || "",
                          adaptationNotes: (rec as any).adaptationNotes || "",
                          generationPrompt: (rec as any).generationPrompt || "",
                        };
                        setSpecForLibrarySearch(spec);
                        if (!showLibrary) {
                          fetchLibraryItems();
                          setShowLibrary(true);
                        }
                      }}
                      className="flex-1 min-w-0 text-[11px] font-semibold text-brand-blue bg-[var(--eds-status-blue-bg)] hover:bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-lg px-2 py-1.5 transition-colors"
                      data-testid={`button-library-search-recommendation-${i}`}
                    >
                      Bibliothek durchsuchen
                    </button>
                    <button
                      onClick={() => {
                        const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                        setExName(rec.name);
                        setExType(mappedType);
                        setExInstructions(rec.description || "");
                        setActiveModuleSpec({
                          name: rec.name,
                          type: rec.type,
                          description: rec.description || "",
                          adaptationNotes: (rec as any).adaptationNotes || "",
                          generationPrompt: (rec as any).generationPrompt || "",
                        });
                        setShowCreateExercise(true);
                      }}
                      className="flex-1 min-w-0 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2 py-1.5 transition-colors"
                      data-testid={`button-create-from-recommendation-${i}`}
                    >
                      Neu erstellen / KI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-wrap gap-3 mb-2">
        <Link
          href={`/w/${workspaceSlug}/admin/exercise-library`}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
          data-testid="link-exercise-library"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
          </svg>
          Übungsbibliothek
        </Link>
      </div>

      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-exercises">Übungen</h2>
          <div className="flex gap-2">
            <button
              onClick={handleToggleLibrary}
              data-testid="button-import-library"
              className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
            >
              {showLibrary ? "Bibliothek schließen" : "Aus Bibliothek importieren"}
            </button>
            <button
              onClick={() => setShowCreateExercise(!showCreateExercise)}
              data-testid="button-create-exercise"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
            >
              {showCreateExercise ? "Abbrechen" : "Neue Übung"}
            </button>
          </div>
        </div>

        {showLibrary && (
          <div className="border border-[var(--eds-border)] rounded-lg p-4 mb-4 bg-[var(--eds-bg-sunken)]">
            {specForLibrarySearch && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3" data-testid="banner-spec-library-search">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-purple-700">Suche für Modulspezifikation: {specForLibrarySearch.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 font-medium">
                      Typ: {EXERCISE_TYPE_LABELS[TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type] || specForLibrarySearch.type}
                    </span>
                    <button type="button" onClick={() => setSpecForLibrarySearch(null)} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)]" data-testid="button-clear-spec-search">×</button>
                  </div>
                </div>
                {specForLibrarySearch.description && <p className="text-xs text-purple-600 mb-1">{specForLibrarySearch.description}</p>}
                {specForLibrarySearch.adaptationNotes && (
                  <p className="text-[10px] text-purple-500"><span className="font-semibold uppercase">Anpassungshinweise:</span> {specForLibrarySearch.adaptationNotes}</p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-brand-navy">Übungsbibliothek</h3>
              <button
                onClick={handleSeedVarexia}
                disabled={seedingVarexia || varexiaSeeded}
                data-testid="button-seed-varexia"
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-purple-400 text-purple-600 hover:bg-purple-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {varexiaSeeded ? "✓ Varexia SE geladen" : seedingVarexia ? "Wird geladen…" : "Varexia SE laden"}
              </button>
            </div>
            {libraryLoading ? (
              <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>
            ) : libraryItems.length === 0 ? (
              <p className="text-sm text-[var(--eds-text-disabled)]">Keine Einträge in der Bibliothek. Laden Sie die Varexia-Fallstudie oder erstellen Sie Übungen in der Bibliothek.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  let filtered = libraryItems;
                  if (specForLibrarySearch?.type) {
                    const specKey = TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type?.toLowerCase().replace(/[\s-]+/g, "_") || "";
                    filtered = libraryItems.filter(item => {
                      const itemKey = TYPE_MAP_DE_TO_KEY[item.exerciseType] || item.exerciseType?.toLowerCase().replace(/[\s-]+/g, "_") || "";
                      return itemKey === specKey;
                    });
                  }
                  if (filtered.length === 0 && specForLibrarySearch?.type) {
                    return (
                      <div className="col-span-full text-center py-6">
                        <p className="text-sm text-[var(--eds-text-tertiary)] mb-2">Keine Übungen vom Typ „{EXERCISE_TYPE_LABELS[TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type] || specForLibrarySearch.type}" in der Bibliothek gefunden.</p>
                        <button
                          type="button"
                          onClick={() => setSpecForLibrarySearch(null)}
                          className="text-xs font-medium text-brand-blue hover:underline"
                          data-testid="button-show-all-library"
                        >
                          Alle Übungen anzeigen
                        </button>
                      </div>
                    );
                  }
                  return filtered.map((item) => (
                    <div key={item.id} className="border border-[var(--eds-border)] rounded-lg p-3 bg-white" data-testid={`library-item-${item.id}`}>
                      <p className="font-medium text-sm text-[var(--eds-text-primary)] mb-1">{item.title}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]">
                          {EXERCISE_TYPE_LABELS[item.exerciseType] || item.exerciseType}
                        </span>
                        {item.targetLevels?.map((level: string) => (
                          <span key={level} className="text-xs px-2 py-0.5 rounded-full bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]">
                            {level}
                          </span>
                        ))}
                        {item.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]">
                            {tag}
                          </span>
                        ))}
                        {(item.tags?.length || 0) > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-disabled)]">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                      {(item.clientName || item.projectName) && (
                        <p className="text-xs text-[var(--eds-text-disabled)] mb-1">
                          {item.clientName && <><span className="font-medium">Kunde:</span> {item.clientName}</>}
                          {item.clientName && item.projectName && " · "}
                          {item.projectName && <><span className="font-medium">Projekt:</span> {item.projectName}</>}
                        </p>
                      )}
                      {item.metadataJson?.description && (
                        <p className="text-xs text-[var(--eds-text-tertiary)] mb-2 line-clamp-2">{typeof item.metadataJson.description === "string" ? item.metadataJson.description : ""}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImportFromLibrary(item)}
                          data-testid={`button-import-${item.id}`}
                          className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark"
                        >
                          Importieren
                        </button>
                        <button
                          onClick={() => handleAIVariantImport(item)}
                          data-testid={`button-ai-variant-${item.id}`}
                          className="text-xs font-medium text-purple-600 hover:text-purple-800"
                        >
                          KI-Anpassung
                        </button>
                        <button
                          onClick={() => {
                            setBasisExercise(item);
                            setShowBasisPicker(false);
                            setShowLibrary(false);
                            setShowCreateExercise(true);
                            setExName(item.title + " (angepasst)");
                            setExType(item.exerciseType);
                            setExInstructions(item.metadataJson?.instructions || item.metadataJson?.description || "");
                          }}
                          data-testid={`button-basis-${item.id}`}
                          className="text-xs font-medium text-[var(--eds-status-green)] hover:text-emerald-800"
                        >
                          Als Basis
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {showCreateExercise && (
          <div className="border border-[var(--eds-border)] rounded-lg p-4 mb-4 bg-[var(--eds-bg-sunken)]">
            <form onSubmit={handleCreateExercise} className="space-y-3" data-testid="form-create-exercise">
              {activeModuleSpec && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2" data-testid="banner-active-module-spec">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-purple-700">Kontext aus Anforderungsanalyse</span>
                    <button type="button" onClick={() => setActiveModuleSpec(null)} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)]" data-testid="button-clear-module-spec">×</button>
                  </div>
                  {activeModuleSpec.adaptationNotes && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-purple-500 uppercase">Anpassungshinweise</p>
                      <p className="text-xs text-purple-700">{activeModuleSpec.adaptationNotes}</p>
                    </div>
                  )}
                  {activeModuleSpec.generationPrompt && (
                    <div>
                      <p className="text-[10px] font-semibold text-purple-500 uppercase">Prompt / Erstellungsanweisung</p>
                      <pre className="text-xs text-purple-700 whitespace-pre-wrap font-mono">{activeModuleSpec.generationPrompt}</pre>
                    </div>
                  )}
                </div>
              )}
              {basisExercise && (
                <div className="bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--eds-status-green)]">Basierend auf:</span>
                    <button
                      type="button"
                      onClick={() => { setBasisExercise(null); setBasisChanges(""); }}
                      className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)]"
                    >
                      Basis entfernen
                    </button>
                  </div>
                  <p className="text-sm font-medium text-emerald-900">{basisExercise.title}</p>
                  <p className="text-xs text-[var(--eds-status-green)]">{EXERCISE_TYPE_LABELS[basisExercise.exerciseType] || basisExercise.exerciseType}</p>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-[var(--eds-status-green)] mb-1">Gewünschte Änderungen / Kontext-Verknüpfung</label>
                    <textarea
                      value={basisChanges}
                      onChange={(e) => setBasisChanges(e.target.value)}
                      rows={2}
                      placeholder="z.B. Mitarbeitergespräch im Kontext der Fallstudie Varexia SE einbetten…"
                      data-testid="input-basis-changes"
                      className="w-full rounded-lg border border-[var(--eds-status-green-bg)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-[var(--eds-status-green)] bg-white"
                    />
                  </div>
                </div>
              )}
              {!basisExercise && (
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showLibrary) fetchLibraryItems();
                      setShowBasisPicker(!showBasisPicker);
                    }}
                    data-testid="button-select-basis"
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-400 text-[var(--eds-status-green)] hover:bg-[var(--eds-status-green-bg)] transition-colors"
                  >
                    Bestehende Übung als Basis verwenden
                  </button>
                </div>
              )}
              {showBasisPicker && !basisExercise && (
                <div className="border border-[var(--eds-status-green-bg)] rounded-lg p-3 bg-[var(--eds-status-green-bg)]/50 max-h-48 overflow-y-auto">
                  {libraryLoading ? (
                    <p className="text-xs text-[var(--eds-text-disabled)]">Laden…</p>
                  ) : libraryItems.length === 0 ? (
                    <p className="text-xs text-[var(--eds-text-disabled)]">Keine Übungen in der Bibliothek.</p>
                  ) : (
                    <div className="space-y-1">
                      {libraryItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setBasisExercise(item);
                            setShowBasisPicker(false);
                            setExName(item.title + " (angepasst)");
                            setExType(item.exerciseType);
                            setExInstructions(item.metadataJson?.instructions || item.metadataJson?.description || "");
                          }}
                          className="w-full text-left px-3 py-2 rounded hover:bg-[var(--eds-status-green-bg)] transition-colors"
                          data-testid={`button-pick-basis-${item.id}`}
                        >
                          <p className="text-sm font-medium text-[var(--eds-text-primary)]">{item.title}</p>
                          <p className="text-xs text-[var(--eds-text-tertiary)]">
                            {EXERCISE_TYPE_LABELS[item.exerciseType] || item.exerciseType}
                            {item.clientName && <span className="text-[var(--eds-text-disabled)]"> · {item.clientName}</span>}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                  <input
                    type="text"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    required
                    data-testid="input-exercise-name"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Typ</label>
                  <select
                    value={exType}
                    onChange={(e) => setExType(e.target.value)}
                    data-testid="select-exercise-type"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  >
                    {EXERCISE_TYPES.map((t) => (
                      <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Anweisungen</label>
                <textarea
                  value={exInstructions}
                  onChange={(e) => setExInstructions(e.target.value)}
                  rows={2}
                  data-testid="input-exercise-instructions"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Dauer (Minuten)</label>
                  <input
                    type="number"
                    value={exDuration}
                    onChange={(e) => setExDuration(e.target.value)}
                    min="0"
                    data-testid="input-exercise-duration"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Reihenfolge</label>
                  <input
                    type="number"
                    value={exSortOrder}
                    onChange={(e) => setExSortOrder(e.target.value)}
                    min="0"
                    data-testid="input-exercise-sort-order"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
              </div>
              {exError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-exercise-error">{exError}</p>}
              {aiError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-ai-error">{aiError}</p>}

              {aiGenerating && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4" data-testid="ai-progress">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">KI-Generierung</span>
                    <span className="text-sm font-bold text-purple-700">{aiProgress}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2.5 mb-2">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${aiProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-600">{aiProgressLabel}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={exCreating || aiGenerating || !exName.trim()}
                  data-testid="button-submit-exercise"
                  className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                >
                  {exCreating ? "Wird erstellt…" : "Übung erstellen"}
                </button>
                <button
                  type="button"
                  onClick={handleAIGenerateExercise}
                  disabled={aiGenerating || exCreating || !exName.trim()}
                  data-testid="button-ai-generate-exercise"
                  className="rounded-lg bg-purple-600 text-white text-sm font-medium px-6 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Generiert…
                    </>
                  ) : "KI-Generierung"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4" data-testid="table-exercises">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden" data-testid={`row-exercise-${ex.id}`}>
              <div className="px-5 py-3 flex items-center gap-4 border-b border-[var(--eds-border)]">
                <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--eds-text-primary)]">{ex.name}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--eds-text-disabled)] mt-0.5">
                    <span>{EXERCISE_TYPE_LABELS[ex.type] || ex.type}</span>
                    {ex.duration && <span>· {ex.duration} Min.</span>}
                    <span>· Reihenfolge: {ex.sortOrder}</span>
                    <span>· {ex.documents.length} Dok.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (editingExId === ex.id) {
                        setEditingExId(null);
                      } else {
                        setEditingExId(ex.id);
                        setEditExName(ex.name);
                        setEditExType(ex.type);
                        setEditExInstructions(ex.instructions ?? "");
                        setEditExDuration(ex.duration?.toString() ?? "");
                        setEditExSortOrder(ex.sortOrder.toString());
                      }
                    }}
                    data-testid={`button-edit-exercise-${ex.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors px-2 py-1 rounded hover:bg-brand-blue/5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => {
                      setExerciseDocUpload(exerciseDocUpload === ex.id ? null : ex.id);
                      setExerciseDocName("");
                      setExerciseDocFile(null);
                      setExerciseDocError("");
                    }}
                    data-testid={`button-upload-doc-${ex.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--eds-status-green)] hover:text-[var(--eds-status-green)] transition-colors px-2 py-1 rounded hover:bg-[var(--eds-status-green-bg)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Dokument
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(ex.id)}
                    data-testid={`button-delete-exercise-${ex.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] transition-colors px-2 py-1 rounded hover:bg-[var(--eds-status-red-bg)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Löschen
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 bg-[var(--eds-bg-sunken)]/50 border-t border-[var(--eds-border)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[var(--eds-text-tertiary)] uppercase tracking-wider">Dokumente ({ex.documents.length})</p>
                  <button
                    onClick={() => {
                      setExerciseDocUpload(exerciseDocUpload === ex.id ? null : ex.id);
                      setExerciseDocName("");
                      setExerciseDocFile(null);
                      setExerciseDocError("");
                    }}
                    data-testid={`button-add-doc-inline-${ex.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--eds-status-green)] hover:text-[var(--eds-status-green)] transition-colors px-2 py-1 rounded hover:bg-[var(--eds-status-green-bg)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Dokument hinzufuegen
                  </button>
                </div>
                {ex.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {ex.documents.map(doc => {
                      const isPdf = doc.mimeType === "application/pdf" || doc.fileName?.toLowerCase().endsWith(".pdf");
                      return (
                        <div key={doc.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-[var(--eds-border)] hover:border-[var(--eds-border)] transition-colors" data-testid={`exercise-doc-${doc.id}`}>
                          <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${isPdf ? "bg-[var(--eds-status-red-bg)]" : "bg-[var(--eds-bg-sunken)]"}`}>
                            {isPdf ? (
                              <svg className="w-3.5 h-3.5 text-[var(--eds-status-red)]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--eds-text-primary)] truncate">{doc.name || doc.fileName}</p>
                            <p className="text-xs text-[var(--eds-text-disabled)]">{doc.fileName} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ""}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isPdf && (
                              <button
                                onClick={() => handleViewDocument(doc.id, doc.fileName || doc.name)}
                                data-testid={`button-view-doc-${doc.id}`}
                                className="text-xs text-brand-blue hover:text-brand-navy font-medium px-2 py-1 rounded hover:bg-brand-blue/5 transition-colors"
                              >
                                Anzeigen
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadDocument(doc.id)}
                              data-testid={`button-download-doc-${doc.id}`}
                              className="text-xs text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] font-medium px-2 py-1 rounded hover:bg-[var(--eds-bg-sunken)] transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDeleteExerciseDoc(doc.id)}
                              data-testid={`button-delete-doc-${doc.id}`}
                              className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] font-medium px-2 py-1 rounded hover:bg-[var(--eds-status-red-bg)] transition-colors"
                            >
                              Entfernen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4 border border-dashed border-[var(--eds-border)] rounded-lg bg-white/50">
                    <button
                      onClick={() => {
                        setExerciseDocUpload(ex.id);
                        setExerciseDocName("");
                        setExerciseDocFile(null);
                        setExerciseDocError("");
                      }}
                      data-testid={`button-upload-empty-${ex.id}`}
                      className="inline-flex items-center gap-2 text-sm text-[var(--eds-text-disabled)] hover:text-[var(--eds-status-green)] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Klicken Sie hier, um ein Dokument hochzuladen
                    </button>
                  </div>
                )}
              </div>

              {exerciseDocUpload === ex.id && (
                <div className="px-5 py-3 bg-[var(--eds-status-green-bg)]/50 border-t border-emerald-100">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Name</label>
                      <input
                        value={exerciseDocName}
                        onChange={e => setExerciseDocName(e.target.value)}
                        placeholder="Optional – Dateiname wird verwendet"
                        data-testid={`input-exercise-doc-name-${ex.id}`}
                        className="w-full border border-[var(--eds-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-[var(--eds-status-green)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Datei *</label>
                      <input
                        type="file"
                        onChange={e => setExerciseDocFile(e.target.files?.[0] || null)}
                        data-testid={`input-exercise-doc-file-${ex.id}`}
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--eds-status-green-bg)] file:text-[var(--eds-status-green)] hover:file:bg-emerald-200"
                      />
                    </div>
                  </div>
                  {exerciseDocError && <p className="text-sm text-[var(--eds-status-red)] mb-2">{exerciseDocError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUploadExerciseDoc(ex.id)}
                      disabled={!exerciseDocFile || exerciseDocUploading}
                      data-testid={`button-submit-exercise-doc-${ex.id}`}
                      className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {exerciseDocUploading ? "Wird hochgeladen…" : "Hochladen"}
                    </button>
                    <button
                      onClick={() => { setExerciseDocUpload(null); setExerciseDocName(""); setExerciseDocFile(null); setExerciseDocError(""); }}
                      className="text-sm text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {editingExId === ex.id && (
                <div className="bg-[var(--eds-bg-sunken)] border-t border-[var(--eds-border)] px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Name *</label>
                      <input
                        type="text"
                        value={editExName}
                        onChange={(e) => setEditExName(e.target.value)}
                        data-testid="input-edit-exercise-name"
                        className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Typ</label>
                      <select
                        value={editExType}
                        onChange={(e) => setEditExType(e.target.value)}
                        data-testid="select-edit-exercise-type"
                        className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                      >
                        {EXERCISE_TYPES.map((t) => (
                          <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Dauer (Min.)</label>
                      <input
                        type="number"
                        value={editExDuration}
                        onChange={(e) => setEditExDuration(e.target.value)}
                        data-testid="input-edit-exercise-duration"
                        className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Reihenfolge</label>
                      <input
                        type="number"
                        value={editExSortOrder}
                        onChange={(e) => setEditExSortOrder(e.target.value)}
                        data-testid="input-edit-exercise-sort-order"
                        className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[var(--eds-text-secondary)] mb-1">Anweisungen</label>
                    <textarea
                      value={editExInstructions}
                      onChange={(e) => setEditExInstructions(e.target.value)}
                      rows={3}
                      data-testid="textarea-edit-exercise-instructions"
                      className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateExercise(ex.id)}
                      data-testid="button-save-exercise"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark transition-colors"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingExId(null)}
                      data-testid={`button-close-exercise-${ex.id}`}
                      className="text-sm text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
