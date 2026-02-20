import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { uploadToObjectStorage } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string };
}

const VALID_REPORT_TYPES = ["one_pager", "gutachten", "gesamtauswertung"];

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "reports.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const templates = await prisma.reportTemplate.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "reports.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const reportType = formData.get("reportType") as string | null;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json(
        { error: "reportType must be one of: one_pager, gutachten, gesamtauswertung" },
        { status: 400 }
      );
    }

    let sourceFilePath: string | null = null;
    let sourceFileName: string | null = null;
    let sourceFileSize: number | null = null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const objectPath = `report-templates/${workspace.id}/${Date.now()}-${file.name}`;
      await uploadToObjectStorage(objectPath, buffer, file.type || "application/octet-stream");

      sourceFilePath = objectPath;
      sourceFileName = file.name;
      sourceFileSize = buffer.length;
    }

    const template = await prisma.reportTemplate.create({
      data: {
        workspaceId: workspace.id,
        name: name.trim(),
        reportType,
        sourceFilePath,
        sourceFileName,
        sourceFileSize,
        status: file ? "uploaded" : "draft",
        analysisStatus: "pending",
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("Error creating report template:", err);
    return NextResponse.json({ error: "Failed to create report template" }, { status: 500 });
  }
}
