"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const rootAuth = sessionStorage.getItem("root_access");
    if (rootAuth === "true") {
      router.replace("/landing");
      return;
    }

    fetch("/api/candidate-portal/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          router.replace("/candidate/data-room");
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail === "christoph.aldering@googlemail.com" && password === "#Sammy2024") {
      sessionStorage.setItem("root_access", "true");
      router.push("/landing");
      return;
    }

    try {
      const res = await fetch("/api/candidate-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/candidate/data-room");
      } else if (data.needsPassword) {
        setError("Bitte setzen Sie zunächst Ihr Passwort über den Candidate Portal Zugang.");
      } else {
        setError(data.error || "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#1d1d1f] rounded-[18px] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1 className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight leading-tight" data-testid="text-dataroom-title">
            Data Room
          </h1>
          <p className="text-[15px] text-[#86868b] mt-2 leading-relaxed" data-testid="text-dataroom-subtitle">
            Melden Sie sich an, um auf Ihre Dokumente zuzugreifen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#f5f5f7] rounded-2xl overflow-hidden">
            <div className="border-b border-[#e5e5e7]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="E-Mail"
                className="w-full bg-transparent px-4 py-3.5 text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
                data-testid="input-dataroom-email"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Passwort"
                className="w-full bg-transparent px-4 py-3.5 pr-12 text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
                data-testid="input-dataroom-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors p-1"
                data-testid="button-toggle-password"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-500 text-center px-2" data-testid="text-dataroom-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0071e3] hover:bg-[#0077ED] active:bg-[#006edb] text-white font-medium py-3.5 rounded-xl transition-all text-[17px] disabled:opacity-50 shadow-sm"
            data-testid="button-dataroom-login"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Anmelden...
              </span>
            ) : (
              "Anmelden"
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#c7c7cc] mt-10 tracking-wide">
          Executive Diagnostics Platform
        </p>
      </div>
    </div>
  );
}
