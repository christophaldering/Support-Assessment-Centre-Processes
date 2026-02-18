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

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const pageWidth = doc.page.width - 100;

    doc.fontSize(18).font("Helvetica-Bold").text(template.name, { align: "left" });
    doc.moveDown(0.3);

    const metaParts = [typeLabel, `Skala: ${ratingScale}`];
    if (template.aiGenerated) metaParts.push("KI-generiert");
    doc.fontSize(9).font("Helvetica").fillColor("#64748b").text(metaParts.join("  ·  "));
    doc.fillColor("#000000");
    doc.moveDown(0.5);

    if (template.description) {
      doc.fontSize(10).font("Helvetica").fillColor("#475569").text(template.description);
      doc.fillColor("#000000");
      doc.moveDown(0.8);
    }

    if (Array.isArray(headerFields) && headerFields.length > 0) {
      const fieldWidth = Math.min(pageWidth / headerFields.length - 8, 130);
      let xPos = 50;
      headerFields.forEach((field: string) => {
        doc.save();
        doc.rect(xPos, doc.y, fieldWidth, 36).stroke("#cbd5e1");
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#64748b").text(field, xPos + 6, doc.y + 4, { width: fieldWidth - 12 });
        doc.fillColor("#000000");
        doc.restore();
        xPos += fieldWidth + 8;
      });
      doc.moveDown(3);
    }

    sections.forEach((section: any, si: number) => {
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.moveDown(0.5);
      doc.fontSize(13).font("Helvetica-Bold").text(section.title || `Abschnitt ${si + 1}`);

      if (section.competency) {
        doc.fontSize(8).font("Helvetica").fillColor("#2563eb").text(section.competency);
        doc.fillColor("#000000");
      }
      doc.moveDown(0.4);

      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
          }

          const itemY = doc.y;
          doc.rect(50, itemY, pageWidth, 0).stroke("#e2e8f0");
          doc.moveDown(0.3);

          doc.fontSize(10).font("Helvetica-Bold").text(item.label || "", 50, doc.y, { width: pageWidth });

          if (item.helpText) {
            doc.fontSize(8).font("Helvetica-Oblique").fillColor("#94a3b8").text(item.helpText, { width: pageWidth });
            doc.fillColor("#000000");
          }

          if (item.anchors && Array.isArray(item.anchors) && item.anchors.length > 0) {
            doc.moveDown(0.2);
            item.anchors.forEach((anchor: string, ai: number) => {
              const labels = ["Niedrig", "Mittel", "Hoch", "Sehr hoch", "Herausragend"];
              const label = labels[ai] || `Stufe ${ai + 1}`;
              doc.fontSize(8).font("Helvetica").fillColor("#475569").text(`${label}: ${anchor}`, 58, doc.y, { width: pageWidth - 16 });
            });
            doc.fillColor("#000000");
          }

          doc.moveDown(0.3);
          const ratingY = doc.y;
          const boxSize = 18;
          const gap = 6;
          let ratingX = 58;
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
      doc.moveDown(1);
      doc.rect(50, doc.y, pageWidth, 0.5).fill("#e2e8f0");
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#64748b").text(content.footerNote, { width: pageWidth });
      doc.fillColor("#000000");
    }

    if (template.competencyNames && template.competencyNames.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#64748b").text("Kompetenzen: ");
      doc.font("Helvetica").text(template.competencyNames.join(", "), { width: pageWidth });
      doc.fillColor("#000000");
    }

    doc.moveDown(2);
    doc.fontSize(7).font("Helvetica").fillColor("#94a3b8").text(
      `Erstellt am ${new Date(template.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`,
      { align: "right" }
    );

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
