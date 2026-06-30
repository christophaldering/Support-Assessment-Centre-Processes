import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { logUsageEvent } from "@/lib/telemetry";
import { getUploadUrl } from "@/lib/object-storage";
import { generateDocx, generatePdf, generatePptx } from "@/lib/report-generator";
import type { ReportData } from "@/lib/report-generator";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";
import { resolveSystemPrompt, PROMPT_SLOTS } from "@/lib/prompt-library";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

const VALID_FORMATS = ["pdf", "docx", "pptx"] as const;

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId");
    const format = url.searchParams.get("format");

    const where: Record<string, unknown> = {
      assessmentId: params.assessmentId,
      workspaceId: workspace.id,
    };
    if (candidateId) where.candidateId = candidateId;
    if (format) where.format = format;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
      include: { theme: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { candidateId, format, includeAiRecommendations } = body;

    if (!candidateId || !format) {
      return NextResponse.json(
        { error: "candidateId und format sind erforderlich" },
        { status: 400 }
      );
    }

    if (!VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: "Ungültiges Format. Erlaubt: pdf, docx, pptx" },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const candidate = await prisma.user.findFirst({
      where: { id: candidateId, workspaceId: workspace.id },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 });
    }

    const consolidatedScores = await prisma.consolidatedScore.findMany({
      where: { assessmentId: params.assessmentId, candidateId },
    });

    const observerRatings = await prisma.observerRating.findMany({
      where: { assessmentId: params.assessmentId, candidateId },
      include: { exercise: true },
    });

    const competencyNodeIds = [
      ...new Set([
        ...consolidatedScores.map((s) => s.competencyNodeId),
        ...observerRatings.map((r) => r.competencyNodeId),
      ]),
    ];

    const competencyNodes = await prisma.competencyNode.findMany({
      where: { id: { in: competencyNodeIds } },
    });
    const nodeMap = new Map(competencyNodes.map((n) => [n.id, n.name]));

    const exerciseIds = [
      ...new Set([
        ...consolidatedScores.filter((s) => s.exerciseId).map((s) => s.exerciseId!),
        ...observerRatings.map((r) => r.exerciseId),
      ]),
    ];
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
    });
    const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

    const observerIds = [...new Set(observerRatings.map((r) => r.observerId))];
    const observers = await prisma.user.findMany({
      where: { id: { in: observerIds } },
    });
    const observerMap = new Map(observers.map((o) => [o.id, o.name]));

    const aiSections: string[] = [];
    let aiRecommendations: string | undefined;

    if (includeAiRecommendations && consolidatedScores.length > 0) {
      if (isAIDisabled("report_generation")) {
        const err = create503Response("report_generation");
        return NextResponse.json(err.body, { status: err.status });
      }

      try {
        const scoresText = consolidatedScores
          .map(
            (s) =>
              `${nodeMap.get(s.competencyNodeId) || "Unbekannt"}: ${s.consolidatedValue.toFixed(2)} (normalisiert: ${(s.normalizedValue ?? 0).toFixed(2)})`
          )
          .join("\n");

        const llmResult = await generateLLMOutput({
          featureName: "report_generation",
          taskName: "generate_report",
          route: "/api/w/[workspaceSlug]/assessments/[assessmentId]/reports",
          input: `Kandidat: ${candidate.name}\nAssessment: ${assessment.name}\n\nKompetenzwerte:\n${scoresText}\n\nBitte erstelle konkrete Entwicklungsempfehlungen.`,
          options: {
            systemPrompt: await resolveSystemPrompt(workspace.id, "generate_report", PROMPT_SLOTS.generate_report.defaultPrompt),
            maxTokens: 2048,
          },
        });

        if (!("aiDisabled" in llmResult)) {
          aiRecommendations = typeof llmResult.data === "string" ? llmResult.data : JSON.stringify(llmResult.data);
          if (aiRecommendations) {
            aiSections.push("recommendations");
          }
        }
      } catch (err) {
        console.error("AI recommendations generation failed:", err);
      }
    }

    const activeBrandRuleSet = await prisma.brandRuleSet.findFirst({
      where: { workspaceId: workspace.id, status: "active" },
      orderBy: { updatedAt: "desc" },
    });

    const brandRules = activeBrandRuleSet
      ? (activeBrandRuleSet.rulesJson as {
          colors?: { primary?: string; secondary?: string; accent?: string; background?: string };
          typography?: { headingFont?: string; bodyFont?: string; headingSize?: string; bodySize?: string };
          documentRules?: { coverPage?: boolean; headerFooter?: string; confidentialityNote?: string; pageNumbers?: boolean; watermark?: string };
          slideRules?: { titleSlide?: boolean; sectionDividers?: boolean; footer?: string; legalLine?: string };
          logoPlacement?: { position?: string; maxHeight?: string };
        })
      : undefined;

    const reportData: ReportData = {
      assessmentName: assessment.name,
      assessmentDescription: assessment.description || undefined,
      candidateName: candidate.name,
      candidateEmail: candidate.email || undefined,
      workspaceName: workspace.name,
      generatedAt: new Date(),
      consolidatedScores: consolidatedScores.map((s) => ({
        competencyName: nodeMap.get(s.competencyNodeId) || "Unbekannt",
        consolidatedValue: s.consolidatedValue,
        normalizedValue: s.normalizedValue ?? 0,
        variance: s.variance ?? undefined,
        outlierFlag: s.outlierFlag,
        moderatorOverride: s.moderatorOverride ?? undefined,
        exerciseName: s.exerciseId ? exerciseMap.get(s.exerciseId) : undefined,
      })),
      evidenceNotes: observerRatings
        .filter((r) => r.evidenceNotes)
        .map((r) => ({
          exerciseName: exerciseMap.get(r.exerciseId) || "Unbekannt",
          competencyName: nodeMap.get(r.competencyNodeId) || "Unbekannt",
          observerName: observerMap.get(r.observerId) || "Unbekannt",
          notes: r.evidenceNotes!,
          rating: r.rating ?? undefined,
        })),
      aiRecommendations,
      aiSections,
      themeColors: workspace.theme
        ? {
            primary: workspace.theme.primaryColor,
            accent: workspace.theme.accentColor,
            text: workspace.theme.textColor,
            bg: workspace.theme.backgroundColor,
          }
        : undefined,
      brandRules,
    };

    let fileBuffer: Buffer;
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    switch (format) {
      case "docx":
        fileBuffer = await generateDocx(reportData);
        break;
      case "pptx":
        fileBuffer = await generatePptx(reportData);
        break;
      default:
        fileBuffer = await generatePdf(reportData);
        break;
    }

    const { uploadURL, objectPath } = await getUploadUrl();

    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": mimeTypes[format] },
      body: fileBuffer,
    });

    const existingReportsCount = await prisma.report.count({
      where: {
        assessmentId: params.assessmentId,
        candidateId,
        format,
        workspaceId: workspace.id,
      },
    });

    const report = await prisma.report.create({
      data: {
        workspaceId: workspace.id,
        assessmentId: params.assessmentId,
        candidateId,
        title: `${assessment.name} - ${candidate.name} (${format.toUpperCase()})`,
        format,
        objectPath,
        snapshotData: reportData as unknown as Record<string, unknown>,
        aiSections,
        version: existingReportsCount + 1,
        status: "completed",
        generatedAt: new Date(),
        createdById: session?.userId || "master",
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: session?.userId || null,
      action: "report.generated",
      entityType: "report",
      entityId: report.id,
      details: {
        assessmentId: params.assessmentId,
        candidateId,
        format,
        includeAiRecommendations: !!includeAiRecommendations,
        aiSections,
      },
    });

    await logUsageEvent({
      workspaceId: workspace.id,
      userId: session?.userId,
      eventType: "report.generated",
      entityType: "report",
      entityId: report.id,
      metadata: { format, aiSections, candidateId },
      credits: includeAiRecommendations ? 1 : 0,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("Report generation failed:", err);
    return NextResponse.json(
      { error: "Berichterstellung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
