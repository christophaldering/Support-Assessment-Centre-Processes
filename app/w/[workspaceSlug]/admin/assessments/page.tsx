"use client";

import { PageShell } from "@/components/shared/PageShell";
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
  clientId: string | null;
  clientName: string | null;
  client?: { id: string; name: string } | null;
  _count?: { candidates: number };
}

interface ClientRecord {
  id: string;
  name: string;
  _count?: { assessments: number };
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", label: "Entwurf" },
  active: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Aktiv" },
  completed: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "Abgeschlossen" },
  archived: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]", label: "Archiviert" },
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
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newStatus, setNewStatus] = useState("draft");
  const [newClientName, setNewClientName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [deleteClientError, setDeleteClientError] = useState("");

  const handleDeleteClient = async (clientId: string) => {
    setDeletingClientId(clientId);
    setDeleteClientError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/clients/${clientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (activeClientFilter === clientId) {
          setActiveClientFilter(null);
        }
        fetchClients();
        fetchAssessments();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteClientError(data.error || "Fehler beim Löschen des Kunden.");
      }
    } catch {
      setDeleteClientError("Fehler beim Löschen des Kunden.");
    } finally {
      setDeletingClientId(null);
    }
  };

  const fetchAssessments = useCallback(async () => {
    try {
      let url = `/api/w/${workspaceSlug}/assessments`;
      if (activeClientFilter && activeClientFilter !== "neutral") {
        url += `?clientId=${activeClientFilter}`;
      }
      const res = await fetch(url);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (res.status === 403) {
        setError("Keine Berechtigung für die Assessmentverwaltung.");
        return;
      }
      if (!res.ok) throw new Error();
      let data: AssessmentRecord[] = await res.json();
      if (activeClientFilter === "neutral") {
        data = data.filter((a) => !a.clientId && !a.clientName);
      }
      setAssessments(data);
    } catch {
      setError("Fehler beim Laden der Assessments.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, router, activeClientFilter]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/clients`);
      if (res.ok) {
        setClients(await res.json());
      }
    } catch {}
  }, [workspaceSlug]);

  useEffect(() => {
    fetchAssessments();
    fetchClients();
  }, [fetchAssessments, fetchClients]);

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
          clientName: newClientName || null,
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
      setNewClientName("");
      fetchAssessments();
      fetchClients();
    } catch {
      setCreateError("Etwas ist schiefgelaufen.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ id, name });
    setDeletePassword("");
    setDeleteError("");
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModal) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${deleteModal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, action: "delete" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Fehler beim Löschen.");
        return;
      }
      setDeleteModal(null);
      setDeletePassword("");
      fetchAssessments();
      fetchClients();
    } catch {
      setDeleteError("Etwas ist schiefgelaufen.");
    } finally {
      setDeleting(false);
    }
  };

  const grouped = assessments.reduce<Record<string, AssessmentRecord[]>>((acc, a) => {
    const key = a.clientName || a.client?.name || "Allgemein / Neutral";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "Allgemein / Neutral") return 1;
    if (b === "Allgemein / Neutral") return -1;
    return a.localeCompare(b, "de");
  });

  const renderAssessmentRow = (a: AssessmentRecord) => {
    const badge = STATUS_BADGES[a.status] || STATUS_BADGES.draft;
    return (
      <tr key={a.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50" data-testid={`row-assessment-${a.id}`}>
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-[var(--eds-text-primary)]">{a.name}</p>
            {viewMode === "flat" && a.clientName && (
              <p className="text-xs text-[var(--eds-text-disabled)] mt-0.5">{a.clientName}</p>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </td>
        <td className="px-4 py-3 text-[var(--eds-text-tertiary)]">
          {formatDate(a.startDate)} – {formatDate(a.endDate)}
        </td>
        <td className="px-4 py-3 text-[var(--eds-text-tertiary)]">{a._count?.candidates ?? 0}</td>
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
              onClick={() => handleDelete(a.id, a.name)}
              data-testid={`button-delete-${a.id}`}
              className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] font-medium"
            >
              Löschen
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <PageShell
      zone="assessment"
      zoneLabel="Assessment · Übersicht"
      breadcrumb={[
        { label: "Executive Diagnostics Suite" },
        { label: "Assessments" },
      ]}
      title="Assessments"
      description={`${assessments.length} Assessments in diesem Workspace`}
      primaryAction={
        <button
          onClick={() => setShowCreate(!showCreate)}
          data-testid="button-create-assessment"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: "var(--eds-radius-lg)",
            backgroundColor: showCreate ? "var(--eds-bg-sunken)" : "var(--eds-z)",
            color: showCreate ? "var(--eds-text-secondary)" : "white",
            border: showCreate ? "1px solid var(--eds-border)" : "none",
            fontSize: "var(--eds-text-md)", fontWeight: 500, cursor: "pointer",
          }}
        >
          {showCreate ? "Abbrechen" : "+ Neues Assessment"}
        </button>
      }
    >

        {clients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveClientFilter(null)}
              data-testid="button-filter-all"
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeClientFilter === null
                  ? "bg-brand-navy text-white border-brand-navy"
                  : "text-[var(--eds-text-secondary)] border-[var(--eds-border)] hover:border-[var(--eds-border-strong)] bg-white"
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setActiveClientFilter("neutral")}
              data-testid="button-filter-neutral"
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeClientFilter === "neutral"
                  ? "bg-brand-navy text-white border-brand-navy"
                  : "text-[var(--eds-text-secondary)] border-[var(--eds-border)] hover:border-[var(--eds-border-strong)] bg-white"
              }`}
            >
              Allgemein
            </button>
            {clients
              .filter((c) => !c._count || c._count.assessments > 0)
              .map((c) => (
                <div
                  key={c.id}
                  className={`group relative flex items-center text-xs font-medium rounded-full border transition-colors ${
                    activeClientFilter === c.id
                      ? "bg-brand-navy text-white border-brand-navy"
                      : "text-[var(--eds-text-secondary)] border-[var(--eds-border)] hover:border-[var(--eds-border-strong)] bg-white"
                  }`}
                >
                  <button
                    onClick={() => setActiveClientFilter(c.id)}
                    data-testid={`button-filter-client-${c.id}`}
                    className="px-3 py-1.5"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(c.id);
                    }}
                    data-testid={`button-delete-client-${c.id}`}
                    disabled={deletingClientId === c.id}
                    title={`${c.name} löschen`}
                    className={`pr-2 pl-0 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      activeClientFilter === c.id
                        ? "text-white/70 hover:text-white"
                        : "text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-primary)]"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}

        {deleteClientError && (
          <p className="text-sm text-[var(--eds-status-red)] mb-2" data-testid="text-delete-client-error">{deleteClientError}</p>
        )}

        {error && <p className="text-sm text-[var(--eds-status-red)] mb-4" data-testid="text-error">{error}</p>}

        {showCreate && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Assessment erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-assessment">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Assessment Name"
                    required
                    data-testid="input-name"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Kunde</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="z.B. REWE Group (optional)"
                    data-testid="input-client-name"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    list="client-suggestions"
                  />
                  <datalist id="client-suggestions">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Standort</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="z.B. Hamburg, Berlin"
                    data-testid="input-location"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    data-testid="select-status"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  >
                    <option value="draft">Entwurf</option>
                    <option value="active">Aktiv</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="archived">Archiviert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Beschreibung</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Beschreibung des Assessments"
                  rows={3}
                  data-testid="input-description"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Startdatum</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    data-testid="input-start-date"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Enddatum</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    data-testid="input-end-date"
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                </div>
              </div>

              {createError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-create-error">{createError}</p>}

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

        {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

        {viewMode === "grouped" ? (
          <div className="space-y-6">
            {sortedGroups.map(([groupName, items]) => (
              <div key={groupName} className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-navy">{groupName}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-border)] text-[var(--eds-text-secondary)]">
                      {items.length}
                    </span>
                  </div>
                </div>
                <table className="w-full text-sm" data-testid={`table-group-${groupName}`}>
                  <thead>
                    <tr className="border-b border-[var(--eds-border)]">
                      <th className="text-left px-4 py-2 font-medium text-[var(--eds-text-tertiary)] text-xs">Name</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--eds-text-tertiary)] text-xs">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--eds-text-tertiary)] text-xs">Datum</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--eds-text-tertiary)] text-xs">Kandidaten</th>
                      <th className="text-right px-4 py-2 font-medium text-[var(--eds-text-tertiary)] text-xs">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(renderAssessmentRow)}
                  </tbody>
                </table>
              </div>
            ))}
            {sortedGroups.length === 0 && !loading && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
                Keine Assessments vorhanden.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm" data-testid="table-assessments">
              <thead>
                <tr className="bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Datum</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Kandidaten</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(renderAssessmentRow)}
                {assessments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--eds-text-disabled)]">
                      Keine Assessments vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" data-testid="modal-delete-assessment">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-[var(--eds-text-primary)] mb-1">Assessment löschen</h2>
            <p className="text-sm text-[var(--eds-text-tertiary)] mb-4">
              <span className="font-medium text-[var(--eds-text-primary)]">„{deleteModal.name}"</span> wird unwiderruflich gelöscht. Alle zugehörigen Daten gehen verloren.
            </p>
            <form onSubmit={confirmDelete} className="space-y-4" data-testid="form-delete-assessment">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Passwort zur Bestätigung</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Ihr Passwort"
                  required
                  autoFocus
                  data-testid="input-delete-password"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                />
              </div>
              {deleteError && (
                <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-delete-error">{deleteError}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setDeleteModal(null); setDeletePassword(""); setDeleteError(""); }}
                  data-testid="button-cancel-delete"
                  className="text-sm font-medium text-[var(--eds-text-secondary)] hover:text-[var(--eds-text-primary)] px-4 py-2 rounded-lg border border-[var(--eds-border)] hover:border-[var(--eds-border-strong)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  data-testid="button-confirm-delete"
                  className="text-sm font-medium text-white bg-[var(--eds-status-red)] hover:bg-[var(--eds-terracotta-dk)] disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                >
                  {deleting ? "Wird gelöscht…" : "Endgültig löschen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
