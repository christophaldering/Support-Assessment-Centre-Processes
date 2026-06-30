/**
 * Einheitliche Dokument-Herkunfts-Kennzeichnung
 *
 * Zentrale Mapping-Schicht: leitet aus bestehenden Modell-Feldern den
 * einheitlichen DocumentOrigin-Status ab. Verändert KEINE bestehenden Felder.
 */

export type DocumentOrigin = "PROVIDED" | "DERIVED" | "GENERATED";

// ─── Document ────────────────────────────────────────────────────────────────

/**
 * Source fields: objectPath (String)
 * Immer PROVIDED — reiner menschlicher Upload, keine KI-Verarbeitung.
 */
export function resolveOriginForDocument(_doc: { objectPath: string }): DocumentOrigin {
  return "PROVIDED";
}

// ─── AudioRecording ──────────────────────────────────────────────────────────

/**
 * Source fields: objectPath (String)
 * Immer PROVIDED — reiner menschlicher Upload.
 */
export function resolveOriginForAudioRecording(_rec: { objectPath: string }): DocumentOrigin {
  return "PROVIDED";
}

// ─── Report ──────────────────────────────────────────────────────────────────

/**
 * Source fields: objectPath (String?)
 * Immer GENERATED — Reports sind konzeptionell immer KI/System-Output.
 */
export function resolveOriginForReport(_report: { objectPath?: string | null }): DocumentOrigin {
  return "GENERATED";
}

// ─── ReportTemplate ──────────────────────────────────────────────────────────

/**
 * Source fields: isAnonymized (Boolean), analysisStatus (String), sourceFilePath (String?)
 * DERIVED wenn: analysisStatus === "analyzed" UND isAnonymized === true (KI-aufbereitet).
 * Sonst PROVIDED (reiner Upload).
 */
export function resolveOriginForReportTemplate(template: {
  isAnonymized: boolean;
  analysisStatus: string;
}): DocumentOrigin {
  if (template.analysisStatus === "analyzed" && template.isAnonymized === true) {
    return "DERIVED";
  }
  return "PROVIDED";
}

// ─── RequirementsAnalysis ────────────────────────────────────────────────────

/**
 * Source fields: inputType (String), objectPath (String?), transcript (String?), proposal (Json?)
 *
 * SONDERFALL: Ein Datensatz enthält gleichzeitig bereitgestellten Input
 * (objectPath / transcript) UND generierten Output (proposal).
 * → Status wird PRO ANZEIGE-KONTEXT bestimmt, nicht auf Datensatz-Ebene.
 * Diese Funktionen werden separat pro Kontext aufgerufen.
 */

/** Status des Input-Teils (Audio-Upload / Transkript) — immer PROVIDED. */
export function resolveOriginForRequirementsAnalysisInput(_ra: {
  inputType: string;
  objectPath?: string | null;
  transcript?: string | null;
}): DocumentOrigin {
  return "PROVIDED";
}

/** Status des Output-Teils (proposal/Analyse) — GENERATED sobald proposal vorhanden. */
export function resolveOriginForRequirementsAnalysisOutput(ra: {
  proposal?: unknown;
}): DocumentOrigin {
  return ra.proposal != null ? "GENERATED" : "PROVIDED";
}

// ─── CompetencyModel ─────────────────────────────────────────────────────────

/**
 * Source fields: sourceType (String, default "manual")
 * "manual" | "upload" → PROVIDED
 * "ai"               → GENERATED
 * Enthält "upload" UND zusätzliches AI-Signal wäre DERIVED — CompetencyModel
 * hat kein aiGenerated-Feld, daher nicht anwendbar.
 * Unbekannter Wert: wird dokumentiert und als PROVIDED behandelt (sicher).
 */
export function resolveOriginForCompetencyModel(model: {
  sourceType: string;
}): DocumentOrigin {
  const st = model.sourceType;
  // Exakte HARDPROMPT-Werte
  if (st === "manual" || st === "upload") return "PROVIDED";
  if (st === "ai") return "GENERATED";
  // Erweiterte tatsächliche DB-Werte (Stand aktuelles Schema):
  // "uploaded" → hochgeladen, kein KI-Eingriff → PROVIDED
  if (st === "uploaded" || st === "client_provided" || st === "co_developed" || st === "standard") return "PROVIDED";
  // "ai_generated" → vollständig KI-erzeugt → GENERATED
  if (st === "ai_generated") return "GENERATED";
  // "analysis_derived" → aus Analyse abgeleitet → DERIVED
  if (st === "analysis_derived") return "DERIVED";
  // Unbekannter sourceType-Wert — Bekannte Werte: "manual", "upload", "uploaded",
  // "ai", "ai_generated", "analysis_derived", "client_provided", "co_developed", "standard"
  console.warn(`[resolveOriginForCompetencyModel] Unbekannter sourceType: "${st}" — liefere PROVIDED`);
  return "PROVIDED";
}

// ─── WorkspaceStyleGuide ─────────────────────────────────────────────────────

/**
 * Source fields: sourceType (String), fileObjectPath (String?)
 * "manual" | "upload" → PROVIDED
 * "ai"               → GENERATED
 * WorkspaceStyleGuide hat kein aiGenerated-Feld → DERIVED-Bedingung nicht anwendbar.
 */
export function resolveOriginForWorkspaceStyleGuide(guide: {
  sourceType: string;
}): DocumentOrigin {
  const st = guide.sourceType;
  if (st === "manual" || st === "upload") return "PROVIDED";
  if (st === "ai") return "GENERATED";
  console.warn(`[resolveOriginForWorkspaceStyleGuide] Unbekannter sourceType: "${st}" — liefere PROVIDED`);
  return "PROVIDED";
}

