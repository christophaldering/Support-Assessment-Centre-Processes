"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BdpLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/arag-bdp/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      router.push("/arag-bdp");
      router.refresh();
    } catch (err: any) {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#FFD700] font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-black" data-testid="text-login-title">Anmeldung</h1>
            <p className="text-gray-500 text-sm mt-1">ARAG BDP Evaluation Tool</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
              <input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Demo"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                data-testid="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Demo"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm" data-testid="text-login-error">{error}</p>}

            <button
              data-testid="button-login"
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
            >
              {loading ? "Anmeldung..." : "Anmelden"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-2">
              Demo-Zugang: Demo / Demo
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
        </p>
      </div>
    </div>
  );
}
