"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, workspaceSlug }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-brand-navy mb-2">Passwort zurücksetzen</h1>
            <p className="text-sm text-slate-500">
              Workspace: <strong>{workspaceSlug}</strong>
            </p>
            <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          {submitted ? (
            <div className="text-center bg-emerald-50 border border-emerald-200 rounded-xl p-6" data-testid="text-reset-success">
              <p className="text-sm text-emerald-700 mb-2">
                Falls ein Konto mit dieser E-Mail existiert, wurde ein Zurücksetzungs-Link erstellt.
              </p>
              <p className="text-xs text-slate-500">
                (In dieser Version wird kein E-Mail versendet. Der Token wird in der Server-Konsole protokolliert.)
              </p>
              <Link
                href={`/w/${workspaceSlug}/login`}
                className="inline-block mt-4 text-sm text-brand-blue hover:text-brand-blue-dark transition-colors"
              >
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-reset-password">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-Mail-Adresse
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

              <button
                type="submit"
                disabled={loading || !email.trim()}
                data-testid="button-reset"
                className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
              >
                {loading ? "Wird gesendet…" : "Zurücksetzungs-Link anfordern"}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link
              href={`/w/${workspaceSlug}/login`}
              className="text-sm text-slate-400 hover:text-brand-blue transition-colors"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
