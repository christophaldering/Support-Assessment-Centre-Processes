"use client";

import { useEffect, useState, useCallback } from "react";
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

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
    } catch {
      // non-critical
    }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchUsers();
    fetchAssessments();
  }, [fetchUsers, fetchAssessments]);

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

  const handleUpdateRoles = async (userId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: editRoles }),
      });
      setEditingId(null);
      fetchUsers();
    } catch {
      // handled silently
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/users/${userId}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch {
      // handled silently
    }
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

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm" data-testid="table-users">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Rollen</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50" data-testid={`row-user-${u.id}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex flex-wrap gap-1">
                        {ALL_ROLES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(role, editRoles, setEditRoles)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              editRoles.includes(role)
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white text-slate-500 border-slate-200"
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              r === "ADMIN"
                                ? "bg-purple-50 text-purple-600"
                                : r === "CANDIDATE"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {ROLE_LABELS[r] || r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {u.status === "active" ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === u.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdateRoles(u.id)}
                          className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(u.id);
                            setEditRoles([...u.roles]);
                          }}
                          data-testid={`button-edit-${u.id}`}
                          className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                        >
                          Rollen bearbeiten
                        </button>
                        {u.status === "active" && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            data-testid={`button-deactivate-${u.id}`}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Deaktivieren
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Keine Benutzer vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
