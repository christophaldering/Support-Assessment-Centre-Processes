"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BdpGatePage() {
  const [projectKey, setProjectKey] = useState("ARAG_BDP");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectKey !== "ARAG_BDP") {
      setError("Ungültiger Projekt-Schlüssel");
      return;
    }
    router.push("/arag-bdp/login");
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#FFD700] font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-black" data-testid="text-gate-title">Projekt-Zugang</h1>
            <p className="text-gray-500 text-sm mt-1">ARAG Business Development Pitch</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projekt-Schlüssel</label>
              <input
                data-testid="input-project-key"
                type="text"
                value={projectKey}
                onChange={e => setProjectKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                data-testid="input-gate-password"
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50"
              />
            </div>

            {error && <p className="text-red-500 text-sm" data-testid="text-gate-error">{error}</p>}

            <button
              data-testid="button-gate-enter"
              type="submit"
              className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors"
            >
              Eintreten
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
