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

const ALL_TYPES = ["open", "leave", "search", "flag", "note_save", "session_start", "session_end", "heartbeat"] as const;
type EventType = (typeof ALL_TYPES)[number];

const TYPE_LABEL: Record<string, string> = {
  session_start: "Sitzung Start",
  session_end: "Sitzung Ende",
  open: "Dokument geöffnet",
  leave: "Dokument verlassen",
  search: "Suche",
  flag: "Als relevant markiert",
  note_save: "Notiz gespeichert",
  heartbeat: "Heartbeat",
};

const TYPE_COLOR: Record<string, string> = {
  open: "#297587",
  search: "#E0A458",
  flag: "#A6473B",
  note_save: "#6b8cce",
  session_start: "#5a7a52",
  session_end: "#5a7a52",
  leave: "#94a3b8",
  heartbeat: "#cbd5e1",
};

function fmtDurHms(ms: number | null): string {
  if (!ms || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE");
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function EventTimelinePage() {
  const params = useParams() as { workspaceSlug: string; linkId: string };
  const router = useRouter();

  const [events, setEvents] = useState<DREvent[]>([]);
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = () => {
    fetch(`/api/w/${params.workspaceSlug}/dr/links/${params.linkId}/events`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setMeta(d.link || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [params.workspaceSlug, params.linkId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [autoRefresh, params.workspaceSlug, params.linkId]);

  const filtered = useMemo(() =>
    filter === "all" ? events : events.filter((e) => e.type === filter),
    [events, filter]
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
    return counts;
  }, [events]);

  if (loading) {
    return (
      <div style={S.wrap}>
        <p style={{ color: "var(--eds-text-muted,#7f8da3)" }}>Lade Events…</p>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <nav style={S.breadcrumb}>
        <button
          onClick={() => router.push(`/w/${params.workspaceSlug}/admin/data-room/links`)}
          style={S.backBtn}
          data-testid="button-back"
        >
          ← Alle Links
        </button>
      </nav>

      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>ConVia · Event-Timeline</div>
          <h1 style={S.h1}>{meta?.label || "Kandidat:in"}</h1>
          {meta?.email && <div style={S.sub}>{meta.email}</div>}
          {meta && (
            <div style={S.metaRow}>
              <span style={S.metaBadge}>{meta.dataRoomSlug}</span>
              <span style={{
                ...S.metaBadge,
                background: meta.revoked ? "#fef2f2" : "#f0fdf4",
                color: meta.revoked ? "#991b1b" : "#15803d",
                border: `1px solid ${meta.revoked ? "#fecaca" : "#bbf7d0"}`,
              }}>
                {meta.revoked ? "Widerrufen" : "Aktiv"}
              </span>
              <span style={S.metaText}>Aufrufe: {meta.useCount}</span>
              {meta.firstUsedAt && <span style={S.metaText}>Erstmalig: {fmtDate(meta.firstUsedAt)}</span>}
              {meta.lastUsedAt && <span style={S.metaText}>Zuletzt: {fmtDate(meta.lastUsedAt)}</span>}
            </div>
          )}
        </div>

        <div style={S.controls}>
          <button
            onClick={load}
            style={S.btnRefresh}
            data-testid="button-refresh"
          >
            ↻ Aktualisieren
          </button>
          <label style={S.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              data-testid="checkbox-auto-refresh"
            />
            <span>Live (10s)</span>
          </label>
        </div>
      </header>

      <div style={S.filterRow}>
        <span style={S.filterLabel}>Filter:</span>
        <button
          onClick={() => setFilter("all")}
          style={{ ...S.filterBtn, ...(filter === "all" ? S.filterBtnActive : {}) }}
          data-testid="filter-all"
        >
          Alle ({events.length})
        </button>
        {ALL_TYPES.filter((t) => typeCounts[t] > 0).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ ...S.filterBtn, ...(filter === t ? S.filterBtnActive : {}), borderLeftColor: TYPE_COLOR[t] }}
            data-testid={`filter-${t}`}
          >
            {TYPE_LABEL[t]} ({typeCounts[t]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>📭</div>
          <p>Keine Events für diesen Filter.</p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <div style={S.tableHead}>
            <span>#</span>
            <span>Uhrzeit</span>
            <span>Typ</span>
            <span>Payload / Details</span>
            <span>Dauer</span>
          </div>
          {filtered.map((e, i) => (
            <div key={e.id} style={S.tableRow} data-testid={`row-event-${e.id}`}>
              <span style={S.seqNum}>{e.seq ?? i + 1}</span>
              <span style={S.timeCell}>{fmtTime(e.clientTs || e.createdAt)}</span>
              <span style={S.typeCell}>
                <span
                  style={{ ...S.typeDot, background: TYPE_COLOR[e.type] || "#94a3b8" }}
                />
                {TYPE_LABEL[e.type] || e.type}
              </span>
              <span style={S.payloadCell}>
                {e.type === "note_save" ? renderNote(e.payload) : (e.payload || "—")}
              </span>
              <span style={S.durationCell}>
                {e.type === "leave" || e.type === "session_end"
                  ? <span style={{ fontFamily: "monospace", color: e.durationMs ? "#1a2332" : "#94a3b8" }}>{fmtDurHms(e.durationMs)}</span>
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderNote(payload: string | null) {
  if (!payload) return "—";
  try {
    const p = JSON.parse(payload) as { doc?: string; text?: string; chars?: number };
    const parts: string[] = [];
    if (p.doc) parts.push(`[${p.doc}]`);
    if (p.chars) parts.push(`${p.chars} Zeichen`);
    if (p.text) parts.push(String(p.text).slice(0, 80) + (p.text.length > 80 ? "…" : ""));
    return parts.join(" · ") || payload;
  } catch {
    return String(payload).slice(0, 120);
  }
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,#1a2332)" },
  breadcrumb: { marginBottom: 16 },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--eds-accent,#A6473B)", fontWeight: 600, fontSize: 14, padding: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--eds-border,#e2e8f0)" },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,#A6473B)", fontWeight: 700 },
  h1: { fontSize: 24, margin: "6px 0 4px", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 6 },
  metaBadge: { fontSize: 11, fontWeight: 600, background: "var(--eds-surface,#f1f5f9)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 999, padding: "3px 10px", color: "var(--eds-text-muted,#5a6a82)" },
  metaText: { fontSize: 12, color: "var(--eds-text-muted,#7f8da3)" },
  controls: { display: "flex", gap: 10, alignItems: "center", flexShrink: 0 },
  btnRefresh: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--eds-text,#1a2332)" },
  autoRefreshLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "var(--eds-text-muted,#5a6a82)" },
  filterRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 20 },
  filterLabel: { fontSize: 12, fontWeight: 700, color: "var(--eds-text-muted,#7f8da3)", textTransform: "uppercase", letterSpacing: ".05em" },
  filterBtn: { fontSize: 12, padding: "5px 12px", border: "1px solid var(--eds-border,#e2e8f0)", borderLeft: "3px solid transparent", borderRadius: 6, background: "#fff", cursor: "pointer", color: "var(--eds-text,#1a2332)", transition: "background .1s" },
  filterBtnActive: { background: "var(--eds-surface,#f1f5f9)", fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "48px 24px", color: "var(--eds-text-muted,#7f8da3)", fontSize: 14 },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  tableWrap: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 14, overflow: "hidden" },
  tableHead: { display: "grid", gridTemplateColumns: "44px 100px 180px 1fr 90px", gap: 8, padding: "10px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--eds-text-muted,#7f8da3)", borderBottom: "1px solid var(--eds-border,#e2e8f0)", background: "var(--eds-surface,#f8fafc)" },
  tableRow: { display: "grid", gridTemplateColumns: "44px 100px 180px 1fr 90px", gap: 8, padding: "10px 16px", fontSize: 13, borderBottom: "1px solid var(--eds-border,#f1f5f9)", alignItems: "center" },
  seqNum: { color: "var(--eds-text-muted,#cbd5e1)", fontSize: 11, fontVariantNumeric: "tabular-nums" },
  timeCell: { fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--eds-text-muted,#5a6a82)", fontFamily: "monospace" },
  typeCell: { display: "flex", alignItems: "center", gap: 7, fontWeight: 500 },
  typeDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  payloadCell: { color: "var(--eds-text,#334155)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: 12 },
  durationCell: { fontSize: 12, textAlign: "right" as const },
};
