import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import { Client } from "@replit/object-storage";
import { generateTagsAndTitle } from "@/lib/ai";

interface RouteContext {
  params: { workspaceSlug: string };
}

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
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
    const title = formData.get("title") as string | null;
    const exerciseType = formData.get("exerciseType") as string | null;
    const targetLevelsRaw = formData.get("targetLevels") as string | null;
    const languagesAvailableRaw = formData.get("languagesAvailable") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const description = formData.get("description") as string | null;
    const sourceProjectId = formData.get("sourceProjectId") as string | null;
    const metadataJsonRaw = formData.get("metadataJson") as string | null;

    let metadataJson: any = null;
    if (metadataJsonRaw) {
      try {
        metadataJson = JSON.parse(metadataJsonRaw);
      } catch {}
    }

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei darf maximal 50 MB groß sein" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!exerciseType) {
      return NextResponse.json({ error: "Exercise type is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Ungültiger Dateityp. Erlaubt: .docx, .pptx, .xlsx, .pdf" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const targetLevels = targetLevelsRaw
      ? targetLevelsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const languagesAvailable = languagesAvailableRaw
      ? languagesAvailableRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const tags = tagsRaw
      ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const uuid = crypto.randomUUID();
    const objectPath = `.private/exercises/${workspace.id}/${uuid}_${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getStorageClient();
    await client.uploadFromBytes(objectPath, buffer);

    const item = await prisma.exerciseLibraryItem.create({
      data: {
        title,
        description: description ?? null,
        exerciseType,
        workspaceId: workspace.id,
        tags,
        targetLevels,
        languagesAvailable,
        originalFileKey: objectPath,
        originalFileName: file.name,
        originalFileSize: file.size,
        originalMimeType: file.type,
        sourceProjectId: sourceProjectId || null,
        metadataJson: metadataJson ?? undefined,
        sourceContext: metadataJson?.sourceContext || null,
      },
      include: {
        _count: { select: { variants: true } },
      },
    });

    generateTagsAndTitle({
      title,
      description: description ?? null,
      type: exerciseType,
      fileName: file.name,
      sourceContext: metadataJson?.sourceContext || null,
      author: metadataJson?.author || null,
    }).then(async (result) => {
      if (result.tags.length > 0 || result.suggestedTitle !== title) {
        const mergedTags = Array.from(new Set([...tags, ...result.tags]));
        const updateData: any = { tags: mergedTags };
        await prisma.exerciseLibraryItem.update({
          where: { id: item.id },
          data: updateData,
        });
      }
    }).catch((err) => {
      console.error("Async AI tag generation failed for exercise:", item.id, err);
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Exercise upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
