import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import { Client } from "@replit/object-storage";
import { generateTags } from "@/lib/ai";

interface RouteContext {
  params: { workspaceSlug: string };
}

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
];

function getStorageClient() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || process.env.REPLIT_DEFAULT_BUCKET_ID;
  if (!bucketId) throw new Error("Object storage bucket not configured");
  return new Client({ bucketId });
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei darf maximal 50 MB groß sein" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: .docx, .pptx, .pdf" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const uuid = crypto.randomUUID();
    const objectPath = `.private/observation-sheets/${workspace.id}/${uuid}_${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getStorageClient();
    await client.uploadFromBytes(objectPath, buffer);

    const template = await prisma.observationSheetTemplate.create({
      data: {
        name,
        workspaceId: workspace.id,
        type: "uploaded",
        fileKey: objectPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        originalFileKey: objectPath,
        originalFileName: file.name,
      },
    });

    generateTags({
      title: name,
      description: null,
      type: "observation_sheet",
      fileName: file.name,
    }).then(async (aiTags) => {
      if (aiTags.length > 0) {
        await prisma.observationSheetTemplate.update({
          where: { id: template.id },
          data: { tags: aiTags },
        });
      }
    }).catch((err) => {
      console.error("Async AI tag generation failed for observation sheet template:", template.id, err);
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Observation sheet template upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
