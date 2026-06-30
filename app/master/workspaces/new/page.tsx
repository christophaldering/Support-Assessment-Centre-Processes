"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_OPTIONS = [
  { value: "WORKSPACE_ADMIN", label: "Workspace-Administrator" },
  { value: "ADMIN",           label: "Workspace-Administrator (Legacy)" },
  { value: "MODERATOR",       label: "Moderator" },
  { value: "OBSERVER",        label: "Beobachter" },
  { value: "PROJECT_OFFICE",  label: "Projektoffice" },
  { value: "CLIENT",          label: "Auftraggeber" },
];

interface PersonRow {
  id: number;
  email: string;
  name: string;
  role: string;
  password: string;
}

interface PersonResult {
  email: string;
  name: string;
  ok: boolean;
  error?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

let nextId = 1;
function mkId() { return nextId++; }

export default function NewWorkspacePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces", { credentials: "include" })
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else router.replace("/");
      })
      .catch(() => router.replace("/"))
      .finally(() => setChecking(false));
  }, [router]);

  // ── Formular-State ──────────────────────────────────────────────────────────
  const [wsName, setWsName]           = useState("");
  const [slug, setSlug]               = useState("");
  const [slugManual, setSlugManual]   = useState(false);
  const [adminPw, setAdminPw]         = useState("");
  const [dataRes, setDataRes]         = useState("EU");
  const [persons, setPersons]         = useState<PersonRow[]>([
    { id: mkId(), email: "", name: "", role: "WORKSPACE_ADMIN", password: "" },
  ]);

  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [results, setResults]         = useState<PersonResult[]>([]);

  // Auto-slug from name unless manually edited
  useEffect(() => {
    if (!slugManual && wsName) {
      setSlug(slugify(wsName));
    }
  }, [wsName, slugManual]);

  const addPerson = () =>
    setPersons((p) => [...p, { id: mkId(), email: "", name: "", role: "MODERATOR", password: "" }]);

  const removePerson = (id: number) =>
    setPersons((p) => p.filter((r) => r.id !== id));

  const updatePerson = useCallback((id: number, field: keyof PersonRow, value: string) => {
    setPersons((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const hasAdmin = persons.some(
    (p) => p.role === "WORKSPACE_ADMIN" || p.role === "ADMIN"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!hasAdmin) {
      setFormError("Mindestens ein Workspace-Admin (WORKSPACE_ADMIN oder ADMIN) ist erforderlich.");
      return;
    }

    setSubmitting(true);
    try {
      // a) Workspace anlegen
      const wsRes = await fetch("/api/workspaces", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName, slug, adminPassword: adminPw, dataResidency: dataRes }),
      });

      if (!wsRes.ok) {
        const err = await wsRes.json().catch(() => ({}));
        setFormError(err.error ?? `Fehler ${wsRes.status}: Workspace konnte nicht erstellt werden.`);
        return;
      }

      const newWs = await wsRes.json();
      const newSlug: string = newWs.slug ?? slug;

      // b) Personen sequenziell anlegen (kein Abbruch bei Einzelfehler)
      const personResults: PersonResult[] = [];
      for (const p of persons) {
        try {
          const r = await fetch(`/api/w/${newSlug}/users`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: p.email, name: p.name, password: p.password, roles: [p.role] }),
          });
          if (r.ok) {
            personResults.push({ email: p.email, name: p.name, ok: true });
          } else {
            const err = await r.json().catch(() => ({}));
            personResults.push({ email: p.email, name: p.name, ok: false, error: err.error ?? `Status ${r.status}` });
          }
        } catch (err: any) {
          personResults.push({ email: p.email, name: p.name, ok: false, error: err?.message ?? "Netzwerkfehler" });
        }
      }

      setResults(personResults);
      setSuccessSlug(newSlug);
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || !authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Laden...</div>
      </div>
    );
  }

  if (successSlug) {
    const ok   = results.filter((r) => r.ok);
    const fail = results.filter((r) => !r.ok);
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-brand-navy text-white border-b border-white/5">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/master" className="font-serif text-lg font-bold tracking-tight hover:text-slate-200 transition">
              Executive Diagnostics Suite
            </Link>
            <span className="text-xs text-slate-400">Master-Administration</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Workspace eingerichtet</h1>
                <p className="text-sm text-slate-500">Slug: <code className="bg-slate-100 px-1 rounded">{successSlug}</code></p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">
                {ok.length} von {results.length} Person{results.length !== 1 ? "en" : ""} erfolgreich angelegt:
              </p>
              <ul className="space-y-1">
                {ok.map((r) => (
                  <li key={r.email} className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {r.name} ({r.email})
                  </li>
                ))}
              </ul>
            </div>

            {fail.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  {fail.length} Person{fail.length !== 1 ? "en" : ""} konnte{fail.length !== 1 ? "n" : ""} nicht angelegt werden — bitte manuell unter{" "}
                  <Link href={`/w/${successSlug}/admin/users`} className="underline">
                    /w/{successSlug}/admin/users
                  </Link>{" "}
                  nachtragen:
                </p>
                <ul className="space-y-1">
                  {fail.map((r) => (
                    <li key={r.email} className="text-sm text-red-600">
                      <span className="font-medium">{r.name}</span> ({r.email}) — {r.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href={`/w/${successSlug}/admin`}
                className="px-4 py-2 rounded-lg bg-brand-navy text-white text-sm font-medium hover:opacity-90 transition"
                data-testid="link-goto-workspace"
              >
                Workspace öffnen →
              </Link>
              <Link
                href="/master"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                Zurück zur Übersicht
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-navy text-white border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/master" className="font-serif text-lg font-bold tracking-tight hover:text-slate-200 transition">
            Executive Diagnostics Suite
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Master-Administration</span>
            <Link href="/master" className="text-xs text-slate-400 hover:text-white transition">
              ← Übersicht
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy font-serif" data-testid="text-page-title">
            Neuer Workspace
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Workspace anlegen und initiale Zugänge direkt einrichten. Der Workspace ist danach sofort nutzbar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="form-new-workspace">

          {/* ── Workspace-Details ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Workspace-Details</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="ws-name">
                  Workspace-Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  required
                  placeholder="z. B. Varexia SE"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  data-testid="input-workspace-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="ws-slug">
                  Slug <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-slate-400 font-normal">(Kleinbuchstaben, Ziffern, Bindestriche, 3–50 Zeichen)</span>
                </label>
                <input
                  id="ws-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                  required
                  placeholder="varexia-se"
                  pattern="^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$"
                  title="Kleinbuchstaben, Ziffern, Bindestriche, 3–50 Zeichen, kein führender/abschließender Bindestrich"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  data-testid="input-workspace-slug"
                />
                {slug && (
                  <p className="mt-1 text-xs text-slate-400">
                    Login-URL: <span className="font-mono">/w/{slug}/login</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="ws-pw">
                  Workspace-Admin-Passwort <span className="text-red-500">*</span>
                </label>
                <input
                  id="ws-pw"
                  type="password"
                  value={adminPw}
                  onChange={(e) => setAdminPw(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mindestens 8 Zeichen"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  data-testid="input-admin-password"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Dies ist das Workspace-weite Zugangspasswort, getrennt von individuellen Nutzer-Logins.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="ws-residency">
                  Daten-Residenz
                </label>
                <select
                  id="ws-residency"
                  value={dataRes}
                  onChange={(e) => setDataRes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  data-testid="select-data-residency"
                >
                  <option value="EU">EU (Standard)</option>
                </select>
              </div>

            </div>
          </div>

          {/* ── Personen-Zugänge ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Zugang für folgende Personen</h2>
                {!hasAdmin && persons.some((p) => p.email || p.name) && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">
                    Mindestens eine Person muss die Rolle Workspace-Administrator haben.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={addPerson}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                data-testid="button-add-person"
              >
                + Person hinzufügen
              </button>
            </div>

            <div className="space-y-4" data-testid="person-rows">
              {persons.map((p, idx) => (
                <div key={p.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50" data-testid={`person-row-${idx}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Person {idx + 1}
                    </span>
                    {persons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePerson(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition"
                        data-testid={`button-remove-person-${idx}`}
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        E-Mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={p.email}
                        onChange={(e) => updatePerson(p.id, "email", e.target.value)}
                        required
                        placeholder="person@beispiel.de"
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        data-testid={`input-person-email-${idx}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePerson(p.id, "name", e.target.value)}
                        required
                        placeholder="Vorname Nachname"
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        data-testid={`input-person-name-${idx}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Rolle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={p.role}
                        onChange={(e) => updatePerson(p.id, "role", e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        data-testid={`select-person-role-${idx}`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Initiales Passwort <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={p.password}
                        onChange={(e) => updatePerson(p.id, "password", e.target.value)}
                        required
                        minLength={8}
                        placeholder="Min. 8 Zeichen"
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        data-testid={`input-person-password-${idx}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Fehler + Submit ────────────────────────────────────────── */}
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="text-form-error">
              {formError}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || !hasAdmin}
              title={!hasAdmin ? "Mindestens ein Workspace-Administrator erforderlich" : undefined}
              className="px-6 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-submit"
            >
              {submitting ? "Wird eingerichtet…" : "Workspace einrichten"}
            </button>
            <Link href="/master" className="text-sm text-slate-500 hover:text-slate-700 transition">
              Abbrechen
            </Link>
          </div>

        </form>
      </main>

      <footer className="border-t border-slate-200 py-6 mt-10">
        <p className="text-center text-xs text-slate-500">
          &copy; Christoph Aldering &middot; Private initiative &ndash; for training reasons only &ndash; no data from reality so far!
        </p>
      </footer>
    </div>
  );
}
