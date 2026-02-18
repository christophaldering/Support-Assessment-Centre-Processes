import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { analysisId } = await req.json();

    if (!analysisId || typeof analysisId !== "string") {
      return NextResponse.json({ error: "analysisId ist erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const analysis = await prisma.requirementsAnalysis.findFirst({
      where: { id: analysisId, workspaceId: workspace.id },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analyse nicht gefunden" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const proposal = analysis.proposal as Record<string, any> | null;

    const updateData: Record<string, any> = {
      sourceAnalysisId: analysisId,
    };

    if (proposal) {
      if (typeof proposal.company === "string" && proposal.company.trim()) {
        updateData.clientName = proposal.company.trim();
      }
      if (typeof proposal.targetRole === "string" && proposal.targetRole.trim()) {
        updateData.targetPosition = proposal.targetRole.trim();
      }
      if (typeof proposal.assessmentDate === "string" && proposal.assessmentDate) {
        try {
          const parts = proposal.assessmentDate.split(".");
          if (parts.length === 3) {
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(d.getTime())) {
              updateData.startDate = d;
            }
          }
        } catch {}
      }
    }

    let competenciesApplied = 0;

    if (proposal?.competencies && Array.isArray(proposal.competencies)) {
      const selectedComps = proposal.competencies.filter(
        (c: any) =>
          c &&
          typeof c.name === "string" &&
          c.name.trim().length > 0 &&
          c.selected !== false
      );

      if (selectedComps.length > 0) {
        let model = await prisma.competencyModel.findFirst({
          where: { workspaceId: workspace.id },
          orderBy: { createdAt: "desc" },
        });

        if (!model) {
          model = await prisma.competencyModel.create({
            data: {
              workspaceId: workspace.id,
              name: `Kompetenzmodell — ${analysis.title || assessment.name}`,
              description: "Automatisch erstellt aus Anforderungsanalyse",
              sourceType: "analysis_derived",
              companyName: analysis.clientName || assessment.clientName || null,
            },
          });
        }

        const existingNodes = await prisma.competencyNode.findMany({
          where: { competencyModelId: model.id },
          select: { name: true, sortOrder: true },
        });

        const existingNames = new Set(existingNodes.map((n) => n.name.toLowerCase()));
        let maxSort = existingNodes.reduce((max, n) => Math.max(max, n.sortOrder), -1);

        for (const comp of selectedComps) {
          const normalizedName = comp.name.trim();
          if (existingNames.has(normalizedName.toLowerCase())) continue;

          maxSort++;
          await prisma.competencyNode.create({
            data: {
              competencyModelId: model.id,
              name: normalizedName,
              description: typeof comp.description === "string" ? comp.description : "",
              sortOrder: maxSort,
            },
          });
          existingNames.add(normalizedName.toLowerCase());
          competenciesApplied++;
        }
      }
    }

    const updated = await prisma.assessment.update({
      where: { id: params.assessmentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: updated.id,
        name: updated.name,
        clientName: updated.clientName,
        targetPosition: updated.targetPosition,
        sourceAnalysisId: updated.sourceAnalysisId,
      },
      competenciesApplied,
    });
  } catch (err) {
    console.error("apply-analysis error:", err);
    return NextResponse.json({ error: "Fehler beim Übernehmen der Analyse" }, { status: 500 });
  }
}
