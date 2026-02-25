"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/app/components/PasswordInput";

interface ArchivedAssessment {
  id: string;
  name: string;
  status: string;
  description: string | null;
  clientName: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  workspace: { slug: string; name: string };
  _count: { candidates: number; exercises: number; reports: number };
  client: { id: string; name: string } | null;
}

export default function MasterArchivePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [assessments, setAssessments] = useState<ArchivedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
          loadArchived();
        } else {
          router.replace("/");
        }
        setChecking(false);
      })
      .catch(() => {
        router.replace("/");
        setChecking(false);
      });
  }, [router]);

  async function loadArchived() {
    try {
      const res = await fetch("/api/admin/archived-assessments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!restoreId || !restorePassword) return;
    setRestoring(true);
    setRestoreError("");
    try {
      const res = await fetch("/api/admin/archived-assessments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: restoreId, password: restorePassword }),
        credentials: "include",
      });
      if (res.ok) {
        setAssessments((prev) => prev.filter((a) => a.id !== restoreId));
        setRestoreId(null);
        setRestorePassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setRestoreError(data.error || "Wiederherstellung fehlgeschlagen");
      }
    } catch {
      setRestoreError("Netzwerkfehler");
    } finally {
      setRestoring(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "–";
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  if (checking || !authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-navy text-white border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/master" className="font-serif text-lg font-bold tracking-tight hover:text-slate-200 transition" data-testid="text-logo">
            Executive Diagnostics Suite
          </Link>
          <span className="text-xs text-slate-400">Archiv</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/master" className="text-sm text-slate-400 hover:text-slate-600 transition" data-testid="link-back-master">
            ← Module
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-brand-navy font-serif mb-2" data-testid="text-archive-title">
          Archivierte Assessments
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Nur Master-Administratoren haben Zugriff auf archivierte Assessments. Hier können Sie Assessments einsehen und bei Bedarf wiederherstellen.
        </p>

        {loading ? (
          <div className="text-sm text-slate-400">Archiv wird geladen...</div>
        ) : assessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Keine archivierten Assessments vorhanden.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {assessments.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center gap-4" data-testid={`archived-assessment-${a.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{a.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      Archiviert
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Workspace: {a.workspace?.name || a.workspace?.slug}</span>
                    {a.clientName && <span>Kunde: {a.clientName}</span>}
                    <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-center shrink-0">
                  <div>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{a._count.exercises}</p>
                    <p className="text-[10px] text-slate-400">Übungen</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{a._count.candidates}</p>
                    <p className="text-[10px] text-slate-400">Teilnehmer</p>
                  </div>
                </div>
                <button
                  onClick={() => { setRestoreId(a.id); setRestorePassword(""); setRestoreError(""); }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition shrink-0"
                  data-testid={`button-restore-${a.id}`}
                >
                  Wiederherstellen
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setRestoreId(null); setRestorePassword(""); setRestoreError(""); }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()} data-testid="dialog-restore">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Assessment wiederherstellen</h3>
            <p className="text-sm text-slate-500 mb-5">
              Das Assessment wird wieder im Company-Cockpit des jeweiligen Workspace sichtbar.
            </p>
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Master-Passwort zur Bestätigung</label>
              <PasswordInput
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Master-Passwort eingeben"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                autoFocus
                data-testid="input-restore-password"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRestore(); } }}
              />
            </div>
            {restoreError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs" data-testid="text-restore-error">
                {restoreError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setRestoreId(null); setRestorePassword(""); setRestoreError(""); }} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring || !restorePassword}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                data-testid="button-confirm-restore"
              >
                {restoring ? "Wird wiederhergestellt..." : "Wiederherstellen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 py-6 mt-10">
        <p className="text-center text-xs text-slate-500">
          &copy; Christoph Aldering &middot; Private initiative &ndash; for training reasons only &ndash; no data from reality so far!
        </p>
      </footer>
    </div>
  );
}
