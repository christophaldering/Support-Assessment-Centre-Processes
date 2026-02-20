export interface ModuleFlag {
  id: string;
  released: boolean;
  label: string;
}

export const MODULE_REGISTRY: Record<string, { label: string; defaultReleased: boolean }> = {
  users: { label: "Benutzerverwaltung", defaultReleased: true },
  assessments: { label: "Assessments", defaultReleased: true },
  competencies: { label: "Kompetenzmanagement", defaultReleased: false },
  requirements: { label: "Anforderungsanalyse", defaultReleased: false },
  exercise_library: { label: "Baustein-Bibliothek", defaultReleased: false },
  modules: { label: "Modul-Designer", defaultReleased: false },
  case_studio: { label: "Case-Studio", defaultReleased: false },
  observation_sheets: { label: "Beobachtungsbogen-Tool", defaultReleased: false },
  analytics: { label: "Analytics & Berichte", defaultReleased: false },
  brand_rules: { label: "Corporate Design", defaultReleased: false },
  intelligence: { label: "Advanced Intelligence", defaultReleased: false },
  audio: { label: "Audio & Transkription", defaultReleased: false },
  consents: { label: "Consent-Management", defaultReleased: false },
  theme: { label: "Theming", defaultReleased: false },
  reports: { label: "Reports", defaultReleased: false },
};

export const NAV_MODULE_MAP: Record<string, string> = {
  competencies: "competencies",
  requirements: "requirements",
  "exercise-library": "exercise_library",
  modules: "modules",
  "case-study-builder": "case_studio",
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
