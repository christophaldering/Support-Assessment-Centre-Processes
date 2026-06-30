export interface ModuleFlag {
  id: string;
  released: boolean;
  label: string;
}

export const MODULE_REGISTRY: Record<string, { label: string; defaultReleased: boolean }> = {
  users: { label: "Benutzerverwaltung", defaultReleased: true },
  assessments: { label: "Assessments", defaultReleased: true },
  competencies: { label: "Kompetenzmanagement", defaultReleased: true },
  requirements: { label: "Anforderungsanalyse", defaultReleased: true },
  exercise_library: { label: "Baustein-Bibliothek", defaultReleased: true },
  modules: { label: "Modul-Designer", defaultReleased: true },
  case_studio: { label: "Fallstudien-Werkstatt", defaultReleased: true },
  observation_sheets: { label: "Beobachtungsbogen-Tool", defaultReleased: true },
  analytics: { label: "Analytics & Berichte", defaultReleased: true },
  brand_rules: { label: "Corporate Design", defaultReleased: true },
  intelligence: { label: "Advanced Intelligence", defaultReleased: true },
  audio: { label: "Audio & Transkription", defaultReleased: true },
  consents: { label: "Consent-Management", defaultReleased: true },
  theme: { label: "Theming", defaultReleased: true },
  reports: { label: "Reports", defaultReleased: true },
  gutachten: { label: "Gutachten-Generator", defaultReleased: true },
  access_requests: { label: "Zugriffsanfragen", defaultReleased: true },
  ai_governance: { label: "AI-Governance", defaultReleased: true },
  prompt_library: { label: "KI-Prompts", defaultReleased: true },
  comparison: { label: "Gegenüberstellung", defaultReleased: true },
  document_sharing: { label: "Externe Dokumentenfreigabe", defaultReleased: true },
};

export const NAV_MODULE_MAP: Record<string, string> = {
  competencies: "competencies",
  requirements: "requirements",
  "exercise-library": "exercise_library",
  modules: "modules",
  "case-studio": "case_studio",
  "document-sharing": "document_sharing",
  "observation-sheets": "observation_sheets",
  analytics: "analytics",
  "brand-rules": "brand_rules",
  intelligence: "intelligence",
  audio: "audio",
  consents: "consents",
  theme: "theme",
  reports: "reports",
  users: "users",
  assessments: "assessments",
  gutachten: "gutachten",
  "access-requests": "access_requests",
  "ai-governance": "ai_governance",
  "prompt-library": "prompt_library",
};

export type FeatureFlags = Record<string, boolean>;

export function getModuleFlags(featureFlags: Record<string, boolean> | null | undefined): FeatureFlags {
  const flags: FeatureFlags = {};
  for (const [key, config] of Object.entries(MODULE_REGISTRY)) {
    flags[key] = featureFlags?.[key] ?? config.defaultReleased;
  }
  return flags;
}

export function isModuleReleased(
  moduleKey: string,
  featureFlags: Record<string, boolean> | null | undefined,
  isMasterOrAdmin: boolean
): boolean {
  if (isMasterOrAdmin) return true;
  const flags = getModuleFlags(featureFlags);
  return flags[moduleKey] ?? false;
}

export function getReleasedModuleKeys(
  featureFlags: Record<string, boolean> | null | undefined,
  isMasterOrAdmin: boolean
): string[] {
  if (isMasterOrAdmin) return Object.keys(MODULE_REGISTRY);
  const flags = getModuleFlags(featureFlags);
  return Object.keys(flags).filter((k) => flags[k]);
}

export function hrefToModuleKey(href: string): string | null {
  const segments = href.split("/admin/");
  if (segments.length < 2 || !segments[1]) return null;
  const path = segments[1].split("/")[0];
  if (!path) return null;
  return NAV_MODULE_MAP[path] ?? null;
}
