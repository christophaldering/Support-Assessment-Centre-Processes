"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Workspace {
  slug: string;
  name: string;
}

export default function BdpGatePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("arag");
  const [loading, setLoading] = useState(true);
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
        }
      } catch {}
      setCheckingSession(false);
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const res = await fetch("/api/arag-bdp/workspaces");
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);
          if (data.length > 0 && !data.find((w: Workspace) => w.slug === "arag")) {
            setSelectedSlug(data[0].slug);
          }
        }
      } catch {}
      setLoading(false);
    }
    loadWorkspaces();
  }, []);

  const handleContinue = () => {
    document.cookie = `arag_selected_workspace=${selectedSlug}; path=/; samesite=lax`;
    router.push(`/w/${selectedSlug}/login`);
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
            <h1 className="text-2xl font-bold text-black" data-testid="text-gate-title">Projekt-Zugang</h1>
            <p className="text-gray-500 text-sm mt-1">ARAG Business Development Pitch</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace auswählen</label>
              <select
                data-testid="bdp-workspace-select"
                value={selectedSlug}
                onChange={e => setSelectedSlug(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-black"
              >
                {loading ? (
                  <option>Laden...</option>
                ) : (
                  workspaces.map(w => (
                    <option key={w.slug} value={w.slug}>{w.name}</option>
                  ))
                )}
              </select>
            </div>

            <button
              data-testid="bdp-gate-continue"
              onClick={handleContinue}
              disabled={loading || !selectedSlug}
              className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
            >
              Weiter
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
        </p>
      </div>
    </div>
  );
}
