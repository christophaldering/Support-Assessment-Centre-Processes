"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DREvent = {
  id: string;
  type: string;
  payload: string | null;
  durationMs: number | null;
  seq: number | null;
  clientTs: string | null;
  createdAt: string;
};

type LinkMeta = {
  id: string;
  label: string;
  email: string | null;
  dataRoomSlug: string;
  expiresAt: string;
  useCount: number;
  revoked: boolean;
  firstUsedAt: string | null;
  lastUsedAt: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  session_start: "Sitzung gestartet",
  session_end: "Sitzung beendet",
  session_complete: "✓ Bearbeitung beendet",
  session_resume: "↩ Weiter bearbeitet",
  open: "Dokument geöffnet",
  leave: "Dokument verlassen",
  search: "Suche",
  flag: "Als relevant markiert",
  unflag: "Markierung entfernt",
  note_save: "Notiz gespeichert",
  heartbeat: "aktiv",
};

const TYPE_COLOR: Record<string, string> = {
  open: "var(--eds-lagune)",
  search: "var(--eds-status-amber)",
  flag: "var(--eds-terracotta)",
  note_save: "var(--eds-status-blue)",
  session_start: "#5a7a52",  // no-eds-token: custom activity-green
  session_end: "#5a7a52",  // no-eds-token: custom activity-green
  session_complete: "#2f7a4a",  // no-eds-token: custom dark-green
  session_resume: "var(--eds-text-tertiary)",
  leave: "var(--eds-text-tertiary)",
};

function fmtDur(ms: number | null) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE");
}

