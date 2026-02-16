import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth, getWorkspaceAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const hasAccess =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    (userSession &&
      userSession.workspaceSlug === params.workspaceSlug &&
      hasPermission(userSession.roles, "users.read"));

  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const statusFilter = req.nextUrl.searchParams.get("status") || "pending";

  const requests = await prisma.accessRequest.findMany({
    where: {
      workspaceId: workspace.id,
      status: statusFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { email, name, message } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name und E-Mail sind erforderlich." },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace nicht gefunden." },
        { status: 404 }
      );
    }

    const existing = await prisma.accessRequest.findUnique({
      where: {
        email_workspaceId: {
          email: email.toLowerCase().trim(),
          workspaceId: workspace.id,
        },
      },
    });

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Eine Anfrage für diese E-Mail-Adresse ist bereits ausstehend." },
          { status: 409 }
        );
      }
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "Ihr Zugang wurde bereits genehmigt. Bitte nutzen Sie die Erstanmeldung." },
          { status: 409 }
        );
      }
      if (existing.status === "rejected") {
        await prisma.accessRequest.update({
          where: { id: existing.id },
          data: { status: "pending", name, message: message || null, reviewedAt: null, reviewedBy: null },
        });
        return NextResponse.json({ success: true, status: "pending" });
      }
    }

    await prisma.accessRequest.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        message: message || null,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({ success: true, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
}
