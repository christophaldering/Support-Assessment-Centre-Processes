import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
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

  const caseStudy = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!caseStudy) {
    return NextResponse.json({ error: "Fallstudie nicht gefunden" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { documentType, documentId, updates } = body;

    if (!documentType || !documentId || !updates) {
      return NextResponse.json({ error: "documentType, documentId und updates sind erforderlich" }, { status: 400 });
    }

    const dataJson = caseStudy.dataJson as any;
    if (!dataJson) {
      return NextResponse.json({ error: "Keine Daten vorhanden" }, { status: 400 });
    }

    let updated = false;

    if (documentType === "email") {
      const emails = dataJson.emails;
      if (Array.isArray(emails)) {
        const idx = emails.findIndex((e: any) => e.id === documentId);
        if (idx !== -1) {
          dataJson.emails[idx] = { ...dataJson.emails[idx], ...updates };
          updated = true;
        }
      }
    } else if (documentType === "protocol") {
      const protocols = dataJson.protocols;
      if (Array.isArray(protocols)) {
        const idx = protocols.findIndex((p: any) => p.id === documentId);
        if (idx !== -1) {
          dataJson.protocols[idx] = { ...dataJson.protocols[idx], ...updates };
          updated = true;
        }
      }
    } else if (documentType === "news") {
      const newsArticles = dataJson.newsArticles;
      if (Array.isArray(newsArticles)) {
        const idx = newsArticles.findIndex((n: any) => n.id === documentId);
        if (idx !== -1) {
          dataJson.newsArticles[idx] = { ...dataJson.newsArticles[idx], ...updates };
          updated = true;
        }
      }
    } else {
      return NextResponse.json({ error: "Unbekannter documentType. Erlaubt: email, protocol, news" }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    const result = await prisma.caseStudy.update({
      where: { id: params.caseStudyId },
      data: { dataJson },
    });

    return NextResponse.json({ success: true, dataJson: result.dataJson });
  } catch (err) {
    console.error("Error updating document:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Dokuments" }, { status: 500 });
  }
}
