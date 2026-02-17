import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { extractRequirementsAnalysis } from "@/lib/ai";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (name.endsWith(".pdf")) {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return result.text || "";
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = require("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const texts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        texts.push(`[Blatt: ${sheetName}]\n${csv}`);
      }
    }
    return texts.join("\n\n");
  }

  if (name.endsWith(".pptx") || name.endsWith(".ppt")) {
    const officeparser = require("officeparser");
    const text = await officeparser.parseOfficeAsync(buffer);
    return text || "";
  }

  if (name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  return "";
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

    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let analysisId: string | undefined;
    const fileNames: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const manualText = formData.get("text") as string || "";
      analysisId = (formData.get("analysisId") as string) || undefined;

      const extractedTexts: string[] = [];
      const files = formData.getAll("files");
      for (const entry of files) {
        if (entry instanceof File && entry.size > 0) {
          const extracted = await extractTextFromFile(entry);
          if (extracted.trim()) {
            fileNames.push(entry.name);
            extractedTexts.push(`--- ${entry.name} ---\n${extracted}`);
          }
        }
      }

      const parts: string[] = [];
      if (manualText.trim()) parts.push(manualText.trim());
      if (extractedTexts.length > 0) parts.push(extractedTexts.join("\n\n"));
      text = parts.join("\n\n---\n\n");
    } else {
      const body = await req.json();
      text = body.text || "";
      analysisId = body.analysisId;
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Bitte geben Sie einen ausreichend langen Text ein oder laden Sie Dateien hoch (mind. 20 Zeichen)." },
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
      const titleParts = [];
      if (extraction.company) titleParts.push(extraction.company);
      if (extraction.targetRole) titleParts.push(extraction.targetRole);
      const titleSuffix = titleParts.length > 0 ? titleParts.join(" – ") : new Date().toLocaleDateString("de-DE");

      const analysis = await prisma.requirementsAnalysis.create({
        data: {
          workspaceId: workspace.id,
          title: `Anforderungsanalyse: ${titleSuffix}`,
          mode: "auto",
          status: "proposal_ready",
          inputType: fileNames.length > 0 ? "files" : "transcript",
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
          fileCount: fileNames.length,
          fileNames,
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
