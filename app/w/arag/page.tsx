"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingHero from "@/app/components/arag/LandingHero";
import LandingCards from "@/app/components/arag/LandingCards";
import LandingCharts from "@/app/components/arag/LandingCharts";
import JourneyTimeline from "@/app/components/arag/JourneyTimeline";

type DemoRole = {
  code: string;
  label: string;
  personaName: string;
  description: string;
};

const DEMO_ROLES: DemoRole[] = [
  { code: "D-MD1", label: "Admin", personaName: "Virginia Woolf", description: "Zugang zur Admin-Konsole, Session-Steuerung und Auswertung" },
  { code: "D-V1", label: "Beobachter", personaName: "Marie Curie", description: "Bewertung der Teams und individuelle Teilnehmer-Notizen" },
];

export default function AragLobbyPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemoLocked, setIsDemoLocked] = useState(false);

  const [lobbyEnv, setLobbyEnv] = useState<"live" | "demo" | null>(null);
  const [envLockedNote, setEnvLockedNote] = useState(false);

  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [personError, setPersonError] = useState("");
  const [personLoading, setPersonLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const gateRes = await fetch("/api/arag-bdp/gate/me", { cache: "no-store" });
        const gateData = await gateRes.json();
        if (gateData.ok) {
          setAuthenticated(true);
          if (gateData.demoLock) setIsDemoLocked(true);
          setAuthLoading(false);
          return;
        }
      } catch {}

      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (meRes.ok) {
          await fetch("/api/arag-bdp/gate/general-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: true }),
          });
          setAuthenticated(true);
          setAuthLoading(false);
          return;
        }
      } catch {}

      setAuthenticated(false);
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/");
    }
  }, [authLoading, authenticated, router]);

  const handleEnvSelect = (env: "live" | "demo") => {
    if (env === "live" && isDemoLocked) {
      setEnvLockedNote(true);
      return;
    }
    setEnvLockedNote(false);
    setLobbyEnv(env);
  };

  const handlePersonLogin = async () => {
    if (!selectedRole || !lobbyEnv) return;
    setPersonError("");
    setPersonLoading(true);
    try {
      await fetch("/api/arag-bdp/auth/session", { method: "DELETE" });
      const res = await fetch("/api/arag-bdp/gate/person-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: lobbyEnv, code: selectedRole.code, password: "demo-bypass" }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = data.redirectTo || "/arag-bdp";
      } else {
        setPersonError(data.error || "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setPersonError("Verbindungsfehler.");
    } finally {
      setPersonLoading(false);
    }
  };

  if (authLoading || !authenticated) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col">
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ARAG</span>
            <span className="text-white/40 text-sm hidden sm:inline">Executive Diagnostics</span>
          </div>
          {lobbyEnv && (
            <button
              onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Zurück zur Übersicht
            </button>
          )}
        </div>
      </header>

      {!lobbyEnv ? (
        <>
          <LandingHero />
          <LandingCards />
          <LandingCharts />
          <JourneyTimeline />

          <section className="w-full bg-black" data-testid="section-env-select">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700] mb-3">
                  Zugang
                </p>
                <h2
                  className="text-2xl md:text-3xl font-bold text-white mb-4"
                  style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                >
                  Umgebung wählen
                </h2>
                <p className="text-gray-400 text-sm mb-10">
                  Starten Sie die Bewertungsumgebung im LIVE- oder DEMO-Modus.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <button
                    data-testid="arag-lobby-live"
                    disabled
                    className="group relative px-8 py-5 border-2 border-gray-700 rounded-xl text-center opacity-40 cursor-not-allowed"
                  >
                    <span className="block font-bold text-white text-lg mb-1">LIVE</span>
                    <span className="block text-xs text-gray-500">Noch nicht verfügbar</span>
                  </button>
                  <button
                    data-testid="arag-lobby-demo"
                    onClick={() => handleEnvSelect("demo")}
                    className="group relative px-8 py-5 border-2 border-[#FFD700] rounded-xl text-center transition-all hover:bg-[#FFD700]"
                  >
                    <span className="block font-bold text-white text-lg mb-1 group-hover:text-black transition-colors">DEMO</span>
                    <span className="block text-xs text-gray-400 group-hover:text-black/60 transition-colors">Testumgebung starten</span>
                  </button>
                </div>

                {envLockedNote && (
                  <p className="text-sm text-amber-400 mt-6" data-testid="arag-env-locked-note">
                    Sie befinden sich in der DEMO-Umgebung.
                  </p>
                )}
              </div>
            </div>
          </section>

          <footer className="bg-black border-t border-white/10 py-6">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
              </p>
              <p className="text-xs text-gray-600">ARAG SE</p>
            </div>
          </footer>
        </>
      ) : (
        <main className="flex-1 flex items-start justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="text-xl font-bold text-black"
                    style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                  >
                    Perspektive wählen
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {lobbyEnv === "demo" ? "Demo-Umgebung" : "Live-System"}
                  </p>
                </div>
                <button
                  data-testid="arag-back-env"
                  onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
                  className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                  Umgebung wechseln
                </button>
              </div>

              <div className="space-y-3">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.code}
                    type="button"
                    data-testid={`arag-role-${role.label.toLowerCase()}`}
                    onClick={() => { setSelectedRole(role); setPersonError(""); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedRole?.code === role.code
                        ? "border-[#FFD700] bg-[#FFD700]/10"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedRole?.code === role.code
                          ? "bg-[#FFD700] text-black"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {role.personaName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-black">{role.personaName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            {role.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
                      </div>
                      {selectedRole?.code === role.code && (
                        <span className="text-[#FFD700] font-bold text-lg">&#10003;</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedRole && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                    <input
                      data-testid="arag-person-password"
                      type="password"
                      value="****"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-400 cursor-default"
                    />
                  </div>

                  {personError && <p className="text-red-500 text-sm" data-testid="text-person-error">{personError}</p>}

                  <button
                    data-testid="arag-person-login"
                    type="button"
                    onClick={handlePersonLogin}
                    disabled={personLoading}
                    className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
                  >
                    {personLoading ? "Anmeldung..." : `Als ${selectedRole.personaName} anmelden`}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 pb-4">
              Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
