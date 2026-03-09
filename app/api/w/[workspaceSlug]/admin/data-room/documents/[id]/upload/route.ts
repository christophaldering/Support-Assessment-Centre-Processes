import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { uploadToObjectStorage } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectPath = `.private/portal/${doc.assessmentId}/${Date.now()}_${file.name}`;
  const mimeType = file.type || "application/octet-stream";

  await uploadToObjectStorage(objectPath, buffer, mimeType);

  const updated = await prisma.portalDocument.update({
    where: { id: params.id },
    data: {
      objectPath,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    },
  });

  return NextResponse.json(updated);
}
