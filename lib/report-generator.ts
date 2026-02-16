import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageBreak,
  SectionType,
} from "docx";
// @ts-ignore
import PDFDocument from "pdfkit";
import PptxGenJS from "pptxgenjs";

export interface ReportData {
  assessmentName: string;
  assessmentDescription?: string;
  candidateName: string;
  candidateEmail?: string;
  workspaceName: string;
  generatedAt: Date;
  consolidatedScores: Array<{
    competencyName: string;
    consolidatedValue: number;
    normalizedValue: number;
    variance?: number;
    outlierFlag: boolean;
    moderatorOverride?: number;
    exerciseName?: string;
  }>;
  evidenceNotes: Array<{
    exerciseName: string;
    competencyName: string;
    observerName: string;
    notes: string;
    rating?: number;
  }>;
  aiRecommendations?: string;
  aiSections: string[];
  themeColors?: { primary: string; accent: string; text: string; bg: string };
  brandRules?: {
    colors?: { primary?: string; secondary?: string; accent?: string; background?: string };
    typography?: { headingFont?: string; bodyFont?: string; headingSize?: string; bodySize?: string };
    documentRules?: { coverPage?: boolean; headerFooter?: string; confidentialityNote?: string; pageNumbers?: boolean; watermark?: string };
    slideRules?: { titleSlide?: boolean; sectionDividers?: boolean; footer?: string; legalLine?: string };
    logoPlacement?: { position?: string; maxHeight?: string };
  };
}

function getStrengthsAndDevAreas(data: ReportData) {
  const uniqueScores = new Map<string, number>();
  for (const s of data.consolidatedScores) {
    const existing = uniqueScores.get(s.competencyName);
    if (existing === undefined || s.normalizedValue > existing) {
      uniqueScores.set(s.competencyName, s.normalizedValue);
    }
  }
  const sorted = Array.from(uniqueScores.entries()).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3).map(([name, val]) => `${name} (${val.toFixed(2)})`);
  const devAreas = sorted
    .slice(-3)
    .reverse()
    .map(([name, val]) => `${name} (${val.toFixed(2)})`);
  return { strengths, devAreas };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function aiLabel(sectionName: string, aiSections: string[]): string {
  return aiSections.includes(sectionName) ? " (KI-generiert)" : "";
}

