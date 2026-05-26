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

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function DataRoomLinksIndexPage() {
  const params = useParams() as { workspaceSlug: string };
  const router = useRouter();
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/w/${params.workspaceSlug}/admin/dr/links`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.workspaceSlug]);

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>ConVia · Datenraum</div>
          <h1 style={S.h1}>Zugangslinks & Tracking</h1>
          <p style={S.sub}>Klicke auf einen Link, um die vollständige Event-Timeline einzusehen.</p>
        </div>
        <button
          onClick={() => router.push(`/w/${params.workspaceSlug}/admin/dr`)}
          style={S.btnSecondary}
          data-testid="button-manage-links"
        >
          Links verwalten →
        </button>
      </header>

      {loading ? (
        <p style={S.empty}>Lade…</p>
      ) : links.length === 0 ? (
        <p style={S.empty}>Noch keine Links erstellt.</p>
      ) : (
        <div style={S.grid}>
          {links.map((l) => {
            const expired = new Date(l.expiresAt) < new Date();
            const status = l.revoked ? "Gesperrt" : expired ? "Abgelaufen" : "Aktiv";
            const statusColor = l.revoked ? "#991b1b" : expired ? "#92400e" : "#15803d";
            const statusBg = l.revoked ? "#fef2f2" : expired ? "#fffbeb" : "#f0fdf4";
            return (
              <div
                key={l.id}
                style={S.card}
                onClick={() =>
                  router.push(`/w/${params.workspaceSlug}/admin/data-room/links/${l.id}/events`)
                }
                data-testid={`card-link-${l.id}`}
              >
                <div style={S.cardTop}>
                  <span style={S.cardLabel}>{l.label}</span>
                  <span style={{ ...S.statusPill, background: statusBg, color: statusColor }}>
                    {status}
                  </span>
                </div>
                {l.email && <div style={S.cardEmail}>{l.email}</div>}
                <div style={S.cardMeta}>
                  <span style={S.metaChip}>{l.dataRoomSlug}</span>
                  <span style={S.metaChip}>Aufrufe: {l.useCount}</span>
                  <span style={S.metaChip}>Events: {l._count.events}</span>
                </div>
                <div style={S.cardDates}>
                  <span>Läuft ab: {fmtDate(l.expiresAt)}</span>
                  {l.lastUsedAt && <span>Zuletzt: {fmtDate(l.lastUsedAt)}</span>}
                </div>
                <div style={S.cardCta}>Timeline ansehen →</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,#1a2332)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,#A6473B)", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 0", fontWeight: 700 },
  sub: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)", marginTop: 4 },
  btnSecondary: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--eds-accent,#A6473B)" },
  empty: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "box-shadow .15s, transform .1s", boxShadow: "0 1px 3px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", gap: 8 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardLabel: { fontWeight: 700, fontSize: 15 },
  statusPill: { fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" as const },
  cardEmail: { fontSize: 12, color: "var(--eds-text-muted,#7f8da3)" },
  cardMeta: { display: "flex", gap: 6, flexWrap: "wrap" },
  metaChip: { fontSize: 11, background: "var(--eds-surface,#f1f5f9)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 999, padding: "2px 8px", color: "var(--eds-text-muted,#5a6a82)" },
  cardDates: { fontSize: 11, color: "var(--eds-text-muted,#94a3b8)", display: "flex", flexDirection: "column", gap: 2 },
  cardCta: { marginTop: 4, fontSize: 12, fontWeight: 600, color: "var(--eds-accent,#A6473B)" },
};
