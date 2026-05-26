// ============================================================================
//  ConVia Datenraum — Auswerte-Ansicht  (Next.js Client Component)
//  DATEI:  app/w/[workspaceSlug]/admin/dr/[linkId]/page.tsx  (o.ä.)
//  Zeigt das Suchverhalten EINES Kandidaten: Timeline, geöffnete Dokumente
//  mit Verweildauer, Suchbegriffe, Notizen.
//  >>> ANPASSEN <<< — RBAC-Schutz + Datenbeschaffung an dein Projekt.
//  Diese Datei nutzt nur React + fetch; Styling über die --eds-* Tokens
//  deiner Plattform (mit Fallback-Werten), keine externen UI-Libs nötig.
// ============================================================================
"use client";

import { useEffect, useMemo, useState } from "react";

type DREvent = {
  id: string;
  type: string;
  payload: string | null;
  durationMs: number | null;
  seq: number | null;
  clientTs: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  session_start: "Sitzung gestartet",
  session_end: "Sitzung beendet",
  open: "Dokument geöffnet",
  leave: "Dokument verlassen",
  search: "Suche",
  flag: "Als relevant markiert",
  unflag: "Markierung entfernt",
  note_save: "Notiz gespeichert",
  heartbeat: "aktiv",
};

const TYPE_COLOR: Record<string, string> = {
  open: "#3E8E8E",
  search: "#E0A458",
  flag: "#c0563f",
  note_save: "#6b8cce",
  session_start: "#5a7a52",
  session_end: "#5a7a52",
};

function fmtDur(ms: number | null) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function DataRoomEvaluation({ linkId }: { linkId: string }) {
  const [events, setEvents] = useState<DREvent[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // >>> ANPASSEN <<< — Endpunkt, der Link-Meta + Events liefert.
    fetch(`/api/w/main/admin/dr/links/${linkId}/events`)
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setMeta(d.link || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [linkId]);

  // --- Aggregationen --------------------------------------------------------
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

  if (loading) return <div style={S.wrap}><p style={{ color: "var(--eds-text-muted,#7f8da3)" }}>Lade Auswertung…</p></div>;

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>ConVia · Datenraum-Auswertung</div>
          <h1 style={S.h1}>{meta?.label || "Kandidat:in"}</h1>
          {meta?.email && <div style={S.sub}>{meta.email}</div>}
        </div>
        <div style={S.kpis}>
          <Kpi n={docStats.length} l="Dokumente geöffnet" />
          <Kpi n={searches.length} l="Suchanfragen" />
          <Kpi n={notes.length} l="Notizen" />
          <Kpi n={docStats.filter(([, v]) => v.flagged).length} l="Markiert" />
        </div>
      </header>

      <div style={S.grid}>
        {/* Dokumente nach Verweildauer */}
        <section style={S.card}>
          <h2 style={S.h2}>Dokumente nach Verweildauer</h2>
          {docStats.length === 0 && <p style={S.empty}>Keine Dokumentaufrufe erfasst.</p>}
          {docStats.map(([doc, v]) => {
            const max = docStats[0]?.[1].totalMs || 1;
            return (
              <div key={doc} style={S.barRow}>
                <div style={S.barLabel}>
                  {v.flagged && <span style={S.star}>★</span>}{doc}
                  <span style={S.barMeta}>{v.opens}× · {fmtDur(v.totalMs)}</span>
                </div>
                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: `${(v.totalMs / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Suchbegriffe */}
        <section style={S.card}>
          <h2 style={S.h2}>Suchbegriffe (chronologisch)</h2>
          {searches.length === 0 && <p style={S.empty}>Keine Suchanfragen.</p>}
          <div style={S.chips}>
            {searches.map((q, i) => (
              <span key={i} style={S.chip}>{q}</span>
            ))}
          </div>
        </section>

        {/* Notizen */}
        <section style={{ ...S.card, gridColumn: "1 / -1" }}>
          <h2 style={S.h2}>Notizen des Kandidaten</h2>
          {notes.length === 0 && <p style={S.empty}>Keine Notizen gespeichert.</p>}
          {notes.map((n) => {
            let parsed: any = {};
            try { parsed = JSON.parse(n.payload || "{}"); } catch {}
            return (
              <div key={n.id} style={S.note}>
                <div style={S.noteDoc}>{parsed.doc || "—"}</div>
                <div style={S.noteText}>{parsed.text || n.payload}</div>
              </div>
            );
          })}
        </section>

        {/* Roh-Timeline */}
        <section style={{ ...S.card, gridColumn: "1 / -1" }}>
          <h2 style={S.h2}>Vollständige Timeline</h2>
          <div style={S.timeline}>
            {events
              .filter((e) => e.type !== "heartbeat")
              .map((e) => (
                <div key={e.id} style={S.tlRow}>
                  <span style={{ ...S.tlDot, background: TYPE_COLOR[e.type] || "#5a6a82" }} />
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

// --- Inline-Styles (nutzt --eds-* Tokens mit Fallbacks) ---------------------
const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font, 'Satoshi', system-ui, sans-serif)", color: "var(--eds-text, #1a2332)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--eds-border,#e2e8f0)" },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,#A6473B)", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 0", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)", marginTop: 2 },
  kpis: { display: "flex", gap: 14, flexWrap: "wrap" },
  kpi: { background: "var(--eds-surface,#f8fafc)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 92 },
  kpiN: { fontSize: 24, fontWeight: 700, color: "var(--eds-accent,#A6473B)" },
  kpiL: { fontSize: 11, color: "var(--eds-text-muted,#7f8da3)", marginTop: 2 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 },
  card: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  h2: { fontSize: 15, fontWeight: 700, margin: "0 0 16px" },
  empty: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)" },
  barRow: { marginBottom: 12 },
  barLabel: { fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 },
  barMeta: { color: "var(--eds-text-muted,#7f8da3)", fontVariantNumeric: "tabular-nums" },
  barTrack: { height: 8, background: "var(--eds-surface,#f1f5f9)", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg,#297587,#3E8E8E)", borderRadius: 4 },
  star: { color: "#E0A458", marginRight: 6 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { background: "var(--eds-surface,#f1f5f9)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 999, padding: "5px 12px", fontSize: 13 },
  note: { borderLeft: "3px solid var(--eds-accent,#A6473B)", padding: "8px 14px", marginBottom: 10, background: "var(--eds-surface,#f8fafc)", borderRadius: "0 8px 8px 0" },
  noteDoc: { fontSize: 11, fontWeight: 700, color: "var(--eds-accent,#A6473B)", marginBottom: 2 },
  noteText: { fontSize: 13, whiteSpace: "pre-wrap" },
  timeline: { display: "flex", flexDirection: "column", gap: 6 },
  tlRow: { display: "grid", gridTemplateColumns: "16px 90px 160px 1fr", alignItems: "center", gap: 10, fontSize: 12.5, padding: "3px 0" },
  tlDot: { width: 9, height: 9, borderRadius: "50%" },
  tlTime: { color: "var(--eds-text-muted,#7f8da3)", fontVariantNumeric: "tabular-nums" },
  tlType: { fontWeight: 600 },
  tlPayload: { color: "var(--eds-text-muted,#5a6a82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};