export async function generateDocx(data: ReportData): Promise<Buffer> {
  const { strengths, devAreas } = getStrengthsAndDevAreas(data);

  const brandColors = data.brandRules?.colors;
  const brandBorderColor = brandColors?.accent?.replace("#", "") || "999999";

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: brandBorderColor,
  };
  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headingColor = brandColors?.primary?.replace("#", "") || undefined;

  const headerCell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: headingColor })] })],
      borders: cellBorders,
      width: { size: 20, type: WidthType.PERCENTAGE },
    });

  const dataCell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
      borders: cellBorders,
      width: { size: 20, type: WidthType.PERCENTAGE },
    });

  const scoresTable = new Table({
    rows: [
      new TableRow({
        children: [
          headerCell("Kompetenz"),
          headerCell("Konsolidiert"),
          headerCell("Normalisiert"),
          headerCell("Varianz"),
          headerCell("Outlier"),
        ],
      }),
      ...data.consolidatedScores.map(
        (s) =>
          new TableRow({
            children: [
              dataCell(s.competencyName + (s.exerciseName ? ` (${s.exerciseName})` : "")),
              dataCell(
                s.moderatorOverride !== undefined
                  ? s.moderatorOverride.toFixed(2)
                  : s.consolidatedValue.toFixed(2)
              ),
              dataCell(s.normalizedValue.toFixed(2)),
              dataCell(s.variance !== undefined ? s.variance.toFixed(2) : "-"),
              dataCell(s.outlierFlag ? "Ja" : "Nein"),
            ],
          })
      ),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const sections: Paragraph[] = [];

  sections.push(
    new Paragraph({
      text: `Diagnostik-Bericht: ${data.assessmentName}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );
  sections.push(
    new Paragraph({
      text: `Kandidat: ${data.candidateName} | ${data.workspaceName} | ${formatDate(data.generatedAt)}`,
      alignment: AlignmentType.CENTER,
    })
  );
  sections.push(new Paragraph({ text: "" }));

  sections.push(
    new Paragraph({
      text: `1. Executive Summary${aiLabel("executive_summary", data.aiSections)}`,
      heading: HeadingLevel.HEADING_1,
    })
  );
  sections.push(
    new Paragraph({
      text:
        data.assessmentDescription ||
        `Dieser Bericht fasst die Ergebnisse des Assessment Centers "${data.assessmentName}" für ${data.candidateName} zusammen.`,
    })
  );
  sections.push(new Paragraph({ text: "" }));

  sections.push(
    new Paragraph({
      text: "2. Kompetenzprofil",
      heading: HeadingLevel.HEADING_1,
    })
  );

  sections.push(
    new Paragraph({
      text: `3. Stärken & Entwicklungsfelder${aiLabel("strengths", data.aiSections)}`,
      heading: HeadingLevel.HEADING_1,
    })
  );
  sections.push(
    new Paragraph({
      text: "Top 3 Stärken:",
      heading: HeadingLevel.HEADING_2,
    })
  );
  for (const s of strengths) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `• ${s}` })],
      })
    );
  }
  sections.push(
    new Paragraph({
      text: "Top 3 Entwicklungsfelder:",
      heading: HeadingLevel.HEADING_2,
    })
  );
  for (const d of devAreas) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `• ${d}` })],
      })
    );
  }
  sections.push(new Paragraph({ text: "" }));

  sections.push(
    new Paragraph({
      text: "4. Evidenz-Zusammenfassung",
      heading: HeadingLevel.HEADING_1,
    })
  );
  const exerciseGroups = new Map<string, typeof data.evidenceNotes>();
  for (const en of data.evidenceNotes) {
    const group = exerciseGroups.get(en.exerciseName) || [];
    group.push(en);
    exerciseGroups.set(en.exerciseName, group);
  }
  Array.from(exerciseGroups.entries()).forEach(([exercise, notes]) => {
    sections.push(
      new Paragraph({
        text: exercise,
        heading: HeadingLevel.HEADING_2,
      })
    );
    for (const n of notes) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${n.competencyName} (${n.observerName}${n.rating !== undefined ? `, Bewertung: ${n.rating}` : ""}): `,
              bold: true,
            }),
            new TextRun({ text: n.notes }),
          ],
        })
      );
    }
  });
  sections.push(new Paragraph({ text: "" }));

  if (data.aiRecommendations) {
    sections.push(
      new Paragraph({
        text: `5. Empfehlungen${aiLabel("recommendations", data.aiSections)}`,
        heading: HeadingLevel.HEADING_1,
      })
    );
    sections.push(new Paragraph({ text: data.aiRecommendations }));
    sections.push(new Paragraph({ text: "" }));
  }

  const observers = Array.from(new Set(data.evidenceNotes.map((e) => e.observerName)));
  sections.push(
    new Paragraph({
      text: "6. Assessment-Metadaten",
      heading: HeadingLevel.HEADING_1,
    })
  );
  sections.push(new Paragraph({ text: `Assessment: ${data.assessmentName}` }));
  sections.push(new Paragraph({ text: `Kandidat: ${data.candidateName}` }));
  if (data.candidateEmail) {
    sections.push(new Paragraph({ text: `E-Mail: ${data.candidateEmail}` }));
  }
  sections.push(new Paragraph({ text: `Datum: ${formatDate(data.generatedAt)}` }));
  sections.push(new Paragraph({ text: `Beobachter: ${observers.join(", ") || "Keine"}` }));
  sections.push(new Paragraph({ text: `Workspace: ${data.workspaceName}` }));

  const docSectionHeaders: Record<string, unknown> = {};
  const docSectionFooters: Record<string, unknown> = {};

  if (data.brandRules?.documentRules?.headerFooter) {
    docSectionHeaders["default"] = new Header({
      children: [
        new Paragraph({
          children: [new TextRun({ text: data.brandRules.documentRules.headerFooter, size: 16, italics: true, color: headingColor || "666666" })],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    });
  }

  if (data.brandRules?.documentRules?.confidentialityNote) {
    docSectionFooters["default"] = new Footer({
      children: [
        new Paragraph({
          children: [new TextRun({ text: data.brandRules.documentRules.confidentialityNote, size: 14, italics: true, color: "999999" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  const docSections: Array<Record<string, unknown>> = [];

  if (data.brandRules?.documentRules?.coverPage) {
    docSections.push({
      properties: {
        type: SectionType.NEXT_PAGE,
      },
      headers: docSectionHeaders,
      footers: docSectionFooters,
      children: [
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: data.assessmentName, bold: true, size: 52, color: headingColor })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Diagnostik-Bericht`, size: 36, color: brandColors?.secondary?.replace("#", "") || headingColor })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: data.workspaceName, size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: formatDate(data.generatedAt), size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: data.brandRules?.typography?.headingFont ? `Schriftart: ${data.brandRules.typography.headingFont}` : "", size: 16, italics: true, color: "AAAAAA" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  docSections.push({
    ...(docSections.length > 0 ? { properties: { type: SectionType.NEXT_PAGE } } : {}),
    headers: docSectionHeaders,
    footers: docSectionFooters,
    children: [...sections.slice(0, 8), scoresTable, ...sections.slice(8)],
  });

  const doc = new Document({
    sections: docSections as any,
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

export async function generatePdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const brandColors = data.brandRules?.colors;
    const primary = brandColors?.primary || data.themeColors?.primary || "#1a365d";
    const secondary = brandColors?.secondary || primary;
    const accentColor = brandColors?.accent || data.themeColors?.accent || "#3182ce";
    const textColor = data.themeColors?.text || "#1a1a1a";
    const confidentialityNote = data.brandRules?.documentRules?.confidentialityNote;
    const watermark = data.brandRules?.documentRules?.watermark;

    const addPageDecorations = () => {
      if (watermark) {
        doc.save();
        doc.fontSize(48).fillColor("#EEEEEE").opacity(0.15);
        doc.text(watermark, 100, 350, { align: "center" });
        doc.opacity(1).restore();
      }
      if (confidentialityNote) {
        const savedY = doc.y;
        doc.fontSize(7).fillColor("#AAAAAA").text(confidentialityNote, 50, 810, { align: "center", width: 495 });
        doc.y = savedY;
      }
    };

    if (data.brandRules?.typography) {
      const typo = data.brandRules.typography;
      doc.fontSize(8).fillColor("#CCCCCC").text(
        `[Typography: Heading=${typo.headingFont || "default"}, Body=${typo.bodyFont || "default"}]`,
        { align: "right" }
      );
    }

    doc.on("pageAdded", () => addPageDecorations());
    addPageDecorations();

    doc.fontSize(22).fillColor(primary).text(`Diagnostik-Bericht`, { align: "center" });
    doc.fontSize(16).fillColor(secondary).text(data.assessmentName, { align: "center" });
    doc
      .fontSize(11)
      .fillColor(textColor)
      .text(
        `Kandidat: ${data.candidateName} | ${data.workspaceName} | ${formatDate(data.generatedAt)}`,
        { align: "center" }
      );
    doc.moveDown(2);

    const sectionTitle = (num: number, title: string, section?: string) => {
      const label = section ? aiLabel(section, data.aiSections) : "";
      doc.fontSize(14).fillColor(primary).text(`${num}. ${title}${label}`);
      doc.moveDown(0.5);
      doc.fillColor(textColor).fontSize(10);
    };

    sectionTitle(1, "Executive Summary", "executive_summary");
    doc.text(
      data.assessmentDescription ||
        `Dieser Bericht fasst die Ergebnisse des Assessment Centers "${data.assessmentName}" für ${data.candidateName} zusammen.`
    );
    doc.moveDown();

    sectionTitle(2, "Kompetenzprofil");
    const tableTop = doc.y;
    const colWidths = [160, 80, 80, 60, 60];
    const headers = ["Kompetenz", "Konsolidiert", "Normalisiert", "Varianz", "Outlier"];
    const tableLeft = 50;

    let xPos = tableLeft;
    doc.fontSize(8).fillColor("#ffffff");
    for (let i = 0; i < headers.length; i++) {
      const w = colWidths[i]!;
      doc.rect(xPos, tableTop, w, 18).fill(primary);
      doc.fillColor("#ffffff").text(headers[i]!, xPos + 3, tableTop + 4, { width: w - 6 });
      xPos += w;
    }

    let rowY = tableTop + 18;
    doc.fillColor(textColor).fontSize(8);
    for (const s of data.consolidatedScores) {
      if (rowY > 750) {
        doc.addPage();
        rowY = 50;
      }
      xPos = tableLeft;
      const rowData = [
        s.competencyName + (s.exerciseName ? ` (${s.exerciseName})` : ""),
        s.moderatorOverride !== undefined
          ? s.moderatorOverride.toFixed(2)
          : s.consolidatedValue.toFixed(2),
        s.normalizedValue.toFixed(2),
        s.variance !== undefined ? s.variance.toFixed(2) : "-",
        s.outlierFlag ? "Ja" : "Nein",
      ];
      for (let i = 0; i < rowData.length; i++) {
        const w = colWidths[i]!;
        doc.rect(xPos, rowY, w, 16).stroke("#cccccc");
        doc.text(rowData[i]!, xPos + 3, rowY + 3, { width: w - 6 });
        xPos += w;
      }
      rowY += 16;
    }
    doc.y = rowY + 10;
    doc.moveDown();

    const { strengths, devAreas } = getStrengthsAndDevAreas(data);
    sectionTitle(3, "Stärken & Entwicklungsfelder", "strengths");
    doc.fontSize(11).fillColor(primary).text("Top 3 Stärken:");
    doc.fillColor(textColor).fontSize(10);
    for (const s of strengths) {
      doc.text(`  • ${s}`);
    }
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(primary).text("Top 3 Entwicklungsfelder:");
    doc.fillColor(textColor).fontSize(10);
    for (const d of devAreas) {
      doc.text(`  • ${d}`);
    }
    doc.moveDown();

    sectionTitle(4, "Evidenz-Zusammenfassung");
    const exerciseGroups = new Map<string, typeof data.evidenceNotes>();
    for (const en of data.evidenceNotes) {
      const group = exerciseGroups.get(en.exerciseName) || [];
      group.push(en);
      exerciseGroups.set(en.exerciseName, group);
    }
    Array.from(exerciseGroups.entries()).forEach(([exercise, notes]) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).fillColor(primary).text(exercise);
      doc.fillColor(textColor).fontSize(9);
      for (const n of notes) {
        doc.text(
          `${n.competencyName} (${n.observerName}${n.rating !== undefined ? `, Bewertung: ${n.rating}` : ""}): ${n.notes}`,
          { indent: 10 }
        );
      }
      doc.moveDown(0.5);
    });

    if (data.aiRecommendations) {
      if (doc.y > 650) doc.addPage();
      sectionTitle(5, "Empfehlungen", "recommendations");
      doc.text(data.aiRecommendations);
      doc.moveDown();
    }

    if (doc.y > 680) doc.addPage();
    const metaNum = data.aiRecommendations ? 6 : 5;
    sectionTitle(metaNum, "Assessment-Metadaten");
    const observers = Array.from(new Set(data.evidenceNotes.map((e) => e.observerName)));
    doc.text(`Assessment: ${data.assessmentName}`);
    doc.text(`Kandidat: ${data.candidateName}`);
    if (data.candidateEmail) doc.text(`E-Mail: ${data.candidateEmail}`);
    doc.text(`Datum: ${formatDate(data.generatedAt)}`);
    doc.text(`Beobachter: ${observers.join(", ") || "Keine"}`);
    doc.text(`Workspace: ${data.workspaceName}`);

    doc.end();
  });
}

export async function generatePptx(data: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();

  const brandColors = data.brandRules?.colors;
  const primary = brandColors?.primary || data.themeColors?.primary || "#1a365d";
  const accent = brandColors?.accent || data.themeColors?.accent || "#3182ce";
  const textCol = data.themeColors?.text || "#1a1a1a";
  const bgCol = brandColors?.background || data.themeColors?.bg || "#ffffff";
  const slideFooter = data.brandRules?.slideRules?.footer;

  pptx.defineLayout({ name: "A4", width: 10, height: 7.5 });
  pptx.layout = "A4";

  const slideOpts = { fill: { color: bgCol.replace("#", "") } };

  const addSlideFooter = (slide: PptxGenJS.Slide) => {
    if (slideFooter) {
      slide.addText(slideFooter, {
        x: 0.5, y: 7.0, w: 9, h: 0.3,
        fontSize: 8, color: "999999", align: "center", italic: true,
      });
    }
  };

  const addDividerSlide = (title: string) => {
    if (data.brandRules?.slideRules?.sectionDividers) {
      const divider = pptx.addSlide();
      Object.assign(divider, { background: slideOpts });
      divider.addText(title, {
        x: 0.5, y: 2.5, w: 9, h: 2,
        fontSize: 28, bold: true, color: primary.replace("#", ""), align: "center", valign: "middle",
      });
      addSlideFooter(divider);
    }
  };

  const titleSlide = pptx.addSlide();
  Object.assign(titleSlide, { background: slideOpts });
  titleSlide.addText("Diagnostik-Bericht", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.2,
    fontSize: 32,
    bold: true,
    color: primary.replace("#", ""),
    align: "center",
  });
  titleSlide.addText(data.assessmentName, {
    x: 0.5,
    y: 2.8,
    w: 9,
    h: 0.8,
    fontSize: 22,
    color: accent.replace("#", ""),
    align: "center",
  });
  titleSlide.addText(
    `Kandidat: ${data.candidateName}\n${data.workspaceName}\n${formatDate(data.generatedAt)}`,
    {
      x: 0.5,
      y: 4,
      w: 9,
      h: 1.2,
      fontSize: 14,
      color: textCol.replace("#", ""),
      align: "center",
    }
  );
  addSlideFooter(titleSlide);

  addDividerSlide("Executive Summary");
  const summarySlide = pptx.addSlide();
  Object.assign(summarySlide, { background: slideOpts });
  const summaryLabel = `Executive Summary${aiLabel("executive_summary", data.aiSections)}`;
  summarySlide.addText(summaryLabel, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: primary.replace("#", ""),
  });
  summarySlide.addText(
    data.assessmentDescription ||
      `Dieser Bericht fasst die Ergebnisse des Assessment Centers "${data.assessmentName}" für ${data.candidateName} zusammen.`,
    {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 5,
      fontSize: 14,
      color: textCol.replace("#", ""),
      valign: "top",
    }
  );
  addSlideFooter(summarySlide);

  addDividerSlide("Kompetenzprofil");
  const scoresSlide = pptx.addSlide();
  Object.assign(scoresSlide, { background: slideOpts });
  scoresSlide.addText("Kompetenzprofil", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: primary.replace("#", ""),
  });

  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: "Kompetenz", options: { bold: true, fill: { color: primary.replace("#", "") }, color: "FFFFFF", fontSize: 10 } },
      { text: "Konsolidiert", options: { bold: true, fill: { color: primary.replace("#", "") }, color: "FFFFFF", fontSize: 10 } },
      { text: "Normalisiert", options: { bold: true, fill: { color: primary.replace("#", "") }, color: "FFFFFF", fontSize: 10 } },
      { text: "Varianz", options: { bold: true, fill: { color: primary.replace("#", "") }, color: "FFFFFF", fontSize: 10 } },
      { text: "Outlier", options: { bold: true, fill: { color: primary.replace("#", "") }, color: "FFFFFF", fontSize: 10 } },
    ],
  ];
  for (const s of data.consolidatedScores.slice(0, 12)) {
    tableRows.push([
      { text: s.competencyName + (s.exerciseName ? ` (${s.exerciseName})` : ""), options: { fontSize: 9 } },
      {
        text:
          s.moderatorOverride !== undefined
            ? s.moderatorOverride.toFixed(2)
            : s.consolidatedValue.toFixed(2),
        options: { fontSize: 9 },
      },
      { text: s.normalizedValue.toFixed(2), options: { fontSize: 9 } },
      { text: s.variance !== undefined ? s.variance.toFixed(2) : "-", options: { fontSize: 9 } },
      { text: s.outlierFlag ? "Ja" : "Nein", options: { fontSize: 9 } },
    ]);
  }
  scoresSlide.addTable(tableRows, {
    x: 0.3,
    y: 1.1,
    w: 9.4,
    colW: [3.5, 1.5, 1.5, 1.2, 1.0],
    border: { type: "solid", pt: 0.5, color: "CCCCCC" },
    fontSize: 9,
    color: textCol.replace("#", ""),
  });
  addSlideFooter(scoresSlide);

  const { strengths, devAreas } = getStrengthsAndDevAreas(data);
  addDividerSlide("Stärken & Entwicklungsfelder");
  const sdSlide = pptx.addSlide();
  Object.assign(sdSlide, { background: slideOpts });
  sdSlide.addText(`Stärken & Entwicklungsfelder${aiLabel("strengths", data.aiSections)}`, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: primary.replace("#", ""),
  });
  sdSlide.addText("Top 3 Stärken", {
    x: 0.5,
    y: 1.2,
    w: 4,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: accent.replace("#", ""),
  });
  sdSlide.addText(strengths.map((s) => `• ${s}`).join("\n"), {
    x: 0.5,
    y: 1.8,
    w: 4,
    h: 3,
    fontSize: 13,
    color: textCol.replace("#", ""),
    valign: "top",
  });
  sdSlide.addText("Top 3 Entwicklungsfelder", {
    x: 5,
    y: 1.2,
    w: 4.5,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: accent.replace("#", ""),
  });
  sdSlide.addText(devAreas.map((d) => `• ${d}`).join("\n"), {
    x: 5,
    y: 1.8,
    w: 4.5,
    h: 3,
    fontSize: 13,
    color: textCol.replace("#", ""),
    valign: "top",
  });
  addSlideFooter(sdSlide);

  addDividerSlide("Evidenz-Zusammenfassung");
  const evidenceSlide = pptx.addSlide();
  Object.assign(evidenceSlide, { background: slideOpts });
  evidenceSlide.addText("Evidenz-Zusammenfassung", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: primary.replace("#", ""),
  });
  const evidenceLines: string[] = [];
  const exerciseGroups = new Map<string, typeof data.evidenceNotes>();
  for (const en of data.evidenceNotes) {
    const group = exerciseGroups.get(en.exerciseName) || [];
    group.push(en);
    exerciseGroups.set(en.exerciseName, group);
  }
  Array.from(exerciseGroups.entries()).forEach(([exercise, notes]) => {
    evidenceLines.push(`\n${exercise}:`);
    for (const n of notes.slice(0, 3)) {
      evidenceLines.push(
        `  • ${n.competencyName} (${n.observerName}${n.rating !== undefined ? `, ${n.rating}` : ""}): ${n.notes.substring(0, 120)}${n.notes.length > 120 ? "..." : ""}`
      );
    }
    if (notes.length > 3) {
      evidenceLines.push(`  ... und ${notes.length - 3} weitere Einträge`);
    }
  });
  evidenceSlide.addText(evidenceLines.join("\n").substring(0, 2000), {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 5.5,
    fontSize: 10,
    color: textCol.replace("#", ""),
    valign: "top",
  });
  addSlideFooter(evidenceSlide);

  if (data.aiRecommendations) {
    addDividerSlide("Empfehlungen");
    const recSlide = pptx.addSlide();
    Object.assign(recSlide, { background: slideOpts });
    recSlide.addText(`Empfehlungen${aiLabel("recommendations", data.aiSections)}`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: primary.replace("#", ""),
    });
    recSlide.addText(data.aiRecommendations.substring(0, 3000), {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 5.5,
      fontSize: 12,
      color: textCol.replace("#", ""),
      valign: "top",
    });
    addSlideFooter(recSlide);
  }

  if (data.brandRules?.slideRules?.legalLine) {
    const legalSlide = pptx.addSlide();
    Object.assign(legalSlide, { background: slideOpts });
    legalSlide.addText(data.brandRules.slideRules.legalLine, {
      x: 0.5, y: 3.0, w: 9, h: 1.5,
      fontSize: 10, color: "999999", align: "center", valign: "middle", italic: true,
    });
    addSlideFooter(legalSlide);
  }

  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
