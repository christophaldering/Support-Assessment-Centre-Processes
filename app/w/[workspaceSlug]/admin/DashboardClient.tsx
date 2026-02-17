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
  });
  const [error, setError] = useState("");

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
      setForm({ name: "", description: "", startDate: "", endDate: "", designMode: "classic" });
      router.push(`${base}/projects/${newAssessment.id}`);
    } catch {
      setError("Netzwerkfehler");
      setCreating(false);
    }
  }

  return (
    <section className="mb-10" data-testid="section-projects">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Projekte & Assessments
          </h2>
          <p className="text-sm mt-0.5 opacity-40 italic">
            Wählen Sie ein Projekt oder erstellen Sie ein neues.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: primary }}
          data-testid="button-create-project"
        >
          + Neues Projekt
        </button>
      </div>

      {showCreate && (
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
                <p className="text-[11px] mt-1.5 opacity-40 italic">
                  {form.designMode === "ai_full" ? "KI generiert komplette Assessment-Struktur mit Modul-Vorschlägen." :
                   form.designMode === "ai_supported" ? "KI schlägt Optionen vor, Sie wählen und modifizieren." :
                   "Sie wählen Module manuell aus der Bibliothek."}
                </p>
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
      )}

      {assessments.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: `${primary}20` }}
          data-testid="empty-projects"
        >
          <p className="text-lg font-medium opacity-40 mb-2">Noch keine Projekte vorhanden</p>
          <p className="text-sm opacity-30 mb-4">Erstellen Sie Ihr erstes Assessment-Projekt, um loszulegen.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: primary }}
            data-testid="button-create-first-project"
          >
            + Erstes Projekt erstellen
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => {
            const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8" };
            return (
              <Link
                key={a.id}
                href={`${base}/projects/${a.id}`}
                className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group flex"
                style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
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
                        <p className="text-sm opacity-50 mt-1 line-clamp-2">{a.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs opacity-40">
                        <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                        <span>{a.candidateCount} Kandidat{a.candidateCount !== 1 ? "en" : ""}</span>
                        <span>{a.exerciseCount} Übung{a.exerciseCount !== 1 ? "en" : ""}</span>
                        <span>{a.reportCount} Bericht{a.reportCount !== 1 ? "e" : ""}</span>
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
                      className="text-sm font-medium opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap"
                      style={{ color: primary }}
                    >
                      Öffnen →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
