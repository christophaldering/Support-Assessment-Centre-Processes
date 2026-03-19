import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: RouteContext) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const authorized =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    userSession?.workspaceSlug === params.workspaceSlug;

  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });

  if (!workspace) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
        }
      };

      const ping = () => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
        }
      };

      const sendSnapshot = async () => {
        try {
          const [assessmentStats, pendingRatings] = await Promise.all([
            prisma.assessment.groupBy({
              by: ["status"],
              where: { workspaceId: workspace.id },
              _count: { id: true },
            }),
            prisma.observerRating
              ? prisma.observerRating.count({
                  where: {
                    assessment: { workspaceId: workspace.id },
                    status: "pending",
                  },
                }).catch(() => 0)
              : Promise.resolve(0),
          ]);

          const statusMap: Record<string, number> = {};
          for (const row of assessmentStats) {
            statusMap[row.status] = row._count.id;
          }

          send("snapshot", {
            ts: Date.now(),
            assessments: statusMap,
            pendingRatings,
          });
        } catch {
        }
      };

      send("connected", { ts: Date.now(), workspace: params.workspaceSlug });

      await sendSnapshot();

      const pingInterval = setInterval(ping, 25_000);
      const dataInterval = setInterval(sendSnapshot, 30_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        clearInterval(dataInterval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
