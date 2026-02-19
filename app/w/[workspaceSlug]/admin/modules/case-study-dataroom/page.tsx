"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CaseStudySummary {
  id: string;
  title: string;
  companyName: string;
  status: string;
  sourceType: string;
  createdAt: string;
}

const ACCENT = "hsl(14, 48%, 44%)";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Entwurf", bg: "bg-slate-100", text: "text-slate-600" },
  active: { label: "Aktiv", bg: "bg-emerald-100", text: "text-emerald-700" },
};

const SOURCE_LABELS: Record<string, string> = {
  upload: "Hochgeladen",
  ai_generated: "KI-generiert",
  manual: "Manuell",
};

export default function CaseStudyDataroomPage() {
  const params = useParams();
  const slug = params.workspaceSlug as string;

  const [caseStudies, setCaseStudies] = useState<CaseStudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchCaseStudies = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${slug}/case-studies`);
      if (res.ok) {
        const data = await res.json();
        setCaseStudies(data);
      }
    } catch {
      setError("Fehler beim Laden der Fallstudien");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchCaseStudies(); }, [fetchCaseStudies]);

  const activateStudy = async (id: string) => {
    try {
      await fetch(`/api/w/${slug}/case-studies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      fetchCaseStudies();
    } catch {
      setError("Fehler beim Aktivieren");
    }
  };

  const deleteStudy = async (id: string) => {
    if (!confirm("Fallstudie wirklich löschen?")) return;
    try {
      await fetch(`/api/w/${slug}/case-studies/${id}`, { method: "DELETE" });
      fetchCaseStudies();
    } catch {
      setError("Fehler beim Löschen");
    }
  };

  const activeStudy = caseStudies.find((cs) => cs.status === "active");

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 text-white" style={{ backgroundColor: ACCENT }}>
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-module-overview">Modul-Übersicht</a>
            <Link href={`/w/${slug}/admin`} className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-back-dashboard">Dashboard</Link>
            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }} data-testid="text-page-title">
              Fallstudien-Datenraum
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/w/${slug}/admin/modules/case-study-builder`}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-case-study-builder"
            >
              Case-Studio
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between" data-testid="text-error">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Fallstudien administrieren
          </h2>
          <p className="text-sm text-slate-500">
            Verwalten Sie digitale Fallstudien für Assessment Center. Aktive Fallstudien werden im Kandidaten-Portal als Datenraum angezeigt.
          </p>
        </div>

        {activeStudy && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-5" data-testid="section-active-study">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Aktive Fallstudie im Portal</p>
                <h3 className="text-lg font-bold text-slate-800">{activeStudy.title}</h3>
                <p className="text-sm text-slate-600 mt-0.5">{activeStudy.companyName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/w/${slug}/admin/modules/case-study/${activeStudy.id}`}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="link-view-active-dataroom"
                >
                  Datenraum öffnen
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl" data-testid="section-varexia-link">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Referenz-Fallstudie</p>
              <h3 className="text-base font-bold text-slate-800">Varexia SE — Datenraum</h3>
              <p className="text-xs text-slate-500 mt-0.5">Vollständige Referenz-Fallstudie mit interaktivem Datenraum. Bitte zuerst über die API seeden, falls noch nicht vorhanden.</p>
            </div>
            <Link
              href={`/w/${slug}/admin/modules/case-study-dataroom/varexia`}
              className="px-4 py-2 text-sm font-medium border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition"
              data-testid="link-varexia-dataroom"
            >
              Varexia Datenraum öffnen
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-700" style={{ fontFamily: "Playfair Display, serif" }}>
              Alle Fallstudien ({caseStudies.length})
            </h3>
            <Link
              href={`/w/${slug}/admin/modules/case-study-builder`}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}
              data-testid="button-create-case-study"
            >
              + Neue Fallstudie erstellen
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">Laden...</div>
          ) : caseStudies.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
              <p className="text-slate-500 font-medium">Noch keine Fallstudien vorhanden</p>
              <p className="text-xs text-slate-400 mt-1">Erstellen Sie eine neue Fallstudie über das Case-Studio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caseStudies.map((cs) => {
                const st = STATUS_LABELS[cs.status] || STATUS_LABELS.draft;
                return (
                  <div
                    key={cs.id}
                    className={`bg-white border rounded-xl p-4 transition hover:shadow-md cursor-pointer ${selectedId === cs.id ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
                    onClick={() => setSelectedId(selectedId === cs.id ? null : cs.id)}
                    data-testid={`card-case-study-${cs.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{cs.title}</h4>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{cs.companyName}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{SOURCE_LABELS[cs.sourceType] || cs.sourceType}</span>
                      <span>&middot;</span>
                      <span>{new Date(cs.createdAt).toLocaleDateString("de-DE")}</span>
                    </div>

                    {selectedId === cs.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        <Link
                          href={`/w/${slug}/admin/modules/case-study/${cs.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition"
                          style={{ backgroundColor: ACCENT }}
                          data-testid={`link-dataroom-${cs.id}`}
                        >
                          Datenraum öffnen
                        </Link>
                        {cs.status !== "active" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); activateStudy(cs.id); }}
                            className="px-3 py-1.5 text-xs font-medium border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                            data-testid={`button-activate-${cs.id}`}
                          >
                            Aktivieren
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteStudy(cs.id); }}
                          className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                          data-testid={`button-delete-${cs.id}`}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-4 mt-8">
        <p className="text-center text-xs text-slate-400">&copy; Christoph Aldering &middot; Private initiative / concept</p>
      </footer>
    </div>
  );
}
