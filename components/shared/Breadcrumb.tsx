"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--eds-space-1)",
        marginBottom: "var(--eds-space-4)",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "var(--eds-text-sm)",
          color: "var(--eds-text-tertiary)",
        }}
      >
        Executive Diagnostics Suite
      </span>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span
            key={index}
            style={{ display: "flex", alignItems: "center", gap: "var(--eds-space-1)" }}
          >
            <span
              style={{
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-tertiary)",
                userSelect: "none",
              }}
            >
              ›
            </span>
            {isLast || !item.href ? (
              <span
                style={{
                  fontSize: "var(--eds-text-sm)",
                  color: isLast ? "var(--eds-text-secondary)" : "var(--eds-text-tertiary)",
                  fontWeight: isLast ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                style={{
                  fontSize: "var(--eds-text-sm)",
                  color: "var(--eds-text-tertiary)",
                  textDecoration: "none",
                  transition: "color var(--eds-transition-fast)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--eds-text-brand)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--eds-text-tertiary)";
                }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
