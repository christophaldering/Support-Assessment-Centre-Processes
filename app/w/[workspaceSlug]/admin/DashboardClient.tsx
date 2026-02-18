"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AssessmentItem {
  id: string;
  name: string;
  status: string;
  designMode: string;
  description: string | null;
  clientName: string | null;
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

interface RoleSummary {
  role: string;
  label: string;
  count: number;
}

interface ModuleItem {
  title: string;
  description: string;
  href: string;
  icon: string;
  count?: number;
  countLabel?: string;
}

const designModeLabels: Record<string, { de: string; icon: string }> = {
  ai_full: { de: "KI-Vollautomatik", icon: "⚡" },
  ai_supported: { de: "KI-Unterstützt", icon: "🤖" },
  classic: { de: "Manuell", icon: "✋" },
};

interface Props {
  assessments: AssessmentItem[];
  roleSummary: RoleSummary[];
  modules: ModuleItem[];
  workspaceSlug: string;
  workspaceName: string;
  primary: string;
  textColor: string;
  bgColor: string;
  headingFont: string;
  isMaster: boolean;
  userRoles: string[];
}

const statusLabels: Record<string, { de: string; color: string; bg: string }> = {
  draft: { de: "Entwurf", color: "#64748b", bg: "#f1f5f9" },
  active: { de: "Aktiv", color: "#16a34a", bg: "#f0fdf4" },
  completed: { de: "Abgeschlossen", color: "#2563eb", bg: "#eff6ff" },
  archived: { de: "Archiviert", color: "#9ca3af", bg: "#f9fafb" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function ModuleIcon({ icon, color }: { icon: string; color: string }) {
  const cls = "w-5 h-5";
  const props = { className: cls, fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: color };
  switch (icon) {
    case "target":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" /></svg>;
    case "library":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
    case "builder":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.573-5.572a2.625 2.625 0 113.714-3.714l5.573 5.572M11.42 15.17l4.572 4.574a2.625 2.625 0 003.714-3.714l-4.573-4.574M11.42 15.17l-1.06-1.06" /></svg>;
    case "clipboard":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" /></svg>;
    case "chart":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
    case "palette":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>;
    case "brain":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
    case "users":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    default:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>;
  }
}

export default function DashboardClient({
  assessments, roleSummary, modules, workspaceSlug, workspaceName,
  primary, textColor, bgColor, headingFont, isMaster, userRoles,
}: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientName: "",
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
          clientName: form.clientName.trim() || null,
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
      setForm({ name: "", description: "", clientName: "", startDate: "", endDate: "", designMode: "classic", copyFromId: "", autoDeleteDays: "" });
      router.push(`${base}/assessments/${newAssessment.id}`);
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
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors";
  const inputStyle = { borderColor: `${primary}25`, color: textColor, backgroundColor: bgColor };
  const focusRing = { "--tw-ring-color": `${primary}30` } as React.CSSProperties;

  function renderCreateModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
        <div
          className="rounded-2xl border shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: bgColor, borderColor: `${primary}15` }}
          onClick={(e) => e.stopPropagation()}
          data-testid="dialog-create-project"
        >
          <h3
            className="text-xl font-bold mb-6"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Neues Assessment erstellen
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Assessment-Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                style={{ ...inputStyle, ...focusRing }}
                placeholder="z.B. CEO REWE"
                data-testid="input-project-name"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Kunde</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className={inputClass}
                style={{ ...inputStyle, ...focusRing }}
                placeholder="z.B. REWE Group"
                data-testid="input-client-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Vorlage verwenden</label>
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
                className={inputClass}
                style={{ ...inputStyle, ...focusRing }}
                data-testid="select-copy-from"
              >
                <option value="">— Keine Vorlage —</option>
                {localAssessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Beschreibung</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass + " min-h-[70px] resize-y"}
                style={{ ...inputStyle, ...focusRing }}
                placeholder="Kurze Beschreibung..."
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Startdatum</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} style={{ ...inputStyle, ...focusRing }} data-testid="input-project-start-date" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Enddatum</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} style={{ ...inputStyle, ...focusRing }} data-testid="input-project-end-date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: textColor }}>Design-Modus</label>
              <div className="grid grid-cols-3 gap-2">
                {(["ai_full", "ai_supported", "classic"] as const).map((mode) => {
                  const ml = designModeLabels[mode] ?? { de: mode, icon: "✋" };
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
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>Auto-Löschung</label>
              <select value={form.autoDeleteDays} onChange={(e) => setForm({ ...form, autoDeleteDays: e.target.value })} className={inputClass} style={{ ...inputStyle, ...focusRing }} data-testid="select-auto-delete-days">
                <option value="">Keine</option>
                <option value="30">30 Tage</option>
                <option value="60">60 Tage</option>
                <option value="90">90 Tage</option>
                <option value="180">180 Tage</option>
                <option value="365">365 Tage</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600 font-medium" data-testid="text-create-error">{error}</p>}
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
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: `'${headingFont}', serif`, color: "#ef4444" }}>Assessment löschen</h3>
          <p className="text-sm mb-6" style={{ color: textColor }}>
            Möchten Sie &laquo;{project.name}&raquo; wirklich löschen? Alle zugehörigen Daten werden unwiderruflich entfernt.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-slate-50" style={{ borderColor: `${primary}20`, color: textColor }} data-testid="button-cancel-delete">
              Abbrechen
            </button>
            <button type="button" onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete} className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#ef4444" }} data-testid="button-confirm-delete">
              {deletingId === confirmDelete ? "Wird gelöscht..." : "Endgültig löschen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = roleSummary.reduce((sum, r) => sum + r.count, 0);
  const activeCount = localAssessments.filter((a) => a.status === "active").length;
  const draftCount = localAssessments.filter((a) => a.status === "draft").length;
  const completedCount = localAssessments.filter((a) => a.status === "completed").length;
  const totalCandidates = localAssessments.reduce((sum, a) => sum + a.candidateCount, 0);
  const totalExercises = localAssessments.reduce((sum, a) => sum + a.exerciseCount, 0);

  const kpis = [
    { label: "Assessments", value: localAssessments.length, sub: `${activeCount} aktiv`, icon: "briefcase" },
    { label: "Teilnehmer", value: totalCandidates, sub: "gesamt", icon: "people" },
    { label: "Übungen", value: totalExercises, sub: "zugewiesen", icon: "puzzle" },
    { label: "Team", value: totalUsers, sub: `${roleSummary.length} Rollen`, icon: "shield" },
  ];

  function KpiIcon({ icon }: { icon: string }) {
    const cls = "w-5 h-5";
    const props = { className: cls, fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: primary };
    switch (icon) {
      case "briefcase":
        return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
      case "people":
        return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
      case "puzzle":
        return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>;
      case "shield":
        return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9", color: textColor }}>
      {renderCreateModal()}
      {renderDeleteConfirmation()}

      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: `${primary}12` }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold" style={{ color: primary, fontFamily: `'${headingFont}', serif` }}>{workspaceName}</span>
          </div>
          <div className="flex items-center gap-3">
            {userRoles.length > 0 && (
              <span className="text-[11px] opacity-50">{userRoles.join(", ")}</span>
            )}
            {isMaster && (
              <Link
                href="/admin/workspaces"
                className="text-[11px] font-medium opacity-60 hover:opacity-100 border rounded-full px-2.5 py-0.5 transition-colors"
                style={{ borderColor: `${primary}25`, color: primary }}
                data-testid="link-switch-workspace"
              >
                Workspace wechseln
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif`, color: textColor }}
            data-testid="text-dashboard-title"
          >
            Enterprise Cockpit
          </h1>
          <p className="text-sm mt-1 opacity-50">
            {workspaceName} · Diagnostik-Plattform
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="kpi-grid">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm"
              style={{ borderColor: `${primary}10` }}
              data-testid={`kpi-${kpi.label.toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                  <KpiIcon icon={kpi.icon} />
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: textColor, fontFamily: `'${headingFont}', serif` }}>{kpi.value}</div>
              <div className="text-xs mt-0.5 opacity-50">{kpi.label} · {kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: `'${headingFont}', serif`, color: textColor }} data-testid="text-assessments-title">
                Assessments
              </h2>
              <p className="text-xs opacity-50 mt-0.5">
                {activeCount > 0 && <span className="font-medium" style={{ color: "#16a34a" }}>{activeCount} aktiv</span>}
                {activeCount > 0 && draftCount > 0 && " · "}
                {draftCount > 0 && <span>{draftCount} Entwurf</span>}
                {(activeCount > 0 || draftCount > 0) && completedCount > 0 && " · "}
                {completedCount > 0 && <span>{completedCount} abgeschlossen</span>}
                {activeCount === 0 && draftCount === 0 && completedCount === 0 && <span>Noch keine Assessments</span>}
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white rounded-xl transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: primary }}
              data-testid="button-create-project"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Neues Assessment
            </button>
          </div>

          {localAssessments.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: `${primary}10` }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={primary}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <p className="text-sm opacity-50 mb-4">Noch keine Assessments vorhanden.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white rounded-xl hover:opacity-90"
                style={{ backgroundColor: primary }}
                data-testid="button-create-first-project"
              >
                Erstes Assessment erstellen
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="assessments-grid">
              {localAssessments.map((a) => {
                const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8", bg: "#f9fafb" };
                const dm = designModeLabels[a.designMode] ?? { de: a.designMode, icon: "✋" };
                const progress = Math.round(a.ratingProgress);
                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-xl border group cursor-pointer transition-all hover:shadow-md hover:border-opacity-40"
                    style={{ borderColor: `${primary}12` }}
                    onClick={() => router.push(`${base}/assessments/${a.id}`)}
                    data-testid={`card-assessment-${a.id}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: st.bg, color: st.color }}
                            >
                              {st.de}
                            </span>
                            {a.autoDeleteDays && (
                              <span className="text-[10px] opacity-40 flex items-center gap-0.5" title={`Auto-Löschung nach ${a.autoDeleteDays} Tagen`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {a.autoDeleteDays}d
                              </span>
                            )}
                          </div>
                          <h3
                            className="text-sm font-bold truncate group-hover:underline"
                            style={{ fontFamily: `'${headingFont}', serif`, color: textColor }}
                          >
                            {a.name}
                          </h3>
                          {a.clientName && (
                            <p className="text-[11px] opacity-50 mt-0.5 truncate">{a.clientName}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(a.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity hover:bg-red-50 shrink-0 ml-2"
                          style={{ color: "#ef4444" }}
                          data-testid={`button-delete-assessment-${a.id}`}
                          title="Löschen"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] opacity-50 mb-3">
                        <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-base font-bold tabular-nums" style={{ color: textColor }}>{a.candidateCount}</div>
                          <div className="text-[10px] opacity-40">Teilnehmer</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-bold tabular-nums" style={{ color: textColor }}>{a.exerciseCount}</div>
                          <div className="text-[10px] opacity-40">Übungen</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-bold tabular-nums" style={{ color: textColor }}>{a.reportCount}</div>
                          <div className="text-[10px] opacity-40">Berichte</div>
                        </div>
                      </div>

                      {progress > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="opacity-50">Bewertungsfortschritt</span>
                            <span className="font-medium" style={{ color: primary }}>{progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${primary}10` }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: primary }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: `${primary}06` }}>
                      <span className="text-[10px] opacity-40 flex items-center gap-1">
                        <span>{dm.icon}</span> {dm.de}
                      </span>
                      <span className="text-[11px] font-medium group-hover:underline" style={{ color: primary }}>
                        Öffnen →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-10">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border" style={{ borderColor: `${primary}10` }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: `${primary}06` }}>
                <h2 className="text-sm font-bold" style={{ fontFamily: `'${headingFont}', serif`, color: textColor }} data-testid="text-team-title">
                  Team
                </h2>
                <p className="text-[11px] opacity-50 mt-0.5">
                  {totalUsers} Person{totalUsers !== 1 ? "en" : ""}
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: `${primary}06` }}>
                {roleSummary.map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <span className="text-xs" style={{ color: r.count > 0 ? textColor : `${textColor}50` }}>
                      {r.label}
                    </span>
                    <span
                      className="text-[11px] font-bold tabular-nums min-w-[24px] text-center rounded-full py-0.5"
                      style={{
                        backgroundColor: r.count > 0 ? `${primary}10` : "transparent",
                        color: r.count > 0 ? primary : `${textColor}30`,
                      }}
                    >
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t" style={{ borderColor: `${primary}06` }}>
                <Link
                  href={`${base}/users`}
                  className="text-[11px] font-medium hover:underline"
                  style={{ color: primary }}
                  data-testid="link-manage-users"
                >
                  Benutzer verwalten →
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-4">
              <h2 className="text-sm font-bold" style={{ fontFamily: `'${headingFont}', serif`, color: textColor }} data-testid="text-modules-title">
                Module & Werkzeuge
              </h2>
              <p className="text-[11px] opacity-50 mt-0.5">
                Werkzeuge für Ihre Assessment-Center
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="modules-grid">
              {modules.map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="group"
                  data-testid={`link-module-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <div
                    className="bg-white rounded-xl border p-4 h-full transition-all hover:shadow-md"
                    style={{ borderColor: `${primary}10` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${primary}08` }}
                      >
                        <ModuleIcon icon={mod.icon} color={primary} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className="text-xs font-semibold group-hover:underline truncate"
                            style={{ color: textColor, fontFamily: `'${headingFont}', serif` }}
                          >
                            {mod.title}
                          </h3>
                          {mod.count !== undefined && (
                            <span
                              className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 ml-1"
                              style={{ backgroundColor: `${primary}08`, color: primary }}
                            >
                              {mod.count}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-50 line-clamp-2 mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-5 bg-white" style={{ borderColor: `${primary}08` }}>
        <p className="text-center text-[11px] opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
