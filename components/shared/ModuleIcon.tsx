"use client";

type ModuleType = "interview" | "presentation" | "roleplay" | "fact_finding" | "case_study" | "other";
type SizeKey = "sm" | "md" | "lg";

interface ModuleIconProps {
  type: ModuleType;
  size?: SizeKey;
}

const SIZE_PX: Record<SizeKey, number> = { sm: 14, md: 18, lg: 24 };

const COLOR_VAR: Record<ModuleType, string> = {
  interview:    "var(--eds-type-interview)",
  presentation: "var(--eds-type-presentation)",
  roleplay:     "var(--eds-type-roleplay)",
  fact_finding: "var(--eds-type-factfinding)",
  case_study:   "var(--eds-type-casestudy)",
  other:        "var(--eds-type-other)",
};

function InterviewIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PresentationIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function RoleplayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FactFindingIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CaseStudyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function OtherIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

const ICONS: Record<ModuleType, (p: { size: number }) => JSX.Element> = {
  interview:    InterviewIcon,
  presentation: PresentationIcon,
  roleplay:     RoleplayIcon,
  fact_finding: FactFindingIcon,
  case_study:   CaseStudyIcon,
  other:        OtherIcon,
};

export function ModuleIcon({ type, size = "md" }: ModuleIconProps) {
  const px = SIZE_PX[size];
  const color = COLOR_VAR[type] ?? COLOR_VAR.other;
  const Icon = ICONS[type] ?? ICONS.other;
  return (
    <span style={{ color, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <Icon size={px} />
    </span>
  );
}
