"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function WorkspaceUserLoginPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [mode, setMode] = useState<"login" | "activate">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [statusInfo, setStatusInfo] = useState<"pending" | "rejected" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, workspaceSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Anmeldung fehlgeschlagen.");
        return;
      }

      const data = await res.json();

      if (data.user.forcePasswordChange) {
        router.push(`/w/${workspaceSlug}/change-password`);
        return;
      }

      if (data.user.roles.includes("CANDIDATE")) {
        router.push(`/w/${workspaceSlug}/assessment`);
      } else if (data.user.roles.length === 1 && data.user.roles[0] === "OBSERVER") {
        router.push(`/w/${workspaceSlug}/observer`);
      } else if (data.user.roles.length === 1 && (data.user.roles[0] === "HR_CLIENT" || data.user.roles[0] === "CLIENT")) {
        router.push(`/w/${workspaceSlug}/observer`);
      } else {
        router.push(`/w/${workspaceSlug}/admin`);
      }
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusInfo(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, workspaceSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "pending" || data.status === "rejected") {
          setStatusInfo(data.status);
        }
        setError(data.error || "Aktivierung fehlgeschlagen.");
        return;
      }

      router.push(`/w/${workspaceSlug}/change-password`);
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            Executive Diagnostics Suite
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-navy mb-2">
              {mode === "login" ? "Anmeldung" : "Erstanmeldung"}
            </h1>
            <p className="text-sm text-slate-500">
              Workspace: <strong>{workspaceSlug}</strong>
            </p>
            <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <div className="flex rounded-lg border border-slate-200 mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-brand-navy text-white"
                  : "bg-white text-slate-500 hover:text-slate-700"
              }`}
              data-testid="tab-login"
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => { setMode("activate"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "activate"
                  ? "bg-brand-navy text-white"
                  : "bg-white text-slate-500 hover:text-slate-700"
              }`}
              data-testid="tab-activate"
            >
              Erstanmeldung
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  required
                  data-testid="input-email"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  required
                  data-testid="input-password"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                />
              </div>

              {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                data-testid="button-login"
                className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
              >
                {loading ? "Anmelden…" : "Anmelden"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4" data-testid="form-activate">
              <p className="text-sm text-slate-500 leading-relaxed">
                Geben Sie Ihre E-Mail-Adresse ein, um Ihr Konto zu aktivieren und ein persönliches Passwort festzulegen.
              </p>

              <div>
                <label htmlFor="activate-email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-Mail
                </label>
                <input
                  id="activate-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  required
                  data-testid="input-activate-email"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                />
              </div>

              {error && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    statusInfo === "pending"
                      ? "bg-amber-50 border border-amber-200 text-amber-800"
                      : statusInfo === "rejected"
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "text-red-500"
                  }`}
                  data-testid="text-activate-error"
                >
                  <p>{error}</p>
                  {statusInfo === "pending" && (
                    <p className="mt-1 text-xs text-amber-600">Ihr Workspace-Administrator wird Sie informieren, sobald Ihr Zugang freigeschaltet ist.</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                data-testid="button-activate"
                className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
              >
                {loading ? "Wird geprüft…" : "Konto aktivieren"}
              </button>
            </form>
          )}

          <div className="text-center mt-6 space-y-2">
            <Link
              href={`/w/${workspaceSlug}/request-access`}
              className="block text-sm text-brand-blue hover:text-brand-blue-dark font-medium transition-colors"
              data-testid="link-request-access"
            >
              Zugang anfordern
            </Link>
            <Link
              href={`/w/${workspaceSlug}/reset-password`}
              className="block text-sm text-slate-400 hover:text-brand-blue transition-colors"
            >
              Passwort vergessen?
            </Link>
            <Link href="/" className="block text-sm text-slate-400 hover:text-brand-blue transition-colors">
              Zurück zur Plattform
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
