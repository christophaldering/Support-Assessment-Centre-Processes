import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { extractRequirementsAnalysis } from "@/lib/ai";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
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
    const { text, analysisId } = body;

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Bitte geben Sie einen ausreichend langen Text ein (mind. 20 Zeichen)." },
        { status: 400 }
      );
    }

    const extraction = await extractRequirementsAnalysis(text.trim());

    const userId = session?.userId || "master";

    let resultAnalysisId = analysisId;

    if (analysisId) {
      await prisma.requirementsAnalysis.update({
        where: { id: analysisId },
        data: {
          transcript: text.trim(),
          proposal: extraction as unknown as Record<string, unknown>,
          status: "proposal_ready",
        },
      });
    } else {
      const analysis = await prisma.requirementsAnalysis.create({
        data: {
          workspaceId: workspace.id,
          title: extraction.company
            ? `Anforderungsanalyse: ${extraction.company} – ${extraction.targetRole || "Rolle"}`
            : `Anforderungsanalyse ${new Date().toLocaleDateString("de-DE")}`,
          mode: "auto",
          status: "proposal_ready",
          inputType: "transcript",
          transcript: text.trim(),
          proposal: extraction as unknown as Record<string, unknown>,
          consentGiven: true,
          consentTimestamp: new Date(),
          consentUserId: userId,
          createdById: userId,
        },
      });

      resultAnalysisId = analysis.id;

      await logAudit({
        workspaceId: workspace.id,
        userId,
        action: "requirements_analysis.extracted",
        entityType: "RequirementsAnalysis",
        entityId: analysis.id,
        details: {
          competencyCount: extraction.competencies?.length,
          moduleCount: extraction.assessmentModules?.length,
          candidateCount: extraction.candidates?.length,
        },
      });
    }

    return NextResponse.json({ extraction, analysisId: resultAnalysisId });
  } catch (err) {
    console.error("Requirements extraction error:", err);
    return NextResponse.json(
      { error: "KI-Extraktion fehlgeschlagen. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
