"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RequestAccessPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, message: message || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Anfrage fehlgeschlagen.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
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

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {submitted ? (
            <div className="text-center space-y-6" data-testid="text-request-submitted">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-navy">
                Zugangsanfrage gesendet
              </h1>
              <p className="text-slate-500 leading-relaxed">
                Ihre Anfrage für den Workspace <strong>{workspaceSlug}</strong> wurde
                erfolgreich gesendet. Der Administrator wird Ihre Anfrage prüfen.
              </p>
              <p className="text-sm text-slate-400">
                Sie erhalten eine Benachrichtigung, sobald Ihr Zugang genehmigt wurde.
                Anschließend können Sie sich über die Erstanmeldung registrieren.
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-brand-navy text-white font-medium px-6 py-2.5 text-sm hover:bg-brand-navy/90 transition-colors"
                data-testid="link-back-home"
              >
                Zurück zur Plattform
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-brand-navy mb-2" data-testid="text-request-title">
                  Zugang anfordern
                </h1>
                <p className="text-sm text-slate-500">
                  Workspace: <strong>{workspaceSlug}</strong>
                </p>
                <div className="h-1 w-10 bg-brand-blue mx-auto rounded-full mt-4" />
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Der Zugang zu diesem Workspace erfordert eine Genehmigung durch den Administrator.
                Bitte geben Sie Ihre Daten ein, um eine Zugangsanfrage zu senden.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-request-access">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vollständiger Name"
                    required
                    data-testid="input-request-name"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    E-Mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihre@email.de"
                    required
                    data-testid="input-request-email"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Nachricht <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Grund für die Zugangsanfrage..."
                    rows={3}
                    data-testid="input-request-message"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors resize-none"
                  />
                </div>

                {error && <p className="text-sm text-red-500" data-testid="text-request-error">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim()}
                  data-testid="button-submit-request"
                  className="w-full rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                >
                  {loading ? "Wird gesendet..." : "Zugang anfordern"}
                </button>
              </form>

              <div className="text-center mt-6 space-y-2">
                <Link
                  href={`/w/${workspaceSlug}/login`}
                  className="block text-sm text-slate-400 hover:text-brand-blue transition-colors"
                  data-testid="link-to-login"
                >
                  Bereits Zugang? Anmelden
                </Link>
                <Link href="/" className="block text-sm text-slate-400 hover:text-brand-blue transition-colors">
                  Zurück zur Plattform
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
