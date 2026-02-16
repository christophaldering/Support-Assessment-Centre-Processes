"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MasterAdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password.");
        return;
      }

      router.push("/admin/workspaces");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            Executive Diagnostics Platform
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-navy mb-2">Administrator Access</h1>
            <p className="text-sm text-slate-500">Enter the master admin password to continue.</p>
            <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying…" : "Continue"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-slate-400 hover:text-brand-blue transition-colors">
              ← Back to platform
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
