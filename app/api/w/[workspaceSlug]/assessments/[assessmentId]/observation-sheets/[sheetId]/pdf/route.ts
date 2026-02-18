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

    const accentColor = "#a35237";
    const headingColor = "#1e293b";
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
    doc.moveDown(0.8);

    if (mtmmMappings.length > 0) {
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

    if (sheet.description) {
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

    if (sheet.content) {
      checkPage(60);
      doc.fontSize(11).fillColor(accentColor).font("Helvetica-Bold")
        .text("Inhalt", ML);
      doc.moveDown(0.15);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(accentColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);

      const content = sheet.content as any;
      if (typeof content === "string") {
        doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
          .text(content, ML, undefined, { width: CW, lineGap: 3 });
      } else if (Array.isArray(content)) {
        for (const item of content) {
          checkPage(30);
          if (typeof item === "string") {
            doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
              .text(`• ${item}`, ML + 5, undefined, { width: CW - 10 });
            doc.moveDown(0.2);
          } else if (item && typeof item === "object") {
            if (item.title || item.name || item.label) {
              doc.fontSize(10).fillColor(headingColor).font("Helvetica-Bold")
                .text(item.title || item.name || item.label, ML, undefined, { width: CW });
              doc.moveDown(0.15);
            }
            if (item.description || item.text || item.value) {
              doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
                .text(String(item.description || item.text || item.value), ML + 5, undefined, { width: CW - 10, lineGap: 2 });
              doc.moveDown(0.3);
            }
            if (item.items && Array.isArray(item.items)) {
              for (const subItem of item.items) {
                checkPage(20);
                doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
                  .text(`  – ${typeof subItem === "string" ? subItem : subItem.text || subItem.name || JSON.stringify(subItem)}`, ML + 10, undefined, { width: CW - 20 });
                doc.moveDown(0.1);
              }
            }
            doc.moveDown(0.3);
          }
        }
      } else if (typeof content === "object") {
        const renderObj = (obj: any, indent: number) => {
          for (const [key, val] of Object.entries(obj)) {
            checkPage(20);
            if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
              doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
                .text(`${key}: ${val}`, ML + indent, undefined, { width: CW - indent });
              doc.moveDown(0.1);
            } else if (Array.isArray(val)) {
              doc.fontSize(9).fillColor(headingColor).font("Helvetica-Bold")
                .text(`${key}:`, ML + indent, undefined, { width: CW - indent });
              doc.moveDown(0.1);
              for (const item of val) {
                checkPage(20);
                doc.fontSize(9).fillColor(bodyColor).font("Helvetica")
                  .text(`• ${typeof item === "string" ? item : JSON.stringify(item)}`, ML + indent + 5, undefined, { width: CW - indent - 10 });
                doc.moveDown(0.1);
              }
            }
          }
        };
        renderObj(content, 0);
      }
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
