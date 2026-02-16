"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceEntry() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(trimmed)}/check`);
      if (res.ok) {
        router.push(`/w/${encodeURIComponent(trimmed)}/request-access`);
      } else {
        setError("Workspace nicht gefunden. Bitte prüfen Sie den Namen.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            if (error) setError("");
          }}
          placeholder="Workspace-Name eingeben"
          className="flex-1 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors"
          data-testid="input-workspace-slug"
        />
        <button
          type="submit"
          disabled={loading || !slug.trim()}
          className="rounded-lg bg-brand-blue text-white font-medium px-5 py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shrink-0"
          data-testid="button-enter-workspace"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center" data-testid="text-workspace-error">
          {error}
        </p>
      )}
    </div>
  );
}
