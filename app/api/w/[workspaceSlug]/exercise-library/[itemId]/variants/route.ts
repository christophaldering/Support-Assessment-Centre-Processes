import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission, hasAnyPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; itemId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    const variants = await prisma.exerciseLibraryVariant.findMany({
      where: { libraryItemId: params.itemId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(variants);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    const { variantType, language, fileName, fileSize, mimeType, contentJson, analysisJson } = await req.json();

    if (!variantType) {
      return NextResponse.json({ error: "Varianten-Typ ist erforderlich" }, { status: 400 });
    }

    const validVariantTypes = ["original", "cd_adapted", "assessment_tailored", "ai_generated_new"];
    if (!validVariantTypes.includes(variantType)) {
      return NextResponse.json({ error: "Ungültiger Varianten-Typ" }, { status: 400 });
    }

    const validLanguages = ["DE", "EN"];
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: "Ungültige Sprache" }, { status: 400 });
    }

    const fileObjectPath = fileName
      ? `.private/exercise-library/${workspace.id}/${params.itemId}/${Date.now()}_${fileName}`
      : null;

    const variant = await prisma.exerciseLibraryVariant.create({
      data: {
        libraryItemId: params.itemId,
        variantType,
        language: language ?? "DE",
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        fileObjectPath,
        contentJson: contentJson ?? null,
        analysisJson: analysisJson ?? null,
      },
    });

    return NextResponse.json({ ...variant, fileObjectPath }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
