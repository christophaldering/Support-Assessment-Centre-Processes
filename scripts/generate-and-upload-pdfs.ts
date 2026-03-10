import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

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

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
};

const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  const lighter = rgb.map(c => Math.min(255, Math.round(c + (255 - c) * amount)));
  return `#${lighter.map(c => c.toString(16).padStart(2, "0")).join("")}`;
};

const typeLabels: Record<string, string> = {
  memo: "Internes Memorandum",
  report: "Bericht",
  email: "E-Mail Korrespondenz",
  analysis: "Analyse",
  survey: "Umfrage / Erhebung",
  briefing: "Briefing",
  minutes: "Protokoll",
  article: "Presseartikel",
};

function generatePdf(doc: DocInfo, logoPath: string | null): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PDFDocument = require("pdfkit");
    const pdf = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 56, right: 56 },
      bufferPages: true,
      info: {
        Title: doc.title,
        Author: "Varexia SE",
        Subject: doc.shortDescription || "",
        Creator: "Executive Diagnostics Platform",
      },
    });

    const chunks: Buffer[] = [];
    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const pageW = 595.28;
    const pageH = 841.89;
    const mL = 56;
    const mR = 56;
    const cW = pageW - mL - mR;

    const catColor = doc.category?.color || "#1e293b";
    const catLabel = doc.category?.labelDe || "Dokument";
    const rgb = hexToRgb(catColor);
    const lightBg = lightenColor(catColor, 0.92);
    const docTypeLabel = typeLabels[doc.documentType || ""] || (doc.documentType || "Dokument").charAt(0).toUpperCase() + (doc.documentType || "Dokument").slice(1);

    const isEmail = doc.documentType === "email";
    const isMemo = doc.documentType === "memo";
    const isArticle = doc.documentType === "article";
    const isAnalysis = doc.documentType === "analysis";
    const isMinutes = doc.documentType === "minutes";
    const isSurvey = doc.documentType === "survey";
    const isReport = doc.documentType === "report";

    function checkPage(needed: number, currentY: number): number {
      if (currentY + needed > pageH - 70) {
        pdf.addPage();
        drawPageHeader();
        return 56;
      }
      return currentY;
    }

    function drawPageHeader() {
      pdf.save();
      pdf.rect(0, 0, pageW, 6).fill(catColor);
      pdf.moveTo(mL, 20).lineTo(pageW - mR, 20).strokeColor("#f1f5f9").lineWidth(0.3).stroke();
      pdf.fontSize(6.5).fillColor("#94a3b8").font("Helvetica");
      pdf.text("VAREXIA SE", mL, 10, { width: cW * 0.5 });
      pdf.text(docTypeLabel.toUpperCase(), mL, 10, { width: cW, align: "right" });
      pdf.restore();
    }

    pdf.save();
    pdf.rect(0, 0, pageW, 6).fill(catColor);
    pdf.restore();

    let y = 16;

    if (logoPath && fs.existsSync(logoPath)) {
      try {
        pdf.image(logoPath, mL, y, { width: 36, height: 36 });
      } catch {}
    }

    pdf.fontSize(8).fillColor("#64748b").font("Helvetica");
    pdf.text("VAREXIA SE", mL + 44, y + 4, { width: 200 });
    pdf.fontSize(6.5).fillColor("#94a3b8");
    pdf.text("Societas Europaea · Frankfurt am Main", mL + 44, y + 16, { width: 200 });

    pdf.fontSize(6.5).fillColor("#94a3b8").font("Helvetica");
    pdf.text("VERTRAULICH", pageW - mR - 120, y + 4, { width: 120, align: "right" });
    pdf.text("Nur für autorisierte Personen", pageW - mR - 120, y + 14, { width: 120, align: "right" });

    y += 42;
    pdf.moveTo(mL, y).lineTo(pageW - mR, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    y += 12;

    pdf.save();
    const badgeBg = lightenColor(catColor, 0.88);
    const badgeTextWidth = pdf.fontSize(7).font("Helvetica-Bold").widthOfString(catLabel.toUpperCase());
    const badgePad = 8;
    const badgeW = badgeTextWidth + badgePad * 2;
    pdf.roundedRect(mL, y, badgeW, 18, 4).fill(badgeBg);
    pdf.fontSize(7).fillColor(rgb[0], rgb[1], rgb[2]).font("Helvetica-Bold");
    pdf.text(catLabel.toUpperCase(), mL + badgePad, y + 5, { width: badgeW - badgePad * 2 });
    pdf.restore();

    const typeBadgeX = mL + badgeW + 8;
    const typeBadgeTextW = pdf.fontSize(7).font("Helvetica").widthOfString(docTypeLabel);
    const typeBadgeW = typeBadgeTextW + 16;
    pdf.save();
    pdf.roundedRect(typeBadgeX, y, typeBadgeW, 18, 4).fill("#f8fafc");
    pdf.roundedRect(typeBadgeX, y, typeBadgeW, 18, 4).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    pdf.fontSize(7).fillColor("#64748b").font("Helvetica");
    pdf.text(docTypeLabel, typeBadgeX + 8, y + 5, { width: typeBadgeW - 16 });
    pdf.restore();

    y += 28;

    pdf.fontSize(20).fillColor("#0f172a").font("Helvetica-Bold");
    pdf.text(doc.title, mL, y, { width: cW, lineGap: 2 });
    y = pdf.y + 8;

    if (doc.shortDescription) {
      pdf.fontSize(10.5).fillColor("#475569").font("Helvetica-Oblique");
      pdf.text(doc.shortDescription, mL, y, { width: cW, lineGap: 2 });
      y = pdf.y + 10;
    }

    pdf.moveTo(mL, y).lineTo(mL + 60, y).strokeColor(catColor).lineWidth(2).stroke();
    y += 14;

    const rawText = doc.textSummary || doc.shortDescription || "";
    const lines = rawText.split("\n");

    let metaLines: { key: string; value: string }[] = [];
    let inMetaBlock = true;
    let bodyStartIndex = 0;

    if (isEmail || isMemo || isMinutes) {
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i]!.trim();
        if (!trimmed) {
          if (metaLines.length > 0) {
            bodyStartIndex = i + 1;
            break;
          }
          continue;
        }
        const metaMatch = trimmed.match(/^(Von|An|Datum|Date|From|To|Betreff|Subject|CC|Source|Abteilung|Verfasser|Ort|Zeit|Teilnehmer|Meeting|Anwesend|Following)\s*:\s*(.+)$/i);
        if (metaMatch && inMetaBlock) {
          metaLines.push({ key: metaMatch[1]!, value: metaMatch[2]! });
        } else if (metaLines.length > 0) {
          bodyStartIndex = i;
          break;
        } else {
          inMetaBlock = false;
        }
      }
    }

    if (metaLines.length > 0) {
      y = checkPage(metaLines.length * 18 + 24, y);
      const metaBoxH = metaLines.length * 18 + 16;
      pdf.save();
      pdf.roundedRect(mL, y, cW, metaBoxH, 6).fill(lightBg);
      pdf.roundedRect(mL, y, 4, metaBoxH, 2).fill(catColor);
      let my = y + 10;
      for (const m of metaLines) {
        pdf.fontSize(8.5).font("Helvetica-Bold").fillColor("#475569");
        pdf.text(m.key + ":", mL + 16, my, { continued: true, width: cW - 24 });
        pdf.font("Helvetica").fillColor("#1e293b");
        pdf.text("  " + m.value, { width: cW - 24 });
        my = pdf.y + 3;
      }
      pdf.restore();
      y += metaBoxH + 14;
    }

    if (isArticle) {
      const sourceLines: string[] = [];
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const t = lines[i]!.trim();
        if (t.match(/^Source:/i) || t.match(/^(Financial Times|Handelsblatt|Reuters|Bloomberg)/i)) {
          sourceLines.push(t);
          if (bodyStartIndex <= i) bodyStartIndex = i + 1;
        }
      }
      if (sourceLines.length > 0) {
        y = checkPage(36, y);
        pdf.save();
        pdf.roundedRect(mL, y, cW, 30, 6).fill("#f8fafc");
        pdf.roundedRect(mL, y, cW, 30, 6).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        pdf.fontSize(8).fillColor("#64748b").font("Helvetica-Oblique");
        pdf.text(sourceLines.join(" · "), mL + 14, y + 10, { width: cW - 28 });
        pdf.restore();
        y += 40;
      }
    }

    let quoteBuffer: string[] = [];
    let inNumberedSection = false;

    for (let li = bodyStartIndex; li < lines.length; li++) {
      const line = lines[li]!;
      const trimmed = line.trim();

      y = checkPage(20, y);

      if (!trimmed) {
        y += 6;
        continue;
      }

      if (trimmed === "---" || trimmed === "***" || trimmed === "===") {
        y += 4;
        pdf.save();
        pdf.moveTo(mL + 20, y).lineTo(pageW - mR - 20, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        pdf.restore();
        y += 10;
        continue;
      }

      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 60) {
        y = checkPage(50, y);
        y += 6;
        pdf.save();
        pdf.roundedRect(mL, y, cW, 0, 4).fill("white");
        pdf.rect(mL, y, 3, 60).fill(catColor);
        pdf.fontSize(10).fillColor("#475569").font("Helvetica-Oblique");
        pdf.text(trimmed, mL + 16, y + 8, { width: cW - 32, lineGap: 3 });
        const quoteH = pdf.y - y + 8;
        pdf.restore();
        pdf.save();
        pdf.roundedRect(mL, y, cW, quoteH, 4).fill(lightenColor(catColor, 0.95));
        pdf.rect(mL, y, 3, quoteH).fill(catColor);
        pdf.fontSize(10).fillColor("#475569").font("Helvetica-Oblique");
        pdf.text(trimmed, mL + 16, y + 8, { width: cW - 32, lineGap: 3 });
        pdf.restore();
        y += quoteH + 8;
        continue;
      }

      const metaMatch = trimmed.match(/^(Von|An|Datum|Date|From|To|Betreff|Subject|CC|Source|Abteilung|Verfasser|Ort|Zeit|Teilnehmer|Meeting|Anwesend)\s*:\s*(.+)$/i);
      if (metaMatch) {
        pdf.fontSize(8.5).font("Helvetica-Bold").fillColor("#475569");
        pdf.text(metaMatch[1] + ":", mL, y, { continued: true, width: cW });
        pdf.font("Helvetica").fillColor("#1e293b");
        pdf.text("  " + metaMatch[2], { width: cW });
        y = pdf.y + 4;
        continue;
      }

      if (/^[•\-–—]\s+/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[•\-–—]\s+/, "");
        y = checkPage(20, y);
        pdf.save();
        pdf.circle(mL + 5, y + 5, 2).fill(rgb[0], rgb[1], rgb[2]);
        pdf.fontSize(9.5).font("Helvetica").fillColor("#334155");
        pdf.text(bulletText, mL + 16, y, { width: cW - 16, lineGap: 2 });
        pdf.restore();
        y = pdf.y + 5;
        continue;
      }

      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const numStr = numberedMatch[1]!;
        const rest = numberedMatch[2]!;
        const isHeading = rest.length < 80 && !/[.!?]$/.test(rest);

        if (isHeading) {
          y = checkPage(30, y);
          y += 10;
          pdf.save();
          const circleR = 10;
          pdf.circle(mL + circleR, y + circleR, circleR).fill(catColor);
          pdf.fontSize(9).font("Helvetica-Bold").fillColor(255, 255, 255);
          const numW = pdf.widthOfString(numStr);
          pdf.text(numStr, mL + circleR - numW / 2, y + circleR - 5);
          pdf.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a");
          pdf.text(rest, mL + circleR * 2 + 10, y + circleR - 7, { width: cW - circleR * 2 - 10 });
          pdf.restore();
          y += Math.max(circleR * 2, pdf.y - y) + 6;
          inNumberedSection = true;
          continue;
        } else {
          pdf.fontSize(9.5).font("Helvetica").fillColor("#334155");
          pdf.text(trimmed, mL, y, { width: cW, lineGap: 2 });
          y = pdf.y + 5;
          continue;
        }
      }

      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3 &&
        trimmed.length < 80 &&
        !/[.!?;,]$/.test(trimmed) &&
        /[A-ZÄÖÜß]/.test(trimmed)
      ) {
        y = checkPage(30, y);
        y += 12;
        pdf.save();
        pdf.fontSize(13).font("Helvetica-Bold").fillColor("#0f172a");
        pdf.text(trimmed, mL, y, { width: cW });
        y = pdf.y + 3;
        pdf.moveTo(mL, y).lineTo(mL + Math.min(100, cW * 0.3), y).strokeColor(catColor).lineWidth(2).stroke();
        pdf.restore();
        y += 8;
        inNumberedSection = false;
        continue;
      }

      if (trimmed.includes("|")) {
        const cells = trimmed.split("|").map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
        if (cells.length >= 2) {
          y = checkPage(20, y);
          const cellW = cW / cells.length;
          const isHeader = cells.every(c => c === c.toUpperCase() || c.match(/^[A-Z]/));

          if (isHeader) {
            pdf.save();
            pdf.rect(mL, y, cW, 18).fill(catColor);
            for (let ci = 0; ci < cells.length; ci++) {
              pdf.fontSize(7.5).font("Helvetica-Bold").fillColor(255, 255, 255);
              pdf.text(cells[ci]!, mL + ci * cellW + 6, y + 5, { width: cellW - 12, align: "left" });
            }
            pdf.restore();
            y += 20;
          } else {
            const rowIndex = li;
            const isAltRow = rowIndex % 2 === 0;
            if (isAltRow) {
              pdf.save();
              pdf.rect(mL, y, cW, 16).fill("#f8fafc");
              pdf.restore();
            }
            pdf.save();
            for (let ci = 0; ci < cells.length; ci++) {
              pdf.fontSize(8).font("Helvetica").fillColor("#334155");
              pdf.text(cells[ci]!, mL + ci * cellW + 6, y + 4, { width: cellW - 12, align: "left" });
            }
            pdf.moveTo(mL, y + 16).lineTo(pageW - mR, y + 16).strokeColor("#f1f5f9").lineWidth(0.3).stroke();
            pdf.restore();
            y += 18;
          }
          continue;
        }
      }

      if (isAnalysis || isReport) {
        const kvMatch = trimmed.match(/^(.+?):\s+(€?[\d,.]+%?\s*.*)$/);
        if (kvMatch && kvMatch[1]!.length < 50) {
          y = checkPage(16, y);
          pdf.save();
          pdf.fontSize(8.5).font("Helvetica").fillColor("#64748b");
          pdf.text(kvMatch[1]!, mL, y + 1, { width: cW * 0.55 });
          pdf.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");
          pdf.text(kvMatch[2]!, mL + cW * 0.55, y + 1, { width: cW * 0.45, align: "right" });
          y += 14;
          pdf.moveTo(mL, y).lineTo(pageW - mR, y).strokeColor("#f1f5f9").lineWidth(0.3).stroke();
          pdf.restore();
          y += 4;
          continue;
        }
      }

      pdf.fontSize(9.5).font("Helvetica").fillColor("#334155");
      pdf.text(trimmed, mL, y, { width: cW, lineGap: 3 });
      y = pdf.y + 5;
    }

    y += 16;
    y = checkPage(40, y);

    pdf.save();
    pdf.moveTo(mL, y).lineTo(pageW - mR, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    y += 10;
    pdf.fontSize(7).fillColor("#94a3b8").font("Helvetica");
    pdf.text("Varexia SE · Vertraulich · Nur für den internen Gebrauch", mL, y, { width: cW, align: "center" });

    if (doc.confidentialityLabel) {
      y = pdf.y + 4;
      pdf.fontSize(7.5).fillColor("#dc2626").font("Helvetica-Bold");
      pdf.text(doc.confidentialityLabel.toUpperCase(), mL, y, { width: cW, align: "center" });
    }
    pdf.restore();

    const pageCount = pdf.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      pdf.switchToPage(i);
      pdf.save();
      pdf.fontSize(7).fillColor("#94a3b8").font("Helvetica");
      pdf.text(
        `Seite ${i + 1} von ${pageCount}`,
        mL,
        pageH - 40,
        { width: cW, align: "right" }
      );
      if (i > 0) {
        pdf.text(doc.title, mL, pageH - 40, { width: cW * 0.7, align: "left" });
      }
      pdf.restore();
    }

    pdf.end();
  });
}

async function main() {
  const prisma = new PrismaClient();

  const logoPath = path.resolve(__dirname, "../assets/varexia-logo.png");
  const hasLogo = fs.existsSync(logoPath);
  console.log(hasLogo ? `Logo found: ${logoPath}` : "No logo found, proceeding without logo");

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

    console.log(`Found ${documents.length} data room documents to process.\n`);

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
        console.log(`  Generating: ${doc.title}...`);
        const pdfBuffer = await generatePdf(docInfo, hasLogo ? logoPath : null);

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
        console.log(`  ✓ Done (${(pdfBuffer.length / 1024).toFixed(1)} KB)\n`);
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
