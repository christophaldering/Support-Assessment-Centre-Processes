"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Loading chunk") ||
      msg.includes("ChunkLoadError") ||
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("loading CSS chunk");

    if (isChunkError) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "#0f172a",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            fontSize: 24,
            fontWeight: 700,
            color: "#dc2626",
          }}
        >
          !
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Fehler beim Laden
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          Diese Seite konnte nicht geladen werden.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            marginRight: "0.5rem",
          }}
        >
          Seite neu laden
        </button>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "#fff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
