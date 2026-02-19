"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccessMode = null | "master" | "workspace" | "candidate";

export default function LandingPage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<AccessMode>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [wsPassword, setWsPassword] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePassword, setCandidatePassword] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("aestimamus");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (res.ok) {
        router.push("/master");
      } else {
        setError("Falsches Passwort");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: wsPassword, workspaceSlug }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
        } else {
          router.push(`/w/${workspaceSlug}/admin`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Anmeldung fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: candidateEmail, password: candidatePassword, workspaceSlug }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
        } else {
          router.push(`/w/${workspaceSlug}/assessment`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Anmeldung fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveMode(null);
    setPassword("");
    setEmail("");
    setWsPassword("");
    setCandidateEmail("");
    setCandidatePassword("");
    setError("");
  };

  const accessCards = [
    {
      id: "master" as AccessMode,
      title: "Master-Administration",
      subtitle: "Plattform-Verwaltung",
      description: "Zugang zur globalen Modul-Übersicht und Plattform-Konfiguration",
      icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "from-slate-700 to-slate-900",
      ring: "ring-slate-400",
      accent: "bg-slate-800 hover:bg-slate-700",
    },
    {
      id: "workspace" as AccessMode,
      title: "Company-Cockpit",
      subtitle: "Workspace-Zugang",
      description: "Workspace auswählen und im Enterprise-Cockpit anmelden",
      icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
      gradient: "from-blue-600 to-blue-800",
      ring: "ring-blue-400",
      accent: "bg-blue-700 hover:bg-blue-600",
    },
    {
      id: "candidate" as AccessMode,
      title: "Kandidaten-Portal",
      subtitle: "Teilnehmer-Zugang",
      description: "Als Kandidat im Assessment-Portal anmelden",
      icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
      gradient: "from-amber-600 to-amber-800",
      ring: "ring-amber-400",
      accent: "bg-amber-700 hover:bg-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <header className="bg-brand-navy text-white border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight" data-testid="text-logo">
            Executive Diagnostics Suite
          </span>
          <span className="text-xs text-slate-400">Zugangsverwaltung</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {!activeMode && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-landing-title">
                  Willkommen
                </h1>
                <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">
                  Wählen Sie Ihren Zugangsbereich, um sich anzumelden.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accessCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => { setActiveMode(card.id); setError(""); }}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    data-testid={`button-access-${card.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center mb-4`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 font-serif">
                      {card.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                      {card.subtitle}
                    </p>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Anmelden
                      <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeMode && (
            <div className="max-w-sm mx-auto">
              <button
                onClick={resetForm}
                className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
                data-testid="button-back"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Zurück zur Übersicht
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                {(() => {
                  const card = accessCards.find((c) => c.id === activeMode)!;
                  return (
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 font-serif">{card.title}</h2>
                        <p className="text-xs text-slate-400">{card.subtitle}</p>
                      </div>
                    </div>
                  );
                })()}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs" data-testid="text-login-error">
                    {error}
                  </div>
                )}

                {activeMode === "master" && (
                  <form onSubmit={handleMasterLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Passwort</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Master-Admin Passwort"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      autoFocus
                      data-testid="input-master-password"
                    />
                    <button
                      type="submit"
                      disabled={loading || !password}
                      className="w-full mt-4 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                      data-testid="button-master-login"
                    >
                      {loading ? "Anmelden..." : "Als Master-Admin anmelden"}
                    </button>
                  </form>
                )}

                {activeMode === "workspace" && (
                  <form onSubmit={handleWorkspaceLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Workspace</label>
                    <select
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 bg-white"
                      data-testid="select-workspace"
                    >
                      <option value="aestimamus">aestimamus</option>
                    </select>

                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-Mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.de"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                      data-testid="input-workspace-email"
                    />

                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Passwort</label>
                    <input
                      type="password"
                      value={wsPassword}
                      onChange={(e) => setWsPassword(e.target.value)}
                      placeholder="Passwort"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="input-workspace-password"
                    />

                    <button
                      type="submit"
                      disabled={loading || !email || !wsPassword}
                      className="w-full mt-4 px-4 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                      data-testid="button-workspace-login"
                    >
                      {loading ? "Anmelden..." : "Im Company-Cockpit anmelden"}
                    </button>
                  </form>
                )}

                {activeMode === "candidate" && (
                  <form onSubmit={handleCandidateLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Workspace</label>
                    <select
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3 bg-white"
                      data-testid="select-candidate-workspace"
                    >
                      <option value="aestimamus">aestimamus</option>
                    </select>

                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-Mail</label>
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="ihre@email.de"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3"
                      data-testid="input-candidate-email"
                    />

                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Passwort</label>
                    <input
                      type="password"
                      value={candidatePassword}
                      onChange={(e) => setCandidatePassword(e.target.value)}
                      placeholder="Passwort"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      data-testid="input-candidate-password"
                    />

                    <button
                      type="submit"
                      disabled={loading || !candidateEmail || !candidatePassword}
                      className="w-full mt-4 px-4 py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                      data-testid="button-candidate-login"
                    >
                      {loading ? "Anmelden..." : "Im Kandidaten-Portal anmelden"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
