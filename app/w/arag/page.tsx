"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch("/api/arag-bdp/gate/person-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: lobbyEnv, code: selectedRole.code, password: "demo-bypass" }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(data.redirectTo || "/arag-bdp");
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
      <header className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">ARAG Executive BDP</h1>
          </div>
          {lobbyEnv && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              lobbyEnv === "demo" ? "bg-[#FFD700] text-black" : "bg-green-500 text-white"
            }`}>
              {lobbyEnv === "demo" ? "DEMO" : "LIVE"}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">

          {!lobbyEnv && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-black">Umgebung wählen</h2>
                <p className="text-gray-500 text-sm mt-1">Wählen Sie LIVE oder DEMO.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  data-testid="arag-lobby-live"
                  disabled
                  className="p-6 rounded-2xl border-2 border-gray-200 opacity-40 cursor-not-allowed text-center"
                >
                  <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </span>
                  <span className="font-bold text-black block">LIVE starten</span>
                  <span className="text-xs text-gray-400 mt-1 block">Noch nicht verfügbar</span>
                </button>
                <button
                  data-testid="arag-lobby-demo"
                  onClick={() => handleEnvSelect("demo")}
                  className="p-6 rounded-2xl border-2 border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/15 transition-all text-center group"
                >
                  <span className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FFD700] transition-colors">
                    <span className="w-3 h-3 rounded-full bg-[#FFD700] group-hover:bg-black" />
                  </span>
                  <span className="font-bold text-black block">DEMO starten</span>
                  <span className="text-xs text-gray-400 mt-1 block">Testumgebung</span>
                </button>
              </div>
              {envLockedNote && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl mt-4 text-center" data-testid="arag-env-locked-note">
                  Sie befinden sich in der DEMO-Umgebung.
                </p>
              )}
            </div>
          )}

          {lobbyEnv && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-black">Perspektive wählen</h2>
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
          )}

          <div className="bg-white/60 rounded-2xl p-5 space-y-2">
            <h3 className="font-bold text-sm text-black">Business Development Pitch – Bewertungsumgebung</h3>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                Pro Kriterium stehen 100 Punkte zur Verfügung.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                Die Punkte müssen vollständig verteilt werden.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                Die Bewertung kann gespeichert und später abgeschlossen werden.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                Die Ergebnisse werden nach Abschluss der Bewertung sichtbar.
              </li>
            </ul>
          </div>

          <p className="text-center text-xs text-gray-400 pb-4">
            Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </p>
        </div>
      </main>
    </div>
  );
}
