"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [isForced, setIsForced] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.push(`/w/${workspaceSlug}/login`);
          return;
        }
        const data = await res.json();
        setUserName(data.name);
        setIsForced(data.forcePasswordChange);
      })
      .catch(() => router.push(`/w/${workspaceSlug}/login`));
  }, [router, workspaceSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    if (newPassword.length < 4) {
      setError("Passwort muss mindestens 4 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Ändern des Passworts.");
        return;
      }

      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.roles.includes("CANDIDATE")) {
          router.push(`/w/${workspaceSlug}/assessment`);
        } else {
          router.push(`/w/${workspaceSlug}/admin`);
        }
      }
    } catch {
      setError("Etwas ist schiefgelaufen.");
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
            <h1 className="text-2xl font-bold text-brand-navy mb-2">Passwort ändern</h1>
            {isForced && (
              <p className="text-sm text-amber-600">
                Willkommen{userName ? `, ${userName}` : ""}! Bitte ändern Sie Ihr Passwort bei der ersten Anmeldung.
              </p>
            )}
            {!isForced && (
              <p className="text-sm text-slate-500">Neues Passwort festlegen</p>
            )}
            <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-change-password">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Neues Passwort
              </label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort"
                required
                data-testid="input-new-password"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors pr-12"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Passwort bestätigen
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                data-testid="input-confirm-password"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors pr-12"
              />
            </div>

            {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

            <button
              type="submit"
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
              data-testid="button-change-password"
              className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Wird gespeichert…" : "Passwort ändern"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
