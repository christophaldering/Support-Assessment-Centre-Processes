import { PrismaClient } from "@prisma/client";

const SIDECAR = "http://127.0.0.1:1106";

async function signUrl(bucketName: string, objectName: string, method: "GET" | "PUT", ttlSec: number): Promise<string> {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Failed to sign URL: ${res.status}`);
  const { signed_url } = await res.json();
  return signed_url;
}

async function uploadBuffer(objectPath: string, buffer: Buffer, contentType: string): Promise<void> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  const fullPath = `/${bucketId}/${objectPath}`;
  const parts = fullPath.split("/");
  const bucketName = parts[1]!;
  const objectName = parts.slice(2).join("/");
  const url = await signUrl(bucketName, objectName, "PUT", 900);
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: buffer });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

interface DocInfo {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  textSummary: string | null;
  documentType: string | null;
  confidentialityLabel: string | null;
  assessmentId: string;
  category?: { labelDe: string; color: string } | null;
}

function generatePdf(doc: DocInfo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PDFDocument = require("pdfkit");
    const pdf = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 60, right: 60 },
      info: {
        Title: doc.title,
        Author: "Varexia SE",
        Subject: doc.shortDescription || "",
      },
    });

    const chunks: Buffer[] = [];
    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const pageW = 595.28;
    const marginL = 60;
    const marginR = 60;
    const contentW = pageW - marginL - marginR;

    const catColor = doc.category?.color || "#1e293b";
    const catLabel = doc.category?.labelDe || "Dokument";

    const hexToRgb = (hex: string) => {
      const h = hex.replace("#", "");
      return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)] as [number, number, number];
    };

    const rgb = hexToRgb(catColor);

    pdf.rect(0, 0, pageW, 8).fill(catColor);

    pdf.fontSize(9).fillColor("#94a3b8").text("VAREXIA SE", marginL, 24, { width: contentW });
    pdf.fontSize(8).fillColor("#cbd5e1").text("VERTRAULICH — NUR FÜR AUTORISIERTE PERSONEN", marginL, 36, { width: contentW, align: "right" });

    pdf.moveTo(marginL, 52).lineTo(pageW - marginR, 52).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

    let y = 66;

    pdf.roundedRect(marginL, y, 6, 28, 2).fill(catColor);
    pdf.fontSize(8).fillColor(rgb[0], rgb[1], rgb[2]).text(catLabel.toUpperCase(), marginL + 14, y + 2, { width: contentW - 14 });

    const docTypeLabel = (doc.documentType || "dokument").charAt(0).toUpperCase() + (doc.documentType || "dokument").slice(1);
    pdf.fontSize(7).fillColor("#94a3b8").text(docTypeLabel, marginL + 14, y + 14, { width: contentW - 14 });

    y += 42;

    pdf.fontSize(18).fillColor("#0f172a").font("Helvetica-Bold");
    pdf.text(doc.title, marginL, y, { width: contentW });
    y = pdf.y + 10;

    if (doc.shortDescription) {
      pdf.fontSize(10).fillColor("#64748b").font("Helvetica-Oblique");
      pdf.text(doc.shortDescription, marginL, y, { width: contentW });
      y = pdf.y + 8;
    }

    pdf.moveTo(marginL, y).lineTo(pageW - marginR, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    y += 16;

    const rawText = doc.textSummary || doc.shortDescription || "";
    const lines = rawText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (y > 770) {
        pdf.addPage();
        pdf.rect(0, 0, pageW, 4).fill(catColor);
        y = 40;
      }

      if (!trimmed) {
        y += 6;
        continue;
      }

      if (trimmed === "---" || trimmed === "***" || trimmed === "===") {
        pdf.moveTo(marginL, y + 4).lineTo(pageW - marginR, y + 4).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        y += 14;
        continue;
      }

      const metaMatch = trimmed.match(/^(Von|An|Datum|Date|From|To|Betreff|Subject|CC|Source|Abteilung|Verfasser|Ort|Zeit|Teilnehmer|Meeting|Anwesend)\s*:\s*(.+)$/i);
      if (metaMatch) {
        pdf.fontSize(8).font("Helvetica-Bold").fillColor("#475569");
        pdf.text(metaMatch[1] + ":", marginL, y, { continued: true, width: contentW });
        pdf.font("Helvetica").fillColor("#1e293b");
        pdf.text("  " + metaMatch[2], { width: contentW });
        y = pdf.y + 3;
        continue;
      }

      if (/^[•\-–—]\s+/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[•\-–—]\s+/, "");
        pdf.fontSize(9.5).font("Helvetica").fillColor("#334155");
        const bulletY = y + 4;
        pdf.circle(marginL + 4, bulletY, 1.8).fill(rgb[0], rgb[1], rgb[2]);
        pdf.fillColor("#334155");
        pdf.text(bulletText, marginL + 14, y, { width: contentW - 14 });
        y = pdf.y + 4;
        continue;
      }

      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3 &&
        trimmed.length < 80 &&
        !/[.!?;,]$/.test(trimmed) &&
        /[A-ZÄÖÜß]/.test(trimmed)
      ) {
        y += 8;
        pdf.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a");
        pdf.text(trimmed, marginL, y, { width: contentW });
        y = pdf.y + 4;
        pdf.moveTo(marginL, y).lineTo(marginL + 80, y).strokeColor(catColor).lineWidth(1.5).stroke();
        y += 8;
        continue;
      }

      const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
      if (numberedMatch && trimmed.length < 100 && !/[.!?]$/.test(numberedMatch[2]!)) {
        y += 6;
        pdf.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b");
        pdf.text(trimmed, marginL, y, { width: contentW });
        y = pdf.y + 4;
        continue;
      }

      if (trimmed.includes("|")) {
        const cells = trimmed.split("|").map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
        if (cells.length >= 2) {
          const cellW = contentW / cells.length;
          for (let ci = 0; ci < cells.length; ci++) {
            pdf.fontSize(8).font("Helvetica").fillColor("#334155");
            pdf.text(cells[ci]!, marginL + ci * cellW, y, { width: cellW - 4, align: "left" });
          }
          y = pdf.y + 3;
          continue;
        }
      }

      pdf.fontSize(9.5).font("Helvetica").fillColor("#334155");
      pdf.text(trimmed, marginL, y, { width: contentW, lineGap: 3 });
      y = pdf.y + 5;
    }

    y += 20;
    if (y > 770) {
      pdf.addPage();
      y = 40;
    }

    pdf.moveTo(marginL, y).lineTo(pageW - marginR, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    y += 10;
    pdf.fontSize(7).fillColor("#94a3b8").font("Helvetica");
    pdf.text("Varexia SE · Vertraulich · Nur für den internen Gebrauch", marginL, y, { width: contentW, align: "center" });

    if (doc.confidentialityLabel) {
      y = pdf.y + 4;
      pdf.fontSize(7).fillColor("#dc2626").font("Helvetica-Bold");
      pdf.text(doc.confidentialityLabel.toUpperCase(), marginL, y, { width: contentW, align: "center" });
    }

    pdf.end();
  });
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const documents = await prisma.portalDocument.findMany({
      where: {
        category: "data-room",
        textSummary: { not: null },
      },
      include: {
        dataRoomCategory: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    console.log(`Found ${documents.length} data room documents to process.`);

    let successCount = 0;

    for (const doc of documents) {
      const docInfo: DocInfo = {
        id: doc.id,
        slug: doc.slug || doc.id,
        title: doc.title,
        shortDescription: doc.shortDescription,
        textSummary: doc.textSummary,
        documentType: doc.documentType,
        confidentialityLabel: doc.confidentialityLabel,
        assessmentId: doc.assessmentId,
        category: doc.dataRoomCategory
          ? { labelDe: doc.dataRoomCategory.labelDe, color: doc.dataRoomCategory.color }
          : null,
      };

      try {
        console.log(`  Generating PDF: ${doc.title}...`);
        const pdfBuffer = await generatePdf(docInfo);

        const objectPath = `.private/portal/${doc.assessmentId}/dataroom_${docInfo.slug}.pdf`;
        console.log(`  Uploading (${(pdfBuffer.length / 1024).toFixed(1)} KB) → ${objectPath}`);
        await uploadBuffer(objectPath, pdfBuffer, "application/pdf");

        await prisma.portalDocument.update({
          where: { id: doc.id },
          data: {
            objectPath,
            fileName: `${docInfo.slug}.pdf`,
            fileSize: pdfBuffer.length,
            mimeType: "application/pdf",
            downloadAllowed: true,
          },
        });

        successCount++;
        console.log(`  ✓ Done: ${doc.title}`);
      } catch (err) {
        console.error(`  ✗ Failed: ${doc.title}`, err);
      }
    }

    console.log(`\n=== Complete: ${successCount}/${documents.length} PDFs generated and uploaded ===`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
