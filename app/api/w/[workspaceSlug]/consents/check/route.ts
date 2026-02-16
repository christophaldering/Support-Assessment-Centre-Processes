import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { checkConsent } from "@/lib/consent";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { userId, feature } = body;

    if (!userId || !feature) {
      return NextResponse.json(
        { error: "userId und feature sind erforderlich" },
        { status: 400 }
      );
    }

    const hasConsentResult = await checkConsent(workspace.id, userId, feature);

    let record = null;
    if (hasConsentResult) {
      record = await prisma.consentRecord.findFirst({
        where: {
          workspaceId: workspace.id,
          userId,
          feature,
          granted: true,
          revokedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ hasConsent: hasConsentResult, record });
  } catch (err) {
    console.error("Consent check error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
