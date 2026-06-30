"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

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

interface UserItem {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
}

interface ModuleItem {
  title: string;
  description: string;
  href: string;
  icon: string;
  count?: number;
  countLabel?: string;
  moduleKey: string;
}

const designModeLabels: Record<string, { de: string; icon: string }> = {
  ai_full: { de: "KI-Vollautomatik", icon: "⚡" },
  ai_supported: { de: "KI-Unterstützt", icon: "🤖" },
  classic: { de: "Manuell", icon: "✋" },
};

const ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: "Master-Administratoren",
  WORKSPACE_ADMIN: "Workspace-Administratoren",
  ADMIN: "Administratoren",
  MODERATOR: "Moderatoren",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  PROJECT_ASSISTANT: "Projektassistenten",
  CLIENT: "Auftraggeber",
  HR_CLIENT: "HR-Kunden",
};

const TEAM_ROLE_ORDER = ["MASTER_ADMIN", "WORKSPACE_ADMIN", "ADMIN", "MODERATOR", "OBSERVER", "PROJECT_OFFICE", "PROJECT_ASSISTANT", "CLIENT", "HR_CLIENT"];

interface Props {
  assessments: AssessmentItem[];
  users: UserItem[];
  modules: ModuleItem[];
  workspaceSlug: string;
  workspaceName: string;
  primary: string;
  textColor: string;
  bgColor: string;
  headingFont: string;
  isMaster: boolean;
  isAdmin: boolean;
  userRoles: string[];
  featureFlags: Record<string, boolean>;
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
    case "competency":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    case "casestudy":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    case "report":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5" /></svg>;
    default:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>;
  }
}

