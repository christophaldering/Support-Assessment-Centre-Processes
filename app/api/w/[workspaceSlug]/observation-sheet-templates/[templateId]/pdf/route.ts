import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import PDFDocument from "pdfkit";

interface RouteContext {
  params: { workspaceSlug: string; templateId: string };
}

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

    const template = await prisma.observationSheetTemplate.findFirst({
      where: { id: params.templateId, workspaceId: workspace.id },
    });
    if (!template) {
      return NextResponse.json({ error: "Vorlage nicht gefunden" }, { status: 404 });
    }

    const sections = getSections(template);
    const content = template.content as any;
    const headerFields = content?.headerFields || ["Kandidat/in", "Übung", "Beobachter/in", "Datum"];
    const ratingScale = template.ratingScale || "1-5";

    const TEMPLATE_TYPE_LABELS: Record<string, string> = {
      "verhaltensanker-bogen": "Verhaltensanker-Bogen",
      "kompetenzmatrix": "Kompetenzmatrix",
      "freitext-bogen": "Freitext-Bogen",
      "kombinierter-bogen": "Kombinierter Bogen",
    };
    const typeLabel = TEMPLATE_TYPE_LABELS[template.type] || template.type;

    const scaleValues = ratingScale === "a-e"
      ? ["A", "B", "C", "D", "E"]
      : Array.from({ length: parseInt(ratingScale.split("-")[1]) || 5 }, (_, i) => String(i + 1));

    const PW = 595.28;
    const PH = 841.89;
    const ML = 50;
    const MR = 50;
    const CW = PW - ML - MR;
    const accentColor = "#a35237";
    const mutedColor = "#6b7280";

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: ML, right: MR },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    function checkPage(needed: number = 100) {
      if (doc.y > PH - 70 - needed) {
        doc.addPage();
      }
    }

    doc.save();
    doc.rect(0, 0, PW, 3).fill(accentColor);
    doc.restore();

    doc.moveDown(0.3);
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#1e293b").text(template.name, { align: "left" });
    doc.moveDown(0.3);

    const metaParts = [typeLabel, `Skala: ${ratingScale}`];
    if (template.aiGenerated) metaParts.push("KI-generiert");
    doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text(metaParts.join("  ·  "));
    doc.fillColor("#000000");
    doc.moveDown(0.3);
    doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    if (template.description) {
      doc.fontSize(10).font("Helvetica").fillColor("#475569").text(template.description);
      doc.fillColor("#000000");
      doc.moveDown(0.8);
    }

    if (Array.isArray(headerFields) && headerFields.length > 0) {
      const fieldWidth = Math.min(CW / headerFields.length - 8, 130);
      let xPos = ML;
      const fieldY = doc.y;
      headerFields.forEach((field: string) => {
        doc.save();
        doc.rect(xPos, fieldY, fieldWidth, 36).stroke("#cbd5e1");
        doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor).text(field, xPos + 6, fieldY + 4, { width: fieldWidth - 12 });
        doc.fillColor("#000000");
        doc.restore();
        xPos += fieldWidth + 8;
      });
      doc.y = fieldY + 44;
    }

    sections.forEach((section: any, si: number) => {
      checkPage(120);

      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(accentColor).text(section.title || `Abschnitt ${si + 1}`);
      doc.moveDown(0.1);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(accentColor).lineWidth(0.3).stroke();

      if (section.competency) {
        doc.moveDown(0.15);
        doc.fontSize(8).font("Helvetica").fillColor("#2563eb").text(section.competency);
        doc.fillColor("#000000");
      }
      doc.moveDown(0.4);

      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          checkPage(80);

          doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor("#e2e8f0").lineWidth(0.3).stroke();
          doc.moveDown(0.3);

          doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(item.label || "", ML, doc.y, { width: CW });

          if (item.helpText) {
            doc.fontSize(8).font("Helvetica-Oblique").fillColor("#94a3b8").text(item.helpText, { width: CW });
            doc.fillColor("#000000");
          }

          if (item.anchors && Array.isArray(item.anchors) && item.anchors.length > 0) {
            doc.moveDown(0.2);
            item.anchors.forEach((anchor: string, ai: number) => {
              const labels = ["Niedrig", "Mittel", "Hoch", "Sehr hoch", "Herausragend"];
              const label = labels[ai] || `Stufe ${ai + 1}`;
              doc.fontSize(8).font("Helvetica").fillColor("#475569").text(`${label}: ${anchor}`, ML + 8, doc.y, { width: CW - 16 });
            });
            doc.fillColor("#000000");
          }

          doc.moveDown(0.3);
          const ratingY = doc.y;
          const boxSize = 18;
          const gap = 6;
          let ratingX = ML + 8;
          scaleValues.forEach((val) => {
            doc.rect(ratingX, ratingY, boxSize, boxSize).stroke("#cbd5e1");
            doc.fontSize(7).font("Helvetica").fillColor("#94a3b8").text(val, ratingX + 1, ratingY + 5, { width: boxSize, align: "center" });
            ratingX += boxSize + gap;
          });
          doc.fillColor("#000000");
          doc.y = ratingY + boxSize + 8;
          doc.moveDown(0.3);
        });
      }
    });

    if (content?.footerNote) {
      checkPage(40);
      doc.moveDown(1);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(mutedColor).text(content.footerNote, { width: CW });
      doc.fillColor("#000000");
    }

    if (template.competencyNames && template.competencyNames.length > 0) {
      checkPage(30);
      doc.moveDown(0.8);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor).text("Kompetenzen: ", { continued: true });
      doc.font("Helvetica").text(template.competencyNames.join(", "), { width: CW });
      doc.fillColor("#000000");
    }

    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      if (i > 0) {
        doc.save();
        doc.rect(0, 0, PW, 3).fill(accentColor);
        doc.restore();
      }

      doc.save();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text("Executive Diagnostics Suite  ·  Eco-Print", ML, PH - 45, { width: CW * 0.7, lineBreak: false });
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text(`Seite ${i + 1} / ${totalPages}`, ML + CW * 0.7, PH - 45, { width: CW * 0.3, align: "right", lineBreak: false });
      doc.restore();
    }

    doc.end();
    const pdfBuffer = await pdfReady;

    const safeName = template.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "PDF-Generierung fehlgeschlagen" }, { status: 500 });
  }
}

function getSections(tmpl: any): any[] {
  if (tmpl.structuredData && Array.isArray(tmpl.structuredData) && tmpl.structuredData.length > 0) {
    return tmpl.structuredData;
  }
  if (tmpl.content && typeof tmpl.content === "object" && tmpl.content.sections && Array.isArray(tmpl.content.sections)) {
    return tmpl.content.sections;
  }
  return [];
}
