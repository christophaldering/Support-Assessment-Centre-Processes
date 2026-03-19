"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface AIPanelProps {
  workspaceSlug: string;
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          background: "var(--eds-terracotta)",
          color: "#fff",
          borderRadius: "var(--eds-radius-md) var(--eds-radius-md) 2px var(--eds-radius-md)",
          padding: "8px 11px",
          maxWidth: "85%",
          fontSize: "var(--eds-text-sm)",
          lineHeight: "1.45",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function AiBubble({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "var(--eds-lagune-light)",
          border: "1px solid var(--eds-lagune)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--eds-lagune)" strokeWidth="2.5">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        </svg>
      </div>
      <div
        style={{
          background: "var(--eds-bg-sunken)",
          borderRadius: "2px var(--eds-radius-md) var(--eds-radius-md) var(--eds-radius-md)",
          padding: "8px 11px",
          maxWidth: "85%",
          fontSize: "var(--eds-text-sm)",
          lineHeight: "1.45",
          color: "var(--eds-text-primary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text || (streaming ? (
          <span
            style={{
              display: "inline-flex",
              gap: "3px",
              alignItems: "center",
              height: "14px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "var(--eds-text-tertiary)",
                  animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </span>
        ) : "")}
        {streaming && text && (
          <span
            style={{
              display: "inline-block",
              width: "2px",
              height: "13px",
              background: "var(--eds-terracotta)",
              marginLeft: "2px",
              animation: "pulse 0.8s ease-in-out infinite",
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function AIPanel({ workspaceSlug }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ich bin Ihr Diagnostik-Assistent. Wie kann ich Sie heute bei Ihrem Assessment unterstützen?",
    },
  ]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setQuery("");
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    try {
      const historyForApi = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      historyForApi.push({ role: "user", content: text });

      const resp = await fetch(`/api/w/${workspaceSlug}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                accumulated += parsed.text;
                const snapshot = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: snapshot, streaming: true } : m
                  )
                );
              }
            } catch {}
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Verbindungsfehler";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Fehler: ${errMsg}`, streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: "Chat zurückgesetzt. Wie kann ich Ihnen helfen?",
      },
    ]);
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
          padding: "11px 14px",
          borderBottom: "1px solid var(--eds-border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: isStreaming ? "var(--eds-status-green)" : "var(--eds-terracotta)",
            flexShrink: 0,
            animation: isStreaming ? "pulse 1s ease-in-out infinite" : "none",
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
        <button
          onClick={handleClear}
          title="Chat löschen"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--eds-text-tertiary)",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            borderRadius: "var(--eds-radius-sm)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} text={msg.content} />
          ) : (
            <AiBubble key={msg.id} text={msg.content} streaming={msg.streaming} />
          )
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: "1px solid var(--eds-border)",
          padding: "10px 12px",
          display: "flex",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Frage stellen…"
          data-testid="ai-panel-input"
          disabled={isStreaming}
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
        />
        <button
          type="submit"
          disabled={!query.trim() || isStreaming}
          data-testid="ai-panel-submit"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--eds-radius-md)",
            background: query.trim() && !isStreaming ? "var(--eds-terracotta)" : "var(--eds-bg-sunken)",
            border: "none",
            color: query.trim() && !isStreaming ? "#fff" : "var(--eds-text-tertiary)",
            cursor: query.trim() && !isStreaming ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background var(--eds-transition-base)",
          }}
        >
          {isStreaming ? (
            <div
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid var(--eds-border)",
                borderTop: "2px solid var(--eds-terracotta)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          )}
        </button>
      </form>
    </aside>
  );
}
