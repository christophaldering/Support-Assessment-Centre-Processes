export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", label: "Entwurf" },
  active: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Aktiv" },
  completed: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "Abgeschlossen" },
  archived: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]", label: "Archiviert" },
};

export const ALL_ROLES = ["MASTER_ADMIN", "WORKSPACE_ADMIN", "MODERATOR", "OBSERVER", "PROJECT_OFFICE", "CLIENT", "CANDIDATE"] as const;

export const ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: "Master-Administrator",
  WORKSPACE_ADMIN: "Workspace-Administrator",
  ADMIN: "Workspace-Administrator",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  PROJECT_ASSISTANT: "Projektoffice",
  CLIENT: "Auftraggeber",
  HR_CLIENT: "Auftraggeber",
  CANDIDATE: "Kandidat",
};

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview",
  interview_guide: "Interview-Leitfaden",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  behavior_simulation: "Verhaltenssimulation",
  group_discussion: "Gruppendiskussion",
  fact_finding: "Fact-Finding-Simulation",
  in_tray: "Postkorb",
  psychometric: "Psychometrischer Test",
  psychometric_test: "Psychometrischer Test",
  other: "Sonstiges",
};

export const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_LABELS);

export const TYPE_MAP_DE_TO_KEY: Record<string, string> = {
  "Fallstudie": "case_study", "Präsentation": "presentation", "Interview": "interview_guide",
  "Interview-Leitfaden": "interview_guide", "Fact-Finding": "fact_finding", "Fact-Finding-Simulation": "fact_finding",
  "Verhaltenssimulation": "behavior_simulation", "Rollenspiel": "behavior_simulation",
  "Psychometrischer Test": "psychometric_test", "Gruppenübung": "other", "Gruppendiskussion": "other",
  "interview": "interview_guide", "case_study": "case_study", "presentation": "presentation",
  "fact_finding": "fact_finding", "behavior_simulation": "behavior_simulation",
  "role_play": "behavior_simulation", "psychometric_test": "psychometric_test",
};
