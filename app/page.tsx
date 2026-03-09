"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/app/components/PasswordInput";

export default function RootLandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simple check if already "authenticated" for this session
    const auth = sessionStorage.getItem("root_access");
    if (auth === "true") {
      router.push("/landing");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Targeted credentials
    if (email === "christoph.aldering@googlemail.com" && password === "#Sammy2024") {
      sessionStorage.setItem("root_access", "true");
      router.push("/landing");
    } else {
      setError("Ungültige Anmeldedaten.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-bold font-serif mb-2 tracking-tight">Executive Diagnostics</h1>
            <p className="text-slate-400 text-sm">Bitte melden Sie sich an, um fortzufahren.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="ihre@email.de"
                data-testid="input-root-email"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Passwort</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Passwort eingeben"
                data-testid="input-root-password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-medium animate-pulse" data-testid="text-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              data-testid="button-root-login"
            >
              {loading ? "Wird geprüft..." : "Anmelden"}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-[0.2em]">
          Protected Access &middot; Executive Diagnostics Platform
        </p>
      </div>
    </div>
  );
}
