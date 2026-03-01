"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/app/components/PasswordInput";
import { LanguageProvider, useLanguage } from "@/app/providers/LanguageProvider";
import LanguageToggle from "@/app/components/LanguageToggle";

type DemoRole = {
  code: string;
  label: string;
  personaName: string;
  description: string;
};

function getDemoRoles(t: (key: string, vars?: Record<string, string | number>) => string): DemoRole[] {
  return [
    { code: "A-MD1", label: t("adminRole"), personaName: "Virginia Woolf", description: t("adminDescription") },
    { code: "A-V1", label: t("observerRole"), personaName: "Marie Curie", description: t("observerDescription") },
  ];
}

export default function AbcdLobbyPage() {
  return (
    <LanguageProvider>
      <AbcdLobbyInner />
    </LanguageProvider>
  );
}

function AbcdLobbyInner() {
  const router = useRouter();
  const { t } = useLanguage();
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
        const gateRes = await fetch("/api/abcd-bdp/gate/me", { cache: "no-store" });
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
          await fetch("/api/abcd-bdp/gate/general-login", {
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
      router.push("/w/abcd/login");
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
      await fetch("/api/abcd-bdp/auth/session", { method: "DELETE" });
      const res = await fetch("/api/abcd-bdp/gate/person-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: lobbyEnv, code: selectedRole.code, password: "demo-bypass" }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = data.redirectTo || "/abcd-bdp";
      } else {
        setPersonError(data.error || t("loginFailed"));
      }
    } catch {
      setPersonError(t("connectionErrorShort"));
    } finally {
      setPersonLoading(false);
    }
  };

  if (authLoading || !authenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-gray-400">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <header className="bg-[#1d1d1f] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0071e3] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ABCD</span>
            <span className="text-white/40 text-sm hidden sm:inline">Executive Diagnostics</span>
          </div>
          <div className="flex items-center gap-4">
            {lobbyEnv && (
              <button
                onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {t("backToOverview")}
              </button>
            )}
            <LanguageToggle variant="dark" />
          </div>
        </div>
      </header>

      {!lobbyEnv ? (
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg space-y-8 text-center">
            <div>
              <h1 className="text-3xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
                Executive Diagnostics
              </h1>
              <p className="text-gray-500 text-sm">{t("selectEnvironment")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                data-testid="abcd-env-live"
                onClick={() => handleEnvSelect("live")}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-green-600 text-lg">&#9679;</span>
                </div>
                <h3 className="font-bold text-[#1d1d1f]">LIVE</h3>
                <p className="text-xs text-gray-400 mt-1">{t("liveDescription")}</p>
              </button>
              <button
                data-testid="abcd-env-demo"
                onClick={() => handleEnvSelect("demo")}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-blue-600 text-lg">&#9881;</span>
                </div>
                <h3 className="font-bold text-[#1d1d1f]">DEMO</h3>
                <p className="text-xs text-gray-400 mt-1">{t("demoDescription")}</p>
              </button>
            </div>
            {envLockedNote && (
              <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3">{t("demoLockedNote")}</p>
            )}
            <p className="text-center text-xs text-gray-400">
              {t("poweredBy")} <span className="font-semibold text-[#A6473B]">Executive Diagnostics Suite</span>
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-start justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="rounded-2xl shadow-lg p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1d1d1f]">
                    {t("selectPerspective")}
                  </h2>
                  <p className="text-sm mt-0.5 text-gray-500">
                    {lobbyEnv === "demo" ? t("demoEnvironment") : t("liveSystem")}
                  </p>
                </div>
                <button
                  data-testid="abcd-back-env"
                  onClick={() => { setLobbyEnv(null); setSelectedRole(null); setPersonError(""); }}
                  className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                  {t("changeEnvironment")}
                </button>
              </div>

              <div className="space-y-3">
                {getDemoRoles(t).map(role => (
                  <button
                    key={role.code}
                    type="button"
                    data-testid={`abcd-role-${role.label.toLowerCase()}`}
                    onClick={() => { setSelectedRole(role); setPersonError(""); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedRole?.code === role.code
                        ? "border-[#0071e3] bg-[#0071e3]/5"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedRole?.code === role.code
                          ? "bg-[#0071e3] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {role.personaName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1d1d1f]">{role.personaName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                            {role.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 text-gray-400">{role.description}</p>
                      </div>
                      {selectedRole?.code === role.code && (
                        <span className="text-[#0071e3] font-bold text-lg">&#10003;</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedRole && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t("password")}</label>
                    <PasswordInput
                      data-testid="abcd-person-password"
                      value="****"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-400 rounded-xl text-sm cursor-default pr-12"
                      toggleClassName="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    />
                  </div>

                  {personError && <p className="text-red-500 text-sm" data-testid="text-person-error">{personError}</p>}

                  <button
                    data-testid="abcd-person-login"
                    type="button"
                    onClick={handlePersonLogin}
                    disabled={personLoading}
                    className="w-full bg-[#0071e3] text-white font-bold py-3 rounded-xl hover:bg-[#0077ED] transition-colors disabled:opacity-50"
                  >
                    {personLoading ? t("loggingIn") : t("loginAs", { name: selectedRole.personaName })}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-xs pb-4 text-gray-400">
              {t("poweredBy")} <span className="font-semibold text-[#A6473B]">Executive Diagnostics Suite</span>
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
