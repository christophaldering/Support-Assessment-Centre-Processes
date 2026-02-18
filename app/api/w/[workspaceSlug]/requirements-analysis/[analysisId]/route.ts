import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { transcribeAudio, extractProposal, type AIProposal } from "@/lib/ai";
import { getSignedDownloadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; analysisId: string };
}

async function authorize(params: RouteContext["params"]) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session && !master && !hasPermission(session.roles, "requirements.manage")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return { error: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) };
  }

  const analysis = await prisma.requirementsAnalysis.findFirst({
    where: { id: params.analysisId, workspaceId: workspace.id },
  });

  if (!analysis) {
    return { error: NextResponse.json({ error: "Analyse nicht gefunden" }, { status: 404 }) };
  }

  return { workspace, analysis, session, userId: session?.userId || "master" };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await authorize(params);
  if ("error" in auth && auth.error) return auth.error;
  return NextResponse.json(auth.analysis);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const auth = await authorize(params);
  if ("error" in auth && auth.error) return auth.error;
  const { analysis, workspace, userId } = auth as { analysis: NonNullable<typeof auth.analysis>; workspace: NonNullable<typeof auth.workspace>; userId: string };

  try {
    const body = await req.json();
    const { proposal, status, clientName, projectName, autoDeleteAt } = body;

    const updated = await prisma.requirementsAnalysis.update({
      where: { id: analysis.id },
      data: {
        ...(proposal !== undefined && { proposal }),
        ...(status !== undefined && { status }),
        ...(clientName !== undefined && { clientName }),
        ...(projectName !== undefined && { projectName }),
        ...(autoDeleteAt !== undefined && { autoDeleteAt: autoDeleteAt ? new Date(autoDeleteAt) : null }),
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "requirements_analysis.updated",
      entityType: "RequirementsAnalysis",
      entityId: analysis.id,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await authorize(params);
  if ("error" in auth && auth.error) return auth.error;
  const { analysis, workspace, userId } = auth as { analysis: NonNullable<typeof auth.analysis>; workspace: NonNullable<typeof auth.workspace>; userId: string };

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "process") {
      await prisma.requirementsAnalysis.update({
        where: { id: analysis.id },
        data: { status: "processing" },
      });

      await logAudit({
        workspaceId: workspace.id,
        userId,
        action: "requirements_analysis.processing_started",
        entityType: "RequirementsAnalysis",
        entityId: analysis.id,
      });

      let transcript = analysis.transcript;

      if (analysis.inputType === "audio" && analysis.objectPath) {
        try {
          const downloadUrl = await getSignedDownloadUrl(analysis.objectPath);
          const audioRes = await fetch(downloadUrl);
          const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
          transcript = await transcribeAudio(audioBuffer, analysis.originalFileName || "audio.wav");

          await prisma.requirementsAnalysis.update({
            where: { id: analysis.id },
            data: { transcript },
          });

          await logAudit({
            workspaceId: workspace.id,
            userId,
            action: "requirements_analysis.transcribed",
            entityType: "RequirementsAnalysis",
            entityId: analysis.id,
            details: { transcriptLength: transcript.length },
          });
        } catch (err) {
          console.error("Transcription error:", err);
          await prisma.requirementsAnalysis.update({
            where: { id: analysis.id },
            data: { status: "error" },
          });
          return NextResponse.json({ error: "Transkription fehlgeschlagen" }, { status: 500 });
        }
      }

      if (!transcript) {
        await prisma.requirementsAnalysis.update({
          where: { id: analysis.id },
          data: { status: "error" },
        });
        return NextResponse.json({ error: "Kein Transkript vorhanden" }, { status: 400 });
      }

      try {
        const proposal = await extractProposal(transcript);

        const updated = await prisma.requirementsAnalysis.update({
          where: { id: analysis.id },
          data: {
            proposal: proposal as unknown as Record<string, unknown>,
            status: "proposal_ready",
          },
        });

        await logAudit({
          workspaceId: workspace.id,
          userId,
          action: "requirements_analysis.proposal_generated",
          entityType: "RequirementsAnalysis",
          entityId: analysis.id,
          details: {
            exerciseCount: proposal.exercises?.length,
            competencyCount: proposal.competencies?.length,
          },
        });

        return NextResponse.json(updated);
      } catch (err) {
        console.error("AI extraction error:", err);
        await prisma.requirementsAnalysis.update({
          where: { id: analysis.id },
          data: { status: "error" },
        });
        return NextResponse.json({ error: "KI-Analyse fehlgeschlagen" }, { status: 500 });
      }
    }

    if (action === "apply") {
      if (!analysis.proposal) {
        return NextResponse.json({ error: "Kein Vorschlag vorhanden" }, { status: 400 });
      }

      const proposal = analysis.proposal as unknown as AIProposal;

      const result = await prisma.$transaction(async (tx) => {
        const assessment = await tx.assessment.create({
          data: {
            name: proposal.assessmentName || analysis.title,
            workspaceId: workspace.id,
            status: "draft",
            description: proposal.assessmentDescription || null,
            aiGenerated: true,
            sourceAnalysisId: analysis.id,
          },
        });

        const competencyModel = await tx.competencyModel.create({
          data: {
            workspaceId: workspace.id,
            name: `Modell: ${proposal.assessmentName || analysis.title}`,
            description: `KI-generiert aus Anforderungsanalyse "${analysis.title}"`,
            status: "draft",
          },
        });

        const nodeNameToId: Record<string, string> = {};
        let domainOrder = 0;

        for (const domain of (proposal.competencies || [])) {
          const domainNode = await tx.competencyNode.create({
            data: {
              competencyModelId: competencyModel.id,
              name: domain.name,
              nodeType: domain.nodeType || "domain",
              description: domain.description || null,
              sortOrder: domainOrder++,
            },
          });
          nodeNameToId[domain.name] = domainNode.id;

          let childOrder = 0;
          for (const child of (domain.children || [])) {
            const childNode = await tx.competencyNode.create({
              data: {
                competencyModelId: competencyModel.id,
                parentId: domainNode.id,
                name: child.name,
                nodeType: child.nodeType || "competency",
                description: child.description || null,
                sortOrder: childOrder++,
              },
            });
            nodeNameToId[child.name] = childNode.id;

            if (child.anchors) {
              let anchorOrder = 0;
              for (const anchor of child.anchors) {
                await tx.competencyNode.create({
                  data: {
                    competencyModelId: competencyModel.id,
                    parentId: childNode.id,
                    name: anchor,
                    nodeType: "anchor",
                    sortOrder: anchorOrder++,
                  },
                });
              }
            }
          }
        }

        if (proposal.scale) {
          await tx.scaleDefinition.create({
            data: {
              workspaceId: workspace.id,
              name: proposal.scale.name || "KI-Bewertungsskala",
              type: proposal.scale.type || "likert",
              minValue: Math.min(...(proposal.scale.points || []).map((p) => p.value)),
              maxValue: Math.max(...(proposal.scale.points || []).map((p) => p.value)),
              points: proposal.scale.points || [],
            },
          });
        }

        for (let i = 0; i < (proposal.exercises || []).length; i++) {
          const ex = proposal.exercises[i];
          const exercise = await tx.exercise.create({
            data: {
              assessmentId: assessment.id,
              name: ex.name,
              type: ex.type || "other",
              instructions: ex.instructions || null,
              duration: ex.duration || null,
              sortOrder: i,
              difficultyLevel: ex.difficultyLevel || null,
              difficultyMeta: ex.difficultyLevel ? { level: ex.difficultyLevel, source: "ai" } : null,
              aiGenerated: true,
            },
          });

          for (const compName of (ex.competencyMappings || [])) {
            const nodeId = nodeNameToId[compName];
            if (nodeId) {
              await tx.exerciseCompetencyMapping.create({
                data: {
                  exerciseId: exercise.id,
                  competencyNodeId: nodeId,
                  weight: 1.0,
                },
              });
            }
          }
        }

        if (proposal.weightings && proposal.weightings.length > 0) {
          const weights = proposal.weightings.map((w) => ({
            competencyNodeId: nodeNameToId[w.competencyName] || null,
            competencyName: w.competencyName,
            weight: w.weight,
          }));

          await tx.weightingProfile.create({
            data: {
              competencyModelId: competencyModel.id,
              name: `Gewichtung: ${proposal.assessmentName || analysis.title}`,
              targetRole: proposal.targetRole?.title || null,
              weights,
            },
          });
        }

        await tx.requirementsAnalysis.update({
          where: { id: analysis.id },
          data: {
            status: "applied",
            appliedAssessmentId: assessment.id,
          },
        });

        return { assessment, competencyModel };
      });

      await logAudit({
        workspaceId: workspace.id,
        userId,
        action: "requirements_analysis.applied",
        entityType: "RequirementsAnalysis",
        entityId: analysis.id,
        details: {
          assessmentId: result.assessment.id,
          competencyModelId: result.competencyModel.id,
        },
      });

      return NextResponse.json({
        message: "Assessment erfolgreich erstellt",
        assessmentId: result.assessment.id,
        competencyModelId: result.competencyModel.id,
      });
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
  } catch (err) {
    console.error("Requirements analysis action error:", err);
    return NextResponse.json({ error: "Verarbeitungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await authorize(params);
  if ("error" in auth && auth.error) return auth.error;
  const { analysis, workspace, userId } = auth as { analysis: NonNullable<typeof auth.analysis>; workspace: NonNullable<typeof auth.workspace>; userId: string };

  await prisma.$transaction(async (tx) => {
    await tx.assessment.updateMany({
      where: { sourceAnalysisId: analysis.id },
      data: { sourceAnalysisId: null },
    });

    await tx.requirementsAnalysis.delete({
      where: { id: analysis.id },
    });
  });

  await logAudit({
    workspaceId: workspace.id,
    userId,
    action: "requirements_analysis.deleted",
    entityType: "RequirementsAnalysis",
    entityId: analysis.id,
  });

  return NextResponse.json({ message: "Gelöscht" });
}
