"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const WS = "main";

const modules = [
  {
    id: "archive",
    title: "Archiv-Container",
    desc: "Archivierte Assessments einsehen und wiederherstellen",
    href: "/master/archive",
    icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
    color: "from-gray-600 to-gray-800",
    border: "hover:border-gray-300",
  },
  {
    id: "cockpit",
    title: "Enterprise Cockpit",
    desc: "Projekt-Übersicht, KPIs, Assessment-Verwaltung",
    href: `/w/${WS}/admin`,
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
    color: "from-blue-600 to-blue-800",
    border: "hover:border-blue-300",
  },
  {
    id: "assessments",
    title: "Assessment-Management",
    desc: "Projekte anlegen, 5-Schritte-Prozess, Kandidaten",
    href: `/w/${WS}/admin/assessments`,
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
    color: "from-indigo-600 to-indigo-800",
    border: "hover:border-indigo-300",
  },
  {
    id: "competencies",
    title: "Kompetenzmodelle",
    desc: "Kompetenzmodelle, Verhaltensanker, Gewichtungen",
    href: `/w/${WS}/admin/competencies`,
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z",
    color: "from-rose-600 to-rose-800",
    border: "hover:border-rose-300",
  },
  {
    id: "exercise-library",
    title: "Baustein-Bibliothek",
    desc: "Assessment-Bausteine: Upload, Kategorien, Download",
    href: `/w/${WS}/admin/exercise-library`,
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    color: "from-amber-600 to-amber-800",
    border: "hover:border-amber-300",
  },
  {
    id: "case-studio",
    title: "Case-Studio",
    desc: "Fallstudien erstellen: Upload oder KI-Generierung",
    href: `/w/${WS}/admin/case-studio`,
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "from-teal-600 to-teal-800",
    border: "hover:border-teal-300",
  },
  {
    id: "modules",
    title: "Modul-Designer",
    desc: "Assessment-Bausteine erstellen, übernehmen oder per KI generieren",
    href: `/w/${WS}/admin/modules`,
    icon: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m0 0l5.571 3 5.571-3",
    color: "from-violet-600 to-violet-800",
    border: "hover:border-violet-300",
  },
  {
    id: "observation-sheets",
    title: "Beobachtungsbögen",
    desc: "Vorlagen: Upload, manuelle Erstellung, Suche & Filter",
    href: `/w/${WS}/admin/observation-sheets`,
    icon: "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75",
    color: "from-cyan-600 to-cyan-800",
    border: "hover:border-cyan-300",
  },
  {
    id: "brand-rules",
    title: "Brand & Style",
    desc: "Corporate-Identity-Regeln, Style-Guide-Parsing, Theme",
    href: `/w/${WS}/admin/brand-rules`,
    icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
    color: "from-pink-600 to-pink-800",
    border: "hover:border-pink-300",
  },
  {
    id: "intelligence",
    title: "KI Intelligence Layer",
    desc: "Predictive, Development Paths, Hypothesen-Engine",
    href: `/w/${WS}/admin/intelligence`,
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    color: "from-purple-600 to-purple-800",
    border: "hover:border-purple-300",
  },
  {
    id: "requirements",
    title: "Anforderungsanalyse",
    desc: "Anforderungsprofile, Stellenanalyse, MTMM-Matrix",
    href: `/w/${WS}/admin/requirements`,
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    color: "from-emerald-600 to-emerald-800",
    border: "hover:border-emerald-300",
  },
  {
    id: "reports",
    title: "Reporting",
    desc: "Ergebnisberichte in DOCX, PDF, PPTX",
    href: `/w/${WS}/admin/reports`,
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "from-slate-600 to-slate-800",
    border: "hover:border-slate-300",
  },
  {
    id: "analytics",
    title: "Analytik & Dashboard",
    desc: "Auswertungen, Benchmarks, Kompetenzprofile",
    href: `/w/${WS}/admin/analytics`,
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    color: "from-sky-600 to-sky-800",
    border: "hover:border-sky-300",
  },
  {
    id: "audio",
    title: "Audio-Verarbeitung",
    desc: "Transkription, KI-Zusammenfassungen, Aufnahmen",
    href: `/w/${WS}/admin/audio`,
    icon: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z",
    color: "from-red-600 to-red-800",
    border: "hover:border-red-300",
  },
  {
    id: "consents",
    title: "Einwilligungen (DSGVO)",
    desc: "Consent-Templates, granulare Einwilligungsrecords",
    href: `/w/${WS}/admin/consents`,
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    color: "from-lime-600 to-lime-800",
    border: "hover:border-lime-300",
  },
  {
    id: "users",
    title: "Benutzer & Rollen",
    desc: "Workspace-Benutzer, RBAC, Zugangsanfragen",
    href: `/w/${WS}/admin/users`,
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    color: "from-fuchsia-600 to-fuchsia-800",
    border: "hover:border-fuchsia-300",
  },
  {
    id: "theme",
    title: "Theme Editor",
    desc: "Workspace-Branding, Farben, Schriften, Logo",
    href: `/w/${WS}/admin/theme`,
    icon: "M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z",
    color: "from-yellow-600 to-yellow-800",
    border: "hover:border-yellow-300",
  },
  {
    id: "observer",
    title: "Observer-Ansicht",
    desc: "Beobachter-Bewertungen, Offline-first Rating",
    href: `/w/${WS}/observer`,
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    color: "from-stone-600 to-stone-800",
    border: "hover:border-stone-300",
  },
  {
    id: "candidate-portal",
    title: "Kandidaten-Portal",
    desc: "4-View-Portal: Welcome, Module, Detail, Datenraum",
    href: `/w/${WS}/assessment`,
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    color: "from-orange-600 to-orange-800",
    border: "hover:border-orange-300",
  },
];

export default function MasterModuleOverviewPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/workspaces", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight hover:text-slate-200 transition" data-testid="text-logo">
            Executive Diagnostics Suite
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Master-Administration</span>
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition" data-testid="link-back-landing">
              Abmelden
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy font-serif" data-testid="text-module-overview-title">
              Module
            </h1>
            <p className="text-slate-500 mt-2">
              Alle Plattform-Module im Überblick. Klicken Sie auf eine Kachel, um das jeweilige Modul zu öffnen.
            </p>
          </div>
          <Link
            href="/master/workspaces/new"
            className="shrink-0 px-4 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:opacity-90 transition"
            data-testid="button-new-workspace"
          >
            + Neuer Workspace
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={mod.href}
              className={`group bg-white rounded-xl border border-slate-200 ${mod.border} p-5 transition-all hover:shadow-lg hover:-translate-y-0.5`}
              data-testid={`card-module-${mod.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} text-white flex items-center justify-center shrink-0`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={mod.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{mod.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 mt-10">
        <p className="text-center text-xs text-slate-500">
          &copy; Christoph Aldering &middot; Private initiative &ndash; for training reasons only &ndash; no data from reality so far!
        </p>
      </footer>
    </div>
  );
}
