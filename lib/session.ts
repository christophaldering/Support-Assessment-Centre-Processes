import { cookies } from "next/headers";

const MASTER_COOKIE = "edp_master_auth";
const WORKSPACE_COOKIE = "edp_workspace_auth";
const USER_COOKIE = "edp_user_session";
const TOKEN = "authenticated";

export function setMasterAuth() {
  cookies().set(MASTER_COOKIE, TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export function hasMasterAuth(): boolean {
  return cookies().get(MASTER_COOKIE)?.value === TOKEN;
}

export function clearMasterAuth() {
  cookies().delete(MASTER_COOKIE);
}

export function setWorkspaceAuth(workspaceSlug: string) {
  cookies().set(WORKSPACE_COOKIE, workspaceSlug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export function getWorkspaceAuth(): string | null {
  return cookies().get(WORKSPACE_COOKIE)?.value ?? null;
}

export function clearWorkspaceAuth() {
  cookies().delete(WORKSPACE_COOKIE);
}

export interface UserSession {
  userId: string;
  workspaceSlug: string;
  roles: string[];
}

export function setUserSession(session: UserSession) {
  cookies().set(USER_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export function getUserSession(): UserSession | null {
  const raw = cookies().get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function clearUserSession() {
  cookies().delete(USER_COOKIE);
}
