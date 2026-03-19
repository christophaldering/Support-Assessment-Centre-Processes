"use client";

import { useState } from "react";

interface InsightCard {
  id: string;
  type: "info" | "warning" | "action";
  text: string;
  action?: { label: string; href: string };
}

const MOCK_INSIGHTS: InsightCard[] = [
  {
    id: "1",
    type: "info",
    text: "Wählen Sie ein Assessment aus dem Context Panel, um KI-Insights zu erhalten.",
  },
];

function InsightCardView({ card }: { card: InsightCard }) {
  const borderColors = {
    info:    "var(--eds-lagune)",
    warning: "var(--eds-status-amber)",
    action:  "var(--eds-terracotta)",
  };

  const bgColors = {
    info:    "var(--eds-lagune-light)",
    warning: "var(--eds-status-amber-bg)",
    action:  "var(--eds-terracotta-ghost)",
  };

  return (
    <div
      style={{
        borderRadius: "var(--eds-radius-md)",
        background: bgColors[card.type],
        borderLeft: `3px solid ${borderColors[card.type]}`,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <p
        style={{
          fontSize: "var(--eds-text-sm)",
          color: "var(--eds-text-secondary)",
          lineHeight: "1.4",
          margin: 0,
        }}
      >
        {card.text}
      </p>
      {card.action && (
        <a
          href={card.action.href}
          style={{
            fontSize: "var(--eds-text-xs)",
            color: borderColors[card.type],
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          {card.action.label}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </a>
      )}
    </div>
  );
}

interface AIPanelProps {
  workspaceSlug: string;
}

export default function AIPanel({ workspaceSlug }: AIPanelProps) {
  const [query, setQuery] = useState("");
  const [insights, setInsights] = useState<InsightCard[]>(MOCK_INSIGHTS);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery("");
    setIsLoading(true);

    const userCard: InsightCard = {
      id: Date.now().toString(),
      type: "info",
      text: `Anfrage: ${userQuery}`,
    };
    setInsights((prev) => [...prev, userCard]);

    try {
      const resp = await fetch(`/api/w/${workspaceSlug}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const aiCard: InsightCard = {
          id: (Date.now() + 1).toString(),
          type: "action",
          text: data.response ?? data.message ?? "Keine Antwort erhalten.",
        };
        setInsights((prev) => [...prev, aiCard]);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      data-testid="shell-ai-panel"
      style={{
        width: "var(--eds-ai-panel-width)",
        minWidth: "var(--eds-ai-panel-width)",
        background: "var(--eds-bg-surface)",
        borderLeft: "1px solid var(--eds-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--eds-border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--eds-terracotta)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "var(--eds-text-sm)",
            fontWeight: 600,
            color: "var(--eds-text-primary)",
            flex: 1,
          }}
        >
          Diagnostik-Assistent
        </span>
        <span
          style={{
            fontSize: "var(--eds-text-xs)",
            color: "var(--eds-text-tertiary)",
            background: "var(--eds-bg-sunken)",
            borderRadius: "var(--eds-radius-full)",
            padding: "2px 6px",
          }}
        >
          KI
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {insights.map((card) => (
          <InsightCardView key={card.id} card={card} />
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 0",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--eds-terracotta)",
                animation: "pulse 0.8s ease-in-out infinite",
              }}
            />
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--eds-terracotta)",
                animation: "pulse 0.8s ease-in-out 0.15s infinite",
              }}
            />
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--eds-terracotta)",
                animation: "pulse 0.8s ease-in-out 0.3s infinite",
              }}
            />
          </div>
        )}
      </div>

      <form
        onSubmit={handleQuery}
        style={{
          borderTop: "1px solid var(--eds-border)",
          padding: "10px 12px",
          display: "flex",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Frage stellen…"
          data-testid="ai-panel-input"
          style={{
            flex: 1,
            fontSize: "var(--eds-text-sm)",
            color: "var(--eds-text-primary)",
            background: "var(--eds-bg-sunken)",
            border: "1px solid var(--eds-border)",
            borderRadius: "var(--eds-radius-md)",
            padding: "6px 10px",
            outline: "none",
            fontFamily: "var(--eds-font-sans)",
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          data-testid="ai-panel-submit"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--eds-radius-md)",
            background: query.trim() ? "var(--eds-terracotta)" : "var(--eds-bg-sunken)",
            border: "none",
            color: query.trim() ? "#fff" : "var(--eds-text-tertiary)",
            cursor: query.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background var(--eds-transition-base)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
