"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  forcePasswordChange: boolean;
  assessmentId: string | null;
  createdAt: string;
}

interface Assessment {
  id: string;
  name: string;
  status: string;
}

const ALL_ROLES = ["ADMIN", "MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_ASSISTANT: "Projektassistent",
  HR_CLIENT: "HR-Auftraggeber",
  CANDIDATE: "Kandidat",
};
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  MODERATOR: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  OBSERVER: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  PROJECT_ASSISTANT: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  HR_CLIENT: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  CANDIDATE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function UserManagementPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [newAssessmentId, setNewAssessmentId] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [addRoleDropdown, setAddRoleDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users`);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (res.status === 403) {
        setError("Keine Berechtigung für die Benutzerverwaltung.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      setError("Fehler beim Laden der Benutzer.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, router]);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch {}
  }, [workspaceSlug]);

  useEffect(() => {
    fetchUsers();
    fetchAssessments();
  }, [fetchUsers, fetchAssessments]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAddRoleDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          roles: newRoles,
          assessmentId: newRoles.includes("CANDIDATE") ? newAssessmentId || null : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Fehler beim Erstellen.");
        return;
      }

      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRoles([]);
      setNewAssessmentId("");
      fetchUsers();
    } catch {
      setCreateError("Etwas ist schiefgelaufen.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddRole = async (userId: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.roles.includes(role)) return;
    setActionLoading(userId);
    setActionError(null);
    try {
      const updatedRoles = [...user.roles, role];
      const res = await fetch(`/api/w/${workspaceSlug}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: updatedRoles }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Rolle konnte nicht hinzugefügt werden.");
        return;
      }
      setAddRoleDropdown(null);
      fetchUsers();
    } catch {
      setActionError("Fehler beim Hinzufügen der Rolle.");
    } finally { setActionLoading(null); }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const updatedRoles = user.roles.filter((r) => r !== role);
    if (updatedRoles.length === 0) return;
    setActionLoading(userId);
    setActionError(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: updatedRoles }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Rolle konnte nicht entfernt werden.");
        return;
      }
      fetchUsers();
    } catch {
      setActionError("Fehler beim Entfernen der Rolle.");
    } finally { setActionLoading(null); }
  };

  const handleDeactivate = async (userId: string) => {
    setActionLoading(userId);
    setActionError(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Benutzer konnte nicht deaktiviert werden.");
        return;
      }
      setDeleteConfirm(null);
      fetchUsers();
    } catch {
      setActionError("Fehler beim Deaktivieren.");
    } finally { setActionLoading(null); }
  };

  const toggleRole = (role: string, current: string[], setter: (r: string[]) => void) => {
    if (current.includes(role)) {
      setter(current.filter((r) => r !== role));
    } else {
      setter([...current, role]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-module-overview">Modul-Übersicht</Link>
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Benutzerverwaltung</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
          >
            Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Benutzer</h1>
            <p className="text-sm text-slate-500">{users.length} Benutzer in diesem Workspace</p>
          </div>
          <div className="flex gap-2">
            <button
              disabled
              className="rounded-lg border border-slate-200 text-slate-400 text-sm font-medium px-4 py-2 cursor-not-allowed"
              title="CSV-Import kommt in einer zukünftigen Version"
              data-testid="button-csv-import"
            >
              CSV Import
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              data-testid="button-create-user"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
            >
              {showCreate ? "Abbrechen" : "Neuer Benutzer"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4" data-testid="text-error">{error}</p>}

        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Neuen Benutzer erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-user">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Vollständiger Name"
                    required
                    data-testid="input-name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="benutzer@email.de"
                    required
                    data-testid="input-email"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Initiales Passwort"
                  required
                  data-testid="input-password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rollen</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role, newRoles, setNewRoles)}
                      data-testid={`button-role-${role.toLowerCase()}`}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        newRoles.includes(role)
                          ? "bg-brand-blue text-white border-brand-blue"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>

              {newRoles.includes("CANDIDATE") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assessment zuweisen</label>
                  <select
                    value={newAssessmentId}
                    onChange={(e) => setNewAssessmentId(e.target.value)}
                    data-testid="select-assessment"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  >
                    <option value="">Kein Assessment</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}

              <button
                type="submit"
                disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword.trim() || !newRoles.length}
                data-testid="button-submit-user"
                className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
              >
                {creating ? "Wird erstellt…" : "Benutzer erstellen"}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Laden…</p>}

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between" data-testid="text-action-error">
            <p className="text-sm text-red-700">{actionError}</p>
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="space-y-3" data-testid="list-users">
          {users.map((u) => {
            const availableRoles = ALL_ROLES.filter((r) => !u.roles.includes(r));
            const isDeleting = deleteConfirm === u.id;
            const isLoading = actionLoading === u.id;

            return (
              <div
                key={u.id}
                className={`bg-white border rounded-xl p-5 transition-all ${isDeleting ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                data-testid={`card-user-${u.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-brand-navy truncate" data-testid={`text-name-${u.id}`}>{u.name}</h3>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-red-50 text-red-500 border border-red-200"
                        }`}
                      >
                        {u.status === "active" ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3" data-testid={`text-email-${u.id}`}>{u.email}</p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.roles.map((role) => {
                        const colors = ROLE_COLORS[role] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
                        return (
                          <span
                            key={role}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                            data-testid={`chip-role-${u.id}-${role.toLowerCase()}`}
                          >
                            {ROLE_LABELS[role] || role}
                            {u.roles.length > 1 ? (
                              <button
                                onClick={() => handleRemoveRole(u.id, role)}
                                disabled={isLoading}
                                className="ml-0.5 hover:opacity-70 transition-opacity disabled:opacity-30"
                                title={`Rolle "${ROLE_LABELS[role]}" entfernen`}
                                data-testid={`button-remove-role-${u.id}-${role.toLowerCase()}`}
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            ) : (
                              <span className="ml-0.5 opacity-20 cursor-not-allowed" title="Mindestens eine Rolle erforderlich">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                              </span>
                            )}
                          </span>
                        );
                      })}

                      {availableRoles.length > 0 && (
                        <div className="relative" ref={addRoleDropdown === u.id ? dropdownRef : undefined}>
                          <button
                            onClick={() => setAddRoleDropdown(addRoleDropdown === u.id ? null : u.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors disabled:opacity-30"
                            data-testid={`button-add-role-${u.id}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Rolle
                          </button>

                          {addRoleDropdown === u.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[180px]" data-testid={`dropdown-roles-${u.id}`}>
                              <p className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Rolle hinzufügen</p>
                              {availableRoles.map((role) => {
                                const colors = ROLE_COLORS[role] || { bg: "bg-slate-100", text: "text-slate-600", border: "" };
                                return (
                                  <button
                                    key={role}
                                    onClick={() => handleAddRole(u.id, role)}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    data-testid={`button-assign-role-${u.id}-${role.toLowerCase()}`}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${colors.bg} border ${colors.border}`} />
                                    {ROLE_LABELS[role]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-medium">Wirklich löschen?</span>
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          disabled={isLoading}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          data-testid={`button-confirm-delete-${u.id}`}
                        >
                          {isLoading ? "…" : "Ja, löschen"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                          data-testid={`button-cancel-delete-${u.id}`}
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      u.status === "active" && (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                          data-testid={`button-delete-${u.id}`}
                        >
                          Deaktivieren
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {users.length === 0 && !loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-400">Keine Benutzer vorhanden.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
