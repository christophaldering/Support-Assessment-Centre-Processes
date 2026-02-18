import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const caseStudy = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!caseStudy) {
    return NextResponse.json({ error: "Fallstudie nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(caseStudy);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const existing = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Fallstudie nicht gefunden" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { title, subtitle, companyName, description, type, difficulty, dataJson, questionsJson, status, referenceDate, logoUrl } = body;

    const updated = await prisma.caseStudy.update({
      where: { id: params.caseStudyId },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(companyName !== undefined && { companyName }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(difficulty !== undefined && { difficulty }),
        ...(dataJson !== undefined && { dataJson }),
        ...(questionsJson !== undefined && { questionsJson }),
        ...(status !== undefined && { status }),
        ...(referenceDate !== undefined && { referenceDate }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating case study:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const existing = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Fallstudie nicht gefunden" }, { status: 404 });
  }

  await prisma.caseStudy.delete({ where: { id: params.caseStudyId } });

  return NextResponse.json({ success: true });
}
