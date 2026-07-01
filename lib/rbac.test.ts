import { describe, it, expect } from "vitest";
import {
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isCandidate,
  isAdmin,
  isInternalUser,
} from "@/lib/rbac";

describe("getPermissionsForRoles", () => {
  it("returns empty set for empty roles array (fail-safe)", () => {
    const perms = getPermissionsForRoles([]);
    expect(perms.size).toBe(0);
  });

  it("returns no permissions for unknown role", () => {
    const perms = getPermissionsForRoles(["NONEXISTENT_ROLE"]);
    expect(perms.size).toBe(0);
  });
});

describe("hasPermission", () => {
  it("MASTER_ADMIN hat cross_workspace.access", () => {
    expect(hasPermission(["MASTER_ADMIN"], "cross_workspace.access")).toBe(true);
  });

  it("WORKSPACE_ADMIN hat NICHT cross_workspace.access", () => {
    expect(hasPermission(["WORKSPACE_ADMIN"], "cross_workspace.access")).toBe(false);
  });

  it("CANDIDATE hat NICHT cross_workspace.access", () => {
    expect(hasPermission(["CANDIDATE"], "cross_workspace.access")).toBe(false);
  });

  it("CANDIDATE hat candidate.own_assessment", () => {
    expect(hasPermission(["CANDIDATE"], "candidate.own_assessment")).toBe(true);
  });

  it("MASTER_ADMIN hat workspace.manage", () => {
    expect(hasPermission(["MASTER_ADMIN"], "workspace.manage")).toBe(true);
  });

  it("leeres Rollen-Array ergibt keine Permissions", () => {
    expect(hasPermission([], "workspace.manage")).toBe(false);
    expect(hasPermission([], "candidate.own_assessment")).toBe(false);
  });
});

describe("Legacy-Aliase", () => {
  it("ADMIN verhält sich identisch zu WORKSPACE_ADMIN bei workspace.manage", () => {
    expect(hasPermission(["ADMIN"], "workspace.manage")).toBe(
      hasPermission(["WORKSPACE_ADMIN"], "workspace.manage")
    );
  });

  it("ADMIN hat workspace.manage (positiv)", () => {
    expect(hasPermission(["ADMIN"], "workspace.manage")).toBe(true);
  });

  it("PROJECT_ASSISTANT verhält sich identisch zu PROJECT_OFFICE bei assessments.read", () => {
    expect(hasPermission(["PROJECT_ASSISTANT"], "assessments.read")).toBe(
      hasPermission(["PROJECT_OFFICE"], "assessments.read")
    );
  });

  it("HR_CLIENT verhält sich identisch zu CLIENT bei reports.read", () => {
    expect(hasPermission(["HR_CLIENT"], "reports.read")).toBe(
      hasPermission(["CLIENT"], "reports.read")
    );
  });

  it("isAdmin erkennt Legacy-Alias ADMIN", () => {
    expect(isAdmin(["ADMIN"])).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  it("gibt true wenn mindestens eine Permission vorhanden ist", () => {
    expect(
      hasAnyPermission(["OBSERVER"], ["reports.read", "workspace.manage"])
    ).toBe(true);
  });

  it("gibt false wenn keine der Permissions vorhanden ist", () => {
    expect(
      hasAnyPermission(["CANDIDATE"], ["reports.read", "workspace.manage"])
    ).toBe(false);
  });

  it("leeres Rollen-Array → false", () => {
    expect(hasAnyPermission([], ["reports.read"])).toBe(false);
  });

  it("leere Permissions-Liste → false", () => {
    expect(hasAnyPermission(["MASTER_ADMIN"], [])).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  it("MASTER_ADMIN hat alle: workspace.manage und cross_workspace.access", () => {
    expect(
      hasAllPermissions(["MASTER_ADMIN"], ["workspace.manage", "cross_workspace.access"])
    ).toBe(true);
  });

  it("OBSERVER hat NICHT alle: workspace.manage fehlt", () => {
    expect(
      hasAllPermissions(["OBSERVER"], ["workspace.manage", "candidates.read"])
    ).toBe(false);
  });

  it("leere Permissions-Liste → true (vacuously true)", () => {
    expect(hasAllPermissions(["CANDIDATE"], [])).toBe(true);
  });

  it("leeres Rollen-Array → false wenn Permissions gefordert", () => {
    expect(hasAllPermissions([], ["workspace.manage"])).toBe(false);
  });
});

describe("isCandidate", () => {
  it("true für CANDIDATE", () => {
    expect(isCandidate(["CANDIDATE"])).toBe(true);
  });

  it("false für MODERATOR", () => {
    expect(isCandidate(["MODERATOR"])).toBe(false);
  });

  it("true wenn CANDIDATE eine von mehreren Rollen ist", () => {
    expect(isCandidate(["OBSERVER", "CANDIDATE"])).toBe(true);
  });

  it("false für leeres Array", () => {
    expect(isCandidate([])).toBe(false);
  });
});

describe("isAdmin", () => {
  it("true für WORKSPACE_ADMIN", () => {
    expect(isAdmin(["WORKSPACE_ADMIN"])).toBe(true);
  });

  it("true für MASTER_ADMIN", () => {
    expect(isAdmin(["MASTER_ADMIN"])).toBe(true);
  });

  it("true für Legacy-Alias ADMIN", () => {
    expect(isAdmin(["ADMIN"])).toBe(true);
  });

  it("false für OBSERVER", () => {
    expect(isAdmin(["OBSERVER"])).toBe(false);
  });

  it("false für CANDIDATE", () => {
    expect(isAdmin(["CANDIDATE"])).toBe(false);
  });

  it("false für leeres Array", () => {
    expect(isAdmin([])).toBe(false);
  });
});

describe("isInternalUser", () => {
  it("true für MODERATOR", () => {
    expect(isInternalUser(["MODERATOR"])).toBe(true);
  });

  it("true für OBSERVER", () => {
    expect(isInternalUser(["OBSERVER"])).toBe(true);
  });

  it("false für CANDIDATE allein", () => {
    expect(isInternalUser(["CANDIDATE"])).toBe(false);
  });

  it("true wenn CANDIDATE + OBSERVER kombiniert", () => {
    expect(isInternalUser(["CANDIDATE", "OBSERVER"])).toBe(true);
  });

  it("false für leeres Array", () => {
    expect(isInternalUser([])).toBe(false);
  });
});
