import { prisma } from "@/lib/db";

export async function checkConsent(workspaceId: string, userId: string, feature: string): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: { workspaceId, userId, feature, granted: true, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return !!record;
}

export async function checkFeatureEnabled(workspaceId: string, feature: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { featureFlags: true } });
  if (!workspace?.featureFlags) return true;
  const flags = workspace.featureFlags as Record<string, boolean>;
  return flags[feature] !== false;
}