// ─── ExerciseLibraryItem ─────────────────────────────────────────────────────

/**
 * Source fields: basedOnId (String?), originalFileKey (String?)
 * basedOnId !== null UND originalFileKey !== null → DERIVED (Upload + KI-Ableitung)
 * Nur originalFileKey !== null                   → PROVIDED (reiner Upload)
 * Keines von beiden                              → GENERATED (reine KI-Erstellung)
 */
export function resolveOriginForExerciseLibraryItem(item: {
  basedOnId?: string | null;
  originalFileKey?: string | null;
}): DocumentOrigin {
  if (item.basedOnId != null && item.originalFileKey != null) return "DERIVED";
  if (item.originalFileKey != null) return "PROVIDED";
  return "GENERATED";
}

// ─── ObservationSheet ────────────────────────────────────────────────────────

/**
 * Source fields: fileName (String?), aiGenerated (Boolean)
 * fileName vorhanden UND aiGenerated === true  → DERIVED
 * fileName vorhanden UND aiGenerated === false → PROVIDED
 * Keine Datei UND aiGenerated === true         → GENERATED
 * Kein Datei UND aiGenerated === false         → PROVIDED (leerer Entwurf)
 */
export function resolveOriginForObservationSheet(sheet: {
  fileName?: string | null;
  aiGenerated: boolean;
}): DocumentOrigin {
  if (sheet.fileName != null && sheet.aiGenerated) return "DERIVED";
  if (sheet.fileName != null) return "PROVIDED";
  if (sheet.aiGenerated) return "GENERATED";
  return "PROVIDED";
}

// ─── ObservationSheetTemplate ────────────────────────────────────────────────

/**
 * Source fields: originalFileKey (String?), aiGenerated (Boolean)
 * originalFileKey vorhanden UND aiGenerated === true  → DERIVED
 * originalFileKey vorhanden UND aiGenerated === false → PROVIDED
 * Keine Datei UND aiGenerated === true                → GENERATED
 * Keine Datei UND aiGenerated === false               → PROVIDED (leerer Entwurf)
 */
export function resolveOriginForObservationSheetTemplate(template: {
  originalFileKey?: string | null;
  aiGenerated: boolean;
}): DocumentOrigin {
  if (template.originalFileKey != null && template.aiGenerated) return "DERIVED";
  if (template.originalFileKey != null) return "PROVIDED";
  if (template.aiGenerated) return "GENERATED";
  return "PROVIDED";
}

// ─── CaseStudy ───────────────────────────────────────────────────────────────

/**
 * Source fields: sourceType (String, default "manual"), aiGenerated (Boolean), sourceFilePath (String?)
 * Enthält "upload" UND aiGenerated === true → DERIVED (Upload + KI-Verarbeitung)
 * "manual" | "upload"                       → PROVIDED
 * "ai"                                      → GENERATED
 * Sonstiger unbekannter Wert                → dokumentiert, PROVIDED als Fallback
 */
export function resolveOriginForCaseStudy(cs: {
  sourceType: string;
  aiGenerated: boolean;
}): DocumentOrigin {
  if (cs.sourceType.includes("upload") && cs.aiGenerated) return "DERIVED";
  if (cs.sourceType === "manual" || cs.sourceType === "upload") return "PROVIDED";
  if (cs.sourceType === "ai") return "GENERATED";
  console.warn(`[resolveOriginForCaseStudy] Unbekannter sourceType: "${cs.sourceType}" — liefere PROVIDED`);
  return "PROVIDED";
}

// ─── PortalDocument ──────────────────────────────────────────────────────────

/**
 * Source fields: objectPath (String?)
 * Immer PROVIDED — Portal-Dokumente sind reine Uploads.
 */
export function resolveOriginForPortalDocument(_doc: {
  objectPath?: string | null;
}): DocumentOrigin {
  return "PROVIDED";
}

// ─── Assessment ──────────────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default false)
 * aiGenerated === true → GENERATED, sonst PROVIDED.
 */
export function resolveOriginForAssessment(a: { aiGenerated: boolean }): DocumentOrigin {
  return a.aiGenerated ? "GENERATED" : "PROVIDED";
}

// ─── Exercise ────────────────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default false)
 * aiGenerated === true → GENERATED, sonst PROVIDED.
 */
export function resolveOriginForExercise(e: { aiGenerated: boolean }): DocumentOrigin {
  return e.aiGenerated ? "GENERATED" : "PROVIDED";
}

// ─── ObserverRating ──────────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default false)
 * aiGenerated === true → GENERATED, sonst PROVIDED.
 */
export function resolveOriginForObserverRating(r: { aiGenerated: boolean }): DocumentOrigin {
  return r.aiGenerated ? "GENERATED" : "PROVIDED";
}

// ─── PredictiveProfile ───────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default true)
 * Immer GENERATED — kein menschlicher Gegenbeispiel-Fall im Schema.
 */
export function resolveOriginForPredictiveProfile(_p: { aiGenerated: boolean }): DocumentOrigin {
  return "GENERATED";
}

// ─── DevelopmentBlueprint ────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default true)
 * Immer GENERATED.
 */
export function resolveOriginForDevelopmentBlueprint(_b: {
  aiGenerated: boolean;
}): DocumentOrigin {
  return "GENERATED";
}

// ─── DiagnosticHypothesis ────────────────────────────────────────────────────

/**
 * Source fields: aiGenerated (Boolean, default true)
 * Immer GENERATED.
 */
export function resolveOriginForDiagnosticHypothesis(_h: {
  aiGenerated: boolean;
}): DocumentOrigin {
  return "GENERATED";
}
