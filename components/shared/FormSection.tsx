"use client";

import { ReactNode } from "react";
import { Card } from "./Card";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card variant="secondary">
      {(title || description) && (
        <div style={{ marginBottom: "var(--eds-space-4)" }}>
          {title && (
            <h3
              style={{
                fontSize: "var(--eds-text-md)",
                fontWeight: 600,
                color: "var(--eds-text-primary)",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              style={{
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-secondary)",
                margin: "var(--eds-space-1) 0 0",
                lineHeight: "1.5",
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
