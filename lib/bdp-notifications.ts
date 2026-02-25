import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type BdpNotificationType =
  | "session_opened"
  | "session_closed"
  | "session_released"
  | "observer_assigned"
  | "observer_removed"
  | "score_submitted"
  | "tie_break_set"
  | "demo_reset";

interface CreateNotificationParams {
  userId: string;
  type: BdpNotificationType;
  title: string;
  message: string;
  link?: string;
  environment?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.bdpNotification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      environment: params.environment || "live",
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function notifyAllObserversInSession(
  sessionId: string,
  type: BdpNotificationType,
  title: string,
  message: string,
  link?: string,
  environment?: string,
  excludeUserId?: string,
) {
  const assignments = await prisma.bdpObserverAssignment.findMany({
    where: { sessionId },
    select: { userId: true },
  });

  const userIds = [...new Set(assignments.map(a => a.userId))].filter(id => id !== excludeUserId);

  for (const userId of userIds) {
    await createNotification({
      userId,
      type,
      title,
      message,
      link,
      environment,
      metadata: { sessionId },
    });
  }

  return userIds.length;
}

export async function notifyAllAdmins(
  type: BdpNotificationType,
  title: string,
  message: string,
  link?: string,
  environment?: string,
  excludeUserId?: string,
) {
  const admins = await prisma.bdpUser.findMany({
    where: { isAdmin: true, environment: environment || "live" },
    select: { id: true },
  });

  const userIds = admins.map(a => a.id).filter(id => id !== excludeUserId);

  for (const userId of userIds) {
    await createNotification({
      userId,
      type,
      title,
      message,
      link,
      environment,
    });
  }

  return userIds.length;
}
