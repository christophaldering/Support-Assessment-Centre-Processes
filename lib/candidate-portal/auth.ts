import { cookies } from "next/headers";

const CANDIDATE_COOKIE = "candidate_portal_session";

export interface CandidateSession {
  userId: string;
  email: string;
  name: string;
  workspaceSlug: string;
  assessmentId: string | null;
}

export function setCandidateSession(session: CandidateSession) {
  cookies().set(CANDIDATE_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function getCandidateSession(): CandidateSession | null {
  const raw = cookies().get(CANDIDATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CandidateSession;
  } catch {
    return null;
  }
}

export function clearCandidateSession() {
  cookies().delete(CANDIDATE_COOKIE);
}
