"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface AccessRequestRecord {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: string;
  createdAt: string;
}

const ASSIGNABLE_ROLES = ["MODERATOR", "OBSERVER", "PROJECT_OFFICE", "CLIENT", "CANDIDATE"] as const;
const ROLE_LABELS: Record<string, string> = {
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  CLIENT: "Auftraggeber",
  CANDIDATE: "Kandidat",
};

export default function AccessRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [roleSelections, setRoleSelections] = useState<Record<string, string[]>>({});

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/access-requests?status=${statusFilter}`);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data);
    } catch {
      setError("Fehler beim Laden der Anfragen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, statusFilter, router]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const toggleRole = (requestId: string, role: string) => {
    setRoleSelections((prev) => {
      const current = prev[requestId] || ["OBSERVER"];
      if (current.includes(role)) {
        return { ...prev, [requestId]: current.filter((r) => r !== role) };
      }
      return { ...prev, [requestId]: [...current, role] };
    });
  };

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessingId(requestId);
    setSuccessMessage("");
    const request = requests.find((r) => r.id === requestId);
    try {
      const roles = roleSelections[requestId] || ["OBSERVER"];
      const res = await fetch(`/api/w/${workspaceSlug}/access-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, roles: action === "approve" ? roles : undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Aktion fehlgeschlagen.");
        return;
      }

      const personName = request?.name || request?.email || "Person";
      if (action === "approve") {
        setSuccessMessage(`${personName} wurde genehmigt. Bitte informieren Sie die Person, dass sie sich jetzt über "Erstanmeldung" auf der Login-Seite registrieren kann.`);
      } else {
        setSuccessMessage(`Anfrage von ${personName} wurde abgelehnt.`);
      }

      fetchRequests();
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
        <PageHeader
          title="Zugangsanfragen"
          description={`${requests.length} ${statusFilter === "pending" ? "ausstehende" : statusFilter === "approved" ? "genehmigte" : "abgelehnte"} Anfragen`}
          actions={
            <div className="flex rounded-lg border border-[var(--eds-border)] overflow-hidden">
              {(["pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  data-testid={`button-filter-${s}`}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-brand-navy text-white"
                      : "bg-white text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
                  }`}
                >
                  {s === "pending" ? "Ausstehend" : s === "approved" ? "Genehmigt" : "Abgelehnt"}
                </button>
              ))}
            </div>
          }
        />

        {successMessage && (
          <div className="mb-4 p-4 bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-lg" data-testid="text-success">
            <p className="text-sm text-[var(--eds-status-green)] font-medium">{successMessage}</p>
          </div>
        )}

        {error && <p className="text-sm text-[var(--eds-status-red)] mb-4" data-testid="text-error">{error}</p>}

        {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden...</p>}

        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-[var(--eds-border)] rounded-xl p-6"
              data-testid={`card-request-${r.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-brand-navy" data-testid={`text-name-${r.id}`}>
                      {r.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === "pending"
                        ? "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                        : r.status === "approved"
                          ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]"
                          : "bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)]"
                    }`}>
                      {r.status === "pending" ? "Ausstehend" : r.status === "approved" ? "Genehmigt" : "Abgelehnt"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--eds-text-tertiary)]" data-testid={`text-email-${r.id}`}>{r.email}</p>
                  {r.message && (
                    <p className="text-sm text-[var(--eds-text-secondary)] mt-2 bg-[var(--eds-bg-sunken)] rounded-lg px-3 py-2 italic">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-[var(--eds-text-disabled)] mt-2">{formatDate(r.createdAt)}</p>
                </div>

                {r.status === "pending" && (
                  <div className="shrink-0 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-[var(--eds-text-tertiary)] mb-1.5">Rolle zuweisen:</p>
                      <div className="flex flex-wrap gap-1">
                        {ASSIGNABLE_ROLES.map((role) => {
                          const selected = (roleSelections[r.id] || ["OBSERVER"]).includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleRole(r.id, role)}
                              data-testid={`button-role-${role.toLowerCase()}-${r.id}`}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                selected
                                  ? "bg-brand-blue text-white border-brand-blue"
                                  : "bg-white text-[var(--eds-text-tertiary)] border-[var(--eds-border)] hover:border-[var(--eds-border-strong)]"
                              }`}
                            >
                              {ROLE_LABELS[role]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={processingId === r.id}
                        data-testid={`button-approve-${r.id}`}
                        className="rounded-lg bg-[var(--eds-status-green-bg)]0 text-white text-xs font-medium px-4 py-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {processingId === r.id ? "..." : "Genehmigen"}
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={processingId === r.id}
                        data-testid={`button-reject-${r.id}`}
                        className="rounded-lg bg-white text-[var(--eds-status-red)] text-xs font-medium px-4 py-2 border border-[var(--eds-status-red-bg)] hover:bg-[var(--eds-status-red-bg)] disabled:opacity-50 transition-colors"
                      >
                        Ablehnen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {requests.length === 0 && !loading && (
            <div className="text-center py-12 text-[var(--eds-text-disabled)]">
              <p className="text-sm">Keine {statusFilter === "pending" ? "ausstehenden" : statusFilter === "approved" ? "genehmigten" : "abgelehnten"} Anfragen.</p>
            </div>
          )}
        </div>
    </div>
  );
}
