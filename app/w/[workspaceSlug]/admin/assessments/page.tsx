"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AssessmentRecord {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  _count?: { candidates: number };
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", label: "Entwurf" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Aktiv" },
  completed: { bg: "bg-blue-50", text: "text-blue-600", label: "Abgeschlossen" },
  archived: { bg: "bg-red-50", text: "text-red-500", label: "Archiviert" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

export default function AssessmentManagementPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newStatus, setNewStatus] = useState("draft");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (res.status === 403) {
        setError("Keine Berechtigung für die Assessmentverwaltung.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssessments(data);
    } catch {
      setError("Fehler beim Laden der Assessments.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, router]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription || null,
          location: newLocation || null,
          startDate: newStartDate || null,
          endDate: newEndDate || null,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Fehler beim Erstellen.");
        return;
      }

      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewLocation("");
      setNewStartDate("");
      setNewEndDate("");
      setNewStatus("draft");
      fetchAssessments();
    } catch {
      setCreateError("Etwas ist schiefgelaufen.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/assessments/${id}`, {
        method: "DELETE",
      });
      fetchAssessments();
    } catch {
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
            <span className="text-sm text-white/70">Assessments</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back"
          >
            Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Assessments</h1>
            <p className="text-sm text-slate-500">{assessments.length} Assessments in diesem Workspace</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            data-testid="button-create-assessment"
            className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
          >
            {showCreate ? "Abbrechen" : "Neues Assessment"}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4" data-testid="text-error">{error}</p>}

        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Assessment erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-assessment">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Assessment Name"
                    required
                    data-testid="input-name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Standort</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="z.B. Hamburg, Berlin"
                    data-testid="input-location"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Beschreibung des Assessments"
                  rows={3}
                  data-testid="input-description"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    data-testid="input-start-date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    data-testid="input-end-date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    data-testid="select-status"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  >
                    <option value="draft">Entwurf</option>
                    <option value="active">Aktiv</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="archived">Archiviert</option>
                  </select>
                </div>
              </div>

              {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}

              <button
                type="submit"
                disabled={creating || !newName.trim()}
                data-testid="button-submit-assessment"
                className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
              >
                {creating ? "Wird erstellt…" : "Assessment erstellen"}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Laden…</p>}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm" data-testid="table-assessments">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Kandidaten</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const badge = STATUS_BADGES[a.status] || STATUS_BADGES.draft;
                return (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50" data-testid={`row-assessment-${a.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(a.startDate)} – {formatDate(a.endDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a._count?.candidates ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/w/${workspaceSlug}/admin/assessments/${a.id}`}
                          data-testid={`link-open-${a.id}`}
                          className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                        >
                          Öffnen
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id)}
                          data-testid={`button-delete-${a.id}`}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assessments.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Keine Assessments vorhanden.
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
