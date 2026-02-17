"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AccessRequestRecord {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: string;
  createdAt: string;
}

const ASSIGNABLE_ROLES = ["MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"] as const;
const ROLE_LABELS: Record<string, string> = {
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_ASSISTANT: "Projektassistent",
  HR_CLIENT: "HR-Auftraggeber",
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
            <span className="text-sm text-white/70">Zugangsanfragen</span>
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
            <h1 className="text-2xl font-bold text-brand-navy" data-testid="text-access-requests-title">
              Zugangsanfragen
            </h1>
            <p className="text-sm text-slate-500">
              {requests.length} {statusFilter === "pending" ? "ausstehende" : statusFilter === "approved" ? "genehmigte" : "abgelehnte"} Anfragen
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                data-testid={`button-filter-${s}`}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-brand-navy text-white"
                    : "bg-white text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "pending" ? "Ausstehend" : s === "approved" ? "Genehmigt" : "Abgelehnt"}
              </button>
            ))}
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="text-success">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-4" data-testid="text-error">{error}</p>}

        {loading && <p className="text-sm text-slate-400">Laden...</p>}

        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-xl p-6"
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
                        ? "bg-amber-50 text-amber-600"
                        : r.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                    }`}>
                      {r.status === "pending" ? "Ausstehend" : r.status === "approved" ? "Genehmigt" : "Abgelehnt"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500" data-testid={`text-email-${r.id}`}>{r.email}</p>
                  {r.message && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 italic">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{formatDate(r.createdAt)}</p>
                </div>

                {r.status === "pending" && (
                  <div className="shrink-0 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1.5">Rolle zuweisen:</p>
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
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
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
                        className="rounded-lg bg-emerald-500 text-white text-xs font-medium px-4 py-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {processingId === r.id ? "..." : "Genehmigen"}
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={processingId === r.id}
                        data-testid={`button-reject-${r.id}`}
                        className="rounded-lg bg-white text-red-500 text-xs font-medium px-4 py-2 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Keine {statusFilter === "pending" ? "ausstehenden" : statusFilter === "approved" ? "genehmigten" : "abgelehnten"} Anfragen.</p>
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
