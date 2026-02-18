"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AssessmentItem {
  id: string;
  name: string;
  status: string;
  designMode: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  candidateCount: number;
  exerciseCount: number;
  reportCount: number;
  ratingCount: number;
  consolidatedCount: number;
  competencyCoverage: number;
  ratingProgress: number;
  autoDeleteDays: number | null;
}

const designModeLabels: Record<string, { de: string; icon: string }> = {
  ai_full: { de: "KI-Vollautomatik", icon: "⚡" },
  ai_supported: { de: "KI-Unterstützt", icon: "🤖" },
  classic: { de: "Manuell", icon: "✋" },
};

interface Props {
  assessments: AssessmentItem[];
  workspaceSlug: string;
  primary: string;
  textColor: string;
  bgColor: string;
  headingFont: string;
}

const statusLabels: Record<string, { de: string; color: string }> = {
  draft: { de: "Entwurf", color: "#94a3b8" },
  active: { de: "Aktiv", color: "#22c55e" },
  completed: { de: "Abgeschlossen", color: "#3b82f6" },
  archived: { de: "Archiviert", color: "#9ca3af" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardClient({ assessments, workspaceSlug, primary, textColor, bgColor, headingFont }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    designMode: "classic",
    copyFromId: "",
    autoDeleteDays: "",
  });
  const [error, setError] = useState("");
  const [localAssessments, setLocalAssessments] = useState<AssessmentItem[]>(assessments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedProjectView, setSelectedProjectView] = useState<"all" | string>("all");

  const base = `/w/${workspaceSlug}/admin`;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name ist erforderlich");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: "draft",
          designMode: form.designMode,
          autoDeleteDays: form.autoDeleteDays ? parseInt(form.autoDeleteDays) : null,
          ...(form.copyFromId ? { copyFromId: form.copyFromId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
        setCreating(false);
        return;
      }

      const newAssessment = await res.json();
      setShowCreate(false);
      setForm({ name: "", description: "", startDate: "", endDate: "", designMode: "classic", copyFromId: "", autoDeleteDays: "" });
      router.push(`${base}/projects/${newAssessment.id}`);
    } catch {
      setError("Netzwerkfehler");
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLocalAssessments((prev) => prev.filter((a) => a.id !== id));
        setConfirmDelete(null);
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  function renderProjectCard(a: AssessmentItem) {
    const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8" };
    return (
      <div
        key={a.id}
        className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group flex relative"
        style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
        data-testid={`card-project-${a.id}`}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirmDelete(a.id);
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
          style={{ color: "#ef4444" }}
          data-testid={`button-delete-project-${a.id}`}
          title="Projekt löschen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
        <Link
          href={`${base}/projects/${a.id}`}
          className="flex flex-1"
          data-testid={`link-project-${a.id}`}
        >
          <div
            className="w-1.5 shrink-0 rounded-l-xl"
            style={{ backgroundColor: st.color }}
          />
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3
                    className="text-lg font-bold tracking-tight truncate"
                    style={{ fontFamily: `'${headingFont}', serif`, color: textColor }}
                  >
                    {a.name}
                  </h3>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}
                  >
                    {st.de}
                  </span>
                </div>
                {a.description && (
                  <p className="text-sm opacity-80 mt-1 line-clamp-2" style={{ color: textColor }}>{a.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs opacity-70" style={{ color: textColor }}>
                  <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                  <span>{a.candidateCount} Kandidat{a.candidateCount !== 1 ? "en" : ""}</span>
                  <span>{a.exerciseCount} Übung{a.exerciseCount !== 1 ? "en" : ""}</span>
                  <span>{a.reportCount} Bericht{a.reportCount !== 1 ? "e" : ""}</span>
                  {a.autoDeleteDays && (
                    <span className="flex items-center gap-1" data-testid={`status-auto-delete-${a.id}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Auto-Löschung: {a.autoDeleteDays} Tage
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5" data-testid={`status-indicators-${a.id}`}>
                  {(() => {
                    const dm = designModeLabels[a.designMode] ?? designModeLabels.classic;
                    return (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: a.designMode === "ai_full" ? "#faf5ff" : a.designMode === "ai_supported" ? "#eff6ff" : "#f8fafc",
                          color: a.designMode === "ai_full" ? "#7c3aed" : a.designMode === "ai_supported" ? "#2563eb" : "#64748b",
                          borderColor: a.designMode === "ai_full" ? "#7c3aed30" : a.designMode === "ai_supported" ? "#2563eb30" : "#64748b30",
                        }}
                        data-testid={`status-design-mode-${a.id}`}
                      >
                        {dm.icon} {dm.de}
                      </span>
                    );
                  })()}

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: a.competencyCoverage >= 80 ? "#f0fdf4" : a.competencyCoverage > 0 ? "#fffbeb" : "#f8fafc",
                      color: a.competencyCoverage >= 80 ? "#16a34a" : a.competencyCoverage > 0 ? "#d97706" : "#94a3b8",
                    }}
                    data-testid={`status-competency-${a.id}`}
                  >
                    Kompetenz {a.competencyCoverage}%
                  </span>

                  {(a.status === "active" || a.status === "completed") && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: a.ratingProgress >= 100 ? "#f0fdf4" : a.ratingProgress > 0 ? "#eff6ff" : "#fffbeb",
                        color: a.ratingProgress >= 100 ? "#16a34a" : a.ratingProgress > 0 ? "#2563eb" : "#d97706",
                      }}
                      data-testid={`status-evaluation-${a.id}`}
                    >
                      Bewertung {a.ratingProgress}%
                    </span>
                  )}

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: a.reportCount > 0 ? "#f0fdf4" : a.candidateCount > 0 ? "#fffbeb" : "#f8fafc",
                      color: a.reportCount > 0 ? "#16a34a" : a.candidateCount > 0 ? "#d97706" : "#94a3b8",
                    }}
                    data-testid={`status-reports-${a.id}`}
                  >
                    {a.reportCount > 0 ? `${a.reportCount} Bericht${a.reportCount !== 1 ? "e" : ""}` : a.candidateCount > 0 ? "Berichte ausstehend" : "Keine Berichte"}
                  </span>

                  {(() => {
                    const steps = [
                      a.competencyCoverage > 0,
                      a.exerciseCount > 0,
                      a.candidateCount > 0,
                      a.ratingCount > 0,
                      a.reportCount > 0,
                    ];
                    const done = steps.filter(Boolean).length;
                    const pct = Math.round((done / steps.length) * 100);
                    return (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: pct >= 100 ? "#f0fdf4" : pct >= 60 ? "#eff6ff" : pct > 0 ? "#fffbeb" : "#f8fafc",
                          color: pct >= 100 ? "#16a34a" : pct >= 60 ? "#2563eb" : pct > 0 ? "#d97706" : "#94a3b8",
                          borderColor: pct >= 100 ? "#16a34a20" : pct >= 60 ? "#2563eb20" : pct > 0 ? "#d9770620" : "#94a3b820",
                        }}
                        data-testid={`status-overall-${a.id}`}
                      >
                        Gesamt {pct}%
                      </span>
                    );
                  })()}
                </div>
              </div>
              <span
                className="text-sm font-medium opacity-0 group-hover:opacity-70 transition-opacity whitespace-nowrap"
                style={{ color: primary }}
              >
                Öffnen →
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  function renderCreateModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
        <div
          className="rounded-2xl border shadow-xl w-full max-w-lg p-8"
          style={{ backgroundColor: bgColor, borderColor: `${primary}20` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            className="text-xl font-bold mb-6"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Neues Projekt erstellen
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Projektname *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: `${primary}30`, color: textColor }}
                placeholder="z.B. Executive Assessment Q1 2026"
                data-testid="input-project-name"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Vorlage verwenden
              </label>
              <select
                value={form.copyFromId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    const source = localAssessments.find((a) => a.id === selectedId);
                    if (source && !form.name) {
                      setForm({ ...form, copyFromId: selectedId, name: `${source.name} (Kopie)` });
                      return;
                    }
                  }
                  setForm({ ...form, copyFromId: selectedId });
                }}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: `${primary}30`, color: textColor }}
                data-testid="select-copy-from"
              >
                <option value="">— Kein Vorlage —</option>
                {localAssessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[11px] mt-1 opacity-70 italic" style={{ color: textColor }}>
                (Optional) Erstellt eine Kopie eines bestehenden Projekts als Basis.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Beschreibung
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors min-h-[80px] resize-y"
                style={{ borderColor: `${primary}30`, color: textColor }}
                placeholder="Kurze Beschreibung des Projekts..."
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                  Startdatum
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ borderColor: `${primary}30`, color: textColor }}
                  data-testid="input-project-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                  Enddatum
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ borderColor: `${primary}30`, color: textColor }}
                  data-testid="input-project-end-date"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: textColor }}>
                Design-Modus
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ai_full", "ai_supported", "classic"] as const).map((mode) => {
                  const ml = designModeLabels[mode];
                  const selected = form.designMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, designMode: mode })}
                      className="rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-center"
                      style={{
                        borderColor: selected ? primary : `${primary}20`,
                        backgroundColor: selected ? `${primary}08` : "transparent",
                        color: selected ? primary : textColor,
                        boxShadow: selected ? `0 0 0 1px ${primary}` : "none",
                      }}
                      data-testid={`button-design-mode-${mode}`}
                    >
                      <span className="block text-base mb-0.5">{ml.icon}</span>
                      {ml.de}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5 opacity-70 italic" style={{ color: textColor }}>
                {form.designMode === "ai_full" ? "KI generiert komplette Assessment-Struktur mit Modul-Vorschlägen." :
                 form.designMode === "ai_supported" ? "KI schlägt Optionen vor, Sie wählen und modifizieren." :
                 "Sie wählen Module manuell aus der Bibliothek."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Automatische Löschung</label>
              <select value={form.autoDeleteDays} onChange={(e) => setForm({ ...form, autoDeleteDays: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: `${primary}30`, color: textColor, backgroundColor: bgColor }} data-testid="select-auto-delete-days">
                <option value="">Keine automatische Löschung</option>
                <option value="30">30 Tage nach Abschluss</option>
                <option value="60">60 Tage nach Abschluss</option>
                <option value="90">90 Tage nach Abschluss</option>
                <option value="180">180 Tage nach Abschluss</option>
                <option value="365">365 Tage nach Abschluss</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium" data-testid="text-create-error">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-slate-50"
                style={{ borderColor: `${primary}20`, color: textColor }}
                data-testid="button-cancel-create"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
                data-testid="button-submit-create"
              >
                {creating ? "Wird erstellt..." : "Erstellen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderDeleteConfirmation() {
    if (!confirmDelete) return null;
    const project = localAssessments.find((a) => a.id === confirmDelete);
    if (!project) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
        <div
          className="rounded-2xl border shadow-xl w-full max-w-md p-8"
          style={{ backgroundColor: bgColor, borderColor: `${primary}20` }}
          onClick={(e) => e.stopPropagation()}
          data-testid="dialog-confirm-delete"
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: `'${headingFont}', serif`, color: "#ef4444" }}
          >
            Projekt löschen
          </h3>
          <p className="text-sm mb-6" style={{ color: textColor }}>
            Möchten Sie das Projekt &apos;{project.name}&apos; wirklich löschen? Alle zugehörigen Daten werden unwiderruflich gelöscht.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-slate-50"
              style={{ borderColor: `${primary}20`, color: textColor }}
              data-testid="button-cancel-delete"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => handleDelete(confirmDelete)}
              disabled={deletingId === confirmDelete}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#ef4444" }}
              data-testid="button-confirm-delete"
            >
              {deletingId === confirmDelete ? "Wird gelöscht..." : "Endgültig löschen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="section-cockpit-tabs">
      {renderCreateModal()}
      {renderDeleteConfirmation()}

      <section data-testid="section-projects">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
            >
              Bestehende Projekte
            </h2>
            <p className="text-sm mt-0.5 opacity-70" style={{ color: textColor }}>
              {localAssessments.length} Projekt{localAssessments.length !== 1 ? "e" : ""} vorhanden
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: primary }}
            data-testid="button-create-project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Neues Projekt
          </button>
        </div>

        {localAssessments.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: `${primary}20` }}
            data-testid="empty-projects"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ color: primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
            >
              Noch keine Projekte
            </h3>
            <p className="text-sm opacity-70 mb-6" style={{ color: textColor }}>
              Erstellen Sie Ihr erstes Assessment-Projekt, um zu beginnen.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: primary }}
              data-testid="button-create-first-project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Erstes Projekt erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3 lg:hidden" data-testid="projects-card-list">
            {localAssessments.map((a) => renderProjectCard(a))}
          </div>
        )}

        {localAssessments.length > 0 && (
          <div className="hidden lg:block rounded-xl border overflow-hidden" style={{ borderColor: `${primary}15` }} data-testid="projects-table">
            <div
              className="grid text-[11px] font-semibold uppercase tracking-wider px-5 py-3"
              style={{
                gridTemplateColumns: "1fr 100px 110px 80px 80px 80px 50px",
                backgroundColor: `${primary}08`,
                color: `${primary}cc`,
              }}
            >
              <span>Projektname</span>
              <span>Status</span>
              <span>Modus</span>
              <span className="text-center">Kandidaten</span>
              <span className="text-center">Übungen</span>
              <span className="text-center">Berichte</span>
              <span></span>
            </div>
            {localAssessments.map((a) => {
              const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8" };
              const dm = designModeLabels[a.designMode] ?? designModeLabels.classic;
              return (
                <div
                  key={a.id}
                  className="grid items-center px-5 py-3.5 border-t cursor-pointer transition-colors group"
                  style={{
                    gridTemplateColumns: "1fr 100px 110px 80px 80px 80px 50px",
                    borderColor: `${primary}10`,
                  }}
                  onClick={() => router.push(`${base}/projects/${a.id}`)}
                  data-testid={`row-project-${a.id}`}
                >
                  <div className="min-w-0 pr-4">
                    <p
                      className="text-sm font-semibold truncate group-hover:underline"
                      style={{ color: textColor, fontFamily: `'${headingFont}', serif` }}
                    >
                      {a.name}
                    </p>
                    {a.description && (
                      <p className="text-[11px] mt-0.5 opacity-60 truncate" style={{ color: textColor }}>
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] opacity-50" style={{ color: textColor }}>
                      <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                      {a.autoDeleteDays && (
                        <span className="flex items-center gap-0.5" data-testid={`status-auto-delete-${a.id}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {a.autoDeleteDays}d
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}
                    >
                      {st.de}
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: a.designMode === "ai_full" ? "#faf5ff" : a.designMode === "ai_supported" ? "#eff6ff" : "#f8fafc",
                        color: a.designMode === "ai_full" ? "#7c3aed" : a.designMode === "ai_supported" ? "#2563eb" : "#64748b",
                      }}
                    >
                      {dm.icon} {dm.de}
                    </span>
                  </div>
                  <p className="text-sm text-center" style={{ color: textColor }}>{a.candidateCount}</p>
                  <p className="text-sm text-center" style={{ color: textColor }}>{a.exerciseCount}</p>
                  <p className="text-sm text-center" style={{ color: textColor }}>{a.reportCount}</p>
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(a.id);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      style={{ color: "#ef4444" }}
                      data-testid={`button-delete-project-${a.id}`}
                      title="Projekt löschen"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
