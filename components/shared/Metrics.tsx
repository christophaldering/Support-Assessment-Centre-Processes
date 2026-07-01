"use client";

interface MetricItem {
  value: string | number;
  label: string;
}

interface MetricsProps {
  items: MetricItem[];
}

export function Metrics({ items }: MetricsProps) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        borderTop: "1px solid var(--eds-border)",
        borderBottom: "1px solid var(--eds-border)",
        background: "var(--eds-bg-surface)",
        borderRadius: "var(--eds-radius-lg)",
        overflow: "hidden",
      }}
      data-testid="metrics-bar"
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: "var(--eds-space-5) var(--eds-space-6)",
            borderRight: i < items.length - 1 ? "1px solid var(--eds-border)" : "none",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--eds-serif)",
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-.02em",
              color: "var(--eds-text-primary)",
              lineHeight: 1,
              margin: 0,
            }}
            data-testid={`metric-value-${i}`}
          >
            {item.value}
          </p>
          <p
            style={{
              fontFamily: "var(--eds-font-sans)",
              fontSize: "var(--eds-text-sm)",
              color: "var(--eds-text-tertiary)",
              marginTop: "var(--eds-space-1)",
            }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
