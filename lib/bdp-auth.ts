import { cookies } from "next/headers";

export interface BdpSession {
  userId: string;
  code: string;
  role: string;
  isAdmin: boolean;
  environment: string;
}

export function getBdpSession(): BdpSession | null {
  try {
    const cookie = cookies().get("bdp_session");
    if (!cookie) return null;
    return JSON.parse(cookie.value) as BdpSession;
  } catch {
    return null;
  }
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
