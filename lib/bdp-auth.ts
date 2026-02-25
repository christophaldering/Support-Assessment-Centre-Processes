import { cookies } from "next/headers";
import { getUserSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export interface BdpSession {
  userId: string;
  code: string;
  role: string;
  isAdmin: boolean;
  environment: string;
  authSource: "bdp_session" | "platform";
  workspaceSlug: string;
}

let _platformCache: Map<string, BdpSession | null> = new Map();

export function getBdpSession(): BdpSession | null {
  const envOverride = getEnvironmentOverride();

  try {
    const cookie = cookies().get("bdp_session");
    if (cookie) {
      const parsed = JSON.parse(cookie.value);
      if (parsed && parsed.userId && parsed.code) {
        return {
          ...parsed,
          authSource: "bdp_session",
          workspaceSlug: parsed.workspaceSlug || "arag",
          environment: envOverride || parsed.environment || "live",
        } as BdpSession;
      }
    }
  } catch {}

  try {
    const platformSession = getUserSession();
    if (!platformSession) return null;

    const roles = platformSession.roles || [];
    const isAdmin = roles.includes("ADMIN") || roles.includes("WORKSPACE_ADMIN");

    return {
      userId: platformSession.userId,
      code: isAdmin ? "MD1" : "V1",
      role: isAdmin ? "MANAGEMENT_DIAGNOSTICS" : "BOARD",
      isAdmin,
      environment: envOverride || "live",
      authSource: "platform",
      workspaceSlug: platformSession.workspaceSlug || "arag",
    };
  } catch {}

  return null;
}

function getEnvironmentOverride(): string | null {
  try {
    const cookie = cookies().get("bdp_environment");
    if (cookie) {
      const val = cookie.value;
      if (val === "demo" || val === "live") return val;
    }
  } catch {}
  return null;
}

export function requireBdpSession(): BdpSession {
  const session = getBdpSession();
  if (!session) throw new Error("Nicht authentifiziert");
  return session;
}

export function requireBdpAdmin(): BdpSession {
  const session = requireBdpSession();
  if (!session.isAdmin) throw new Error("Keine Admin-Berechtigung");
  return session;
}
