import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getUploadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "requirements.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const analyses = await prisma.requirementsAnalysis.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(analyses);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "requirements.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, mode, inputType, transcript, consentGiven, fileName, fileSize } = body;

    if (!title) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json({ error: "Einwilligung zur KI-Verarbeitung ist erforderlich" }, { status: 400 });
    }

    if (!inputType || !["audio", "transcript", "manual"].includes(inputType)) {
      return NextResponse.json({ error: "Ungültiger Eingabetyp" }, { status: 400 });
    }

    const userId = session?.userId || "master";

    let uploadUrl: string | null = null;
    let objectPath: string | null = null;

    if (inputType === "audio" && fileName) {
      const upload = await getUploadUrl();
      uploadUrl = upload.uploadURL;
      objectPath = upload.objectPath;
    }

    const analysis = await prisma.requirementsAnalysis.create({
      data: {
        workspaceId: workspace.id,
        title,
        mode: mode || "auto",
        status: inputType === "manual" ? "ready" : "pending",
        inputType,
        objectPath,
        originalFileName: fileName || null,
        transcript: transcript || null,
        consentGiven: true,
        consentTimestamp: new Date(),
        consentUserId: userId,
        createdById: userId,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "requirements_analysis.created",
      entityType: "RequirementsAnalysis",
      entityId: analysis.id,
      details: { mode, inputType, consentGiven: true },
    });

    return NextResponse.json(
      { analysis, uploadUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("Requirements analysis creation error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
