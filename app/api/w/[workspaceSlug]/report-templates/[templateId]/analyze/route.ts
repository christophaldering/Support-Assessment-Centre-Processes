import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";
import { resolveSystemPrompt, PROMPT_SLOTS } from "@/lib/prompt-library";
import { getSignedDownloadUrlForPath } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; templateId: string };
}

function isAdmin(
  session: ReturnType<typeof getUserSession>,
  master: boolean,
  workspaceSlug: string
): boolean {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  return session.roles.some((r) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r));
}

const REQUIRED_STYLE_FIELDS = [
  "tonality",
  "sentenceLength",
  "hedgingPhrases",
  "structurePattern",
  "strengthsLanguagePattern",
  "developmentAreaLanguagePattern",
] as const;

async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const template = await prisma.reportTemplate.findFirst({
    where: { id: params.templateId, workspaceId: workspace.id },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  if (!template.sourceFilePath) {
    return NextResponse.json({ error: "Keine Quelldatei vorhanden. Bitte zuerst eine Datei hochladen." }, { status: 400 });
  }

  if (isAIDisabled("report_generation")) {
    const err = create503Response("report_generation");
    return NextResponse.json(err.body, { status: err.status });
  }

  await prisma.reportTemplate.update({
    where: { id: params.templateId },
    data: { analysisStatus: "extracting" },
  });

  try {
    const signedUrl = await getSignedDownloadUrlForPath(template.sourceFilePath);
    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) {
      throw new Error(`Datei-Download fehlgeschlagen: ${fileRes.status}`);
    }
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await extractTextFromBuffer(buffer, template.sourceFileName ?? "file.pdf");
    if (!rawText || rawText.trim().length < 50) {
      throw new Error("Extrahierter Text zu kurz oder leer — ungültige Datei?");
    }

    const anonymizePrompt = await resolveSystemPrompt(
      workspace.id,
      "anonymize_report_text",
      PROMPT_SLOTS.anonymize_report_text.defaultPrompt
    );

    const anonymizeResult = await generateLLMOutput({
      featureName: "report_generation",
      taskName: "anonymize_report_text",
      route: "/api/w/[workspaceSlug]/report-templates/[templateId]/analyze",
      input: rawText.slice(0, 12000),
      options: { systemPrompt: anonymizePrompt, maxTokens: 4096 },
    });

    if ("aiDisabled" in anonymizeResult) {
      await prisma.reportTemplate.update({ where: { id: params.templateId }, data: { analysisStatus: "pending" } });
      return NextResponse.json({ error: "KI ist deaktiviert" }, { status: 503 });
    }

    const anonymizedText = typeof anonymizeResult.data === "string"
      ? anonymizeResult.data
      : JSON.stringify(anonymizeResult.data);

    const extractPrompt = await resolveSystemPrompt(
      workspace.id,
      "extract_report_style_profile",
      PROMPT_SLOTS.extract_report_style_profile.defaultPrompt
    );

    const extractResult = await generateLLMOutput({
      featureName: "report_generation",
      taskName: "extract_report_style_profile",
      route: "/api/w/[workspaceSlug]/report-templates/[templateId]/analyze",
      input: anonymizedText.slice(0, 10000),
      options: { systemPrompt: extractPrompt, maxTokens: 2048 },
    });

    if ("aiDisabled" in extractResult) {
      await prisma.reportTemplate.update({ where: { id: params.templateId }, data: { analysisStatus: "pending" } });
      return NextResponse.json({ error: "KI ist deaktiviert" }, { status: 503 });
    }

    const rawOutput = typeof extractResult.data === "string"
      ? extractResult.data
      : JSON.stringify(extractResult.data);

    let styleProfile: Record<string, unknown>;
    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      styleProfile = JSON.parse(jsonMatch ? jsonMatch[0] : rawOutput);
    } catch {
      await prisma.reportTemplate.update({ where: { id: params.templateId }, data: { analysisStatus: "failed" } });
      return NextResponse.json({ error: "KI hat kein valides JSON zurückgegeben", raw: rawOutput.slice(0, 500) }, { status: 422 });
    }

    const missingFields = REQUIRED_STYLE_FIELDS.filter((f) => !(f in styleProfile));
    if (missingFields.length > 0) {
      await prisma.reportTemplate.update({ where: { id: params.templateId }, data: { analysisStatus: "failed" } });
      return NextResponse.json({ error: `Pflichtfelder fehlen: ${missingFields.join(", ")}`, profile: styleProfile }, { status: 422 });
    }

    const updated = await prisma.reportTemplate.update({
      where: { id: params.templateId },
      data: {
        styleRulesJson: styleProfile,
        analysisStatus: "analyzed",
        isAnonymized: true,
        useForStyleGuidance: false,
      },
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (err) {
    console.error("[analyze-template] Error:", err);
    await prisma.reportTemplate.update({
      where: { id: params.templateId },
      data: { analysisStatus: "failed" },
    }).catch(() => {});
    return NextResponse.json({ error: "Analyse fehlgeschlagen", details: String(err) }, { status: 500 });
  }
}
