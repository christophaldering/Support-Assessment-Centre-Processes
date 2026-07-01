"use client";

interface FacetOption {
  key: string;
  label: string;
  count?: number;
}

interface FacetGroup {
  label: string;
  options: FacetOption[];
  active?: string | null;
  onSelect?: (key: string | null) => void;
}

interface FacetsProps {
  groups: FacetGroup[];
}

export function Facets({ groups }: FacetsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--eds-space-4)",
        alignItems: "center",
      }}
      data-testid="facets"
    >
      {groups.map((group) => {
        const visibleOptions = group.options.filter(
          (o) => o.count === undefined || o.count > 0
        );
        if (visibleOptions.length === 0) return null;

        return (
          <div
            key={group.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--eds-space-2)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--eds-font-sans)",
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-tertiary)",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {group.label}
            </span>
            {visibleOptions.map((opt) => {
              const isActive = group.active === opt.key;
              return (
                <button
                  key={opt.key}
                  data-testid={`facet-${group.label}-${opt.key}`}
                  onClick={() =>
                    group.onSelect?.(isActive ? null : opt.key)
                  }
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--eds-radius-full)",
                    border: `1px solid ${isActive ? "var(--eds-z)" : "var(--eds-border)"}`,
                    background: isActive ? "var(--eds-z-ghost)" : "transparent",
                    color: isActive ? "var(--eds-text-primary)" : "var(--eds-text-secondary)",
                    fontFamily: "var(--eds-font-sans)",
                    fontSize: "var(--eds-text-sm)",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "all var(--eds-transition-fast)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: "var(--eds-text-xs)",
                        color: isActive ? "var(--eds-text-secondary)" : "var(--eds-text-tertiary)",
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
