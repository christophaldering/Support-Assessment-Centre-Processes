import { cookies } from "next/headers";

const MASTER_COOKIE = "edp_master_auth";
const WORKSPACE_COOKIE = "edp_workspace_auth";
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
