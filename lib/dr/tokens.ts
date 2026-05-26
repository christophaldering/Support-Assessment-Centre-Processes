import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function makeToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export async function resolveLink(token: string) {
  if (!token) return null;
  const link = await prisma.dataRoomAccessLink.findUnique({ where: { token } });
  if (!link) return null;
  if (link.revoked) return null;
  if (link.expiresAt.getTime() < Date.now()) return null;
  if (!link.multiUse && link.useCount > 0) return null;
  return link;
}
