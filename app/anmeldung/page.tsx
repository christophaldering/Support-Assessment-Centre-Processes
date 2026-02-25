"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AnmeldungPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.workspaceSlug === "arag") {
            router.push("/arag-bdp");
            return;
          }
          router.push(`/w/${data.workspaceSlug}/admin`);
          return;
        }
      } catch {}
      setCheckingSession(false);
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const slug = workspace.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, workspaceSlug: slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Anmeldung fehlgeschlagen.");
        return;
      }

      const data = await res.json();

      if (data.user.forcePasswordChange) {
        router.push(`/w/${slug}/change-password`);
        return;
      }

      if (slug === "arag") {
        router.push("/arag-bdp");
        return;
      }

      if (data.user.roles.includes("CANDIDATE")) {
        router.push(`/w/${slug}/assessment`);
      } else if (data.user.roles.length === 1 && data.user.roles[0] === "OBSERVER") {
        router.push(`/w/${slug}/observer`);
      } else if (data.user.roles.length === 1 && (data.user.roles[0] === "HR_CLIENT" || data.user.roles[0] === "CLIENT")) {
        router.push(`/w/${slug}/observer`);
      } else {
        router.push(`/w/${slug}/admin`);
      }
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-brand-navy mb-2" data-testid="text-anmeldung-title">
              Anmeldung
            </h1>
            <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4" data-testid="form-anmeldung">
            <div>
              <label htmlFor="workspace" className="block text-sm font-medium text-slate-700 mb-1">
                Workspace
              </label>
              <input
                id="workspace"
                type="text"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="Workspace eingeben"
                required
                data-testid="input-workspace"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
            </div>

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
              disabled={loading || !workspace.trim() || !email.trim() || !password.trim()}
              data-testid="button-anmeldung-submit"
              className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <button
              type="button"
              onClick={() => {
                const slug = workspace.trim().toLowerCase();
                if (slug) {
                  router.push(`/w/${slug}/reset-password`);
                } else {
                  setError("Bitte zuerst einen Workspace eingeben.");
                }
              }}
              className="block w-full text-sm text-slate-400 hover:text-brand-blue transition-colors"
              data-testid="link-forgot-password"
            >
              Passwort vergessen?
            </button>
            <Link
              href="/"
              className="block text-sm text-slate-400 hover:text-brand-blue transition-colors"
              data-testid="link-back-platform"
            >
              Zurück zur Plattform
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
