import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getSignedDownloadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; reportId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: params.reportId,
        assessmentId: params.assessmentId,
        workspaceId: workspace.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Bericht nicht gefunden" }, { status: 404 });
    }

    let downloadUrl: string | null = null;
    if (report.objectPath) {
      try {
        downloadUrl = await getSignedDownloadUrl(report.objectPath);
      } catch (err) {
        console.error("Failed to generate download URL:", err);
      }
    }

    return NextResponse.json({ ...report, downloadUrl });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: params.reportId,
        assessmentId: params.assessmentId,
        workspaceId: workspace.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Bericht nicht gefunden" }, { status: 404 });
    }

    await prisma.report.delete({ where: { id: report.id } });

    await logAudit({
      workspaceId: workspace.id,
      userId: session?.userId || null,
      action: "report.deleted",
      entityType: "report",
      entityId: report.id,
      details: {
        assessmentId: params.assessmentId,
        format: report.format,
        title: report.title,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
