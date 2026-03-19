"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  group: string;
  icon?: "assessment" | "candidate" | "action" | "nav" | "setting";
}

function ResultIcon({ type }: { type?: SearchResult["icon"] }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "assessment":
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "candidate":
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
    case "action":
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case "setting":
      return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2" /></svg>;
    default:
      return <svg {...props}><path d="M9 18l6-6-6-6" /></svg>;
  }
}

const QUICK_ACTIONS = [
  { id: "qa-new-assessment", label: "Neues Assessment erstellen", href: "/admin", group: "Schnellaktionen", icon: "action" as const },
  { id: "qa-invite-observer", label: "Observer einladen", href: "/admin/users", group: "Schnellaktionen", icon: "action" as const },
  { id: "qa-new-report", label: "Gutachten erstellen", href: "/admin/gutachten", group: "Schnellaktionen", icon: "action" as const },
];

const NAV_ITEMS = [
  { id: "nav-dashboard", label: "Dashboard", href: "", group: "Navigation", icon: "nav" as const },
  { id: "nav-assessments", label: "Assessments", href: "/assessments", group: "Navigation", icon: "assessment" as const },
  { id: "nav-users", label: "People & Nutzer", href: "/users", group: "Navigation", icon: "candidate" as const },
  { id: "nav-modules", label: "Content & Module", href: "/modules", group: "Navigation", icon: "nav" as const },
  { id: "nav-analytics", label: "Analytics & Berichte", href: "/analytics", group: "Navigation", icon: "nav" as const },
  { id: "nav-gutachten", label: "Gutachten-Generator", href: "/gutachten", group: "Navigation", icon: "nav" as const },
  { id: "nav-competencies", label: "Kompetenzmanagement", href: "/competencies", group: "Navigation", icon: "nav" as const },
  { id: "nav-requirements", label: "Anforderungsanalyse", href: "/requirements", group: "Navigation", icon: "nav" as const },
  { id: "nav-exercise-lib", label: "Baustein-Bibliothek", href: "/exercise-library", group: "Navigation", icon: "nav" as const },
  { id: "nav-obs-sheets", label: "Beobachtungsbögen", href: "/observation-sheets", group: "Navigation", icon: "nav" as const },
  { id: "nav-consents", label: "Einwilligungen", href: "/consents", group: "Navigation", icon: "nav" as const },
  { id: "nav-intelligence", label: "Advanced Intelligence", href: "/intelligence", group: "Navigation", icon: "nav" as const },
  { id: "nav-brand-rules", label: "Corporate Design", href: "/brand-rules", group: "Navigation", icon: "nav" as const },
];

const SETTINGS_ITEMS = [
  { id: "set-theme", label: "Workspace-Einstellungen", href: "/theme", group: "Einstellungen", icon: "setting" as const },
  { id: "set-ai", label: "AI Governance", href: "/ai-governance", group: "Einstellungen", icon: "setting" as const },
];

function groupResults(results: SearchResult[]): { group: string; items: SearchResult[] }[] {
  const map = new Map<string, SearchResult[]>();
  results.forEach((r) => {
    if (!map.has(r.group)) map.set(r.group, []);
    map.get(r.group)!.push(r);
  });
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  workspaceSlug: string;
}

