import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import PDFDocument from "pdfkit";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; sheetId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sheet = await prisma.observationSheet.findFirst({
    where: { id: params.sheetId, assessmentId: params.assessmentId },
  });
  if (!sheet) return NextResponse.json({ error: "Beobachtungsbogen nicht gefunden" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
    include: { exercises: true },
  });

  const exercise = sheet.exerciseId
    ? assessment?.exercises?.find((e) => e.id === sheet.exerciseId)
    : null;

  let mtmmMappings: { weight: number; competencyNode: { name: string } }[] = [];
  if (sheet.exerciseId) {
    mtmmMappings = await prisma.exerciseCompetencyMapping.findMany({
      where: { exerciseId: sheet.exerciseId },
      include: { competencyNode: { select: { name: true } } },
      orderBy: { weight: "desc" },
    });
  }

  try {
    const PW = 595.28;
    const PH = 841.89;
    const ML = 55;
    const MR = 55;
    const CW = PW - ML - MR;

    const doc = new PDFDocument({
      layout: "portrait",
      size: "A4",
      margins: { top: 50, bottom: 60, left: ML, right: MR },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const accentColor = "#1e40af";
    const headingColor = "#0f172a";
    const bodyColor = "#374151";
    const mutedColor = "#6b7280";
    const lightRule = "#e2e8f0";

    function checkPage(needed: number = 80) {
      if (doc.y > PH - 70 - needed) {
        doc.addPage();
      }
    }

    doc.save();
    doc.rect(0, 0, PW, 3).fill(accentColor);
    doc.restore();

    doc.moveDown(0.5);
    doc.fontSize(18).font("Helvetica-Bold").fillColor(headingColor)
      .text("Beobachtungsbogen", ML);
    doc.moveDown(0.2);
    doc.fontSize(11).font("Helvetica").fillColor(accentColor)
      .text(sheet.name, ML, undefined, { width: CW });
    doc.moveDown(0.3);
    doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(lightRule).lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).fillColor(mutedColor).font("Helvetica");
    const metaLines: string[] = [];
    metaLines.push(`Assessment: ${assessment?.name || params.assessmentId}`);
    if (exercise) metaLines.push(`Übung: ${exercise.name} (${exercise.type || ""})`);
    metaLines.push(`Typ: ${sheet.type === "ai" ? "KI-generiert" : sheet.type === "template" ? "Vorlage" : "Manuell"}`);
    metaLines.push(`Erstellt: ${new Date(sheet.createdAt).toLocaleDateString("de-DE")}`);
    doc.text(metaLines.join("  ·  "), ML, undefined, { width: CW });
    doc.moveDown(0.5);

    const content = sheet.content as any;

    if (content && content.headerFields && Array.isArray(content.headerFields)) {
      checkPage(100);
      const fieldHeight = 22;
      const fieldWidth = CW / 2 - 5;
      const startY = doc.y;

      for (let i = 0; i < content.headerFields.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = ML + col * (fieldWidth + 10);
        const y = startY + row * (fieldHeight + 8);

        doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor)
          .text(content.headerFields[i] + ":", x, y);
        doc.moveTo(x, y + 14).lineTo(x + fieldWidth, y + 14).strokeColor(lightRule).lineWidth(0.5).stroke();
      }

      const totalRows = Math.ceil(content.headerFields.length / 2);
      doc.y = startY + totalRows * (fieldHeight + 8) + 5;
      doc.moveDown(0.5);
    }

    if (content?.description) {
      doc.fontSize(9).fillColor(bodyColor).font("Helvetica-Oblique")
        .text(content.description, ML, undefined, { width: CW, lineGap: 2 });
      doc.moveDown(0.6);
    }

    if (content && Array.isArray(content.sections) && content.sections.length > 0) {
      for (const section of content.sections) {
        checkPage(100);

        doc.save();
        doc.rect(ML, doc.y, CW, 22).fill("#f1f5f9");
        doc.restore();

        doc.fontSize(11).font("Helvetica-Bold").fillColor(headingColor)
          .text(section.title || section.competency || "Abschnitt", ML + 8, doc.y + 5, { width: CW - 16 });

        if (section.weight) {
          const weightLabel = section.weight >= 1.5 ? "Primär" : section.weight >= 1.0 ? "Standard" : "Sekundär";
          doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
            .text(`Gewicht: ${section.weight} (${weightLabel})`, ML + CW - 120, doc.y - 10, { width: 110, align: "right" });
        }

        doc.y += 12;
        doc.moveDown(0.4);

        if (Array.isArray(section.items)) {
          const ratingScale = content.ratingScale || "1-5";
          const maxRating = ratingScale === "1-4" ? 4 : ratingScale === "1-7" ? 7 : 5;

          for (const item of section.items) {
            checkPage(60);

            doc.fontSize(9).font("Helvetica-Bold").fillColor(bodyColor)
              .text(`• ${item.label || item.name || ""}`, ML + 5, undefined, { width: CW - 10 });

            if (item.helpText) {
              doc.fontSize(7.5).font("Helvetica-Oblique").fillColor(mutedColor)
                .text(item.helpText, ML + 15, undefined, { width: CW - 25, lineGap: 1 });
            }

            if (Array.isArray(item.anchors) && item.anchors.length > 0) {
              doc.moveDown(0.15);
              const anchorLabels = ["Unter Erwartung", "Erwartungsgemäß", "Über Erwartung"];
              for (let ai = 0; ai < item.anchors.length; ai++) {
                const label = ai < anchorLabels.length ? anchorLabels[ai] : `Stufe ${ai + 1}`;
                doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
                  .text(`${label}: `, ML + 15, undefined, { continued: true, width: CW - 30 });
                doc.fontSize(7).font("Helvetica").fillColor(bodyColor)
                  .text(item.anchors[ai], { width: CW - 30 });
              }
            }

            if (item.type === "rating") {
              doc.moveDown(0.2);
              const boxSize = 14;
              const boxGap = 6;
              const ratingStartX = ML + 15;
              const ratingY = doc.y;

              for (let r = 1; r <= maxRating; r++) {
                const bx = ratingStartX + (r - 1) * (boxSize + boxGap);
                doc.rect(bx, ratingY, boxSize, boxSize).strokeColor(lightRule).lineWidth(0.5).stroke();
                doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
                  .text(String(r), bx, ratingY + 3, { width: boxSize, align: "center" });
              }

              doc.y = ratingY + boxSize + 4;
            }

            doc.moveDown(0.3);
            doc.moveTo(ML + 5, doc.y).lineTo(ML + CW - 5, doc.y).strokeColor("#f1f5f9").lineWidth(0.3).stroke();
            doc.moveDown(0.3);
          }
        }

        doc.moveDown(0.6);
      }
    } else if (mtmmMappings.length > 0) {
      checkPage(60);
      doc.fontSize(11).fillColor(accentColor).font("Helvetica-Bold")
        .text("MTMM-Kompetenzen", ML);
      doc.moveDown(0.15);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(accentColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.fontSize(9).fillColor(bodyColor).font("Helvetica");
      for (const m of mtmmMappings) {
        checkPage(20);
        const weightLabel = m.weight >= 1.5 ? "Primär" : m.weight >= 1.0 ? "Standard" : "Sekundär";
        doc.text(`• ${m.competencyNode.name} — ${m.weight.toFixed(1)} (${weightLabel})`, ML + 5, undefined, { width: CW - 10 });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.5);
    }

    if (!content?.sections && sheet.description) {
      checkPage(60);
      doc.fontSize(11).fillColor(accentColor).font("Helvetica-Bold")
        .text("Beschreibung", ML);
      doc.moveDown(0.15);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(accentColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
        .text(sheet.description, ML, undefined, { width: CW, lineGap: 3 });
      doc.moveDown(0.8);
    }

    if (content?.footerNote) {
      checkPage(40);
      doc.moveDown(0.5);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(lightRule).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(mutedColor)
        .text(content.footerNote, ML, undefined, { width: CW, lineGap: 2 });
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
        .text("Executive Diagnostics Suite — Beobachtungsbogen  ·  Eco-Print", ML, PH - 45, { width: CW * 0.7, lineBreak: false });
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text(`Seite ${i + 1} / ${totalPages}`, ML + CW * 0.7, PH - 45, { width: CW * 0.3, align: "right", lineBreak: false });
      doc.restore();
    }

    doc.end();
    const pdfBuffer = await pdfPromise;

    const safeName = sheet.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Beobachtungsbogen_${safeName}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
