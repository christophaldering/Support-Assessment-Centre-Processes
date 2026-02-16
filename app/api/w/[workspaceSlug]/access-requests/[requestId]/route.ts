import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth, getWorkspaceAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { sendAccessApprovedEmail, sendAccessRejectedEmail } from "@/lib/email";

interface RouteContext {
  params: { workspaceSlug: string; requestId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const hasAccess =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    (userSession &&
      userSession.workspaceSlug === params.workspaceSlug &&
      hasPermission(userSession.roles, "users.write"));

  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!accessRequest || accessRequest.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const { action, roles } = await req.json();

  const baseUrl = req.nextUrl.origin;

  if (action === "approve") {
    const ALLOWED_ROLES = ["MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"];
    const filteredRoles = roles && roles.length > 0
      ? roles.filter((r: string) => ALLOWED_ROLES.includes(r))
      : ["OBSERVER"];
    const assignedRoles = filteredRoles.length > 0 ? filteredRoles : ["OBSERVER"];
    const defaultPassword = "Christoph";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: {
        email_workspaceId: {
          email: accessRequest.email,
          workspaceId: workspace.id,
        },
      },
    });

    if (existingUser) {
      await prisma.accessRequest.update({
        where: { id: params.requestId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: userSession?.userId || "master",
        },
      });

      return NextResponse.json({ success: true, userCreated: false });
    }

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: accessRequest.email,
          name: accessRequest.name,
          passwordHash,
          roles: assignedRoles,
          workspaceId: workspace.id,
          forcePasswordChange: true,
        },
      }),
      prisma.accessRequest.update({
        where: { id: params.requestId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: userSession?.userId || "master",
        },
      }),
    ]);

    try {
      await sendAccessApprovedEmail(
        accessRequest.email,
        accessRequest.name,
        workspace.name,
        workspace.slug,
        baseUrl
      );
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }

    return NextResponse.json({ success: true, userCreated: true });
  }

  if (action === "reject") {
    await prisma.accessRequest.update({
      where: { id: params.requestId },
      data: {
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: userSession?.userId || "master",
      },
    });

    try {
      await sendAccessRejectedEmail(
        accessRequest.email,
        accessRequest.name,
        workspace.name
      );
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
