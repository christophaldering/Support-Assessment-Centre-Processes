export const ROLES = [
  "MASTER_ADMIN",
  "WORKSPACE_ADMIN",
  "ADMIN",
  "MODERATOR",
  "OBSERVER",
  "PROJECT_OFFICE",
  "PROJECT_ASSISTANT",
  "CLIENT",
  "HR_CLIENT",
  "CANDIDATE",
] as const;

export type Role = (typeof ROLES)[number];

export const DISPLAY_ROLES = [
  "MASTER_ADMIN",
  "WORKSPACE_ADMIN",
  "MODERATOR",
  "OBSERVER",
  "PROJECT_OFFICE",
  "CLIENT",
  "CANDIDATE",
] as const;

export type DisplayRole = (typeof DISPLAY_ROLES)[number];

export function getDisplayRoles(): readonly string[] {
  return DISPLAY_ROLES;
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  MASTER_ADMIN: "Master-Administrator",
  WORKSPACE_ADMIN: "Workspace-Administrator",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  CLIENT: "Auftraggeber",
  CANDIDATE: "Kandidat",
  ADMIN: "Workspace-Administrator",
  PROJECT_ASSISTANT: "Projektoffice",
  HR_CLIENT: "Auftraggeber",
};

export const PERMISSIONS = [
  "workspace.manage",
  "users.create",
  "users.read",
  "users.update",
  "users.delete",
  "users.import",
  "assessments.create",
  "assessments.read",
  "assessments.update",
  "assessments.delete",
  "assessments.assign_candidates",
  "candidates.create",
  "candidates.read",
  "candidates.update",
  "reports.read",
  "reports.create",
  "competencies.manage",
  "requirements.manage",
  "audit.read",
  "theme.manage",
  "candidate.own_assessment",
  "exerciselibrary.upload",
  "exerciselibrary.manage",
  "brandrules.manage",
  "requirements.match_exercises",
  "advanced_intelligence.view",
  "advanced_intelligence.generate",
  "advanced_intelligence.export",
  "cross_workspace.access",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ADMIN_PERMISSIONS: Permission[] = [
  "workspace.manage",
  "users.create",
  "users.read",
  "users.update",
  "users.delete",
  "users.import",
  "assessments.create",
  "assessments.read",
  "assessments.update",
  "assessments.delete",
  "assessments.assign_candidates",
  "candidates.create",
  "candidates.read",
  "candidates.update",
  "reports.read",
  "reports.create",
  "competencies.manage",
  "requirements.manage",
  "audit.read",
  "theme.manage",
  "exerciselibrary.upload",
  "exerciselibrary.manage",
  "brandrules.manage",
  "requirements.match_exercises",
  "advanced_intelligence.view",
  "advanced_intelligence.generate",
  "advanced_intelligence.export",
];

const PROJECT_OFFICE_PERMISSIONS: Permission[] = [
  "assessments.read",
  "assessments.update",
  "candidates.create",
  "candidates.read",
  "candidates.update",
  "users.read",
  "exerciselibrary.upload",
  "exerciselibrary.manage",
];

const CLIENT_PERMISSIONS: Permission[] = [
  "assessments.read",
  "candidates.read",
  "reports.read",
  "advanced_intelligence.view",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  MASTER_ADMIN: [
    ...ADMIN_PERMISSIONS,
    "cross_workspace.access",
  ],
  WORKSPACE_ADMIN: ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MODERATOR: [
    "assessments.create",
    "assessments.read",
    "assessments.update",
    "assessments.assign_candidates",
    "candidates.create",
    "candidates.read",
    "candidates.update",
    "reports.read",
    "reports.create",
    "requirements.manage",
    "users.read",
    "exerciselibrary.manage",
    "requirements.match_exercises",
    "advanced_intelligence.view",
    "advanced_intelligence.generate",
  ],
  OBSERVER: [
    "assessments.read",
    "candidates.read",
    "reports.read",
  ],
  PROJECT_OFFICE: PROJECT_OFFICE_PERMISSIONS,
  PROJECT_ASSISTANT: PROJECT_OFFICE_PERMISSIONS,
  CLIENT: CLIENT_PERMISSIONS,
  HR_CLIENT: CLIENT_PERMISSIONS,
  CANDIDATE: [
    "candidate.own_assessment",
  ],
};

export function getPermissionsForRoles(roles: string[]): Set<Permission> {
  const perms = new Set<Permission>();
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role as Role];
    if (rolePerms) {
      for (const p of rolePerms) {
        perms.add(p);
      }
    }
  }
  return perms;
}

export function hasPermission(roles: string[], permission: Permission): boolean {
  return getPermissionsForRoles(roles).has(permission);
}

export function hasAnyPermission(roles: string[], permissions: Permission[]): boolean {
  const userPerms = getPermissionsForRoles(roles);
  return permissions.some((p) => userPerms.has(p));
}

export function hasAllPermissions(roles: string[], permissions: Permission[]): boolean {
  const userPerms = getPermissionsForRoles(roles);
  return permissions.every((p) => userPerms.has(p));
}

export function isCandidate(roles: string[]): boolean {
  return roles.includes("CANDIDATE");
}

export function isAdmin(roles: string[]): boolean {
  return roles.some((r) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r));
}

export function isInternalUser(roles: string[]): boolean {
  return roles.some((r) => r !== "CANDIDATE" && ROLES.includes(r as Role));
}

export const NON_CANDIDATE_ROLES = ROLES.filter((r) => r !== "CANDIDATE");

export const DISPLAY_NON_CANDIDATE_ROLES = DISPLAY_ROLES.filter((r) => r !== "CANDIDATE");
