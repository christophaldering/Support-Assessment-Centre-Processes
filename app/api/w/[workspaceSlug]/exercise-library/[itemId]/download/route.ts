import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { getSignedDownloadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; itemId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Übung nicht gefunden" }, { status: 404 });
    }

    if (!item.originalFileKey) {
      return NextResponse.json({ error: "Keine Datei vorhanden" }, { status: 404 });
    }

    const downloadUrl = await getSignedDownloadUrl(item.originalFileKey);

    return NextResponse.json({
      downloadUrl,
      fileName: item.originalFileName || "download",
    });
  } catch (err) {
    return NextResponse.json({ error: "Fehler beim Erstellen des Download-Links" }, { status: 500 });
  }
}
