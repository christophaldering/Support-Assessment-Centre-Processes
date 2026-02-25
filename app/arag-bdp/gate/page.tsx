"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BdpGatePage() {
  const router = useRouter();
  const [workspaceSlug, setWorkspaceSlug] = useState("");
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
          router.push("/arag-bdp");
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

    const slug = workspaceSlug.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, workspaceSlug: slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      if (data.user.forcePasswordChange) {
        router.push(`/w/${slug}/change-password`);
        return;
      }

      document.cookie = `arag_selected_workspace=${slug}; path=/; samesite=lax`;
      router.push("/arag-bdp");
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#FFD700] font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-black" data-testid="text-gate-title">Anmeldung</h1>
            <p className="text-gray-500 text-sm mt-1">ARAG Business Development Pitch</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
              <input
                type="text"
                data-testid="bdp-input-workspace"
                value={workspaceSlug}
                onChange={e => setWorkspaceSlug(e.target.value)}
                placeholder="Workspace eingeben"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-black placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                data-testid="bdp-input-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-black placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                type="password"
                data-testid="bdp-input-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-black placeholder:text-gray-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3" data-testid="text-gate-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              data-testid="bdp-gate-login"
              disabled={loading || !workspaceSlug.trim() || !email.trim() || !password.trim()}
              className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
            >
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
        </p>
      </div>
    </div>
  );
}
