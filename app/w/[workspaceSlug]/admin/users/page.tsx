"use client";

import { PageShell } from "@/components/shared/PageShell";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { ROLE_DISPLAY_NAMES, getDisplayRoles } from "@/lib/rbac";

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

const ALL_ROLES = getDisplayRoles();
const ROLE_LABELS: Record<string, string> = { ...ROLE_DISPLAY_NAMES };
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MASTER_ADMIN: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]", border: "border-[var(--eds-status-red-bg)]" },
  WORKSPACE_ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  MODERATOR: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", border: "border-[var(--eds-status-blue-bg)]" },
  OBSERVER: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  PROJECT_OFFICE: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  PROJECT_ASSISTANT: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  CLIENT: { bg: "bg-[var(--eds-status-amber-bg)]", text: "text-[var(--eds-status-amber)]", border: "border-[var(--eds-status-amber-bg)]" },
  HR_CLIENT: { bg: "bg-[var(--eds-status-amber-bg)]", text: "text-[var(--eds-status-amber)]", border: "border-[var(--eds-status-amber-bg)]" },
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
    <PageShell
      zone="admin"
      zoneLabel="Verwaltung · Benutzer"
      breadcrumb={[
        { label: "Executive Diagnostics Suite" },
        { label: "Verwaltung" },
        { label: "Benutzer" },
      ]}
      title="Benutzer"
      description={`${users.length} Benutzer in diesem Workspace`}
      primaryAction={
        <button
          onClick={() => setShowCreate(!showCreate)}
          data-testid="button-create-user"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: "var(--eds-radius-lg)",
            backgroundColor: showCreate ? "var(--eds-bg-sunken)" : "var(--eds-z)",
            color: showCreate ? "var(--eds-text-secondary)" : "white",
            border: showCreate ? "1px solid var(--eds-border)" : "none",
            fontSize: "var(--eds-text-md)", fontWeight: 500, cursor: "pointer",
          }}
        >
          {showCreate ? "Abbrechen" : "+ Neuer Benutzer"}
        </button>
      }
    >

        {error && <p className="text-sm text-[var(--eds-status-red)] mb-4" data-testid="text-error">{error}</p>}

        {showCreate && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Neuen Benutzer erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-user">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Vollständiger Name"
                    required
                    data-testid="input-name"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="benutzer@email.de"
                    required
                    data-testid="input-email"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Passwort</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Initiales Passwort"
                  required
                  data-testid="input-password"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-2">Rollen</label>
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
                          : "bg-white text-[var(--eds-text-secondary)] border-[var(--eds-border)] hover:border-[var(--eds-border-strong)]"
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>

              {newRoles.includes("CANDIDATE") && (
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Assessment zuweisen</label>
                  <select
                    value={newAssessmentId}
                    onChange={(e) => setNewAssessmentId(e.target.value)}
                    data-testid="select-assessment"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
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

              {createError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-create-error">{createError}</p>}

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

        {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

        {actionError && (
          <div className="bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-xl p-3 mb-4 flex items-center justify-between" data-testid="text-action-error">
            <p className="text-sm text-[var(--eds-status-red)]">{actionError}</p>
            <button onClick={() => setActionError(null)} className="text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)]">
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
                className={`bg-white border rounded-xl p-5 transition-all ${isDeleting ? "border-[var(--eds-status-red)] bg-[var(--eds-status-red-bg)]/30" : "border-[var(--eds-border)]"}`}
                data-testid={`card-user-${u.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-brand-navy truncate" data-testid={`text-name-${u.id}`}>{u.name}</h3>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          u.status === "active"
                            ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] border border-[var(--eds-status-green-bg)]"
                            : "bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] border border-[var(--eds-status-red-bg)]"
                        }`}
                      >
                        {u.status === "active" ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--eds-text-tertiary)] mb-3" data-testid={`text-email-${u.id}`}>{u.email}</p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.roles.map((role) => {
                        const colors = ROLE_COLORS[role] || { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", border: "border-[var(--eds-border)]" };
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
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-dashed border-[var(--eds-border-strong)] text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] hover:border-[var(--eds-border-strong)] transition-colors disabled:opacity-30"
                            data-testid={`button-add-role-${u.id}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Rolle
                          </button>

                          {addRoleDropdown === u.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--eds-border)] rounded-lg shadow-lg py-1 z-20 min-w-[180px]" data-testid={`dropdown-roles-${u.id}`}>
                              <p className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase">Rolle hinzufügen</p>
                              {availableRoles.map((role) => {
                                const colors = ROLE_COLORS[role] || { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", border: "" };
                                return (
                                  <button
                                    key={role}
                                    onClick={() => handleAddRole(u.id, role)}
                                    className="w-full text-left px-3 py-2 text-sm text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)] transition-colors flex items-center gap-2"
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
                        <span className="text-xs text-[var(--eds-status-red)] font-medium">Wirklich löschen?</span>
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          disabled={isLoading}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--eds-status-red)] text-white hover:bg-[var(--eds-terracotta-dk)] transition-colors disabled:opacity-50"
                          data-testid={`button-confirm-delete-${u.id}`}
                        >
                          {isLoading ? "…" : "Ja, löschen"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-tertiary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
                          data-testid={`button-cancel-delete-${u.id}`}
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      u.status === "active" && (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] hover:bg-[var(--eds-status-red-bg)] hover:border-[var(--eds-status-red)] transition-colors"
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
            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--eds-text-disabled)]">Keine Benutzer vorhanden.</p>
            </div>
          )}
        </div>
    </PageShell>
  );
}