export default function CommandPalette({ open, onClose, workspaceSlug }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [searching, setSearching] = useState(false);

  const base = `/w/${workspaceSlug}/admin`;

  const buildDefaultResults = useCallback((): SearchResult[] => {
    return [
      ...QUICK_ACTIONS.map((a) => ({ ...a, href: base + a.href.replace("/admin", "") })),
      ...NAV_ITEMS.slice(0, 5).map((a) => ({ ...a, href: base + a.href })),
    ];
  }, [base]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults(buildDefaultResults());
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, buildDefaultResults]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(buildDefaultResults());
      setActiveIdx(0);
      return;
    }

    const q = query.toLowerCase();
    const navMatches = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({ ...n, href: base + n.href }));
    const settingsMatches = SETTINGS_ITEMS.filter((s) => s.label.toLowerCase().includes(q)).map((s) => ({ ...s, href: base + s.href }));
    const actionMatches = QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q)).map((a) => ({ ...a, href: base + a.href.replace("/admin", "") }));

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const resp = await fetch(`/api/w/${workspaceSlug}/search?q=${encodeURIComponent(query)}`);
        if (resp.ok) {
          const data = await resp.json();
          const dynamic: SearchResult[] = [
            ...((data.assessments ?? []).slice(0, 3).map((a: any) => ({
              id: `a-${a.id}`,
              label: a.title ?? a.name,
              sublabel: a.status,
              href: `${base}/assessments/${a.id}`,
              group: "Assessments",
              icon: "assessment" as const,
            }))),
            ...((data.candidates ?? []).slice(0, 3).map((c: any) => ({
              id: `c-${c.id}`,
              label: c.name ?? c.email,
              sublabel: c.email,
              href: `${base}/users`,
              group: "Kandidaten",
              icon: "candidate" as const,
            }))),
          ];
          setResults([...dynamic, ...actionMatches, ...navMatches, ...settingsMatches]);
        } else {
          setResults([...actionMatches, ...navMatches, ...settingsMatches]);
        }
      } catch {
        setResults([...actionMatches, ...navMatches, ...settingsMatches]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, workspaceSlug, base, buildDefaultResults]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[activeIdx]) {
        navigate(results[activeIdx]!.href);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, activeIdx, navigate, onClose]);

  if (!open) return null;

  const grouped = groupResults(results);
  let flatIdx = 0;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--eds-bg-overlay)",
          zIndex: "var(--eds-z-modal)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        role="dialog"
        aria-label="Command Palette"
        data-testid="command-palette"
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, calc(100vw - 32px))",
          background: "var(--eds-bg-surface)",
          borderRadius: "var(--eds-radius-xl)",
          boxShadow: "var(--eds-shadow-xl)",
          zIndex: "calc(var(--eds-z-modal) + 1)",
          overflow: "hidden",
          border: "1px solid var(--eds-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--eds-border)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--eds-text-tertiary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen oder Befehl eingeben…"
            data-testid="command-palette-input"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "var(--eds-text-md)",
              color: "var(--eds-text-primary)",
              background: "transparent",
              fontFamily: "var(--eds-font-sans)",
            }}
          />
          {searching && (
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid var(--eds-border)",
                borderTopColor: "var(--eds-terracotta)",
                animation: "spin 0.6s linear infinite",
              }}
            />
          )}
          <kbd
            style={{
              fontSize: "11px",
              background: "var(--eds-bg-sunken)",
              border: "1px solid var(--eds-border)",
              borderRadius: "var(--eds-radius-sm)",
              padding: "2px 6px",
              color: "var(--eds-text-tertiary)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          style={{
            overflowY: "auto",
            maxHeight: "400px",
            padding: "6px",
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--eds-text-tertiary)",
                fontSize: "var(--eds-text-sm)",
              }}
            >
              Keine Ergebnisse für „{query}"
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div
                  style={{
                    fontSize: "var(--eds-text-xs)",
                    fontWeight: 600,
                    color: "var(--eds-text-tertiary)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "8px 10px 4px",
                  }}
                >
                  {group}
                </div>
                {items.map((item) => {
                  const currentIdx = flatIdx++;
                  const isActive = currentIdx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIdx(currentIdx)}
                      data-testid={`command-result-${item.id}`}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "7px 10px",
                        borderRadius: "var(--eds-radius-md)",
                        background: isActive ? "var(--eds-bg-sunken)" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        color: isActive ? "var(--eds-text-primary)" : "var(--eds-text-secondary)",
                        transition: "background var(--eds-transition-fast)",
                        fontFamily: "var(--eds-font-sans)",
                      }}
                    >
                      <span
                        style={{
                          color: isActive ? "var(--eds-terracotta)" : "var(--eds-text-tertiary)",
                          flexShrink: 0,
                        }}
                      >
                        <ResultIcon type={item.icon} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "var(--eds-text-sm)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "var(--eds-text-xs)",
                              color: "var(--eds-text-tertiary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <kbd
                          style={{
                            fontSize: "10px",
                            background: "var(--eds-border)",
                            borderRadius: "3px",
                            padding: "1px 5px",
                            color: "var(--eds-text-tertiary)",
                            fontFamily: "inherit",
                            flexShrink: 0,
                          }}
                        >
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--eds-border)",
            padding: "6px 12px",
            display: "flex",
            gap: "12px",
          }}
        >
          {[["↑↓", "Navigieren"], ["↵", "Öffnen"], ["Esc", "Schließen"]].map(([key, label]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <kbd
                style={{
                  fontSize: "10px",
                  background: "var(--eds-bg-sunken)",
                  border: "1px solid var(--eds-border)",
                  borderRadius: "3px",
                  padding: "1px 5px",
                  color: "var(--eds-text-tertiary)",
                  fontFamily: "inherit",
                }}
              >
                {key}
              </kbd>
              <span style={{ fontSize: "var(--eds-text-xs)", color: "var(--eds-text-tertiary)" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
