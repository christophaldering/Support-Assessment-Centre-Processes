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
    const doc = new PDFDocument({
      layout: "portrait",
      size: "A4",
      margins: { top: 50, bottom: 60, left: 55, right: 55 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const pageW = 595.28 - 110;
    const copper = [163, 82, 55] as [number, number, number];
    const navy = [15, 23, 42] as [number, number, number];
    const copperStr = `rgb(${copper.join(",")})`;
    const navyStr = `rgb(${navy.join(",")})`;
    const slateStr = "rgb(100,116,139)";

    doc.rect(0, 0, 595.28, 65).fill(copperStr);
    doc.fillColor("white").fontSize(18).font("Helvetica-Bold")
      .text("Beobachtungsbogen", 55, 18, { width: pageW });
    doc.fontSize(10).font("Helvetica")
      .text(sheet.name, 55, 42, { width: pageW });

    doc.fillColor(navyStr).moveDown(2);
    let y = 90;

    doc.fontSize(9).fillColor(slateStr).font("Helvetica");
    doc.text(`Assessment: ${assessment?.name || params.assessmentId}`, 55, y);
    y += 16;
    if (exercise) {
      doc.text(`Übung: ${exercise.name} (${exercise.type || ""})`, 55, y);
      y += 16;
    }
    doc.text(`Typ: ${sheet.type === "ai" ? "KI-generiert" : sheet.type === "template" ? "Vorlage" : "Manuell"}`, 55, y);
    y += 16;
    doc.text(`Erstellt: ${new Date(sheet.createdAt).toLocaleDateString("de-DE")}`, 55, y);
    y += 24;

    if (mtmmMappings.length > 0) {
      doc.fontSize(11).fillColor(navyStr).font("Helvetica-Bold")
        .text("MTMM-Kompetenzen", 55, y);
      y += 18;
      doc.fontSize(9).fillColor(slateStr).font("Helvetica");
      for (const m of mtmmMappings) {
        const weightLabel = m.weight >= 1.5 ? "Primär" : m.weight >= 1.0 ? "Standard" : "Sekundär";
        doc.text(`• ${m.competencyNode.name} — Gewicht: ${m.weight.toFixed(1)} (${weightLabel})`, 60, y, { width: pageW - 10 });
        y += 14;
        if (y > 750) { doc.addPage(); y = 50; }
      }
      y += 10;
    }

    if (sheet.description) {
      doc.fontSize(11).fillColor(navyStr).font("Helvetica-Bold")
        .text("Beschreibung", 55, y);
      y += 18;
      doc.fontSize(9).fillColor(slateStr).font("Helvetica")
        .text(sheet.description, 55, y, { width: pageW, lineGap: 3 });
      y = doc.y + 16;
    }

    if (sheet.content) {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.fontSize(11).fillColor(navyStr).font("Helvetica-Bold")
        .text("Inhalt", 55, y);
      y += 18;

      const content = sheet.content as any;
      if (typeof content === "string") {
        doc.fontSize(9).fillColor(slateStr).font("Helvetica")
          .text(content, 55, y, { width: pageW, lineGap: 3 });
      } else if (Array.isArray(content)) {
        for (const item of content) {
          if (y > 730) { doc.addPage(); y = 50; }
          if (typeof item === "string") {
            doc.fontSize(9).fillColor(slateStr).font("Helvetica")
              .text(`• ${item}`, 60, y, { width: pageW - 10 });
            y = doc.y + 6;
          } else if (item && typeof item === "object") {
            if (item.title || item.name || item.label) {
              doc.fontSize(10).fillColor(navyStr).font("Helvetica-Bold")
                .text(item.title || item.name || item.label, 55, y, { width: pageW });
              y = doc.y + 4;
            }
            if (item.description || item.text || item.value) {
              doc.fontSize(9).fillColor(slateStr).font("Helvetica")
                .text(String(item.description || item.text || item.value), 60, y, { width: pageW - 10, lineGap: 2 });
              y = doc.y + 8;
            }
            if (item.items && Array.isArray(item.items)) {
              for (const subItem of item.items) {
                if (y > 730) { doc.addPage(); y = 50; }
                doc.fontSize(9).fillColor(slateStr).font("Helvetica")
                  .text(`  – ${typeof subItem === "string" ? subItem : subItem.text || subItem.name || JSON.stringify(subItem)}`, 65, y, { width: pageW - 20 });
                y = doc.y + 4;
              }
            }
          }
        }
      } else if (typeof content === "object") {
        const renderObj = (obj: any, indent: number) => {
          for (const [key, val] of Object.entries(obj)) {
            if (y > 730) { doc.addPage(); y = 50; }
            if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
              doc.fontSize(9).fillColor(slateStr).font("Helvetica")
                .text(`${key}: ${val}`, 55 + indent, y, { width: pageW - indent });
              y = doc.y + 4;
            } else if (Array.isArray(val)) {
              doc.fontSize(9).fillColor(navyStr).font("Helvetica-Bold")
                .text(`${key}:`, 55 + indent, y, { width: pageW - indent });
              y = doc.y + 4;
              for (const item of val) {
                if (y > 730) { doc.addPage(); y = 50; }
                doc.fontSize(9).fillColor(slateStr).font("Helvetica")
                  .text(`• ${typeof item === "string" ? item : JSON.stringify(item)}`, 60 + indent, y, { width: pageW - indent - 10 });
                y = doc.y + 4;
              }
            }
          }
        };
        renderObj(content, 0);
      }
    }

    const footerY = 841.89 - 40;
    doc.fontSize(7).fillColor(slateStr).font("Helvetica")
      .text("Executive Diagnostics Suite — Beobachtungsbogen", 55, footerY, { width: pageW, align: "center" });
    doc.text("Eco-Print · minimaler Tintenverbrauch", 55, footerY + 10, { width: pageW, align: "center" });

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