export default function DashboardClient({
  assessments, users, modules, workspaceSlug, workspaceName,
  primary, textColor, bgColor, headingFont, isMaster, isAdmin, userRoles, featureFlags,
}: Props) {
  const canSeeAll = isMaster || isAdmin;
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
  const [deleteAction, setDeleteAction] = useState<"delete" | "archive">("archive");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<"dashboard" | "assessments" | "module-settings">("dashboard");
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({ ...featureFlags });
  const [savingFlags, setSavingFlags] = useState(false);
  const [flagSaved, setFlagSaved] = useState(false);

  const base = `/w/${workspaceSlug}/admin`;

  const clientGroups = useMemo(() => {
    const groups: Record<string, AssessmentItem[]> = {};
    for (const a of localAssessments) {
      const key = a.clientName || "__none__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      if (a === "__none__") return 1;
      if (b === "__none__") return -1;
      return a.localeCompare(b, "de");
    });
    return sorted;
  }, [localAssessments]);

  const teamUsers = useMemo(() => {
    return users.filter((u) => !u.roles.every((r) => r === "CANDIDATE"));
  }, [users]);

  const roleGroups = useMemo(() => {
    const groups: Record<string, UserItem[]> = {};
    for (const role of TEAM_ROLE_ORDER) {
      groups[role] = [];
    }
    for (const user of teamUsers) {
      for (const role of user.roles) {
        if (role === "CANDIDATE") continue;
        if (!groups[role]) groups[role] = [];
        groups[role].push(user);
      }
    }
    return groups;
  }, [teamUsers]);

  function toggleRole(key: string) {
    setCollapsedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleClient(key: string) {
    setCollapsedClients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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

  async function handleDeleteOrArchive(id: string) {
    if (!deletePassword) {
      setDeleteError("Bitte Passwort eingeben");
      return;
    }
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, action: deleteAction }),
      });
      if (res.ok) {
        setLocalAssessments((prev) => prev.filter((a) => a.id !== id));
        setConfirmDelete(null);
        setDeletePassword("");
        setDeleteError("");
        setDeleteAction("archive");
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Aktion fehlgeschlagen");
      }
    } catch {
      setDeleteError("Netzwerkfehler");
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass = "w-full rounded-lg border border-[var(--eds-border)] px-3 py-2.5 text-sm text-[var(--eds-text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--eds-status-blue)]/20 focus:border-[var(--eds-status-blue)] transition-colors";

  function renderCreateModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
        <div
          className="bg-white rounded-2xl border border-[var(--eds-border)] shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          data-testid="dialog-create-project"
        >
          <h3 className="text-xl font-semibold text-brand-navy mb-6">
            Neues Assessment erstellen
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Assessment-Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="z.B. CEO REWE"
                data-testid="input-project-name"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Kunde</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className={inputClass}
                placeholder="z.B. REWE Group"
                data-testid="input-client-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Vorlage verwenden</label>
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
                data-testid="select-copy-from"
              >
                <option value="">— Keine Vorlage —</option>
                {localAssessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Beschreibung</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass + " min-h-[70px] resize-y"}
                placeholder="Kurze Beschreibung..."
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Startdatum</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} data-testid="input-project-start-date" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Enddatum</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} data-testid="input-project-end-date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-2">Design-Modus</label>
              <div className="grid grid-cols-3 gap-2">
                {(["ai_full", "ai_supported", "classic"] as const).map((mode) => {
                  const ml = designModeLabels[mode] ?? { de: mode, icon: "✋" };
                  const selected = form.designMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, designMode: mode })}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-center ${
                        selected
                          ? "border-[var(--eds-status-blue)] bg-[var(--eds-status-blue-bg)]/60 text-[var(--eds-status-blue)] ring-1 ring-[var(--eds-status-blue)]"
                          : "border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)]"
                      }`}
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
              <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Auto-Löschung</label>
              <select value={form.autoDeleteDays} onChange={(e) => setForm({ ...form, autoDeleteDays: e.target.value })} className={inputClass} data-testid="select-auto-delete-days">
                <option value="">Keine</option>
                <option value="30">30 Tage</option>
                <option value="60">60 Tage</option>
                <option value="90">90 Tage</option>
                <option value="180">180 Tage</option>
                <option value="365">365 Tage</option>
              </select>
            </div>
            {error && <p className="text-sm text-[var(--eds-status-red)] font-medium" data-testid="text-create-error">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] transition-colors hover:bg-[var(--eds-bg-sunken)]"
                data-testid="button-cancel-create"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90 disabled:opacity-50"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setConfirmDelete(null); setDeletePassword(""); setDeleteError(""); setDeleteAction("archive"); }}>
        <div
          className="bg-white rounded-2xl border border-[var(--eds-border)] shadow-xl w-full max-w-md p-8"
          onClick={(e) => e.stopPropagation()}
          data-testid="dialog-confirm-delete"
        >
          <h3 className="text-lg font-semibold text-[var(--eds-text-primary)] mb-2">Assessment verwalten</h3>
          <p className="text-sm text-[var(--eds-text-tertiary)] mb-5">
            &laquo;{project.name}&raquo;
          </p>

          <div className="space-y-2 mb-5">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === "archive" ? "border-[var(--eds-status-blue)] bg-[var(--eds-status-blue-bg)]/50" : "border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]"}`}
              data-testid="radio-archive"
            >
              <input
                type="radio"
                name="deleteAction"
                checked={deleteAction === "archive"}
                onChange={() => setDeleteAction("archive")}
                className="mt-0.5 accent-[var(--eds-status-blue)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--eds-text-primary)]">Archivieren</span>
                <p className="text-xs text-[var(--eds-text-disabled)] mt-0.5">Assessment wird in den Archiv-Container verschoben. Nur Master-Administratoren können darauf zugreifen.</p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === "delete" ? "border-[var(--eds-status-red)] bg-[var(--eds-status-red-bg)]/50" : "border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]"}`}
              data-testid="radio-delete"
            >
              <input
                type="radio"
                name="deleteAction"
                checked={deleteAction === "delete"}
                onChange={() => setDeleteAction("delete")}
                className="mt-0.5 accent-red-600"
              />
              <div>
                <span className="text-sm font-medium text-[var(--eds-status-red)]">Endgültig löschen</span>
                <p className="text-xs text-[var(--eds-text-disabled)] mt-0.5">Alle zugehörigen Daten werden unwiderruflich entfernt.</p>
              </div>
            </label>
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium text-[var(--eds-text-secondary)] block mb-1.5">Passwort zur Bestätigung</label>
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Ihr Passwort eingeben"
              className="w-full px-4 py-2.5 border border-[var(--eds-border-strong)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--eds-status-blue)] focus:border-[var(--eds-status-blue)] pr-12"
              data-testid="input-delete-password"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleDeleteOrArchive(confirmDelete); } }}
            />
          </div>

          {deleteError && (
            <div className="mb-4 p-2.5 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-[var(--eds-status-red)] text-xs" data-testid="text-delete-error">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setConfirmDelete(null); setDeletePassword(""); setDeleteError(""); setDeleteAction("archive"); }} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)]" data-testid="button-cancel-delete">
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => handleDeleteOrArchive(confirmDelete)}
              disabled={deletingId === confirmDelete || !deletePassword}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition ${deleteAction === "delete" ? "bg-[var(--eds-status-red)] hover:bg-[var(--eds-terracotta-dk)]" : "bg-[var(--eds-status-blue)] hover:bg-[var(--eds-status-blue)]"}`}
              data-testid="button-confirm-delete"
            >
              {deletingId === confirmDelete
                ? (deleteAction === "archive" ? "Wird archiviert..." : "Wird gelöscht...")
                : (deleteAction === "archive" ? "Archivieren" : "Endgültig löschen")
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAssessmentRow(a: AssessmentItem) {
    const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8", bg: "#f9fafb" };
    const dm = designModeLabels[a.designMode] ?? { de: a.designMode, icon: "✋" };
    return (
      <div
        key={a.id}
        className="px-6 py-3.5 flex items-center gap-4 hover:bg-[var(--eds-bg-sunken)]/80 cursor-pointer transition-colors group"
        onClick={() => router.push(`${base}/assessments/${a.id}`)}
        data-testid={`card-assessment-${a.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-[var(--eds-text-primary)] group-hover:text-brand-navy transition-colors truncate">
              {a.name}
            </h4>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: st.bg, color: st.color }}
            >
              {st.de}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[var(--eds-text-disabled)]">
            <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
            <span>{dm.icon} {dm.de}</span>
          </div>
        </div>
        <div className="flex items-center gap-5 text-center shrink-0">
          <div>
            <p className="text-sm font-bold text-[var(--eds-text-primary)] tabular-nums">{a.exerciseCount}</p>
            <p className="text-[10px] text-[var(--eds-text-disabled)]">Übungen</p>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--eds-text-primary)] tabular-nums">{a.candidateCount}</p>
            <p className="text-[10px] text-[var(--eds-text-disabled)]">Teilnehmer</p>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--eds-text-primary)] tabular-nums">{a.reportCount}</p>
            <p className="text-[10px] text-[var(--eds-text-disabled)]">Berichte</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(a.id); setDeletePassword(""); setDeleteError(""); setDeleteAction("archive"); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity hover:bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
            data-testid={`button-manage-assessment-${a.id}`}
            title="Archivieren / Löschen"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <span className="text-xs font-medium text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity">
            Öffnen →
          </span>
        </div>
      </div>
    );
  }

  const activeCount = localAssessments.filter((a) => a.status === "active").length;
  const draftCount = localAssessments.filter((a) => a.status === "draft").length;
  const completedCount = localAssessments.filter((a) => a.status === "completed").length;
  const totalCandidates = localAssessments.reduce((sum, a) => sum + a.candidateCount, 0);
  const totalExercises = localAssessments.reduce((sum, a) => sum + a.exerciseCount, 0);

  const activeAssessments = useMemo(() => {
    return localAssessments.filter((a) => a.status === "active" && a.startDate && a.endDate);
  }, [localAssessments]);

  function renderAssessmentList() {
    return (
      <div className="bg-white border border-[var(--eds-border)] rounded-xl" data-testid="section-assessments">
        <div className="px-6 py-5 border-b border-[var(--eds-border)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-brand-navy">Assessments</h3>
            <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">
              {clientGroups.length > 1
                ? `${clientGroups.filter(([k]) => k !== "__none__").length} Kunden · `
                : ""}
              {activeCount > 0 && <span className="font-medium text-[var(--eds-status-green)]">{activeCount} aktiv</span>}
              {activeCount > 0 && draftCount > 0 && " · "}
              {draftCount > 0 && <span>{draftCount} Entwurf</span>}
              {(activeCount > 0 || draftCount > 0) && completedCount > 0 && " · "}
              {completedCount > 0 && <span>{completedCount} abgeschlossen</span>}
              {activeCount === 0 && draftCount === 0 && completedCount === 0 && <span>Noch keine Assessments</span>}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg bg-brand-navy transition-all hover:opacity-90"
            data-testid="button-create-project"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Neues Assessment
          </button>
        </div>

        {localAssessments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--eds-text-tertiary)] mb-4">Noch keine Assessments vorhanden.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white rounded-lg bg-brand-navy hover:opacity-90"
              data-testid="button-create-first-project"
            >
              Erstes Assessment erstellen
            </button>
          </div>
        ) : clientGroups.length === 1 ? (
          <div className="divide-y divide-[var(--eds-border)]">
            {clientGroups[0][1].map((a) => renderAssessmentRow(a))}
          </div>
        ) : (
          <div>
            {clientGroups.map(([clientKey, items]) => {
              const isCollapsed = collapsedClients.has(clientKey);
              const clientLabel = clientKey === "__none__" ? "Ohne Kunde" : clientKey;
              const clientActiveCount = items.filter((a) => a.status === "active").length;
              return (
                <div key={clientKey} className="border-b border-[var(--eds-border)] last:border-b-0">
                  <button
                    onClick={() => toggleClient(clientKey)}
                    className="w-full flex items-center gap-3 px-6 py-3 bg-[var(--eds-bg-sunken)]/60 hover:bg-[var(--eds-bg-sunken)]/60 transition-colors text-left"
                    data-testid={`toggle-client-${clientKey}`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-[var(--eds-text-disabled)] transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-xs font-semibold text-[var(--eds-text-secondary)] uppercase tracking-wider">
                      {clientLabel}
                    </span>
                    <span className="text-[10px] text-[var(--eds-text-disabled)] tabular-nums">
                      {items.length} Assessment{items.length !== 1 ? "s" : ""}
                      {clientActiveCount > 0 && (
                        <span className="ml-1 text-emerald-500 font-medium">({clientActiveCount} aktiv)</span>
                      )}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-[var(--eds-border)]">
                      {items.map((a) => renderAssessmentRow(a))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderTeamPanel() {
    return (
      <div className="bg-white border border-[var(--eds-border)] rounded-xl">
        <div className="px-5 py-4 border-b border-[var(--eds-border)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand-navy" data-testid="text-team-title">Team</h3>
            <p className="text-[11px] text-[var(--eds-text-disabled)] mt-0.5">
              {teamUsers.length} Person{teamUsers.length !== 1 ? "en" : ""} · {TEAM_ROLE_ORDER.filter((r) => (roleGroups[r]?.length ?? 0) > 0).length} Rollen
            </p>
          </div>
          <Link
            href={`${base}/users`}
            className="text-[11px] font-medium text-brand-blue hover:underline"
            data-testid="link-manage-users"
          >
            Benutzer verwalten →
          </Link>
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {TEAM_ROLE_ORDER.map((role) => {
            const members = roleGroups[role] ?? [];
            if (members.length === 0) return null;
            const isCollapsed = collapsedRoles.has(role);
            return (
              <div key={role} className="border-b border-[var(--eds-border)] last:border-b-0">
                <button
                  onClick={() => toggleRole(role)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 bg-[var(--eds-bg-sunken)]/60 hover:bg-[var(--eds-bg-sunken)]/60 transition-colors text-left"
                  data-testid={`toggle-role-${role.toLowerCase()}`}
                >
                  <svg
                    className={`w-3 h-3 text-[var(--eds-text-disabled)] transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <span className="text-[11px] font-semibold text-[var(--eds-text-secondary)] uppercase tracking-wider">
                    {ROLE_LABELS[role] ?? role}
                  </span>
                  <span className="text-[10px] text-[var(--eds-text-disabled)] tabular-nums">
                    {members.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--eds-border)]">
                    {members.map((u) => (
                      <div key={u.id} className="px-5 py-2 flex items-center gap-3 pl-10" data-testid={`user-${u.id}`}>
                        <div className="w-6 h-6 rounded-full bg-[var(--eds-bg-sunken)] flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-[var(--eds-text-tertiary)] uppercase">
                            {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--eds-text-primary)] truncate">{u.name}</p>
                          <p className="text-[10px] text-[var(--eds-text-disabled)] truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {teamUsers.length === 0 && (
            <div className="px-5 py-6 text-center">
              <p className="text-xs text-[var(--eds-text-disabled)]">Noch keine Teammitglieder.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderTimeline() {
    if (activeAssessments.length === 0) return null;

    const allDates = activeAssessments.flatMap((a) => [
      new Date(a.startDate!).getTime(),
      new Date(a.endDate!).getTime(),
    ]);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const range = maxDate - minDate || 1;

    return (
      <div className="bg-white border border-[var(--eds-border)] rounded-xl" data-testid="section-timeline">
        <div className="px-6 py-4 border-b border-[var(--eds-border)]">
          <h3 className="text-sm font-semibold text-brand-navy">Aktive Assessments – Zeitstrahl</h3>
          <p className="text-[11px] text-[var(--eds-text-disabled)] mt-0.5">{activeAssessments.length} aktive Assessment{activeAssessments.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="px-6 py-4 space-y-3">
          {activeAssessments.map((a) => {
            const start = new Date(a.startDate!).getTime();
            const end = new Date(a.endDate!).getTime();
            const leftPct = ((start - minDate) / range) * 100;
            const widthPct = Math.max(((end - start) / range) * 100, 2);
            return (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-xs font-medium text-[var(--eds-text-primary)]">{a.name}</div>
                <div className="flex-1 relative h-6 bg-[var(--eds-bg-sunken)] rounded-full overflow-hidden">
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-full bg-[var(--eds-status-green-bg)]0/80"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${formatDate(a.startDate)} – ${formatDate(a.endDate)}`}
                  />
                </div>
                <div className="w-36 shrink-0 text-[10px] text-[var(--eds-text-disabled)] text-right">
                  {formatDate(a.startDate)} – {formatDate(a.endDate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 lg:px-10 space-y-8 min-w-0">
      {renderCreateModal()}
      {renderDeleteConfirmation()}

      {activeSection === "dashboard" && (
        <>
          <div className="grid md:grid-cols-5 gap-4" data-testid="kpi-grid">
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="kpi-assessments">
                  <p className="text-2xl font-bold" style={{ color: "#A6473B" }}>{localAssessments.length}</p>
                  <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Assessments</p>
                </div>
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="kpi-active">
                  <p className="text-2xl font-bold" style={{ color: "#297587" }}>{activeCount}</p>
                  <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Aktiv</p>
                </div>
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="kpi-teilnehmer">
                  <p className="text-2xl font-bold" style={{ color: "#5F1A11" }}>{totalCandidates}</p>
                  <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Teilnehmer</p>
                </div>
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="kpi-übungen">
                  <p className="text-2xl font-bold" style={{ color: "#115560" }}>{totalExercises}</p>
                  <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Übungen</p>
                </div>
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4 text-center" data-testid="kpi-team">
                  <p className="text-2xl font-bold" style={{ color: "#297587" }}>{teamUsers.length}</p>
                  <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Team</p>
                </div>
              </div>

              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-schnellzugriff">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#A6473B" }}>Schnellzugriff</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-all"
                    style={{ backgroundColor: "#A6473B" }}
                    data-testid="quick-action-new-assessment"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Neues Assessment
                  </button>
                  <Link
                    href={`${base}/users`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)] transition-all"
                    data-testid="quick-action-new-user"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    Benutzer anlegen
                  </Link>
                  <Link
                    href={`${base}/gutachten`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-all"
                    style={{ backgroundColor: "#297587" }}
                    data-testid="quick-action-gutachten"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Gutachten erstellen
                  </Link>
                </div>
              </div>

              {renderAssessmentList()}

              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-activity-feed">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#A6473B" }}>Letzte Aktivitäten</h3>
                <div className="space-y-3">
                  {localAssessments.slice(0, 5).map((a, i) => {
                    const actions = [
                      { icon: "📋", text: `Assessment "${a.name}" erstellt`, time: formatDate(a.createdAt), accent: "#A6473B" },
                      ...(a.candidateCount > 0 ? [{ icon: "👤", text: `${a.candidateCount} Kandidat${a.candidateCount > 1 ? "en" : ""} zugewiesen`, time: formatDate(a.createdAt), accent: "#297587" }] : []),
                      ...(a.exerciseCount > 0 ? [{ icon: "📝", text: `${a.exerciseCount} Übung${a.exerciseCount > 1 ? "en" : ""} verknüpft`, time: formatDate(a.createdAt), accent: "#115560" }] : []),
                      ...(a.ratingCount > 0 ? [{ icon: "⭐", text: `${a.ratingCount} Bewertung${a.ratingCount > 1 ? "en" : ""} erfasst`, time: formatDate(a.createdAt), accent: "#5F1A11" }] : []),
                    ];
                    return actions.map((act, j) => (
                      <div key={`${i}-${j}`} className="flex items-start gap-3 py-2 border-b border-[var(--eds-border)] last:border-0">
                        <span className="text-sm mt-0.5">{act.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--eds-text-primary)] truncate">{act.text}</p>
                          <p className="text-[10px] text-[var(--eds-text-disabled)] mt-0.5">{act.time}</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: act.accent }} />
                      </div>
                    ));
                  }).flat()}
                  {localAssessments.length === 0 && (
                    <p className="text-sm text-[var(--eds-text-disabled)] text-center py-4">Noch keine Aktivitäten vorhanden</p>
                  )}
                </div>
              </div>

              {renderTimeline()}

              {renderTeamPanel()}
            </>
          )}

          {activeSection === "assessments" && (
            <>
              {renderAssessmentList()}
            </>
          )}

          {activeSection === "module-settings" && canSeeAll && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#A6473B" }}>Modul-Freigabe</h2>
                <p className="text-sm text-[var(--eds-text-tertiary)] mt-1">
                  Steuern Sie, welche Module für Ihre Kollegen sichtbar und nutzbar sind.
                  Nicht freigegebene Module sind nur für Administratoren zugänglich.
                </p>
              </div>

              <div className="bg-white border border-[var(--eds-border)] rounded-xl divide-y divide-[var(--eds-border)]">
                {modules.map((mod) => {
                  const isOn = localFlags[mod.moduleKey] ?? false;
                  return (
                    <div key={mod.moduleKey} className="flex items-center justify-between px-6 py-4" data-testid={`flag-row-${mod.moduleKey}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[var(--eds-bg-sunken)] flex items-center justify-center shrink-0">
                          <ModuleIcon icon={mod.icon} color={isOn ? "#3b82f6" : "#94a3b8"} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--eds-text-primary)]">{mod.title}</p>
                          <p className="text-xs text-[var(--eds-text-disabled)]">{mod.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLocalFlags(prev => ({ ...prev, [mod.moduleKey]: !prev[mod.moduleKey] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? "bg-[var(--eds-status-blue)]" : "bg-[#cbd5e1]"}`}
                        data-testid={`toggle-${mod.moduleKey}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    setSavingFlags(true);
                    setFlagSaved(false);
                    try {
                      await fetch(`/api/w/${workspaceSlug}/feature-flags`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ featureFlags: localFlags }),
                      });
                      setFlagSaved(true);
                      setTimeout(() => setFlagSaved(false), 3000);
                    } catch { /* ignore */ }
                    setSavingFlags(false);
                  }}
                  disabled={savingFlags}
                  className="px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-brand-navy hover:opacity-90 disabled:opacity-50 transition"
                  data-testid="button-save-flags"
                >
                  {savingFlags ? "Wird gespeichert..." : "Änderungen speichern"}
                </button>
                {flagSaved && (
                  <span className="text-sm text-[var(--eds-status-green)] font-medium">Gespeichert</span>
                )}
              </div>

              <div className="bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--eds-status-blue)] mb-2">Hinweis zur Modul-Freigabe</h3>
                <ul className="text-xs text-[var(--eds-status-blue)] space-y-1.5 list-disc list-inside">
                  <li>Nur freigegebene Module sind für reguläre Benutzer sichtbar und nutzbar.</li>
                  <li>Als Administrator haben Sie Zugriff auf alle Module — unabhängig vom Freigabestatus.</li>
                  <li>Die Seite muss nach dem Speichern neu geladen werden, damit die Sidebar-Änderungen sichtbar werden.</li>
                </ul>
              </div>
            </div>
          )}
    </div>
  );
}
