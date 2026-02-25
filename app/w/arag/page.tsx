"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import StandardLanding from "@/app/components/arag/StandardLanding";

const AppleLanding = dynamic(() => import("@/app/components/arag/AppleLanding"), { ssr: false });

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

type ViewMode = "standard" | "apple";

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

  const [viewMode, setViewMode] = useState<ViewMode>("standard");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("arag_landing_view");
      if (saved === "apple" || saved === "standard") setViewMode(saved);
    } catch {}
  }, []);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("arag_landing_view", mode); } catch {}
  };

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
    <div className={`min-h-screen flex flex-col ${viewMode === "apple" ? "bg-black" : "bg-[#FFFBF0]"}`}>
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ARAG</span>
            <span className="text-white/40 text-sm hidden sm:inline">Executive Diagnostics</span>
          </div>
          <div className="flex items-center gap-4">
            {!lobbyEnv && (
              <div className="flex items-center gap-2" data-testid="toggle-view-mode">
                <span className="text-[10px] text-white/30 uppercase tracking-wider hidden sm:inline">Darstellung</span>
                <div className="flex bg-white/10 rounded-full p-0.5">
                  <button
                    onClick={() => toggleView("standard")}
                    className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all ${
                      viewMode === "standard" ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                    data-testid="toggle-standard"
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => toggleView("apple")}
                    className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all ${
                      viewMode === "apple" ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                    data-testid="toggle-apple"
                  >
                    Apple
                  </button>
                </div>
              </div>
            )}
            {lobbyEnv && (
              <button
                onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                Zurück zur Übersicht
              </button>
            )}
          </div>
        </div>
      </header>

      {!lobbyEnv ? (
        <div className="transition-opacity duration-150">
          {viewMode === "standard" && (
            <StandardLanding onSelectEnv={handleEnvSelect} envLockedNote={envLockedNote} />
          )}
          {viewMode === "apple" && (
            <AppleLanding onSelectEnv={handleEnvSelect} envLockedNote={envLockedNote} />
          )}
        </div>
      ) : (
        <main className={`flex-1 flex items-start justify-center px-4 py-12 ${viewMode === "apple" ? "bg-black" : ""}`}>
          <div className="w-full max-w-md space-y-6">
            <div className={`rounded-2xl shadow-lg p-8 ${viewMode === "apple" ? "bg-[#111] border border-white/10" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className={`text-xl font-bold ${viewMode === "apple" ? "text-white" : "text-black"}`}
                    style={{ fontFamily: viewMode === "apple" ? "inherit" : "Georgia, 'Playfair Display', serif" }}
                  >
                    Perspektive wählen
                  </h2>
                  <p className={`text-sm mt-0.5 ${viewMode === "apple" ? "text-white/40" : "text-gray-500"}`}>
                    {lobbyEnv === "demo" ? "Demo-Umgebung" : "Live-System"}
                  </p>
                </div>
                <button
                  data-testid="arag-back-env"
                  onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
                  className={`text-xs transition-colors ${viewMode === "apple" ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-black"}`}
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
                        : viewMode === "apple"
                          ? "border-white/10 hover:border-white/20 bg-transparent"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedRole?.code === role.code
                          ? "bg-[#FFD700] text-black"
                          : viewMode === "apple" ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500"
                      }`}>
                        {role.personaName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${viewMode === "apple" ? "text-white" : "text-black"}`}>{role.personaName}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            viewMode === "apple" ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-500"
                          }`}>
                            {role.label}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${viewMode === "apple" ? "text-white/30" : "text-gray-400"}`}>{role.description}</p>
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
                    <label className={`block text-sm font-medium mb-1 ${viewMode === "apple" ? "text-white/50" : "text-gray-700"}`}>Passwort</label>
                    <input
                      data-testid="arag-person-password"
                      type="password"
                      value="****"
                      readOnly
                      className={`w-full px-4 py-3 border rounded-xl text-sm cursor-default ${
                        viewMode === "apple"
                          ? "border-white/10 bg-white/5 text-white/30"
                          : "border-gray-200 bg-gray-50 text-gray-400"
                      }`}
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

            <p className={`text-center text-xs pb-4 ${viewMode === "apple" ? "text-white/20" : "text-gray-400"}`}>
              Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
