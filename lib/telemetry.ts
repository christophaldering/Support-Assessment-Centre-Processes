import { prisma } from "@/lib/db";

export async function logUsageEvent(params: {
  workspaceId: string;
  userId?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  credits?: number;
}) {
  try {
    await prisma.usageEvent.create({ data: { ...params, credits: params.credits ?? 0 } });
  } catch (e) {
    console.error("Failed to log usage event:", e);
  }
}
