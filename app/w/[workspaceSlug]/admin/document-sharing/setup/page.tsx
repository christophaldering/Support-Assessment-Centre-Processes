"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type FileStatus = {
  exists: boolean;
  isPlaceholder: boolean;
  hasHead: boolean;
  hasTrackingScript: boolean;
  hasDrToken: boolean;
  hasAllHooks: boolean;
  sizeBytes: number;
  ready: boolean;
  checkedAt: string;
};

const SNIPPET_OPEN_LEAVE = `<!-- Wenn ein Dokument/Abschnitt geöffnet wird: -->
<script>drTrackOpen("annual-report-2024", "Geschäftsbericht 2024");</script>

<!-- Wenn der Nutzer das Dokument verlässt: -->
<script>drTrackLeave("annual-report-2024"); // berechnet durationMs automatisch</script>`;

const SNIPPET_SEARCH = `<!-- Bei einer Suche im Datenraum: -->
document.querySelector('#search').addEventListener('input', function(e) {
  drTrackSearch(e.target.value); // Suchbegriff
});`;

const SNIPPET_FLAG = `<!-- Dokument als relevant markieren/entmarkieren: -->
drTrackFlag("annual-report-2024", true);   // markiert
drTrackFlag("annual-report-2024", false);  // entmarkiert`;

const SNIPPET_NOTE = `<!-- Notiz gespeichert: -->
drTrackNoteSave("annual-report-2024", noteText.length); // docId + Zeichenanzahl`;

