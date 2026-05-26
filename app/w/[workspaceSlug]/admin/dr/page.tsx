"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type LinkEntry = {
  id: string;
  token: string;
  label: string;
  email: string | null;
  dataRoomSlug: string;
  expiresAt: string;
  multiUse: boolean;
  revoked: boolean;
  useCount: number;
  firstUsedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  _count: { events: number };
};

const BASE_URL = typeof window !== "undefined"
  ? window.location.origin
  : "https://www.diagnostic-suite.de";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function DataRoomLinksPage() {
  const params = useParams() as { workspaceSlug: string };
  const router = useRouter();

  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "",
    email: "",
    dataRoomSlug: "varexia",
    expiresAt: "",
    multiUse: true,
  });
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = () => {
    setLoading(true);
    fetch(`/api/w/${params.workspaceSlug}/admin/dr/links`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLinks(); }, [params.workspaceSlug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewUrl(null);
    if (!form.label || !form.dataRoomSlug || !form.expiresAt) {
      setError("Label, Datenraum-Slug und Ablaufdatum sind Pflichtfelder.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${params.workspaceSlug}/admin/dr/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Fehler beim Erstellen");
      setNewUrl(data.url);
      setForm({ label: "", email: "", dataRoomSlug: "varexia", expiresAt: "", multiUse: true });
      loadLinks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Diesen Link sperren? Das kann nicht rückgängig gemacht werden.")) return;
    await fetch(`/api/w/${params.workspaceSlug}/admin/dr/links`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadLinks();
  };

  const handleCopy = (token: string, id: string) => {
    const url = `${BASE_URL}/dr/${token}`;
    copyToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>ConVia · Magic-Link-Verwaltung</div>
          <h1 style={S.h1}>Datenraum-Zugänge</h1>
          <p style={S.sub}>Erstelle tokenisierte Einladungslinks für Kandidaten — kein Passwort nötig.</p>
        </div>
      </header>

      <section style={S.card}>
        <h2 style={S.h2}>Neuen Link erstellen</h2>
        <form onSubmit={handleCreate} style={S.form}>
          <div style={S.formRow}>
            <label style={S.label}>Label (Kandidatenname) *</label>
            <input
              style={S.input}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="z.B. Max Mustermann"
              data-testid="input-label"
            />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>E-Mail (optional)</label>
            <input
              style={S.input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="kandidat@beispiel.de"
              data-testid="input-email"
            />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Datenraum-Slug *</label>
            <input
              style={S.input}
              value={form.dataRoomSlug}
              onChange={(e) => setForm({ ...form, dataRoomSlug: e.target.value })}
              placeholder="varexia"
              data-testid="input-slug"
            />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Ablaufdatum *</label>
            <input
              style={S.input}
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              data-testid="input-expires"
            />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Mehrfachnutzung</label>
            <label style={S.checkLabel}>
              <input
                type="checkbox"
                checked={form.multiUse}
                onChange={(e) => setForm({ ...form, multiUse: e.target.checked })}
                data-testid="checkbox-multiuse"
              />
              <span>Link mehrfach nutzbar bis Enddatum</span>
            </label>
          </div>
          {error && <p style={S.errorMsg}>{error}</p>}
          <button type="submit" disabled={creating} style={S.btnPrimary} data-testid="button-create">
            {creating ? "Erstelle…" : "Link erstellen"}
          </button>
        </form>

        {newUrl && (
          <div style={S.successBox}>
            <div style={S.successLabel}>✓ Link erstellt — jetzt kopieren:</div>
            <div style={S.urlRow}>
              <code style={S.urlCode}>{newUrl}</code>
              <button
                onClick={() => { copyToClipboard(newUrl); }}
                style={S.btnCopy}
                data-testid="button-copy-new"
              >
                Kopieren
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={{ ...S.card, marginTop: 20 }}>
        <h2 style={S.h2}>Vorhandene Links ({links.length})</h2>
        {loading ? (
          <p style={S.empty}>Lade…</p>
        ) : links.length === 0 ? (
          <p style={S.empty}>Noch keine Links erstellt.</p>
        ) : (
          <div style={S.table}>
            <div style={S.tableHead}>
              <span>Kandidat</span>
              <span>Datenraum</span>
              <span>Läuft ab</span>
              <span>Aufrufe / Events</span>
              <span>Status</span>
              <span>Aktionen</span>
            </div>
            {links.map((l) => {
              const expired = new Date(l.expiresAt) < new Date();
              const status = l.revoked ? "Gesperrt" : expired ? "Abgelaufen" : "Aktiv";
              const statusColor = l.revoked ? "#991b1b" : expired ? "#92400e" : "#15803d";
              const statusBg = l.revoked ? "#fef2f2" : expired ? "#fffbeb" : "#f0fdf4";
              const token = links.find((x) => x.id === l.id);
              return (
                <div key={l.id} style={S.tableRow} data-testid={`row-link-${l.id}`}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.label}</div>
                    {l.email && <div style={{ fontSize: 11, color: "#7f8da3" }}>{l.email}</div>}
                  </div>
                  <div style={{ fontSize: 13 }}>{l.dataRoomSlug}</div>
                  <div style={{ fontSize: 12, color: "#5a6a82" }}>
                    {fmtDate(l.expiresAt)}
                    {l.lastUsedAt && <div style={{ fontSize: 11, color: "#94a3b8" }}>Zuletzt: {fmtDate(l.lastUsedAt)}</div>}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {l.useCount}× / {l._count.events} Events
                  </div>
                  <div>
                    <span style={{ ...S.statusPill, background: statusBg, color: statusColor }}>{status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => router.push(`/w/${params.workspaceSlug}/admin/dr/${l.id}`)}
                      style={S.btnSmall}
                      data-testid={`button-view-${l.id}`}
                    >
                      Auswertung
                    </button>
                    {!l.revoked && !expired && (
                      <button
                        onClick={() => handleCopy(l.token, l.id)}
                        style={{ ...S.btnSmall, background: copiedId === l.id ? "#f0fdf4" : undefined }}
                        data-testid={`button-copy-${l.id}`}
                      >
                        {copiedId === l.id ? "✓ Kopiert" : "Link kopieren"}
                      </button>
                    )}
                    {!l.revoked && (
                      <button
                        onClick={() => handleRevoke(l.id)}
                        style={{ ...S.btnSmall, color: "#991b1b", borderColor: "#fecaca" }}
                        data-testid={`button-revoke-${l.id}`}
                      >
                        Sperren
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,#1a2332)" },
  header: { marginBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,#A6473B)", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 0", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)", marginTop: 4 },
  card: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  h2: { fontSize: 16, fontWeight: 700, margin: "0 0 18px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  formRow: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--eds-text-muted,#5a6a82)" },
  input: { padding: "9px 12px", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 8, fontSize: 14, outline: "none", width: "100%", maxWidth: 420, boxSizing: "border-box" as const },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" },
  errorMsg: { color: "#991b1b", fontSize: 13, background: "#fef2f2", borderRadius: 8, padding: "8px 12px" },
  btnPrimary: { alignSelf: "flex-start", background: "var(--eds-accent,#A6473B)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  successBox: { marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16 },
  successLabel: { fontSize: 13, fontWeight: 600, color: "#15803d", marginBottom: 8 },
  urlRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  urlCode: { background: "#fff", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 10px", fontSize: 12, wordBreak: "break-all" as const, flex: 1 },
  btnCopy: { background: "#15803d", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const },
  empty: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)" },
  table: { display: "flex", flexDirection: "column", gap: 0 },
  tableHead: { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: 12, padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--eds-text-muted,#7f8da3)", borderBottom: "1px solid var(--eds-border,#e2e8f0)" },
  tableRow: { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: 12, padding: "12px", alignItems: "center", borderBottom: "1px solid var(--eds-border,#f1f5f9)", fontSize: 13 },
  statusPill: { fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px" },
  btnSmall: { fontSize: 12, padding: "5px 10px", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 6, background: "#fff", cursor: "pointer", color: "var(--eds-text,#1a2332)", whiteSpace: "nowrap" as const },
};
