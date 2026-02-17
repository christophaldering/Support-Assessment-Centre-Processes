"use client";

import { useState } from "react";

export default function DemoRequestForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Etwas ist schiefgelaufen.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center" data-testid="container-demo-success">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-brand-navy mb-2">Vielen Dank!</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Ihre Demo-Anfrage ist bei uns eingegangen.<br />
          Wir melden uns in K&uuml;rze bei Ihnen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-5" data-testid="form-demo-request">
      <div>
        <label htmlFor="demo-name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Name *
        </label>
        <input
          id="demo-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ihr vollst&auml;ndiger Name"
          required
          data-testid="input-demo-name"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
      </div>

      <div>
        <label htmlFor="demo-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          E-Mail *
        </label>
        <input
          id="demo-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="ihre@email.de"
          required
          data-testid="input-demo-email"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
      </div>

      <div>
        <label htmlFor="demo-company" className="block text-sm font-medium text-slate-700 mb-1.5">
          Unternehmen / Organisation
        </label>
        <input
          id="demo-company"
          type="text"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="Ihr Unternehmen"
          data-testid="input-demo-company"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
        />
      </div>

      <div>
        <label htmlFor="demo-message" className="block text-sm font-medium text-slate-700 mb-1.5">
          Nachricht
        </label>
        <textarea
          id="demo-message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Wie k&ouml;nnen wir Ihnen helfen?"
          rows={3}
          data-testid="input-demo-message"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" data-testid="text-demo-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !form.name.trim() || !form.email.trim()}
        data-testid="button-submit-demo"
        className="w-full rounded-lg bg-brand-blue text-white font-semibold py-3 text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm"
      >
        {submitting ? "Wird gesendet..." : "Demo-Termin anfragen"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Kostenlos und unverbindlich. Wir melden uns innerhalb von 24 Stunden.
      </p>
    </form>
  );
}
