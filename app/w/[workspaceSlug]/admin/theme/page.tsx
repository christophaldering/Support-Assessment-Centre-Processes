"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";


const ACCENT = "hsl(14, 48%, 44%)";

const BODY_FONTS = ["Inter", "Roboto", "Open Sans", "Lato", "Source Sans Pro"];
const HEADING_FONTS = [
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Cormorant Garamond",
];

interface ThemeData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontFamilyHeading: string;
  logoUrl: string;
}

const defaultTheme: ThemeData = {
  primaryColor: "var(--eds-status-blue)",
  secondaryColor: "var(--eds-status-blue)",
  accentColor: "hsl(14, 48%, 44%)",
  backgroundColor: "var(--eds-bg-surface)",
  textColor: "var(--eds-text-primary)",
  fontFamily: "Inter",
  fontFamilyHeading: "Playfair Display",
  logoUrl: "",
};

export default function ThemeEditorPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [theme, setTheme] = useState<ThemeData>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchTheme = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/theme`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setTheme({
            primaryColor: data.primaryColor || defaultTheme.primaryColor,
            secondaryColor: data.secondaryColor || defaultTheme.secondaryColor,
            accentColor: data.accentColor || defaultTheme.accentColor,
            backgroundColor: data.backgroundColor || defaultTheme.backgroundColor,
            textColor: data.textColor || defaultTheme.textColor,
            fontFamily: data.fontFamily || defaultTheme.fontFamily,
            fontFamilyHeading: data.fontFamilyHeading || defaultTheme.fontFamilyHeading,
            logoUrl: data.logoUrl || "",
          });
        }
      }
    } catch {
      setError("Fehler beim Laden des Themes.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (res.ok) {
        setMessage("Theme erfolgreich gespeichert.");
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern.");
      }
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ThemeData, value: string) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="py-8 px-6 lg:px-10 flex items-center justify-center">
        <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
            data-testid="heading-theme-editor"
          >
            Theme Editor
          </h1>
          <p className="text-sm text-[var(--eds-text-tertiary)]">
            Workspace-Branding und visuelle Identität anpassen
          </p>
        </div>

        {message && (
          <div className="mb-4 bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-xl p-4 text-sm text-emerald-800" data-testid="text-success">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-xl p-4 text-sm text-[var(--eds-status-red)]" data-testid="text-error">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                Farben
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Primärfarbe" value={theme.primaryColor} onChange={(v) => updateField("primaryColor", v)} testId="input-primary-color" />
                <ColorField label="Sekundärfarbe" value={theme.secondaryColor} onChange={(v) => updateField("secondaryColor", v)} testId="input-secondary-color" />
                <ColorField label="Akzentfarbe" value={theme.accentColor} onChange={(v) => updateField("accentColor", v)} testId="input-accent-color" />
                <ColorField label="Hintergrundfarbe" value={theme.backgroundColor} onChange={(v) => updateField("backgroundColor", v)} testId="input-background-color" />
                <ColorField label="Textfarbe" value={theme.textColor} onChange={(v) => updateField("textColor", v)} testId="input-text-color" />
              </div>
            </div>

            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                Schriftarten
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Fließtext-Schriftart</label>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) => updateField("fontFamily", e.target.value)}
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="select-font-family"
                  >
                    {BODY_FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Überschriften-Schriftart</label>
                  <select
                    value={theme.fontFamilyHeading}
                    onChange={(e) => updateField("fontFamilyHeading", e.target.value)}
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="select-font-family-heading"
                  >
                    {HEADING_FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                Logo
              </h2>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Logo-URL</label>
                <input
                  type="url"
                  value={theme.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="input-logo-url"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg text-white text-sm font-medium px-6 py-3 transition-colors disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
              data-testid="button-save-theme"
            >
              {saving ? "Wird gespeichert…" : "Theme speichern"}
            </button>
          </div>

          <div>
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                Vorschau
              </h2>
              <div
                className="border border-[var(--eds-border)] rounded-xl overflow-hidden shadow-lg"
                data-testid="preview-panel"
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {theme.logoUrl ? (
                    <img src={theme.logoUrl} alt="Logo" className="h-6 object-contain" />
                  ) : (
                    <span
                      className="text-sm font-bold text-white"
                      style={{ fontFamily: `'${theme.fontFamilyHeading}', serif` }}
                    >
                      Workspace Name
                    </span>
                  )}
                  <div className="flex gap-2">
                    <span className="text-xs text-white/70">Navigation</span>
                    <span className="text-xs text-white/70">Menü</span>
                  </div>
                </div>

                <div
                  className="p-6 space-y-4"
                  style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
                >
                  <h3
                    className="text-xl font-bold"
                    style={{
                      fontFamily: `'${theme.fontFamilyHeading}', serif`,
                      color: theme.primaryColor,
                    }}
                  >
                    Überschrift Beispiel
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: `'${theme.fontFamily}', sans-serif` }}
                  >
                    Dies ist ein Beispieltext, der zeigt, wie der Fließtext mit der
                    ausgewählten Schriftart und Textfarbe aussehen wird. Die Gestaltung
                    passt sich automatisch an.
                  </p>

                  <div className="flex gap-3">
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Primär-Button
                    </button>
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: theme.secondaryColor }}
                    >
                      Sekundär-Button
                    </button>
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      Akzent-Button
                    </button>
                  </div>

                  <div
                    className="border rounded-lg p-4 mt-4"
                    style={{ borderColor: `${theme.primaryColor}30` }}
                  >
                    <h4
                      className="text-base font-semibold mb-2"
                      style={{
                        fontFamily: `'${theme.fontFamilyHeading}', serif`,
                        color: theme.secondaryColor,
                      }}
                    >
                      Karten-Überschrift
                    </h4>
                    <p
                      className="text-sm opacity-70"
                      style={{ fontFamily: `'${theme.fontFamily}', sans-serif` }}
                    >
                      Ein Beispiel für eine Karten-Komponente mit den ausgewählten
                      Farben und Schriftarten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
// no-eds-token: color-picker-default — value prop für <input type="color">, var() inkompatibel
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-[var(--eds-border)] cursor-pointer p-0.5"
          data-testid={`${testId}-picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
          data-testid={testId}
        />
      </div>
    </div>
  );
}