const SNIPPET_SECTION_VIEW = `<!-- Für Multi-Section Datenräume — jeder Abschnitt hat seine eigene ID: -->
// Beim Wechsel zu Abschnitt "Finanzen":
drTrackOpen("section-finanzen");

// Beim Verlassen:
drTrackLeave("section-finanzen");`;

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
      {ok ? "✅" : "⚠️"}
    </span>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div style={S.statusRow}>
      <CheckIcon ok={ok} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: ok ? "#15803d" : "#92400e" }}>{label}</div>
        {detail && <div style={{ fontSize: 12, color: "#7f8da3", marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  );
}

function CodeBlock({ code, lang = "html" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={S.codeWrap}>
      <button onClick={copy} style={S.copyBtn}>{copied ? "✓ Kopiert" : "Kopieren"}</button>
      <pre style={S.pre}><code>{code}</code></pre>
    </div>
  );
}

export default function DataRoomSetupPage() {
  const params = useParams() as { workspaceSlug: string };
  const router = useRouter();
  const [status, setStatus] = useState<FileStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const loadStatus = () => {
    setLoadingStatus(true);
    fetch(`/api/w/${params.workspaceSlug}/admin/document-sharing/file-status`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStatus(d); })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => { loadStatus(); }, [params.workspaceSlug]);

  return (
    <div style={S.wrap}>
      <nav style={S.breadcrumb}>
        <button onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing`)} style={S.backBtn}>
          ← Externe Freigabe-Links
        </button>
      </nav>

      <header style={S.header}>
        <div style={S.eyebrow}>ConVia · Integrations-Anleitung</div>
        <h1 style={S.h1}>Echte HTML-Datei einrichten</h1>
        <p style={S.sub}>
          Schritt-für-Schritt-Anleitung, um die echte <code style={S.inlineCode}>ConVia_Datenraum.html</code>{" "}
          mit dem Tracking-System zu verbinden.
        </p>
      </header>

      {/* ── Datei-Status ──────────────────────────────────────────────── */}
      <section style={S.card}>
        <div style={S.cardHeaderRow}>
          <h2 style={S.h2}>Aktueller Dateistatus</h2>
          <button onClick={loadStatus} style={S.btnRefresh} data-testid="button-refresh-status">
            ↻ Aktualisieren
          </button>
        </div>

        {loadingStatus ? (
          <p style={S.muted}>Prüfe…</p>
        ) : !status ? (
          <p style={S.muted}>Status konnte nicht geladen werden.</p>
        ) : (
          <>
            <div style={S.statusGrid}>
              <StatusRow
                ok={status.exists}
                label={status.exists ? "Datei vorhanden" : "Datei fehlt"}
                detail={status.exists ? `${(status.sizeBytes / 1024).toFixed(1)} KB` : "private/convia/ConVia_Datenraum.html nicht gefunden"}
              />
              <StatusRow
                ok={!status.isPlaceholder}
                label={status.isPlaceholder ? "Noch Platzhalter" : "Kein Platzhalter-Inhalt"}
                detail={status.isPlaceholder ? "Ersetze den <body>-Inhalt durch die echte ConVia-HTML" : "✓"}
              />
              <StatusRow
                ok={status.hasHead}
                label="<head>-Tag vorhanden"
                detail={!status.hasHead ? "Zwingend erforderlich — Token-Injektion greift nur mit <head>" : "Token wird automatisch injiziert"}
              />
              <StatusRow
                ok={true}
                label={
                  status.hasTrackingScript
                    ? "Tracking-Script in Datei eingebunden"
                    : "Tracking-Script wird vom Server auto-injiziert"
                }
                detail={
                  status.hasTrackingScript
                    ? "Alle Kern-Hooks direkt in der HTML-Datei verfügbar"
                    : "app/dr/view/route.ts injiziert das Script automatisch vor </head> — kein manuelles Einbetten nötig"
                }
              />
              <StatusRow
                ok={status.hasAllHooks || !status.hasTrackingScript}
                label={status.hasAllHooks ? "Alle 5 Tracking-Hooks in Datei" : "Tracking-Hooks via Auto-Injektion verfügbar"}
                detail="drTrackOpen, drTrackLeave, drTrackSearch, drTrackFlag, drTrackNoteSave"
              />
            </div>

            <div style={{ ...S.readyBox, background: status.ready ? "#f0fdf4" : "#fffbeb", borderColor: status.ready ? "#bbf7d0" : "#fde68a" }}>
              <span style={{ fontSize: 18 }}>{status.ready ? "✅" : "⏳"}</span>
              <div>
                <div style={{ fontWeight: 700, color: status.ready ? "#15803d" : "#92400e", fontSize: 14 }}>
                  {status.ready ? "Bereit — echte Datei ist korrekt eingerichtet" : "Noch nicht bereit — Schritte unten beachten"}
                </div>
                <div style={{ fontSize: 12, color: "#7f8da3", marginTop: 2 }}>
                  Geprüft: {new Date(status.checkedAt).toLocaleTimeString("de-DE")}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Schritt 1: Datei hochladen ───────────────────────────────── */}
      <section style={S.card}>
        <div style={S.stepHeader}>
          <span style={S.stepNum}>1</span>
          <h2 style={S.h2}>Echte HTML-Datei hochladen</h2>
        </div>
        <p style={S.para}>
          Die echte <code style={S.inlineCode}>ConVia_Datenraum.html</code> muss in das Verzeichnis{" "}
          <code style={S.inlineCode}>private/convia/</code> im Replit-Projekt abgelegt werden.
        </p>
        <div style={S.infoBox}>
          <div style={S.infoTitle}>📂 Verzeichnis im Replit-Editor öffnen</div>
          <ol style={S.ol}>
            <li>Im Replit-Seitenmenü auf <strong>"Files"</strong> klicken</li>
            <li>Zum Ordner <code style={S.inlineCode}>private/convia/</code> navigieren</li>
            <li>Die aktuelle <code style={S.inlineCode}>ConVia_Datenraum.html</code> ersetzen — Datei-Upload über Rechtsklick → "Upload file" oder via Drag &amp; Drop</li>
            <li>Danach auf <strong>"↻ Aktualisieren"</strong> oben klicken und Datei-Status prüfen</li>
          </ol>
        </div>
        <div style={{ ...S.infoBox, background: "#f0f9ff", borderColor: "#bae6fd" }}>
          <div style={{ ...S.infoTitle, color: "#0369a1" }}>💡 Wichtig: <code style={S.inlineCode}>&lt;head&gt;</code>-Tag darf nicht fehlen</div>
          <p style={{ fontSize: 13, margin: 0, color: "#334155" }}>
            Der Route-Handler <code style={S.inlineCode}>app/dr/view/route.ts</code> injiziert{" "}
            <code style={S.inlineCode}>window.__DR_TOKEN</code> direkt nach dem öffnenden{" "}
            <code style={S.inlineCode}>&lt;head&gt;</code>-Tag. Hat die HTML-Datei keinen{" "}
            <code style={S.inlineCode}>&lt;head&gt;</code>, kann das Token nicht gesetzt werden und
            das Tracking funktioniert nicht.
          </p>
        </div>
      </section>

      {/* ── Schritt 2: Tracking-Script behalten ─────────────────────── */}
      <section style={S.card}>
        <div style={S.stepHeader}>
          <span style={S.stepNum}>2</span>
          <h2 style={S.h2}>Tracking-Script im &lt;head&gt; behalten</h2>
        </div>
        <p style={S.para}>
          Das Tracking-Script ist bereits im aktuellen Platzhalter-<code style={S.inlineCode}>&lt;head&gt;</code> eingebettet.
          Wenn die echte ConVia-HTML-Datei <strong>keinen eigenen Tracking-Code</strong> hat, kopiere den
          gesamten <code style={S.inlineCode}>&lt;script&gt;…&lt;/script&gt;</code>-Block aus dem
          Platzhalter in den <code style={S.inlineCode}>&lt;head&gt;</code> der echten Datei.
        </p>
        <div style={S.infoBox}>
          <div style={S.infoTitle}>📋 Tracking-Script aus dem Platzhalter kopieren</div>
          <ol style={S.ol}>
            <li>Im Replit-Editor <code style={S.inlineCode}>private/convia/ConVia_Datenraum.html</code> öffnen (Platzhalter)</li>
            <li>Den gesamten <code style={S.inlineCode}>&lt;!-- ConVia Datenraum Tracking Script --&gt;</code>-Block kopieren</li>
            <li>In den <code style={S.inlineCode}>&lt;head&gt;</code> der echten ConVia-Datei einfügen (vor dem ersten <code style={S.inlineCode}>&lt;/head&gt;</code>)</li>
          </ol>
        </div>
        <div style={{ ...S.infoBox, background: "#fefce8", borderColor: "#fde68a" }}>
          <div style={{ ...S.infoTitle, color: "#92400e" }}>⚠️ Kein Token-Injection-Script notwendig</div>
          <p style={{ fontSize: 13, margin: 0, color: "#334155" }}>
            Du musst <strong>nicht</strong> selbst <code style={S.inlineCode}>window.__DR_TOKEN</code> setzen.
            Das erledigt automatisch der Server-Handler bevor die Seite ausgeliefert wird.
            Das Tracking-Script liest den Token beim Start aus <code style={S.inlineCode}>window.__DR_TOKEN</code>.
          </p>
        </div>
      </section>

      {/* ── Schritt 3: Tracking-Hooks anbinden ──────────────────────── */}
      <section style={S.card}>
        <div style={S.stepHeader}>
          <span style={S.stepNum}>3</span>
          <h2 style={S.h2}>Tracking-Hooks in der echten HTML anbinden</h2>
        </div>
        <p style={S.para}>
          Das Tracking-Script stellt 5 globale Funktionen bereit, die der ConVia-eigene Code aufrufen soll:
        </p>

        <div style={S.hookGrid}>
          {[
            { fn: "drTrackOpen(docId, label?)", desc: "Dokument/Abschnitt wurde geöffnet" },
            { fn: "drTrackLeave(docId)", desc: "Dokument verlassen — berechnet Verweildauer automatisch" },
            { fn: "drTrackSearch(query)", desc: "Suchbegriff eingegeben" },
            { fn: "drTrackFlag(docId, flagged)", desc: "Dokument als relevant markiert oder entmarkiert" },
            { fn: "drTrackNoteSave(docId, chars?)", desc: "Notiz gespeichert" },
          ].map(({ fn, desc }) => (
            <div key={fn} style={S.hookCard}>
              <code style={S.hookFn}>{fn}</code>
              <div style={S.hookDesc}>{desc}</div>
            </div>
          ))}
        </div>

        <h3 style={S.h3}>Dokument öffnen &amp; verlassen</h3>
        <CodeBlock code={SNIPPET_OPEN_LEAVE} />

        <h3 style={S.h3}>Suche</h3>
        <CodeBlock code={SNIPPET_SEARCH} lang="js" />

        <h3 style={S.h3}>Dokument markieren</h3>
        <CodeBlock code={SNIPPET_FLAG} lang="js" />

        <h3 style={S.h3}>Notiz gespeichert</h3>
        <CodeBlock code={SNIPPET_NOTE} lang="js" />

        <h3 style={S.h3}>Multi-Section-Datenraum</h3>
        <CodeBlock code={SNIPPET_SECTION_VIEW} lang="js" />
      </section>

      {/* ── Schritt 4: Smoke-Test ────────────────────────────────────── */}
      <section style={S.card}>
        <div style={S.stepHeader}>
          <span style={S.stepNum}>4</span>
          <h2 style={S.h2}>Smoke-Test: Magic-Link öffnen → Events prüfen</h2>
        </div>
        <p style={S.para}>
          Nachdem die echte Datei hochgeladen und das Tracking eingebunden ist:
        </p>
        <ol style={S.ol}>
          <li>
            Einen Test-Link anlegen:{" "}
            <button
              onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing`)}
              style={S.linkBtn}
              data-testid="button-go-create"
            >
              → Externe Freigabe-Links öffnen
            </button>
          </li>
          <li>Den generierten Link in einem neuen Fenster/Tab öffnen</li>
          <li>Den Datenraum für ~30 Sekunden nutzen (Dokument öffnen, suchen, etc.)</li>
          <li>
            Zurück zur Auswertung:{" "}
            <button
              onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing`)}
              style={S.linkBtn}
              data-testid="button-go-eval"
            >
              → Auswertung öffnen
            </button>
          </li>
          <li>Den Test-Link anklicken → Events sollten in der Timeline sichtbar sein</li>
        </ol>

        <div style={{ ...S.infoBox, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div style={{ ...S.infoTitle, color: "#15803d" }}>✅ Erwartete Events</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {["session_start", "open", "leave", "heartbeat", "search (optional)", "session_end"].map((e) => (
              <code key={e} style={{ ...S.inlineCode, background: "#dcfce7", color: "#15803d" }}>{e}</code>
            ))}
          </div>
        </div>

        <div style={{ ...S.infoBox, background: "#fef2f2", borderColor: "#fecaca" }}>
          <div style={{ ...S.infoTitle, color: "#991b1b" }}>🔍 Keine Events? Checkliste</div>
          <ul style={S.ul}>
            <li>Browser-Konsole öffnen (<kbd>F12</kbd>) — gibt es Fehler mit <code style={S.inlineCode}>/api/dr/track</code>?</li>
            <li>Ist <code style={S.inlineCode}>window.__DR_TOKEN</code> in der Konsole gesetzt? (<code style={S.inlineCode}>console.log(window.__DR_TOKEN)</code>)</li>
            <li>Hat die HTML-Datei einen <code style={S.inlineCode}>&lt;head&gt;</code>-Tag? (→ Datei-Status oben prüfen)</li>
            <li>Ist das Tracking-Script im <code style={S.inlineCode}>&lt;head&gt;</code> vorhanden?</li>
            <li>Wurde <code style={S.inlineCode}>drTrackOpen()</code> tatsächlich aufgerufen? Test: <code style={S.inlineCode}>drTrackOpen("test-doc")</code> in der Konsole eingeben</li>
          </ul>
        </div>
      </section>

      {/* ── Schritt 5: Live-Monitoring ───────────────────────────────── */}
      <section style={S.card}>
        <div style={S.stepHeader}>
          <span style={S.stepNum}>5</span>
          <h2 style={S.h2}>Am Assessment-Tag: Live-Monitoring</h2>
        </div>
        <p style={S.para}>
          Das Admin-Dashboard zeigt aktive Sitzungen in Echtzeit (Polling alle 15s):
        </p>
        <div style={S.featureList}>
          {[
            { icon: "🟢", label: "Grüner Punkt", desc: "Kandidat ist gerade im Datenraum aktiv (Heartbeat < 60s)" },
            { icon: "📄", label: "Aktuelles Dokument", desc: "Welches Dokument/Abschnitt wird gerade gelesen" },
            { icon: "⏱", label: "Sitzungsdauer", desc: "Wie lange ist der Kandidat schon im Datenraum" },
            { icon: "📊", label: "Event-Timeline", desc: "Vollständige Chronologie pro Kandidat nach dem Assessment" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={S.featureRow}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 12, color: "#7f8da3" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push(`/w/${params.workspaceSlug}/admin/document-sharing`)}
          style={S.btnPrimary}
          data-testid="button-open-dashboard"
        >
          Zum Live-Dashboard →
        </button>
      </section>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "var(--eds-font,'Satoshi',system-ui,sans-serif)", color: "var(--eds-text,#1a2332)", display: "flex", flexDirection: "column", gap: 20 },
  breadcrumb: { marginBottom: 4 },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--eds-accent,#A6473B)", fontWeight: 600, fontSize: 14, padding: 0 },
  header: { marginBottom: 4 },
  eyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--eds-accent,#A6473B)", fontWeight: 700 },
  h1: { fontSize: 26, margin: "6px 0 4px", fontWeight: 700 },
  sub: { fontSize: 14, color: "var(--eds-text-muted,#7f8da3)", margin: 0 },
  card: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", gap: 14 },
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  h2: { fontSize: 17, fontWeight: 700, margin: 0 },
  h3: { fontSize: 14, fontWeight: 700, margin: "8px 0 4px", color: "var(--eds-text,#1a2332)" },
  stepHeader: { display: "flex", alignItems: "center", gap: 12 },
  stepNum: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--eds-accent,#A6473B)", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  muted: { fontSize: 13, color: "var(--eds-text-muted,#7f8da3)" },
  statusGrid: { display: "flex", flexDirection: "column", gap: 10 },
  statusRow: { display: "flex", alignItems: "flex-start", gap: 10 },
  readyBox: { display: "flex", alignItems: "flex-start", gap: 12, borderRadius: 10, padding: "12px 16px", border: "1px solid transparent", marginTop: 4 },
  para: { fontSize: 14, lineHeight: 1.65, color: "#334155", margin: 0 },
  infoBox: { background: "var(--eds-surface,#f8fafc)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 10, padding: "14px 18px" },
  infoTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1a2332" },
  ol: { paddingLeft: 20, margin: 0, fontSize: 13, lineHeight: 2, color: "#334155" },
  ul: { paddingLeft: 20, margin: 0, fontSize: 13, lineHeight: 2, color: "#334155" },
  inlineCode: { fontFamily: "monospace", fontSize: "0.88em", background: "#f1f5f9", borderRadius: 4, padding: "1px 5px", color: "#334155" },
  codeWrap: { position: "relative", background: "#0f172a", borderRadius: 10, overflow: "hidden" },
  pre: { margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.7, color: "#e2e8f0", overflowX: "auto" as const, fontFamily: "monospace" },
  copyBtn: { position: "absolute", top: 8, right: 10, background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 5, fontSize: 11, padding: "3px 10px", cursor: "pointer" },
  hookGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 },
  hookCard: { background: "var(--eds-surface,#f8fafc)", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 },
  hookFn: { fontFamily: "monospace", fontSize: 12, color: "#A6473B", fontWeight: 700 },
  hookDesc: { fontSize: 12, color: "#5a6a82" },
  featureList: { display: "flex", flexDirection: "column", gap: 10 },
  featureRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  btnPrimary: { alignSelf: "flex-start", background: "var(--eds-accent,#A6473B)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnRefresh: { background: "#fff", border: "1px solid var(--eds-border,#e2e8f0)", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--eds-text,#1a2332)" },
  linkBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--eds-accent,#A6473B)", fontWeight: 600, fontSize: 13, padding: 0, textDecoration: "underline" as const },
};
