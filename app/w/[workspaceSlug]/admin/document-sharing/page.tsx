"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useEffect, useRef, useState } from "react";
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

type LiveSession = {
  linkId: string;
  label: string;
  email: string | null;
  dataRoomSlug: string;
  currentDoc: string | null;
  currentDocOpenedAt: string | null;
  sessionStartedAt: string | null;
  sessionDurationMs: number | null;
  lastHeartbeat: string;
  secondsSinceHeartbeat: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.diagnostic-suite.de";

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

function fmtDurMs(ms: number | null) {
  if (!ms || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function DataRoomLinksPage() {
  const params = useParams() as { workspaceSlug: string };
  const router = useRouter();

  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<{ id: string; msg: string } | null>(null);

  // Live sessions state
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveCheckedAt, setLiveCheckedAt] = useState<Date | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    label: "",
    email: "",
    dataRoomSlug: "korena",
    expiresAt: "",
    multiUse: true,
  });
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [newLinkId, setNewLinkId] = useState<string | null>(null);
  const [newLinkEmail, setNewLinkEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = () => {
    setLoading(true);
    fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/links`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadLive = () => {
    fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/links/live`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setLiveSessions(d.active || []);
          setLiveCheckedAt(new Date());
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLinks();
    loadLive();
    liveIntervalRef.current = setInterval(loadLive, 15_000);
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [params.workspaceSlug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewUrl(null);
    setNewLinkId(null);
    setNewLinkEmail(null);
    if (!form.label || !form.dataRoomSlug || !form.expiresAt) {
      setError("Label, Datenraum-Slug und Ablaufdatum sind Pflichtfelder.");
      return;
    }
    setCreating(true);
    const emailAtCreation = form.email;
    try {
      const res = await fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Fehler beim Erstellen");
      setNewUrl(data.url);
      setNewLinkId(data.id || null);
      setNewLinkEmail(emailAtCreation || null);
      setForm({ label: "", email: "", dataRoomSlug: "korena", expiresAt: "", multiUse: true });
      loadLinks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Diesen Link sperren? Das kann nicht rückgängig gemacht werden.")) return;
    await fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/links`, {
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

  const handleSend = async (id: string, email: string | null) => {
    setSendError(null);
    setSendingId(id);
    try {
      const res = await fetch(
        `/api/w/${params.workspaceSlug}/admin/document-sharing/links/${id}/send`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Versand fehlgeschlagen");
      setSentId(id);
      setTimeout(() => setSentId(null), 4000);
    } catch (err: unknown) {
      setSendError({ id, msg: err instanceof Error ? err.message : "Unbekannter Fehler" });
      setTimeout(() => setSendError(null), 6000);
    } finally {
      setSendingId(null);
    }
  };

  const activeLinkIds = new Set(liveSessions.map((s) => s.linkId));

  return (
    <div style={S.wrap}>
      <PageHeader
        title="Externe Freigabe-Links"
        description="Tokenisierte Einladungslinks für Kandidaten erstellen — kein Passwort nötig."
      />

      {/* ── Live-Sitzungen ───────────────────────────────────────────────── */}
      <section style={{ ...S.card, marginBottom: 20, borderColor: liveSessions.length > 0 ? "var(--eds-status-green-bg)" : "var(--eds-border,var(--eds-border))" }}>
        <div style={S.liveHeader}>
          <div style={S.liveTitleRow}>
            <span style={{ ...S.liveDot, background: liveSessions.length > 0 ? "var(--eds-status-green)" : "var(--eds-text-tertiary)", boxShadow: liveSessions.length > 0 ? "0 0 0 3px var(--eds-status-green-bg)40" : "none" }} />
            <h2 style={{ ...S.h2, margin: 0 }}>
              Aktive Nutzer jetzt
              {liveSessions.length > 0 && (
                <span style={S.liveCount}>{liveSessions.length}</span>
              )}
            </h2>
          </div>
          <span style={S.liveChecked}>
            {liveCheckedAt
              ? `Aktualisiert ${liveCheckedAt.toLocaleTimeString("de-DE")} · alle 15s`
              : "Prüfe…"}
          </span>
        </div>

        {liveSessions.length === 0 ? (
          <p style={S.empty}>Kein Kandidat ist gerade im Datenraum aktiv.</p>
        ) : (
          <div style={S.liveGrid}>
            {liveSessions.map((s) => (
              <div key={s.linkId} style={S.liveCard} data-testid={`live-session-${s.linkId}`}>
                <div style={S.liveCardTop}>
                  <span style={S.liveActiveDot} title="Aktiv — Heartbeat empfangen" />
                  <span style={S.liveName}>{s.label}</span>
                  {s.email && <span style={S.liveEmail}>{s.email}</span>}
                </div>
                <div style={S.liveDocRow}>
                  <span style={S.liveDocLabel}>Aktuelles Dokument:</span>
                  <span style={S.liveDoc}>{s.currentDoc || "—"}</span>
                </div>
                <div style={S.liveMeta}>
                  {s.sessionDurationMs && (
                    <span style={S.liveMetaChip}>⏱ {fmtDurMs(s.sessionDurationMs)}</span>
                  )}
                  <span style={S.liveMetaChip}>♡ vor {s.secondsSinceHeartbeat}s</span>
                  <span style={S.liveMetaChip}>{s.dataRoomSlug}</span>
                </div>
                <button
                  onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing/${s.linkId}`)}
                  style={S.liveViewBtn}
                  data-testid={`live-view-${s.linkId}`}
                >
                  Auswertung →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Neuen Link erstellen ─────────────────────────────────────────── */}
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
            <label style={S.label}>Datenraum *</label>
            <select
              style={S.input}
              value={form.dataRoomSlug}
              onChange={(e) => setForm({ ...form, dataRoomSlug: e.target.value })}
              data-testid="input-slug"
            >
              <option value="korena">KORENA Group eG — aestimamus Executive Audit</option>
              <option value="convia">ConVia — Vertraulicher Datenraum</option>
            </select>
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
            <div style={S.successLabel}>✓ Link erstellt — jetzt kopieren oder direkt versenden:</div>
            <div style={S.urlRow}>
              <code style={S.urlCode}>{newUrl}</code>
              <button
                onClick={() => { copyToClipboard(newUrl); }}
                style={S.btnCopy}
                data-testid="button-copy-new"
              >
                Kopieren
              </button>
              {newLinkId && newLinkEmail && (
                <button
                  onClick={() => handleSend(newLinkId, newLinkEmail)}
                  disabled={sendingId === newLinkId}
                  style={{
                    background: sentId === newLinkId ? "var(--eds-status-green)" : sendError?.id === newLinkId ? "var(--eds-status-red)" : "var(--eds-terracotta)",
                    color: "var(--eds-bg-surface)",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: sendingId === newLinkId ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: sendingId === newLinkId ? 0.7 : 1,
                  }}
                  data-testid="button-send-new"
                >
                  {sendingId === newLinkId ? "Sende…" : sentId === newLinkId ? "✓ Gesendet" : `Per Mail senden (${newLinkEmail})`}
                </button>
              )}
            </div>
            {sendError?.id === newLinkId && (
              <p style={{ fontSize: 12, color: "var(--eds-status-red)", margin: "8px 0 0" }}>{sendError.msg}</p>
            )}
          </div>
        )}
      </section>

      {/* ── Vorhandene Links ─────────────────────────────────────────────── */}
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
              const isLive = activeLinkIds.has(l.id);
              const status = l.revoked ? "Gesperrt" : expired ? "Abgelaufen" : "Aktiv";
              const statusColor = l.revoked ? "var(--eds-status-red)" : expired ? "var(--eds-status-amber)" : "var(--eds-status-green)";
              const statusBg = l.revoked ? "var(--eds-status-red-bg)" : expired ? "var(--eds-status-amber-bg)" : "var(--eds-status-green-bg)";
              return (
                <div
                  key={l.id}
                  style={{ ...S.tableRow, background: isLive ? "var(--eds-status-green-bg)" : undefined }}
                  data-testid={`row-link-${l.id}`}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      {isLive && (
                        <span
                          style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--eds-status-green)", display: "inline-block", flexShrink: 0, boxShadow: "0 0 0 2px var(--eds-status-green-bg)" }}
                          title="Gerade aktiv im Datenraum"
                          data-testid={`live-dot-${l.id}`}
                        />
                      )}
                      {l.label}
                    </div>
                    {l.email && <div style={{ fontSize: 11, color: "var(--eds-text-tertiary)" }}>{l.email}</div>}
                  </div>
                  <div style={{ fontSize: 13 }}>{l.dataRoomSlug}</div>
                  <div style={{ fontSize: 12, color: "var(--eds-text-secondary)" }}>
                    {fmtDate(l.expiresAt)}
                    {l.lastUsedAt && <div style={{ fontSize: 11, color: "var(--eds-text-tertiary)" }}>Zuletzt: {fmtDate(l.lastUsedAt)}</div>}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {l.useCount}× / {l._count.events} Events
                  </div>
                  <div>
                    <span style={{ ...S.statusPill, background: statusBg, color: statusColor }}>{status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing/${l.id}`)}
                      style={S.btnSmall}
                      data-testid={`button-view-${l.id}`}
                    >
                      Auswertung
                    </button>
                    {!l.revoked && !expired && (
                      <button
                        onClick={() => handleCopy(l.token, l.id)}
                        style={{ ...S.btnSmall, background: copiedId === l.id ? "var(--eds-status-green-bg)" : undefined }}
                        data-testid={`button-copy-${l.id}`}
                      >
                        {copiedId === l.id ? "✓ Kopiert" : "Link kopieren"}
                      </button>
                    )}
                    {!l.revoked && !expired && l.email && (
                      <button
                        onClick={() => handleSend(l.id, l.email)}
                        disabled={sendingId === l.id}
                        style={{
                          ...S.btnSmall,
                          background: sentId === l.id ? "var(--eds-status-green-bg)" : sendError?.id === l.id ? "var(--eds-status-red-bg)" : "var(--eds-terracotta-ghost)",
                          color: sentId === l.id ? "var(--eds-status-green)" : sendError?.id === l.id ? "var(--eds-status-red)" : "var(--eds-terracotta)",
                          borderColor: sentId === l.id ? "var(--eds-status-green-bg)" : sendError?.id === l.id ? "var(--eds-status-red-bg)" : "var(--eds-terracotta-ghost)",
                          fontWeight: 600,
                          opacity: sendingId === l.id ? 0.6 : 1,
                        }}
                        title={sendError?.id === l.id ? sendError.msg : `E-Mail senden an ${l.email}`}
                        data-testid={`button-send-${l.id}`}
                      >
                        {sendingId === l.id ? "Sende…" : sentId === l.id ? "✓ Gesendet" : sendError?.id === l.id ? "✗ Fehler" : "Per Mail senden"}
                      </button>
                    )}
                    {!l.revoked && (
                      <button
                        onClick={() => handleRevoke(l.id)}
                        style={{ ...S.btnSmall, color: "var(--eds-status-red)", borderColor: "var(--eds-status-red-bg)" }}
                        data-testid={`button-revoke-${l.id}`}
                      >
                        Sperren
                      </button>
                    )}
                  </div>
                  {sendError?.id === l.id && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--eds-status-red)", background: "var(--eds-status-red-bg)", borderRadius: 6, padding: "6px 10px", marginTop: 4 }}>
                      {sendError.msg}
                    </div>
                  )}
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
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,var(--eds-text-primary))" },
  header: { marginBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,var(--eds-terracotta))", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 0", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,var(--eds-text-tertiary))", marginTop: 4 },
  card: { background: "var(--eds-bg-surface)", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  h2: { fontSize: 16, fontWeight: 700, margin: "0 0 18px" },
  // Live section
  liveHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  liveTitleRow: { display: "flex", alignItems: "center", gap: 10 },
  liveDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, transition: "background .3s, box-shadow .3s" },
  liveCount: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--eds-status-green)", color: "var(--eds-bg-surface)", fontSize: 11, fontWeight: 700, borderRadius: 999, width: 20, height: 20, marginLeft: 8 },
  liveChecked: { fontSize: 11, color: "var(--eds-text-muted,var(--eds-text-tertiary))" },
  liveGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 },
  liveCard: { background: "var(--eds-status-green-bg)", border: "1px solid var(--eds-status-green-bg)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 },
  liveCardTop: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  liveActiveDot: { width: 8, height: 8, borderRadius: "50%", background: "var(--eds-status-green)", flexShrink: 0, boxShadow: "0 0 0 2px var(--eds-status-green-bg)", animation: "pulse 2s infinite" },
  liveName: { fontWeight: 700, fontSize: 14 },
  liveEmail: { fontSize: 11, color: "var(--eds-text-secondary)" },
  liveDocRow: { display: "flex", flexDirection: "column", gap: 2 },
  liveDocLabel: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#5a7a52" },  // no-eds-token: custom activity-green
  liveDoc: { fontSize: 12, color: "var(--eds-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  liveMeta: { display: "flex", gap: 6, flexWrap: "wrap" },
  liveMetaChip: { fontSize: 11, background: "var(--eds-bg-surface)", border: "1px solid var(--eds-status-green-bg)", borderRadius: 999, padding: "2px 8px", color: "var(--eds-status-green)" },
  liveViewBtn: { alignSelf: "flex-start", marginTop: 2, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--eds-accent,var(--eds-terracotta))", padding: 0 },
  // Form
  form: { display: "flex", flexDirection: "column", gap: 14 },
  formRow: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--eds-text-muted,var(--eds-text-secondary))" },
  input: { padding: "9px 12px", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 8, fontSize: 14, outline: "none", width: "100%", maxWidth: 420, boxSizing: "border-box" as const },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" },
  errorMsg: { color: "var(--eds-status-red)", fontSize: 13, background: "var(--eds-status-red-bg)", borderRadius: 8, padding: "8px 12px" },
  btnPrimary: { alignSelf: "flex-start", background: "var(--eds-accent,var(--eds-terracotta))", color: "var(--eds-bg-surface)", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  successBox: { marginTop: 16, background: "var(--eds-status-green-bg)", border: "1px solid var(--eds-status-green-bg)", borderRadius: 10, padding: 16 },
  successLabel: { fontSize: 13, fontWeight: 600, color: "var(--eds-status-green)", marginBottom: 8 },
  urlRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  urlCode: { background: "var(--eds-bg-surface)", border: "1px solid var(--eds-status-green-bg)", borderRadius: 6, padding: "6px 10px", fontSize: 12, wordBreak: "break-all" as const, flex: 1 },
  btnCopy: { background: "var(--eds-status-green)", color: "var(--eds-bg-surface)", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const },
  empty: { fontSize: 13, color: "var(--eds-text-muted,var(--eds-text-tertiary))" },
  table: { display: "flex", flexDirection: "column", gap: 0 },
  tableHead: { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: 12, padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--eds-text-muted,var(--eds-text-tertiary))", borderBottom: "1px solid var(--eds-border,var(--eds-border))" },
  tableRow: { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: 12, padding: "12px", alignItems: "center", borderBottom: "1px solid var(--eds-border,var(--eds-bg-sunken))", fontSize: 13 },
  statusPill: { fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px" },
  btnSmall: { fontSize: 12, padding: "5px 10px", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 6, background: "var(--eds-bg-surface)", cursor: "pointer", color: "var(--eds-text,var(--eds-text-primary))", whiteSpace: "nowrap" as const },
};