export default function DataRoomEvaluationPage() {
  const params = useParams() as { workspaceSlug: string; linkId: string };
  const router = useRouter();
  const [events, setEvents] = useState<DREvent[]>([]);
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/links/${params.linkId}/events`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setMeta(d.link || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.workspaceSlug, params.linkId]);

  const docStats = useMemo(() => {
    const map: Record<string, { opens: number; totalMs: number; flagged: boolean }> = {};
    for (const e of events) {
      if (e.type === "open") {
        map[e.payload || "?"] = map[e.payload || "?"] || { opens: 0, totalMs: 0, flagged: false };
        map[e.payload || "?"].opens++;
      }
      if (e.type === "leave" && e.durationMs) {
        const k = e.payload || "?";
        map[k] = map[k] || { opens: 0, totalMs: 0, flagged: false };
        map[k].totalMs = Math.max(map[k].totalMs, e.durationMs);
      }
      if (e.type === "flag") {
        const k = e.payload || "?";
        map[k] = map[k] || { opens: 0, totalMs: 0, flagged: false };
        map[k].flagged = true;
      }
    }
    return Object.entries(map).sort((a, b) => b[1].totalMs - a[1].totalMs);
  }, [events]);

  const searches = useMemo(
    () => events.filter((e) => e.type === "search").map((e) => e.payload).filter(Boolean),
    [events]
  );
  const notes = useMemo(
    () => events.filter((e) => e.type === "note_save"),
    [events]
  );

  if (loading) {
    return (
      <div style={S.wrap}>
        <p style={{ color: "var(--eds-text-muted,var(--eds-text-tertiary))" }}>Lade Auswertung…</p>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <nav style={S.breadcrumb}>
        <button onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing`)} style={S.backBtn}>
          ← Alle Links
        </button>
      </nav>

      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>ConVia · Datenraum-Auswertung</div>
          <h1 style={S.h1}>{meta?.label || "Kandidat:in"}</h1>
          {meta?.email && <div style={S.sub}>{meta.email}</div>}
          {meta && (
            <div style={S.metaRow}>
              <span style={S.metaBadge}>{meta.dataRoomSlug}</span>
              <span style={{ ...S.metaBadge, background: meta.revoked ? "var(--eds-status-red-bg)" : "var(--eds-status-green-bg)", color: meta.revoked ? "var(--eds-status-red)" : "var(--eds-status-green)", border: `1px solid ${meta.revoked ? "var(--eds-status-red-bg)" : "var(--eds-status-green-bg)"}` }}>
                {meta.revoked ? "Widerrufen" : "Aktiv"}
              </span>
              <span style={S.metaText}>Läuft ab: {fmtDate(meta.expiresAt)}</span>
              <span style={S.metaText}>Aufrufe: {meta.useCount}</span>
              {meta.firstUsedAt && <span style={S.metaText}>Erstmalig: {fmtDate(meta.firstUsedAt)}</span>}
            </div>
          )}
        </div>
        <div style={S.kpis}>
          <Kpi n={docStats.length} l="Dokumente" />
          <Kpi n={searches.length} l="Suchanfragen" />
          <Kpi n={notes.length} l="Notizen" />
          <Kpi n={docStats.filter(([, v]) => v.flagged).length} l="Markiert" />
        </div>
      </header>

      <div style={S.grid}>
        <section style={S.card}>
          <h2 style={S.h2}>Dokumente nach Verweildauer</h2>
          {docStats.length === 0 && <p style={S.empty}>Keine Dokumentaufrufe erfasst.</p>}
          {docStats.map(([doc, v]) => {
            const max = docStats[0]?.[1].totalMs || 1;
            return (
              <div key={doc} style={S.barRow}>
                <div style={S.barLabel}>
                  <span>{v.flagged && <span style={S.star}>★ </span>}{doc}</span>
                  <span style={S.barMeta}>{v.opens}× · {fmtDur(v.totalMs)}</span>
                </div>
                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: `${(v.totalMs / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <section style={S.card}>
          <h2 style={S.h2}>Suchbegriffe (chronologisch)</h2>
          {searches.length === 0 && <p style={S.empty}>Keine Suchanfragen.</p>}
          <div style={S.chips}>
            {searches.map((q, i) => (
              <span key={i} style={S.chip}>{q}</span>
            ))}
          </div>
        </section>

        <section style={{ ...S.card, gridColumn: "1 / -1" }}>
          <h2 style={S.h2}>Notizen des Kandidaten</h2>
          {notes.length === 0 && <p style={S.empty}>Keine Notizen gespeichert.</p>}
          {notes.map((n) => {
            let parsed: { doc?: string; text?: string } = {};
            try { parsed = JSON.parse(n.payload || "{}"); } catch {}
            return (
              <div key={n.id} style={S.note}>
                <div style={S.noteDoc}>{parsed.doc || "—"}</div>
                <div style={S.noteText}>{parsed.text || n.payload}</div>
              </div>
            );
          })}
        </section>

        <section style={{ ...S.card, gridColumn: "1 / -1" }}>
          <h2 style={S.h2}>Vollständige Timeline</h2>
          {events.filter((e) => e.type !== "heartbeat").length === 0 && (
            <p style={S.empty}>Noch keine Events aufgezeichnet.</p>
          )}
          <div style={S.timeline}>
            {events
              .filter((e) => e.type !== "heartbeat")
              .map((e) => (
                <div key={e.id} style={S.tlRow}>
                  <span style={{ ...S.tlDot, background: TYPE_COLOR[e.type] || "var(--eds-text-secondary)" }} />
                  <span style={S.tlTime}>
                    {new Date(e.clientTs || e.createdAt).toLocaleTimeString("de-DE")}
                  </span>
                  <span style={S.tlType}>{TYPE_LABEL[e.type] || e.type}</span>
                  <span style={S.tlPayload}>
                    {e.type === "note_save" ? "(Notiz)" : (e.payload || "")}
                    {e.durationMs ? ` · ${fmtDur(e.durationMs)}` : ""}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ n, l }: { n: number; l: string }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiN}>{n}</div>
      <div style={S.kpiL}>{l}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,var(--eds-text-primary))" },
  breadcrumb: { marginBottom: 20 },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--eds-accent,var(--eds-terracotta))", fontWeight: 600, fontSize: 14, padding: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--eds-border,var(--eds-border))" },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,var(--eds-terracotta))", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 4px", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,var(--eds-text-tertiary))", marginBottom: 8 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 4 },
  metaBadge: { fontSize: 11, fontWeight: 600, background: "var(--eds-surface,var(--eds-bg-sunken))", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 999, padding: "3px 10px", color: "var(--eds-text-muted,var(--eds-text-secondary))" },
  metaText: { fontSize: 12, color: "var(--eds-text-muted,var(--eds-text-tertiary))" },
  kpis: { display: "flex", gap: 14, flexWrap: "wrap" },
  kpi: { background: "var(--eds-surface,var(--eds-bg-app))", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 92 },
  kpiN: { fontSize: 24, fontWeight: 700, color: "var(--eds-accent,var(--eds-terracotta))" },
  kpiL: { fontSize: 11, color: "var(--eds-text-muted,var(--eds-text-tertiary))", marginTop: 2 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 },
  card: { background: "var(--eds-bg-surface)", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  h2: { fontSize: 15, fontWeight: 700, margin: "0 0 16px" },
  empty: { fontSize: 13, color: "var(--eds-text-muted,var(--eds-text-tertiary))" },
  barRow: { marginBottom: 12 },
  barLabel: { fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 },
  barMeta: { color: "var(--eds-text-muted,var(--eds-text-tertiary))", fontVariantNumeric: "tabular-nums" },
  barTrack: { height: 8, background: "var(--eds-surface,var(--eds-bg-sunken))", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg,var(--eds-lagune),var(--eds-lagune))", borderRadius: 4 },
  star: { color: "var(--eds-status-amber)" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { background: "var(--eds-surface,var(--eds-bg-sunken))", border: "1px solid var(--eds-border,var(--eds-border))", borderRadius: 999, padding: "5px 12px", fontSize: 13 },
  note: { borderLeft: "3px solid var(--eds-accent,var(--eds-terracotta))", padding: "8px 14px", marginBottom: 10, background: "var(--eds-surface,var(--eds-bg-app))", borderRadius: "0 8px 8px 0" },
  noteDoc: { fontSize: 11, fontWeight: 700, color: "var(--eds-accent,var(--eds-terracotta))", marginBottom: 2 },
  noteText: { fontSize: 13, whiteSpace: "pre-wrap" },
  timeline: { display: "flex", flexDirection: "column", gap: 6 },
  tlRow: { display: "grid", gridTemplateColumns: "16px 90px 160px 1fr", alignItems: "center", gap: 10, fontSize: 12.5, padding: "3px 0" },
  tlDot: { width: 9, height: 9, borderRadius: "50%" },
  tlTime: { color: "var(--eds-text-muted,var(--eds-text-tertiary))", fontVariantNumeric: "tabular-nums" },
  tlType: { fontWeight: 600 },
  tlPayload: { color: "var(--eds-text-muted,var(--eds-text-secondary))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};
