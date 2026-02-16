"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontFamilyHeading: string;
}

interface Workspace {
  id: string;
  slug: string;
  name: string;
  status: string;
  dataResidency: string;
  createdAt: string;
  theme: Theme | null;
}

export default function WorkspaceSelectorPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wsPassword, setWsPassword] = useState("");
  const [wsError, setWsError] = useState("");
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces")
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/admin/login");
            return;
          }
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || body?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setWorkspaces(data);
      })
      .catch((err) => setError(`Failed to load workspaces: ${err.message}`))
      .finally(() => setLoading(false));
  }, [router]);

  const handleWorkspaceAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setWsError("");
    setWsLoading(true);

    try {
      const res = await fetch("/api/auth/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: selectedId, password: wsPassword }),
      });

      if (!res.ok) {
        setWsError("Invalid workspace password.");
        return;
      }

      const { slug } = await res.json();
      router.push(`/w/${slug}/admin`);
    } catch {
      setWsError("Something went wrong.");
    } finally {
      setWsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            Executive Diagnostics Suite
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log out
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy mb-1">Workspace Selection</h1>
          <p className="text-sm text-slate-500">Select a workspace to manage.</p>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading workspaces…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {ws.theme && (
                    <div
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: ws.theme.primaryColor }}
                    />
                  )}
                  <div>
                    <h2 className="font-semibold text-brand-navy">{ws.name}</h2>
                    <p className="text-xs text-slate-400">/{ws.slug} · {ws.dataResidency}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ws.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {ws.status}
                </span>
              </div>

              {selectedId === ws.id ? (
                <form onSubmit={handleWorkspaceAuth} className="flex gap-2 mt-3">
                  <input
                    type="password"
                    value={wsPassword}
                    onChange={(e) => setWsPassword(e.target.value)}
                    placeholder="Workspace admin password"
                    required
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                  <button
                    type="submit"
                    disabled={wsLoading || !wsPassword.trim()}
                    className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                  >
                    {wsLoading ? "…" : "Enter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setWsPassword("");
                      setWsError("");
                    }}
                    className="rounded-lg border border-slate-200 text-slate-500 text-sm px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setSelectedId(ws.id);
                    setWsPassword("");
                    setWsError("");
                  }}
                  className="text-sm font-medium text-brand-blue hover:text-brand-blue-dark transition-colors mt-1"
                >
                  Enter workspace →
                </button>
              )}

              {selectedId === ws.id && wsError && (
                <p className="text-sm text-red-500 mt-2">{wsError}</p>
              )}
            </div>
          ))}
        </div>

        {!loading && workspaces.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No workspaces found. Run the seed script to create one.</p>
          </div>
        )}
      </main>
    </div>
  );
}
