import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import PDFDocument from "pdfkit";

interface RouteContext {
  params: { workspaceSlug: string; analysisId: string };
}

const MODULE_TYPE_LABELS: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview-Leitfaden",
  case_study: "Fallstudie",
  role_play: "Verhaltenssimulation",
  group_discussion: "Gruppendiskussion",
  in_tray: "Postkorb",
  fact_finding: "Fact-Finding",
  psychometric: "Psychometrischer Test",
  other: "Sonstiges",
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const analysis = await prisma.requirementsAnalysis.findFirst({
      where: { id: params.analysisId, workspaceId: workspace.id },
    });
    if (!analysis) {
      return NextResponse.json({ error: "Analyse nicht gefunden" }, { status: 404 });
    }

    const proposal = analysis.proposal as any;
    if (!proposal) {
      return NextResponse.json({ error: "Keine Analysedaten vorhanden" }, { status: 400 });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 55, right: 55 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const PW = 595.28;
    const ML = 55;
    const MR = 55;
    const CW = PW - ML - MR;

    const accentColor = "#a35237";
    const headingColor = "#1e293b";
    const bodyColor = "#374151";
    const mutedColor = "#6b7280";
    const lightRule = "#e2e8f0";
    const sectionBg = "#f8fafc";

    function addFooter() {
      doc.save();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text("© Christoph Aldering · Private initiative / concept", ML, doc.page.height - 45, { width: CW, align: "center" });
      doc.restore();
    }

    function accentLine() {
      doc.save();
      doc.rect(0, 0, PW, 3).fill(accentColor);
      doc.restore();
    }

    function checkPage(needed: number = 100) {
      if (doc.y > doc.page.height - needed) {
        doc.addPage();
        accentLine();
        addFooter();
      }
    }

    function sectionTitle(text: string) {
      checkPage(80);
      doc.moveDown(0.8);
      doc.fontSize(13).font("Helvetica-Bold").fillColor(accentColor).text(text, ML, undefined, { width: CW });
      doc.moveDown(0.15);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(accentColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }

    function fieldRow(label: string, value: string) {
      checkPage(30);
      const y = doc.y;
      doc.fontSize(9).font("Helvetica-Bold").fillColor(mutedColor).text(label, ML, y, { width: 140, continued: false });
      doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(value || "–", ML + 145, y, { width: CW - 145 });
      doc.y = Math.max(doc.y, y + 14);
    }

    function bodyText(text: string) {
      doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(text, ML, undefined, { width: CW, lineGap: 2 });
    }

    accentLine();
    addFooter();

    doc.moveDown(1.5);

    doc.fontSize(10).font("Helvetica").fillColor(mutedColor).text("ANFORDERUNGSANALYSE", ML, undefined, { width: CW, characterSpacing: 2 });
    doc.moveDown(0.3);

    const title = analysis.title || "Ergebnisse";
    doc.fontSize(22).font("Helvetica-Bold").fillColor(headingColor).text(title, ML, undefined, { width: CW });
    doc.moveDown(0.3);

    const metaParts: string[] = [];
    if (analysis.clientName) metaParts.push(analysis.clientName);
    if (analysis.projectName) metaParts.push(analysis.projectName);
    if (proposal.analysisDate) metaParts.push(proposal.analysisDate);
    if (metaParts.length > 0) {
      doc.fontSize(10).font("Helvetica").fillColor(mutedColor).text(metaParts.join("  ·  "), ML, undefined, { width: CW });
    }

    doc.moveDown(0.5);
    doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(lightRule).lineWidth(0.5).stroke();

    sectionTitle("Rahmendaten");
    fieldRow("Datum der Analyse:", proposal.analysisDate || "–");
    fieldRow("Form:", proposal.analysisForm || "–");
    if (proposal.participants && proposal.participants.length > 0) {
      fieldRow("Teilnehmende:", proposal.participants.join(", "));
    }

    sectionTitle("Unternehmen & Rolle");
    fieldRow("Unternehmen:", proposal.company || "–");
    fieldRow("Ziel-Funktion:", proposal.targetRole || "–");
    fieldRow("Besetzung ab:", proposal.startDate || "–");

    sectionTitle("Assessment");
    fieldRow("Durchführungstermin:", proposal.assessmentDate || "–");
    fieldRow("Art:", proposal.assessmentType || "–");
    fieldRow("Dauer:", proposal.assessmentDuration || "–");

    sectionTitle("Durchführende");
    const lc = proposal.leadConsultant;
    if (lc) {
      checkPage(60);
      const y = doc.y;
      doc.rect(ML, y, CW, 1).fill(sectionBg);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor)
        .text(`${lc.firstName || ""} ${lc.lastName || ""}`.trim() || "–", ML, y + 4, { width: CW * 0.4 });
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(lc.role || "", ML + CW * 0.4, y + 4, { width: CW * 0.3 });
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(lc.email || "", ML + CW * 0.7, y + 4, { width: CW * 0.3 });
      doc.y = y + 20;
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(accentColor).text("Leitender Berater", ML);
      doc.moveDown(0.3);
    }

    if (proposal.secondConsultant) {
      const sc = proposal.secondConsultant;
      checkPage(30);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor)
        .text(`${sc.firstName || ""} ${sc.lastName || ""}`.trim() || "–", ML, undefined, { continued: true });
      doc.font("Helvetica").fillColor(mutedColor).text(`  ·  ${sc.role || ""}  ·  ${sc.email || ""}`);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(accentColor).text("Zweit-Berater", ML);
      doc.moveDown(0.3);
    }

    if (proposal.additionalObservers && proposal.additionalObservers.length > 0) {
      proposal.additionalObservers.forEach((obs: any, i: number) => {
        checkPage(25);
        doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor)
          .text(`${obs.firstName || ""} ${obs.lastName || ""}`.trim() || "–", ML, undefined, { continued: true });
        doc.font("Helvetica").fillColor(mutedColor).text(`  ·  ${obs.role || ""}  ·  ${obs.email || ""}`);
        doc.moveDown(0.15);
      });
    }

    if (proposal.candidates && proposal.candidates.length > 0) {
      sectionTitle("Kandidaten");
      proposal.candidates.forEach((c: any, i: number) => {
        checkPage(30);
        doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor)
          .text(`${i + 1}. ${c.firstName || ""} ${c.lastName || ""}`.trim(), ML, undefined, { width: CW });
        const details: string[] = [];
        if (c.currentRole) details.push(c.currentRole);
        if (c.currentCompany) details.push(`bei ${c.currentCompany}`);
        if (c.email) details.push(c.email);
        if (details.length > 0) {
          doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(details.join("  ·  "), ML + 12, undefined, { width: CW - 12 });
        }
        doc.moveDown(0.3);
      });
    }

    const selectedComps = (proposal.competencies || []).filter((c: any) => c.selected !== false);
    if (selectedComps.length > 0) {
      sectionTitle("Anforderungsprofil / Kompetenzen");
      selectedComps.forEach((c: any) => {
        checkPage(40);
        doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor).text(`• ${c.name}`, ML, undefined, { width: CW });
        if (c.description) {
          doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(c.description, ML + 12, undefined, { width: CW - 12, lineGap: 1 });
        }
        doc.moveDown(0.3);
      });
    }

    const selectedModules = (proposal.assessmentModules || []).filter((m: any) => m.selected !== false);
    if (selectedModules.length > 0) {
      sectionTitle("Assessment-Bausteine (Übungs-Spezifikationen)");
      selectedModules.forEach((m: any) => {
        checkPage(50);
        const typeLabel = MODULE_TYPE_LABELS[m.type] || m.type || "–";
        doc.fontSize(9).font("Helvetica-Bold").fillColor(headingColor).text(`• ${m.name}`, ML, undefined, { continued: true });
        doc.font("Helvetica").fillColor(mutedColor).text(`  (${typeLabel})`);
        if (m.description) {
          doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(m.description, ML + 12, undefined, { width: CW - 12, lineGap: 1 });
        }
        if (m.adaptationNotes) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(accentColor).text(`Anpassungshinweise: ${m.adaptationNotes}`, ML + 12, undefined, { width: CW - 12 });
        }
        if (m.generationPrompt) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(mutedColor).text(`Erstellungsanweisung: ${m.generationPrompt}`, ML + 12, undefined, { width: CW - 12 });
        }
        doc.moveDown(0.3);
      });
    }

    if (proposal.specificQuestions && proposal.specificQuestions.length > 0) {
      sectionTitle("Spezifische Fragestellungen");
      proposal.specificQuestions.forEach((q: string) => {
        checkPage(20);
        doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(`• ${q}`, ML + 8, undefined, { width: CW - 8 });
        doc.moveDown(0.15);
      });
    }

    if (proposal.successCriteria && proposal.successCriteria.length > 0) {
      sectionTitle("Stellenspezifische Erfolgsmerkmale");
      proposal.successCriteria.forEach((c: string) => {
        checkPage(20);
        doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(`★ ${c}`, ML + 8, undefined, { width: CW - 8 });
        doc.moveDown(0.15);
      });
    }

    doc.moveDown(2);
    checkPage(30);
    doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(lightRule).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font("Helvetica").fillColor(mutedColor).text(
      `Erstellt am ${new Date(analysis.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`,
      { align: "right", width: CW }
    );

    doc.end();
    const pdfBuffer = await pdfReady;

    const safeName = (analysis.title || "Anforderungsanalyse").replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_${dateStr}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Requirements PDF generation error:", error);
    return NextResponse.json({ error: "PDF-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
