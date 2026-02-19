"use client";

import { useState, useRef } from "react";
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
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

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

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const processSteps = [
    { num: "01", title: "Anforderungsanalyse", desc: "Kompetenzmodelle aus Stellenprofilen ableiten oder KI-generieren lassen", ki: true, icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" },
    { num: "02", title: "Übungsdesign", desc: "Bibliothek nutzen, KI-gestützt anpassen oder komplett neu generieren", ki: true, icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { num: "03", title: "Durchführung", desc: "Offline-fähige Beobachtung, Echtzeit-Kollaboration, Audio-Transkription", ki: false, icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { num: "04", title: "Auswertung", desc: "Konsolidierung, MTMM-Matrix, KI-gestützte Hypothesen und Empfehlungen", ki: true, icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    { num: "05", title: "Ergebnisberichte", desc: "Automatisierte Reports in DOCX, PDF und PowerPoint -- fertig in 30 Minuten", ki: true, icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  ];

  const accessCards = [
    {
      id: "master" as AccessMode,
      title: "Master-Administration",
      subtitle: "Plattform-Verwaltung",
      description: "Zugang zur globalen Modul-\u00dcbersicht und Plattform-Konfiguration",
      icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "from-slate-700 to-slate-900",
      accent: "bg-slate-800 hover:bg-slate-700",
    },
    {
      id: "workspace" as AccessMode,
      title: "Company-Cockpit",
      subtitle: "Workspace-Zugang",
      description: "Workspace ausw\u00e4hlen und im Enterprise-Cockpit anmelden",
      icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
      gradient: "from-blue-600 to-blue-800",
      accent: "bg-blue-700 hover:bg-blue-600",
    },
    {
      id: "candidate" as AccessMode,
      title: "Kandidaten-Portal",
      subtitle: "Teilnehmer-Zugang",
      description: "Als Kandidat im Assessment-Portal anmelden",
      icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
      gradient: "from-amber-600 to-amber-800",
      accent: "bg-amber-700 hover:bg-amber-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── STICKY HEADER ── */}
      <header className="bg-brand-navy text-white sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight" data-testid="text-logo">
            Executive Diagnostics Suite
          </span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#prozess" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Unser Prozess</a>
            <a href="#uebungen" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Übungsbibliothek</a>
            <a href="#fallstudien" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Fallstudien</a>
            <a href="#kandidaten" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Kandidatenportal</a>
            <a href="#frameworks" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Frameworks</a>
          </nav>
          <button
            onClick={scrollToLogin}
            className="text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-dark rounded-full px-5 py-1.5 transition-colors"
            data-testid="button-nav-login"
          >
            Anmelden
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-brand-navy text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-brand-blue/30 rounded-full px-4 py-1.5">
                Unsere Diagnostik-Plattform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] font-serif" data-testid="text-hero-title">
                Die KI denkt mit.
                <br />
                <span className="text-brand-blue">Wir entscheiden.</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Unser eigenes Werkzeug f&uuml;r den kompletten AC-Prozess &mdash; von der
                Anforderungsanalyse bis zum fertigen Ergebnisbericht. KI-gest&uuml;tzt,
                rechtskonform, und immer unter unserer Kontrolle.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <a
                  href="#prozess"
                  className="rounded-lg bg-brand-blue text-white font-semibold px-8 py-3.5 text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/25"
                  data-testid="button-hero-explore"
                >
                  Was wir damit k&ouml;nnen
                </a>
                <button
                  onClick={scrollToLogin}
                  className="rounded-lg border border-white/20 text-white font-medium px-8 py-3.5 text-sm hover:bg-white/5 transition-colors"
                  data-testid="button-hero-login"
                >
                  Direkt anmelden
                </button>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-white/30 ml-2 font-mono">diagnostics.engine</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Anforderungsanalyse</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">100%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">&Uuml;bungsmatching</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: "87%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-blue-400">87%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Beobachtungsb&ouml;gen</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: "92%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-400">92%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Ergebnisbericht</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: "74%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-400">74%</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      KI-Analyse aktiv &middot; 5 Kompetenzen erkannt &middot; 3 &Uuml;bungen vorgeschlagen
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-5 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">DIN 33430 konform</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">DSGVO-ready</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Enterprise-Grade</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Offline-f&auml;hig</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Mandantenf&auml;hig</span>
          </div>
        </div>
      </section>

      {/* ── SEKTION 1: UNSER AC-PROZESS ── */}
      <section id="prozess" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-blue-200 rounded-full px-4 py-1.5 mb-4">
              End-to-End
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-process-headline">
              Unser kompletter AC-Prozess &mdash; durchg&auml;ngig KI-gest&uuml;tzt
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Von der ersten Anforderungsanalyse bis zum fertigen Ergebnisbericht &mdash; ein
              durchg&auml;ngiger Prozess ohne Medienbr&uuml;che. Die KI unterst&uuml;tzt bei jedem Schritt.
              Wir behalten die Kontrolle.
            </p>
          </div>

          <div className="space-y-0">
            {processSteps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < processSteps.length - 1 && (
                  <div className="absolute left-[27px] top-[56px] bottom-0 w-px bg-slate-200" />
                )}
                <div className="flex gap-6 py-6">
                  <div className="shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${step.ki ? "bg-gradient-to-br from-brand-blue to-blue-700" : "bg-gradient-to-br from-slate-500 to-slate-700"}`}>
                      {step.num}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-bold text-brand-navy font-serif">{step.title}</h3>
                      {step.ki && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                          KI-gest&uuml;tzt
                        </span>
                      )}
                      {!step.ki && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
                          Mensch steuert
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="hidden md:flex shrink-0 w-10 h-10 rounded-xl bg-slate-50 text-slate-400 items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 italic max-w-xl mx-auto">
              Kein Copy-Paste zwischen Tools. Kein Medienbruch. Ein System, das von Anfang bis Ende durchdacht ist.
            </p>
          </div>
        </div>
      </section>

      {/* ── SEKTION 2: ÜBUNGSBIBLIOTHEK ── */}
      <section id="uebungen" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600 border border-purple-200 rounded-full px-4 py-1.5 mb-4">
              Unsere &Uuml;bungsbibliothek
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-exercises-headline">
              Vorhandenes nutzen. Anpassen. Oder neu generieren lassen.
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Unser wachsendes Archiv an Assessment-&Uuml;bungen &mdash; sofort einsetzbar,
              KI-gest&uuml;tzt anpassbar oder auf Knopfdruck komplett neu generiert.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-brand-navy mb-2 font-serif">Aus der Bibliothek</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Bew&auml;hrte &Uuml;bungen sofort einsetzen. Unser Scoring-Algorithmus pr&uuml;ft automatisch
                  die Passung zu den definierten Anforderungen.
                </p>
                <div className="space-y-2">
                  {["Sofort einsetzbar", "Automatisches Passung-Scoring", "Versioniert & dokumentiert"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-brand-navy mb-2 font-serif">KI-gest&uuml;tzt anpassen</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Vorhandene &Uuml;bungen kontextspezifisch adaptieren &mdash; Branche, Funktion,
                  Senioritätslevel. Die KI schl&auml;gt Anpassungen vor, wir entscheiden.
                </p>
                <div className="space-y-2">
                  {["Branchenspezifische Adaption", "Schwierigkeitsgrad anpassen", "CD-konforme Varianten"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-700" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-brand-navy mb-2 font-serif">Komplett neu generieren</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Die KI erstellt komplette &Uuml;bungen auf Basis unserer Anforderungsprofile &mdash;
                  inkl. Bewertungskriterien, Verhaltensankern und Beobachtungsb&ouml;gen.
                </p>
                <div className="space-y-2">
                  {["Auf Basis der Anforderung", "Inkl. Bewertungskriterien", "Sofort einsatzbereit"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEKTION 3: FALLSTUDIEN-WOW ── */}
      <section id="fallstudien" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600 border border-amber-200 rounded-full px-4 py-1.5">
                Game Changer
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-casestudy-headline">
                Komplexe Fallstudien in Minuten statt Wochen
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Eine ma&szlig;geschneiderte Fallstudie braucht normalerweise 2&ndash;3 Wochen Entwicklungszeit.
                Mit unserem Case-Studio laden wir vorhandene Unterlagen hoch &mdash; die KI strukturiert
                sie automatisch in eine fertige Fallstudie mit Datenraum, Aufgabenstellung und Bewertungsschl&uuml;ssel.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">Dokument hochladen</p>
                    <p className="text-xs text-slate-500">Gesch&auml;ftsberichte, Strategiepapiere, Organigramme &mdash; was wir haben</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">KI strukturiert</p>
                    <p className="text-xs text-slate-500">Automatische Aufbereitung in Fallstudie mit Datenraum-Dokumenten</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">Wir verfeinern</p>
                    <p className="text-xs text-slate-500">Aufgabenstellung, Bewertungsschl&uuml;ssel und Schwierigkeitsgrad anpassen</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8">
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold text-amber-600 font-serif">2&ndash;3 Wo.</div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1 bg-amber-300" />
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                    <div className="h-px flex-1 bg-amber-300" />
                  </div>
                  <div className="text-6xl font-bold text-emerald-600 font-serif">&lt; 1 Std.</div>
                  <p className="text-sm text-slate-500">
                    Entwicklungszeit f&uuml;r eine ma&szlig;geschneiderte Fallstudie
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEKTION 4: KANDIDATENPORTAL ── */}
      <section id="kandidaten" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
              Kandidatenerlebnis
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-candidates-headline">
              Zeitgem&auml;&szlig;e Darreichung f&uuml;r unsere Teilnehmenden
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Schluss mit &laquo;PDF per Mail&raquo;. Unsere Kandidaten bekommen ein professionelles
              Portal &mdash; im Corporate Design des jeweiligen Kunden, mit zeitgesteuerter Freigabe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <h3 className="text-base font-bold text-red-700">Bisher</h3>
              </div>
              <div className="space-y-3 text-sm text-red-700/70">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">&times;</span> PDFs per Mail an Kandidaten versenden
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">&times;</span> Zeitplanung m&uuml;ndlich oder per separater Mail
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">&times;</span> Dokumente einzeln zusammensuchen
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">&times;</span> Keine einheitliche Darstellung
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">&times;</span> Selbsteinsch&auml;tzungen auf Papier
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-bold text-emerald-700">Mit unserer Plattform</h3>
              </div>
              <div className="space-y-3 text-sm text-emerald-700/70">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Eigenes Kandidatenportal pro Assessment
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Zeitgesteuerte Dokumentenfreigabe
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Im Corporate Design des Kunden
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Digitale Selbsteinsch&auml;tzungen integriert
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  DSGVO-konformes Consent Management
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 italic">
              Unsere Kandidaten erleben ein Assessment, das so professionell ist wie die Position, f&uuml;r die sie sich bewerben.
            </p>
          </div>
        </div>
      </section>

      {/* ── SEKTION 5: BEURTEILUNGS-FRAMEWORKS ── */}
      <section id="frameworks" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 space-y-5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-navy text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex-1 bg-white rounded-lg border border-slate-200 px-4 py-2.5">
                    <p className="text-xs text-slate-400 mb-0.5">Input</p>
                    <p className="text-sm font-medium text-brand-navy">Kompetenzmodell des Kunden</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </svg>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-xs font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg border border-blue-200 px-4 py-2.5">
                    <p className="text-xs text-blue-400 mb-0.5">KI-Verarbeitung</p>
                    <p className="text-sm font-medium text-brand-navy">&Uuml;bersetzung in Verhaltensanker &amp; Skalen</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </svg>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <div className="flex-1 bg-emerald-50 rounded-lg border border-emerald-200 px-4 py-2.5">
                    <p className="text-xs text-emerald-400 mb-0.5">Output</p>
                    <p className="text-sm font-medium text-brand-navy">Fertige Beobachtungsb&ouml;gen + MTMM-Matrix</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2 space-y-6">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 border border-emerald-200 rounded-full px-4 py-1.5">
                Frameworks &amp; Beobachtungsb&ouml;gen
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-frameworks-headline">
                Vom Kundenmodell zum fertigen Beobachtungsbogen in 15 Minuten
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Jeder Kunde hat eigene Kompetenzmodelle. Unsere Plattform &uuml;bersetzt sie
                in Sekundenschnelle in operationalisierte Verhaltensanker, Bewertungsskalen
                und fertige Beobachtungsb&ouml;gen &mdash; inkl. MTMM-Matrix-Generierung.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Unternehmensspezifische Modelle hochladen oder eingeben",
                  "KI generiert Verhaltensanker pro Kompetenz und Skala",
                  "Automatische MTMM-Matrix (Übung x Kompetenz)",
                  "Fertige Beobachtungsbögen zum sofortigen Einsatz",
                  "Oder: KI generiert das komplette Framework von Grund auf",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION: KI HILFT, WIR ENTSCHEIDEN ── */}
      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-4">
              KI hilft. Wir entscheiden.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Unsere KI ist ein diagnostischer Co-Pilot &mdash; kein Autopilot. Alle KI-Ausgaben
              sind transparent gekennzeichnet, konfidenzbewertet und vollst&auml;ndig audit-geloggt.
            </p>
            <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full mt-6" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { before: "2\u20133 Wo.", after: "< 1 Std.", label: "Fallstudien-Entwicklung" },
              { before: "2 Tage", after: "15 Min.", label: "Beobachtungsb\u00f6gen" },
              { before: "4 Std.", after: "30 Min.", label: "Ergebnisberichte" },
              { before: "1 Woche", after: "2 Std.", label: "Kompetenzmodell erstellen" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="text-xs text-slate-500 line-through mb-1">{stat.before}</div>
                <div className="text-2xl font-bold text-brand-blue mb-1">{stat.after}</div>
                <div className="text-xs text-slate-300">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                title: "Volle Transparenz",
                desc: "Jede KI-Ausgabe ist als solche gekennzeichnet. Konfidenz-Scores zeigen, wie sicher die Empfehlung ist.",
              },
              {
                icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
                title: "Rechtskonform",
                desc: "DIN 33430-konform, DSGVO-ready, vollst\u00e4ndiges Consent Management mit versionierten Vorlagen.",
              },
              {
                icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
                title: "Audit-geloggt",
                desc: "Jede KI-Interaktion wird dokumentiert. Nachvollziehbar, reproduzierbar, revisionssicher.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="w-10 h-10 rounded-lg bg-brand-blue/20 text-brand-blue flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANCED INTELLIGENCE LAYER ── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600 border border-purple-200 rounded-full px-4 py-1.5 mb-4">
              Was andere nicht haben
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif">
              Unsere Advanced Intelligence Layer
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Drei KI-Module, die &uuml;ber Standard-Auswertung hinausgehen &mdash; echte diagnostische
              Intelligenz, die uns bei der Interpretation und Empfehlung unterst&uuml;tzt.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Predictive Success Intelligence</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Welche F&uuml;hrungsrisiken sehen wir, bevor sie eintreten? Analyse in f&uuml;nf Dimensionen: Execution,
                Stakeholder, Resilienz, Governance und Transformation.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" />Szenario-Simulationen</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" />Konfidenz-Scoring</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400" />Pr&auml;diktive Erfolgsprofile</div>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Development Path Generator</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Automatisch generierte Entwicklungspl&auml;ne: 90-Tage-Fokus, 6-Monats-Wachstum,
                12-Monats-Positionierung &mdash; direkt aus unseren Ergebnisdaten.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" />Coaching-Empfehlungen</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" />Risikominimierung</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" />Evidenzbasiert</div>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Diagnostic Hypothesis Engine</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                KI formuliert diagnostische Hypothesen mit st&uuml;tzender und kontr&auml;rer Evidenz,
                alternativen Interpretationen und Validierungsschritten.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" />Gegen-Evidenz</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" />Alternativmodelle</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" />Validierungsprotokolle</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-serif">
              Was wir k&ouml;nnen &mdash; und was der Marktstandard bietet
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50">
              <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature</div>
              <div className="p-4 text-xs font-semibold text-brand-navy uppercase tracking-wider text-center">Unsere Plattform</div>
              <div className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Marktstandard</div>
            </div>
            {[
              { feature: "KI-generierte Kompetenzmodelle", us: true, them: false },
              { feature: "Predictive Success Intelligence", us: true, them: false },
              { feature: "Hypothesen-Engine mit Gegen-Evidenz", us: true, them: false },
              { feature: "KI-adaptierte Fallstudien", us: true, them: false },
              { feature: "Audio-Transkription + KI-Summary", us: true, them: false },
              { feature: "MTMM-Matrix-Generierung", us: true, them: false },
              { feature: "Offline-f\u00e4hige Beobachtung", us: true, them: "partial" },
              { feature: "Multi-Format Reports (DOCX/PDF/PPTX)", us: true, them: "partial" },
              { feature: "Kandidatenportal mit Zeitsteuerung", us: true, them: false },
              { feature: "Echtzeit-Kollaboration", us: true, them: false },
              { feature: "Brand Rule Set Management", us: true, them: false },
            ].map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-b border-slate-100 last:border-0`}>
                <div className="p-4 text-sm text-slate-700">{row.feature}</div>
                <div className="p-4 flex justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div className="p-4 flex justify-center">
                  {row.them === true && (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {row.them === false && (
                    <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {row.them === "partial" && (
                    <span className="text-xs text-amber-500 font-medium">Teilweise</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGIN SECTION ── */}
      <section id="signin" ref={loginRef} className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-login-headline">
              Anmelden
            </h2>
            <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">
              Zugangsbereich w&auml;hlen und loslegen.
            </p>
          </div>

          {!activeMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 font-serif">
                    {card.title}
                  </h3>
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
                Zur&uuml;ck zur &Uuml;bersicht
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
                        <h3 className="text-lg font-bold text-slate-800 font-serif">{card.title}</h3>
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
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Master-Admin Passwort" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500" autoFocus data-testid="input-master-password" />
                    <button type="submit" disabled={loading || !password} className="w-full mt-4 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition" data-testid="button-master-login">
                      {loading ? "Anmelden..." : "Als Master-Admin anmelden"}
                    </button>
                  </form>
                )}

                {activeMode === "workspace" && (
                  <form onSubmit={handleWorkspaceLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Workspace</label>
                    <input type="text" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())} placeholder="Workspace-Name eingeben" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" autoFocus data-testid="input-workspace-slug" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-Mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre@email.de" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" data-testid="input-workspace-email" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Passwort</label>
                    <input type="password" value={wsPassword} onChange={(e) => setWsPassword(e.target.value)} placeholder="Passwort" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-testid="input-workspace-password" />
                    <button type="submit" disabled={loading || !workspaceSlug || !email || !wsPassword} className="w-full mt-4 px-4 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition" data-testid="button-workspace-login">
                      {loading ? "Anmelden..." : "Im Company-Cockpit anmelden"}
                    </button>
                  </form>
                )}

                {activeMode === "candidate" && (
                  <form onSubmit={handleCandidateLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Workspace</label>
                    <input type="text" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())} placeholder="Workspace-Name eingeben" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3" autoFocus data-testid="input-candidate-workspace" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-Mail</label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="ihre@email.de" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3" data-testid="input-candidate-email" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Passwort</label>
                    <input type="password" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} placeholder="Passwort" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" data-testid="input-candidate-password" />
                    <button type="submit" disabled={loading || !workspaceSlug || !candidateEmail || !candidatePassword} className="w-full mt-4 px-4 py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition" data-testid="button-candidate-login">
                      {loading ? "Anmelden..." : "Im Kandidaten-Portal anmelden"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 py-8 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              &copy; Christoph Aldering &middot; Private initiative / concept
            </p>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider">
              Mandantenf&auml;hig &middot; Enterprise-Grade &middot; Made with ambition
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
