"use client";

interface SegmentItem {
  key: string;
  label: string;
}

interface SegmentsProps {
  items: SegmentItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Segments({ items, active, onChange }: SegmentsProps) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--eds-border)",
        gap: 0,
      }}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            data-testid={`segment-${item.key}`}
            onClick={() => onChange(item.key)}
            style={{
              padding: "10px 18px",
              fontSize: "var(--eds-text-md)",
              fontWeight: isActive ? 600 : 400,
              fontFamily: "var(--eds-font-sans)",
              color: isActive ? "var(--eds-text-primary)" : "var(--eds-text-secondary)",
              background: "none",
              border: "none",
              borderBottom: isActive
                ? "2px solid var(--eds-z)"
                : "2px solid transparent",
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "color var(--eds-transition-fast), border-color var(--eds-transition-fast)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-secondary)";
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
