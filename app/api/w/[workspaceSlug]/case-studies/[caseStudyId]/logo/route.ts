import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

function getStorageClient() {
  const { Client } = require("@replit/object-storage");
  return new Client();
}

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
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
    return NextResponse.json({ error: "Case study not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Nur PNG, JPEG, SVG und WebP erlaubt" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei zu groß (max. 5 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const key = `.private/case-study-logos/${params.caseStudyId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageClient = getStorageClient();
    await storageClient.uploadFromBytes(key, buffer);

    const logoUrl = `/api/w/${params.workspaceSlug}/case-studies/${params.caseStudyId}/logo`;

    await prisma.caseStudy.update({
      where: { id: params.caseStudyId },
      data: { logoUrl },
    });

    return NextResponse.json({ logoUrl });
  } catch (err) {
    console.error("Logo upload error:", err);
    return NextResponse.json({ error: "Fehler beim Logo-Upload" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const caseStudy = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!caseStudy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const storageClient = getStorageClient();

    const possibleExts = ["png", "jpg", "jpeg", "svg", "webp"];
    let fileBuffer: Buffer | null = null;
    let contentType = "image/png";

    for (const ext of possibleExts) {
      const key = `.private/case-study-logos/${params.caseStudyId}.${ext}`;
      try {
        const { ok, value: rawBuffer } = await storageClient.downloadAsBytes(key);
        if (ok && rawBuffer) {
          fileBuffer = Array.isArray(rawBuffer) ? Buffer.concat(rawBuffer) : Buffer.from(rawBuffer);
          const typeMap: Record<string, string> = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            svg: "image/svg+xml",
            webp: "image/webp",
          };
          contentType = typeMap[ext] || "image/png";
          break;
        }
      } catch {
        continue;
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Logo download error:", err);
    return NextResponse.json({ error: "Fehler beim Logo-Download" }, { status: 500 });
  }
}
