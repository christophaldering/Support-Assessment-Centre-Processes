import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import PDFDocument from "pdfkit";

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
}

function n(v: any): number {
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function s(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function getStorageClient() {
  const { Client } = require("@replit/object-storage");
  return new Client();
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const caseStudy = await prisma.caseStudy.findFirst({
    where: { id: params.caseStudyId, workspaceId: workspace.id },
  });

  if (!caseStudy) {
    return NextResponse.json({ error: "Fallstudie nicht gefunden" }, { status: 404 });
  }

  let data = caseStudy.dataJson as any;
  if (!data) {
    return NextResponse.json({ error: "Keine Daten vorhanden" }, { status: 400 });
  }
  if (data.data && typeof data.data === "object" && data.data.name) {
    data = data.data;
  }

  const questions = caseStudy.questionsJson as any;

  let logoBuffer: Buffer | null = null;
  let logoExt = "";
  try {
    const storageClient = getStorageClient();
    const possibleExts = ["png", "jpg", "jpeg", "webp", "svg"];
    for (const ext of possibleExts) {
      const key = `.private/case-study-logos/${params.caseStudyId}.${ext}`;
      try {
        const result = await storageClient.downloadAsBytes(key);
        if (result) {
          const chunks = Array.isArray(result) ? result : [result];
          logoBuffer = Buffer.concat(chunks.map((c: any) => Buffer.from(c)));
          logoExt = ext;
          break;
        }
      } catch { continue; }
    }
  } catch {}

  if (logoExt === "svg") {
    logoBuffer = null;
  }

  try {
    const doc = new PDFDocument({
      layout: "portrait",
      size: "A4",
      margins: { top: 50, bottom: 70, left: 55, right: 55 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const PW = 595.28;
    const PH = 841.89;
    const ML = 55;
    const MR = 55;
    const CW = PW - ML - MR;
    const copperStr = "rgb(163,82,55)";
    const navyStr = "rgb(15,23,42)";
    const bodyColor = "#374151";
    const mutedColor = "#6b7280";
    const lightMuted = "#9ca3af";
    const ruleColor = "#e2e8f0";
    const altRowBg = "#f8fafc";
    const headerRowBg = "#f1f5f9";

    let pageNum = 0;
    const tocEntries: { title: string; page: number }[] = [];

    function accentLine() {
      doc.save();
      doc.rect(0, 0, PW, 3).fill(copperStr);
      doc.restore();
    }

    function addFooter() {
      doc.save();
      doc.fontSize(7).font("Helvetica").fillColor(lightMuted)
        .text("© Christoph Aldering · Private initiative / concept", ML, PH - 45, { width: CW, align: "center" });
      doc.fontSize(6).font("Helvetica-Oblique").fillColor("#cbd5e1")
        .text("VERTRAULICH / CONFIDENTIAL", ML, PH - 35, { width: CW, align: "center" });
      doc.restore();
    }

    function newPage(tocTitle?: string) {
      if (pageNum > 0) {
        doc.addPage();
      }
      pageNum++;
      accentLine();
      if (tocTitle) {
        tocEntries.push({ title: tocTitle, page: pageNum });
      }
    }

    function sectionTitle(text: string) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor(copperStr).text(text, ML, undefined, { width: CW });
      doc.moveDown(0.2);
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(copperStr).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    }

    function subTitle(text: string) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(navyStr).text(text, ML, undefined, { width: CW });
      doc.moveDown(0.3);
    }

    function bodyText(text: string, opts?: any) {
      doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(text, ML, undefined, { width: CW, lineGap: 2, ...opts });
      doc.moveDown(0.3);
    }

    function thinRule() {
      doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(ruleColor).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }

    function checkPage(needed: number = 80) {
      if (doc.y > PH - 70 - needed) {
        addFooter();
        doc.addPage();
        pageNum++;
        accentLine();
        doc.y = 20;
      }
    }

    function drawTable(headers: string[], rows: string[][], colWidths: number[], startX: number) {
      const cellPadding = 4;
      const rowHeight = 18;
      let y = doc.y;
      const totalW = colWidths.reduce((a, b) => a + b, 0);

      let x = startX;
      doc.rect(startX, y, totalW, rowHeight).fill(headerRowBg);
      doc.rect(startX, y, totalW, rowHeight).strokeColor(ruleColor).lineWidth(0.5).stroke();
      headers.forEach((h, i) => {
        doc.fontSize(7).font("Helvetica-Bold").fillColor(navyStr).text(h, x + cellPadding, y + 4, { width: colWidths[i] - cellPadding * 2 });
        x += colWidths[i];
      });
      y += rowHeight;

      rows.forEach((row, ri) => {
        checkPage(rowHeight + 5);
        if (doc.y !== y && doc.y < 30) {
          y = doc.y;
        }
        if (ri % 2 === 0) {
          doc.rect(startX, y, totalW, rowHeight).fill(altRowBg);
        }
        doc.rect(startX, y, totalW, rowHeight).strokeColor(ruleColor).lineWidth(0.3).stroke();
        x = startX;
        row.forEach((cell, ci) => {
          doc.fontSize(7).font("Helvetica").fillColor(bodyColor).text(cell, x + cellPadding, y + 4, { width: colWidths[ci] - cellPadding * 2 });
          x += colWidths[ci];
        });
        y += rowHeight;
      });
      doc.y = y + 5;
    }

    function renderMultilineContent(content: string) {
      const lines = content.split("\n");
      lines.forEach((line: string) => {
        checkPage(14);
        if (line.trim() === "") {
          doc.moveDown(0.3);
        } else if (line.startsWith("  ") || line.startsWith("\t")) {
          doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(line, ML + 20, undefined, { width: CW - 20, lineGap: 2 });
        } else if (line.match(/^[-–—•]/)) {
          doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(line, ML + 10, undefined, { width: CW - 10, lineGap: 2 });
        } else if (line.match(/^(Best regards|Mit freundlichen Grüßen|Kind regards|Viele Grüße|Herzliche Grüße)/i)) {
          doc.moveDown(0.3);
          doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(line, ML, undefined, { width: CW, lineGap: 2 });
        } else if (line.match(/^(Tel|Phone|Fax|Mobile|E-Mail|Email|Web|www\.|http|\+49|\+1|\+44)/i) || line.match(/^[A-Z][a-zäöü]+ [A-Z][a-zäöü]+\s*$/)) {
          doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(line, ML, undefined, { width: CW, lineGap: 1 });
        } else if (line.match(/^(Diese E-Mail|This email|Confidential|DISCLAIMER|Vertraulich)/i)) {
          doc.fontSize(7).font("Helvetica-Oblique").fillColor(lightMuted).text(line, ML, undefined, { width: CW, lineGap: 1 });
        } else {
          doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(line, ML, undefined, { width: CW, lineGap: 2 });
        }
      });
    }

    newPage();
    doc.y = 15;

    doc.moveTo(ML, 12).lineTo(ML + CW, 12).strokeColor(copperStr).lineWidth(1).stroke();
    doc.moveTo(ML, PH - 55).lineTo(ML + CW, PH - 55).strokeColor(copperStr).lineWidth(1).stroke();

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PW / 2 - 50, 120, { width: 100, height: 100, fit: [100, 100], align: "center", valign: "center" });
        doc.y = 240;
      } catch {
        doc.y = 180;
      }
    } else {
      doc.y = 180;
    }

    doc.fillColor(navyStr).fontSize(28).font("Helvetica-Bold")
      .text(data.name || caseStudy.companyName || "Case Study", ML, undefined, { width: CW, align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").fillColor(mutedColor)
      .text(data.description || "", ML, undefined, { width: CW, align: "center" });
    doc.moveDown(2);

    doc.moveTo(PW / 2 - 60, doc.y).lineTo(PW / 2 + 60, doc.y).strokeColor(copperStr).lineWidth(0.8).stroke();
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor(copperStr).font("Helvetica-Bold")
      .text("Executive Assessment – Case Study", ML, undefined, { width: CW, align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(9).font("Helvetica").fillColor(lightMuted)
      .text(`Erstellt: ${new Date().toLocaleDateString("de-DE")}`, ML, undefined, { width: CW, align: "center" });
    if (caseStudy.referenceDate) {
      doc.text(`Referenzdatum: ${caseStudy.referenceDate}`, ML, undefined, { width: CW, align: "center" });
    }

    addFooter();

    newPage("Inhaltsverzeichnis");
    doc.y = 20;
    sectionTitle("Inhaltsverzeichnis");
    doc.moveDown(0.5);

    const tocPlaceholderY = doc.y;
    const tocPageIndex = pageNum;

    doc.moveDown(20);
    addFooter();

    if (data.briefing) {
      newPage("Aufgabenstellung / Briefing");
      doc.y = 20;
      sectionTitle("Aufgabenstellung / Briefing");

      subTitle("Ihre Rolle");
      bodyText(data.briefing.role || "");

      checkPage();
      subTitle("Situation");
      bodyText(data.briefing.situation || "");

      if (data.briefing.tasks && data.briefing.tasks.length > 0) {
        checkPage();
        subTitle("Ihre Aufgaben");
        data.briefing.tasks.forEach((t: string, i: number) => {
          checkPage(16);
          bodyText(`${i + 1}. ${t}`);
        });
      }

      if (data.briefing.analysisQuestions && data.briefing.analysisQuestions.length > 0) {
        checkPage();
        subTitle("Analysefragen");
        data.briefing.analysisQuestions.forEach((q: string, i: number) => {
          checkPage(16);
          bodyText(`${i + 1}. ${q}`);
        });
      }

      if (data.briefing.conclusionQuestions && data.briefing.conclusionQuestions.length > 0) {
        checkPage();
        subTitle("Schlussfolgerungen");
        data.briefing.conclusionQuestions.forEach((q: string, i: number) => {
          checkPage(16);
          bodyText(`${i + 1}. ${q}`);
        });
      }

      checkPage(50);
      thinRule();
      subTitle("Zeitrahmen");
      bodyText(`Individuelle Analyse: ${data.briefing.timeMinutes || 60} Minuten`);
      bodyText(`Präsentation: ${data.briefing.presentationMinutes || 15} Minuten`);
      addFooter();
    }

    newPage("Übersicht");
    doc.y = 20;
    sectionTitle("Unternehmensübersicht");

    if (data.metrics && data.metrics.length > 0) {
      subTitle("Key Performance Indicators");
      const metricRows = data.metrics.map((m: any) => [s(m.label), s(m.value), s(m.trend)]);
      drawTable(["KPI", "Wert", "Trend"], metricRows, [200, 150, CW - 350], ML);
      doc.moveDown(0.5);
    }

    if (data.businessUnits && data.businessUnits.length > 0) {
      checkPage();
      subTitle(`Geschäftseinheiten (${data.businessUnits.length})`);
      data.businessUnits.forEach((bu: any) => {
        if (!bu) return;
        checkPage(60);
        doc.fontSize(10).font("Helvetica-Bold").fillColor(navyStr).text(s(bu.name), ML);
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`Umsatz: €${n(bu.revenue).toFixed(2)} Mrd  |  EBITDA: €${n(bu.ebitda).toFixed(2)} Mrd  |  Marge: ${n(bu.margin)}%  |  MA: ${n(bu.employees).toLocaleString()}`, ML);
        if (bu.tension) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(copperStr).text(s(bu.tension), ML);
        }
        doc.moveDown(0.4);
      });
    }
    addFooter();

    if (data.strategicAnalysis) {
      const sa = data.strategicAnalysis;
      newPage("Strategische Analyse");
      doc.y = 20;
      sectionTitle("Strategische Analyse");

      if (sa.executiveSummary) {
        subTitle("Executive Summary");
        bodyText(sa.executiveSummary);
        doc.moveDown(0.3);
      }

      if (sa.swot) {
        checkPage(120);
        subTitle("SWOT-Analyse");
        const swotW = CW / 2 - 5;
        const swotData = [
          { label: "Stärken (Strengths)", items: sa.swot.strengths || [], color: "#16a34a" },
          { label: "Schwächen (Weaknesses)", items: sa.swot.weaknesses || [], color: "#dc2626" },
          { label: "Chancen (Opportunities)", items: sa.swot.opportunities || [], color: "#2563eb" },
          { label: "Risiken (Threats)", items: sa.swot.threats || [], color: "#d97706" },
        ];

        swotData.forEach((q, idx) => {
          if (idx === 2) {
            checkPage(80);
          }
          checkPage(40);
          doc.fontSize(9).font("Helvetica-Bold").fillColor(q.color).text(q.label, ML);
          (q.items || []).forEach((item: string) => {
            checkPage(14);
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${item}`, ML + 10, undefined, { width: CW - 10 });
          });
          doc.moveDown(0.4);
        });
        doc.moveDown(0.3);
      }

      if (sa.solutionApproaches) {
        if (sa.solutionApproaches.strategic && sa.solutionApproaches.strategic.length > 0) {
          checkPage();
          subTitle("Strategische Lösungsansätze");
          sa.solutionApproaches.strategic.forEach((approach: any) => {
            checkPage(30);
            doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text(s(approach.title), ML);
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(s(approach.description), ML, undefined, { width: CW });
            doc.moveDown(0.3);
          });
        }

        if (sa.solutionApproaches.bscPerspectives) {
          checkPage(80);
          subTitle("BSC-Perspektiven");
          const bsc = sa.solutionApproaches.bscPerspectives;
          const perspectives = [
            { label: "Finanzen", items: bsc.financial || [] },
            { label: "Kunden", items: bsc.customer || [] },
            { label: "Prozesse", items: bsc.processes || [] },
            { label: "Lernen & Wachstum", items: bsc.learningGrowth || [] },
          ];
          perspectives.forEach((p) => {
            if (p.items.length === 0) return;
            checkPage(30);
            doc.fontSize(9).font("Helvetica-Bold").fillColor(copperStr).text(p.label, ML);
            p.items.forEach((item: string) => {
              checkPage(14);
              doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${item}`, ML + 10, undefined, { width: CW - 10 });
            });
            doc.moveDown(0.3);
          });
        }

        if (sa.solutionApproaches.quickwins && sa.solutionApproaches.quickwins.length > 0) {
          checkPage();
          subTitle("Quick Wins");
          const qwHeaders = ["Maßnahme", "Impact", "Aufwand"];
          const qwRows = sa.solutionApproaches.quickwins.map((qw: any) => [s(qw.title), s(qw.impact), s(qw.effort)]);
          drawTable(qwHeaders, qwRows, [CW * 0.5, CW * 0.25, CW * 0.25], ML);
        }
      }
      addFooter();
    }

    const hasFinancials = data.detailedBalanceSheet || data.balanceSheet || (data.cashFlow && data.cashFlow.length > 0) || data.stressScenario;
    if (hasFinancials) {
      newPage("Finanzanalyse");
      doc.y = 20;
      sectionTitle("Finanzanalyse");

      if (data.balanceSheet && data.balanceSheet.length > 0) {
        subTitle("Bilanzübersicht");
        const bsRows = data.balanceSheet.map((item: any) => [s(item.name), `€${n(item.value).toFixed(2)} Mrd`, s(item.type)]);
        drawTable(["Position", "Wert", "Typ"], bsRows, [CW * 0.5, CW * 0.25, CW * 0.25], ML);
        doc.moveDown(0.5);
      }

      if (data.detailedBalanceSheet?.assets) {
        checkPage();
        subTitle("Detaillierte Bilanz – Aktiva");
        if (data.detailedBalanceSheet.assets.nonCurrent?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Anlagevermögen", ML);
          doc.moveDown(0.2);
          const ncRows = data.detailedBalanceSheet.assets.nonCurrent.map((a: any) => [s(a.item), `€${n(a.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], ncRows, [CW * 0.7, CW * 0.3], ML);
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.assets.current?.length > 0) {
          checkPage();
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Umlaufvermögen", ML);
          doc.moveDown(0.2);
          const cRows = data.detailedBalanceSheet.assets.current.map((a: any) => [s(a.item), `€${n(a.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], cRows, [CW * 0.7, CW * 0.3], ML);
        }
        doc.moveDown(0.5);
      }

      if (data.detailedBalanceSheet?.equityLiabilities) {
        checkPage();
        subTitle("Detaillierte Bilanz – Passiva");
        if (data.detailedBalanceSheet.equityLiabilities.equity?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Eigenkapital", ML);
          doc.moveDown(0.2);
          const eRows = data.detailedBalanceSheet.equityLiabilities.equity.map((l: any) => [s(l.item), `€${n(l.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], eRows, [CW * 0.7, CW * 0.3], ML);
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities?.length > 0) {
          checkPage();
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Langfristige Verbindlichkeiten", ML);
          doc.moveDown(0.2);
          const nlRows = data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((l: any) => [s(l.item), `€${n(l.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], nlRows, [CW * 0.7, CW * 0.3], ML);
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.equityLiabilities.currentLiabilities?.length > 0) {
          checkPage();
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Kurzfristige Verbindlichkeiten", ML);
          doc.moveDown(0.2);
          const clRows = data.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((l: any) => [s(l.item), `€${n(l.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], clRows, [CW * 0.7, CW * 0.3], ML);
        }
        doc.moveDown(0.5);
      }

      if (data.cashFlow && data.cashFlow.length > 0) {
        checkPage();
        subTitle("Cash Flow");
        const cfRows = data.cashFlow.map((cf: any) => {
          const cat = cf.category ? s(cf.category) : "";
          return [cat, s(cf.item), `€${n(cf.value).toFixed(0)} Mio`];
        });
        const hasCat = data.cashFlow.some((cf: any) => cf.category);
        if (hasCat) {
          drawTable(["Kategorie", "Position", "Wert"], cfRows, [CW * 0.3, CW * 0.45, CW * 0.25], ML);
        } else {
          const cfSimple = data.cashFlow.map((cf: any) => [s(cf.item), `€${n(cf.value).toFixed(0)} Mio`]);
          drawTable(["Position", "Wert"], cfSimple, [CW * 0.7, CW * 0.3], ML);
        }
        doc.moveDown(0.5);
      }

      if (data.stressScenario) {
        checkPage();
        subTitle("Stress-Szenario");
        if (data.stressScenario.title) {
          doc.fontSize(10).font("Helvetica-Bold").fillColor(navyStr).text(s(data.stressScenario.title), ML);
          doc.moveDown(0.2);
        }
        if (data.stressScenario.description) {
          bodyText(data.stressScenario.description);
        }

        if (data.stressScenario.assumptions && data.stressScenario.assumptions.length > 0) {
          checkPage(40);
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Annahmen:", ML);
          data.stressScenario.assumptions.forEach((a: string) => {
            checkPage(14);
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${a}`, ML + 10, undefined, { width: CW - 10 });
          });
          doc.moveDown(0.3);
        }

        if (data.stressScenario.items && data.stressScenario.items.length > 0) {
          checkPage();
          const stRows = data.stressScenario.items.map((item: any) => [s(item.item), `€${n(item.amount).toFixed(0)} Mio`, s(item.comment)]);
          drawTable(["Position", "Betrag", "Kommentar"], stRows, [CW * 0.35, CW * 0.2, CW * 0.45], ML);
          doc.moveDown(0.3);
        }

        if (data.stressScenario.keyDrivers && data.stressScenario.keyDrivers.length > 0) {
          checkPage(40);
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Wesentliche Treiber:", ML);
          data.stressScenario.keyDrivers.forEach((d: string) => {
            checkPage(14);
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${d}`, ML + 10, undefined, { width: CW - 10 });
          });
          doc.moveDown(0.3);
        }

        if (data.stressScenario.implications && data.stressScenario.implications.length > 0) {
          checkPage(40);
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Implikationen:", ML);
          data.stressScenario.implications.forEach((imp: string) => {
            checkPage(14);
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${imp}`, ML + 10, undefined, { width: CW - 10 });
          });
          doc.moveDown(0.3);
        }

        if (data.stressScenario.projections && data.stressScenario.projections.length > 0) {
          checkPage();
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Projektionen:", ML);
          doc.moveDown(0.2);
          const projRows = data.stressScenario.projections.map((p: any) => [
            s(p.year),
            `€${n(p.revenue).toFixed(1)} Mrd`,
            `€${n(p.ebitda).toFixed(2)} Mrd`,
            `€${n(p.cashFlow).toFixed(2)} Mrd`,
          ]);
          drawTable(["Jahr", "Umsatz", "EBITDA", "Cash Flow"], projRows, [CW * 0.2, CW * 0.27, CW * 0.27, CW * 0.26], ML);
        }
      }
      addFooter();
    }

    if (data.emails && data.emails.length > 0) {
      data.emails.forEach((email: any, idx: number) => {
        if (!email) return;
        newPage(idx === 0 ? "Kommunikation – E-Mails" : undefined);
        doc.y = 20;

        doc.fontSize(7).font("Helvetica").fillColor(lightMuted)
          .text(`E-Mail ${idx + 1} von ${data.emails.length}`, ML, doc.y, { width: CW, align: "right" });
        doc.moveDown(0.3);

        doc.fontSize(12).font("Helvetica-Bold").fillColor(navyStr).text(s(email.subject) || "Kein Betreff", ML, undefined, { width: CW });
        doc.moveDown(0.3);

        doc.fontSize(8).font("Helvetica").fillColor(lightMuted).text("Von: ", ML, undefined, { continued: true });
        doc.fillColor(bodyColor).text(s(email.from));
        if (email.to) {
          doc.fontSize(8).fillColor(lightMuted).text("An: ", ML, undefined, { continued: true });
          doc.fillColor(bodyColor).text(s(email.to));
        }
        if (email.cc) {
          doc.fontSize(8).fillColor(lightMuted).text("CC: ", ML, undefined, { continued: true });
          doc.fillColor(bodyColor).text(s(email.cc));
        }
        doc.fontSize(8).fillColor(lightMuted).text("Datum: ", ML, undefined, { continued: true });
        doc.fillColor(bodyColor).text(s(email.date));
        if (email.important) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#dc2626").text("⚑ WICHTIG / PRIORITY", ML);
        }

        doc.moveDown(0.4);
        thinRule();
        doc.moveDown(0.2);

        renderMultilineContent(s(email.content));
        addFooter();
      });
    }

    if (data.protocols && data.protocols.length > 0) {
      data.protocols.forEach((p: any, idx: number) => {
        if (!p) return;
        newPage(idx === 0 ? "Kommunikation – Protokolle" : undefined);
        doc.y = 20;

        doc.fontSize(7).font("Helvetica").fillColor(lightMuted)
          .text(`Protokoll ${idx + 1} von ${data.protocols.length}`, ML, doc.y, { width: CW, align: "right" });
        doc.moveDown(0.3);

        doc.fontSize(12).font("Helvetica-Bold").fillColor(navyStr).text(s(p.title), ML, undefined, { width: CW });
        doc.moveDown(0.3);
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`Datum: ${s(p.date)}${p.location ? `  ·  Ort: ${s(p.location)}` : ""}`, ML);
        if (p.participants) {
          doc.fontSize(8).fillColor(mutedColor).text(`Teilnehmer: ${s(p.participants)}`, ML);
        }
        if (p.type) {
          doc.fontSize(8).fillColor(mutedColor).text(`Typ: ${s(p.type)}`, ML);
        }

        doc.moveDown(0.4);
        thinRule();
        doc.moveDown(0.2);

        renderMultilineContent(s(p.content));
        addFooter();
      });
    }

    if (data.newsArticles && data.newsArticles.length > 0) {
      data.newsArticles.forEach((article: any, idx: number) => {
        if (!article) return;
        newPage(idx === 0 ? "Kommunikation – Nachrichtenartikel" : undefined);
        doc.y = 20;

        doc.fontSize(7).font("Helvetica").fillColor(lightMuted)
          .text(`Artikel ${idx + 1} von ${data.newsArticles.length}`, ML, doc.y, { width: CW, align: "right" });
        doc.moveDown(0.3);

        doc.fontSize(14).font("Helvetica-Bold").fillColor(navyStr).text(s(article.headline) || s(article.title), ML, undefined, { width: CW });
        if (article.subtitle) {
          doc.fontSize(10).font("Helvetica-Oblique").fillColor(mutedColor).text(s(article.subtitle), ML, undefined, { width: CW });
        }
        doc.moveDown(0.2);
        doc.fontSize(8).font("Helvetica").fillColor(lightMuted).text(`${s(article.source)}  ·  ${s(article.date)}`, ML);
        doc.moveDown(0.4);
        thinRule();
        doc.moveDown(0.2);

        renderMultilineContent(s(article.content));
        addFooter();
      });
    }

    if (data.hrSurvey && data.hrSurvey.categories && data.hrSurvey.categories.length > 0) {
      newPage("HR-Dashboard / Mitarbeiterbefragung");
      doc.y = 20;
      sectionTitle("HR-Dashboard / Mitarbeiterbefragung");

      if (data.hrSurvey.title) {
        subTitle(data.hrSurvey.title);
      }
      doc.fontSize(9).font("Helvetica").fillColor(bodyColor)
        .text(`Eingeladen: ${data.hrSurvey.participantsInvited || "–"}  |  Rücklaufquote: ${data.hrSurvey.responseRate || "–"}%`, ML);
      doc.moveDown(0.5);

      data.hrSurvey.categories.forEach((cat: any) => {
        checkPage(60);
        doc.fontSize(10).font("Helvetica-Bold").fillColor(navyStr).text(cat.name, ML);
        doc.moveDown(0.2);
        const surveyRows = cat.items.map((item: any) => {
          const score = n(item.score);
          const bar = "█".repeat(Math.round(score)) + "░".repeat(Math.max(0, 5 - Math.round(score)));
          return [item.question, score.toFixed(1), bar];
        });
        drawTable(["Frage", "Score", ""], surveyRows, [CW * 0.55, CW * 0.15, CW * 0.3], ML);
        doc.moveDown(0.3);
      });

      if (data.hrSurvey.comments && data.hrSurvey.comments.length > 0) {
        checkPage();
        subTitle("Kommentare");
        data.hrSurvey.comments.forEach((c: string) => {
          checkPage(16);
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(mutedColor).text(`"${c}"`, ML + 10, undefined, { width: CW - 10 });
          doc.moveDown(0.2);
        });
      }

      if (data.hrSurvey.hrComment) {
        checkPage(40);
        subTitle("HR-Kommentar");
        bodyText(data.hrSurvey.hrComment);
      }
      addFooter();
    }

    const hasMgmt = data.managementTeam && data.managementTeam.length > 0;
    const hasBoard = data.boardImpressions && data.boardImpressions.length > 0;
    if (hasMgmt || hasBoard) {
      newPage("Management Team & Board Impressions");
      doc.y = 20;
      sectionTitle("Management Team & Board Impressions");

      if (hasMgmt) {
        subTitle("Management Team");
        data.managementTeam.forEach((member: any) => {
          checkPage(50);
          doc.fontSize(10).font("Helvetica-Bold").fillColor(navyStr).text(s(member.name), ML);
          doc.fontSize(8).font("Helvetica").fillColor(copperStr).text(s(member.role), ML);
          if (member.division) {
            doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(`Division: ${s(member.division)}`, ML);
          }
          if (member.age) {
            doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(`Alter: ${member.age}`, ML);
          }
          if (member.background) {
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(s(member.background), ML, undefined, { width: CW });
          }
          if (member.assessment) {
            doc.fontSize(8).font("Helvetica-Oblique").fillColor(mutedColor).text(s(member.assessment), ML, undefined, { width: CW });
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.3);
      }

      if (hasBoard) {
        checkPage();
        thinRule();
        subTitle("Board Impressions");
        data.boardImpressions.forEach((bi: any) => {
          checkPage(40);
          const nameOrTitle = bi.name || bi.title || "";
          const roleOrTopic = bi.role || bi.topic || "";
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text(s(nameOrTitle), ML, undefined, { continued: roleOrTopic ? true : false });
          if (roleOrTopic) {
            doc.font("Helvetica").fillColor(mutedColor).text(`  –  ${s(roleOrTopic)}`);
          }
          if (bi.impression) {
            doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(s(bi.impression), ML, undefined, { width: CW });
          }
          if (bi.sentiment) {
            const sentColor = bi.sentiment === "positive" ? "#16a34a" : bi.sentiment === "negative" ? "#dc2626" : "#d97706";
            doc.fontSize(7).font("Helvetica-Oblique").fillColor(sentColor).text(`Sentiment: ${s(bi.sentiment)}`, ML);
          }
          doc.moveDown(0.3);
        });
      }
      addFooter();
    }

    if (data.analystReport) {
      const ar = data.analystReport;
      newPage("Analyst Report");
      doc.y = 20;
      sectionTitle("Analyst Report");

      if (ar.title) {
        subTitle(ar.title);
      }
      if (ar.source || ar.analyst) {
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(`Quelle: ${s(ar.source || ar.analyst)}`, ML);
      }
      if (ar.rating) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor(copperStr).text(`Rating: ${s(ar.rating)}`, ML);
      }
      if (ar.targetPrice) {
        doc.fontSize(9).font("Helvetica").fillColor(bodyColor).text(`Kursziel: ${s(ar.targetPrice)}`, ML);
      }
      doc.moveDown(0.3);

      if (ar.summary) {
        subTitle("Zusammenfassung");
        bodyText(ar.summary);
      }

      if (ar.conclusion) {
        checkPage(40);
        subTitle("Fazit");
        bodyText(ar.conclusion);
      }

      if (ar.keyPoints && ar.keyPoints.length > 0) {
        checkPage();
        subTitle("Kernpunkte");
        ar.keyPoints.forEach((kp: string) => {
          checkPage(14);
          doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${kp}`, ML + 10, undefined, { width: CW - 10 });
        });
        doc.moveDown(0.3);
      }

      if (ar.observations && ar.observations.length > 0) {
        checkPage();
        subTitle("Beobachtungen");
        ar.observations.forEach((obs: string) => {
          checkPage(14);
          doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${obs}`, ML + 10, undefined, { width: CW - 10 });
        });
        doc.moveDown(0.3);
      }

      if (ar.criticalQuestions && ar.criticalQuestions.length > 0) {
        checkPage();
        subTitle("Kritische Fragen");
        ar.criticalQuestions.forEach((cq: string) => {
          checkPage(14);
          doc.fontSize(8).font("Helvetica").fillColor(bodyColor).text(`  • ${cq}`, ML + 10, undefined, { width: CW - 10 });
        });
        doc.moveDown(0.3);
      }

      if (ar.indicators && ar.indicators.length > 0) {
        checkPage();
        subTitle("Indikatoren");
        const indRows = ar.indicators.map((ind: any) => [s(ind.label), s(ind.value)]);
        drawTable(["Indikator", "Wert"], indRows, [CW * 0.5, CW * 0.5], ML);
      }
      addFooter();
    }

    if (data.organigramm && data.organigramm.length > 0) {
      newPage("Organigramm");
      doc.y = 20;
      sectionTitle("Organigramm");

      const departments = new Map<string, any[]>();
      data.organigramm.forEach((person: any) => {
        const dept = person.department || "Sonstige";
        if (!departments.has(dept)) departments.set(dept, []);
        departments.get(dept)!.push(person);
      });

      departments.forEach((members, dept) => {
        checkPage(50);
        doc.fontSize(10).font("Helvetica-Bold").fillColor(copperStr).text(dept, ML);
        doc.moveDown(0.2);
        members.forEach((m: any) => {
          checkPage(20);
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text(s(m.name), ML, undefined, { continued: true });
          doc.font("Helvetica").fillColor(mutedColor).text(`  –  ${s(m.role)}`);
          if (m.reportsTo) {
            doc.fontSize(7).fillColor(lightMuted).text(`    Reports to: ${s(m.reportsTo)}`, ML);
          }
        });
        doc.moveDown(0.4);
      });
      addFooter();
    }

    const hasLeadership = data.leadershipSummary || data.leadershipConference;
    if (hasLeadership) {
      newPage("Leadership Summary & Konferenz");
      doc.y = 20;
      sectionTitle("Leadership Summary & Konferenz");

      if (data.leadershipSummary) {
        subTitle("Leadership Summary");
        renderMultilineContent(s(data.leadershipSummary));
        doc.moveDown(0.5);
      }

      if (data.leadershipConference) {
        checkPage();
        thinRule();
        subTitle("Leadership Conference");
        renderMultilineContent(s(data.leadershipConference));
      }
      addFooter();
    }

    if (questions) {
      newPage("Bewertungsfragen");
      doc.y = 20;
      sectionTitle("Bewertungsfragen / Assessment Questions");

      if (questions.analysis && questions.analysis.length > 0) {
        subTitle("Analysefragen");
        questions.analysis.forEach((q: string, i: number) => {
          checkPage(20);
          bodyText(`${i + 1}. ${q}`);
        });
        doc.moveDown(0.5);
      }

      if (questions.conclusions && questions.conclusions.length > 0) {
        checkPage();
        subTitle("Schlussfolgerungen");
        questions.conclusions.forEach((q: string, i: number) => {
          checkPage(20);
          bodyText(`${i + 1}. ${q}`);
        });
      }
      addFooter();
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).font("Helvetica").fillColor(lightMuted)
        .text(`Seite ${i + 1} von ${range.count}`, ML, PH - 55, { width: CW, align: "right" });
    }

    if (tocEntries.length > 0) {
      doc.switchToPage(tocPageIndex - 1);
      let tocY = tocPlaceholderY;
      tocEntries.forEach((entry) => {
        doc.fontSize(9).font("Helvetica").fillColor(bodyColor)
          .text(entry.title, ML, tocY, { width: CW - 50 });
        doc.fontSize(9).font("Helvetica").fillColor(lightMuted)
          .text(String(entry.page), ML + CW - 40, tocY, { width: 40, align: "right" });
        tocY += 18;
      });
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    const fileName = `${(data.name || "Fallstudie").replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_")}_Case_Study.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("PDF export error:", err?.message || err, err?.stack);
    return NextResponse.json({ error: `Fehler beim PDF-Export: ${err?.message || "Unbekannter Fehler"}` }, { status: 500 });
  }
}
