export const ROLES = [
  "ADMIN",
  "MODERATOR",
  "OBSERVER",
  "PROJECT_ASSISTANT",
  "HR_CLIENT",
  "CANDIDATE",
] as const;

export type Role = (typeof ROLES)[number];

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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
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
  ],
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
  PROJECT_ASSISTANT: [
    "assessments.read",
    "assessments.update",
    "candidates.create",
    "candidates.read",
    "candidates.update",
    "users.read",
    "exerciselibrary.upload",
    "exerciselibrary.manage",
  ],
  HR_CLIENT: [
    "assessments.read",
    "candidates.read",
    "reports.read",
    "advanced_intelligence.view",
  ],
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

export function isInternalUser(roles: string[]): boolean {
  return roles.some((r) => r !== "CANDIDATE" && ROLES.includes(r as Role));
}

export const NON_CANDIDATE_ROLES = ROLES.filter((r) => r !== "CANDIDATE");
