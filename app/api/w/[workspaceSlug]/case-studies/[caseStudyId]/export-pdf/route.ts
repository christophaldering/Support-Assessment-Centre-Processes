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

  try {
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const pageW = 841.89 - 120;
    const copper = [163, 82, 55] as [number, number, number];
    const navy = [15, 23, 42] as [number, number, number];

    function addHeader(title: string, subtitle?: string) {
      doc.rect(0, 0, 841.89, 80).fill(`rgb(${navy.join(",")})`);
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold").text(title, 60, 25, { width: pageW });
      if (subtitle) {
        doc.fontSize(10).font("Helvetica").text(subtitle, 60, 52, { width: pageW });
      }
      doc.fillColor("black").moveDown(2);
      doc.y = 100;
    }

    function sectionTitle(text: string) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor(`rgb(${copper.join(",")})`).text(text);
      doc.moveDown(0.3);
      doc.fillColor("black");
    }

    function bodyText(text: string) {
      doc.fontSize(9).font("Helvetica").fillColor("#374151").text(text, { width: pageW, lineGap: 2 });
      doc.moveDown(0.5);
    }

    function checkPage(needed: number = 120) {
      if (doc.y > 595.28 - 50 - needed) {
        doc.addPage();
      }
    }

    // --- COVER PAGE ---
    doc.rect(0, 0, 841.89, 595.28).fill(`rgb(${navy.join(",")})`);
    doc.fillColor("white").fontSize(36).font("Helvetica-Bold")
      .text(data.name || caseStudy.companyName || "Case Study", 60, 180, { width: pageW, align: "center" });
    doc.fontSize(16).font("Helvetica")
      .text(data.description || "", 60, 240, { width: pageW, align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).fillColor(`rgb(${copper.join(",")})`)
      .text("Executive Assessment – Case Study", 60, 320, { width: pageW, align: "center" });
    doc.fontSize(10).fillColor("white")
      .text(`Generated: ${new Date().toLocaleDateString("de-DE")}`, 60, 360, { width: pageW, align: "center" });
    if (caseStudy.referenceDate) {
      doc.text(`Referenzdatum: ${caseStudy.referenceDate}`, 60, 380, { width: pageW, align: "center" });
    }

    // --- BRIEFING ---
    if (data.briefing) {
      doc.addPage();
      addHeader("Aufgabenstellung", "Independent Assessment · Confidential");

      sectionTitle("Your Role / Situation");
      bodyText(data.briefing.role || "");
      bodyText(data.briefing.situation || "");

      if (data.briefing.tasks && data.briefing.tasks.length > 0) {
        checkPage();
        sectionTitle("Your Tasks");
        data.briefing.tasks.forEach((t: string, i: number) => {
          bodyText(`${i + 1}. ${t}`);
        });
      }

      if (data.briefing.analysisQuestions && data.briefing.analysisQuestions.length > 0) {
        checkPage();
        sectionTitle("Analysis Questions");
        data.briefing.analysisQuestions.forEach((q: string, i: number) => {
          bodyText(`${i + 1}. ${q}`);
        });
      }

      if (data.briefing.conclusionQuestions && data.briefing.conclusionQuestions.length > 0) {
        checkPage();
        sectionTitle("Conclusion Questions");
        data.briefing.conclusionQuestions.forEach((q: string, i: number) => {
          bodyText(`${i + 1}. ${q}`);
        });
      }

      checkPage(60);
      sectionTitle("Framework");
      bodyText(`Individual Analysis: ${data.briefing.timeMinutes || 60} minutes`);
      bodyText(`Presentation: ${data.briefing.presentationMinutes || 15} minutes`);
    }

    // --- OVERVIEW ---
    doc.addPage();
    addHeader("Übersicht", data.name);

    if (data.metrics && data.metrics.length > 0) {
      sectionTitle("Key Performance Indicators");
      const colW = pageW / Math.min(data.metrics.length, 4);
      const startX = 60;
      const startY = doc.y;
      data.metrics.forEach((m: any, i: number) => {
        const x = startX + (i % 4) * colW;
        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(s(m.label), x, startY, { width: colW - 10 });
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#1e293b").text(s(m.value), x, startY + 12, { width: colW - 10 });
        const trendColor = s(m.trend).includes("down") ? "#ef4444" : m.trend === "up" ? "#22c55e" : "#6b7280";
        doc.fontSize(8).font("Helvetica").fillColor(trendColor).text(s(m.trend), x, startY + 30, { width: colW - 10 });
      });
      doc.y = startY + 50;
      doc.moveDown(1);
    }

    // --- BUSINESS UNITS ---
    if (data.businessUnits && data.businessUnits.length > 0) {
      checkPage();
      sectionTitle(`Geschäftseinheiten (${data.businessUnits.length})`);
      data.businessUnits.forEach((bu: any) => {
        if (!bu) return;
        checkPage(80);
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(s(bu.name));
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280")
          .text(`Umsatz: €${n(bu.revenue).toFixed(2)} Mrd  |  EBITDA: €${n(bu.ebitda).toFixed(2)} Mrd  |  Marge: ${n(bu.margin)}%  |  MA: ${n(bu.employees).toLocaleString()}`);
        if (bu.tension) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor("#92400e").text(s(bu.tension));
        }
        doc.moveDown(0.5);
      });
    }

    // --- EMAILS ---
    if (data.emails && data.emails.length > 0) {
      doc.addPage();
      addHeader("Kommunikation", `${data.emails.length} E-Mails`);

      data.emails.forEach((email: any) => {
        if (!email) return;
        checkPage(100);
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(s(email.subject) || "No Subject");
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280")
          .text(`Von: ${s(email.from)}  |  ${s(email.date)}${email.to ? `  |  An: ${s(email.to)}` : ""}`);
        doc.moveDown(0.3);
        const content = s(email.content);
        doc.fontSize(8).font("Helvetica").fillColor("#374151").text(content.substring(0, 800), { width: pageW, lineGap: 1 });
        if (content.length > 800) {
          doc.fontSize(7).fillColor("#9ca3af").text("[...]");
        }
        doc.moveDown(0.8);
        doc.moveTo(60, doc.y).lineTo(60 + pageW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        doc.moveDown(0.5);
      });
    }

    // --- PROTOCOLS ---
    if (data.protocols && data.protocols.length > 0) {
      doc.addPage();
      addHeader("Protokolle", `${data.protocols.length} Dokumente`);

      data.protocols.forEach((p: any) => {
        if (!p) return;
        checkPage(100);
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(s(p.title));
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280")
          .text(`${s(p.date)}${p.location ? ` · ${s(p.location)}` : ""}${p.participants ? ` · ${s(p.participants)}` : ""}`);
        doc.moveDown(0.3);
        const content = s(p.content);
        doc.fontSize(8).font("Helvetica").fillColor("#374151").text(content.substring(0, 600), { width: pageW, lineGap: 1 });
        if (content.length > 600) {
          doc.fontSize(7).fillColor("#9ca3af").text("[...]");
        }
        doc.moveDown(0.8);
      });
    }

    // --- NEWS ---
    if (data.newsArticles && data.newsArticles.length > 0) {
      doc.addPage();
      addHeader("News & Media", `${data.newsArticles.length} Artikel`);

      data.newsArticles.forEach((article: any) => {
        if (!article) return;
        checkPage(100);
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(s(article.headline) || s(article.title));
        if (article.subtitle) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor("#6b7280").text(s(article.subtitle));
        }
        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(`${s(article.source)} · ${s(article.date)}`);
        doc.moveDown(0.3);
        const content = s(article.content);
        doc.fontSize(8).font("Helvetica").fillColor("#374151").text(content.substring(0, 600), { width: pageW, lineGap: 1 });
        if (content.length > 600) {
          doc.fontSize(7).fillColor("#9ca3af").text("[...]");
        }
        doc.moveDown(0.8);
      });
    }

    // --- FINANCIALS ---
    if (data.detailedBalanceSheet || data.balanceSheet) {
      doc.addPage();
      addHeader("Finanzanalyse", data.name);

      if (data.balanceSheet && data.balanceSheet.length > 0) {
        sectionTitle("Balance Sheet Summary");
        data.balanceSheet.forEach((item: any) => {
          doc.fontSize(9).font("Helvetica").fillColor("#374151")
            .text(`${item.name}: €${n(item.value).toFixed(2)} Mrd (${item.type})`, { width: pageW });
        });
        doc.moveDown(1);
      }

      if (data.detailedBalanceSheet?.assets) {
        checkPage();
        sectionTitle("Detailed Balance Sheet - Assets");
        const allAssets = [
          ...(data.detailedBalanceSheet.assets.nonCurrent || []),
          ...(data.detailedBalanceSheet.assets.current || []),
        ];
        allAssets.forEach((a: any) => {
          doc.fontSize(8).font("Helvetica").fillColor("#374151")
            .text(`${a.item}: €${n(a.value).toFixed(0)} Mio`, { width: pageW });
        });
        doc.moveDown(0.5);
      }

      if (data.detailedBalanceSheet?.equityLiabilities) {
        checkPage();
        sectionTitle("Detailed Balance Sheet - Equity & Liabilities");
        const allLiab = [
          ...(data.detailedBalanceSheet.equityLiabilities.equity || []),
          ...(data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities || []),
          ...(data.detailedBalanceSheet.equityLiabilities.currentLiabilities || []),
        ];
        allLiab.forEach((l: any) => {
          doc.fontSize(8).font("Helvetica").fillColor("#374151")
            .text(`${l.item}: €${n(l.value).toFixed(0)} Mio`, { width: pageW });
        });
        doc.moveDown(0.5);
      }
    }

    // --- HR SURVEY ---
    if (data.hrSurvey && data.hrSurvey.categories && data.hrSurvey.categories.length > 0) {
      doc.addPage();
      addHeader("HR-Dashboard", data.hrSurvey.title || "Leadership Pulse Survey");

      doc.fontSize(9).font("Helvetica").fillColor("#374151")
        .text(`Eingeladen: ${data.hrSurvey.participantsInvited}  |  Rücklaufquote: ${data.hrSurvey.responseRate}%`);
      doc.moveDown(0.5);

      data.hrSurvey.categories.forEach((cat: any) => {
        checkPage(80);
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(cat.name);
        cat.items.forEach((item: any) => {
          const color = item.score >= 3 ? "#22c55e" : item.score >= 2.5 ? "#f59e0b" : "#ef4444";
          doc.fontSize(8).font("Helvetica").fillColor(color)
            .text(`  ${item.score.toFixed(1)}  `, { continued: true })
            .fillColor("#374151").text(item.question);
        });
        doc.moveDown(0.5);
      });
    }

    // --- ORGANIGRAMM ---
    if (data.organigramm && data.organigramm.length > 0) {
      doc.addPage();
      addHeader("Organigramm", `${data.organigramm.length} Personen`);

      const departments = new Map<string, any[]>();
      data.organigramm.forEach((person: any) => {
        const dept = person.department || "Sonstige";
        if (!departments.has(dept)) departments.set(dept, []);
        departments.get(dept)!.push(person);
      });

      departments.forEach((members, dept) => {
        checkPage(60);
        doc.fontSize(10).font("Helvetica-Bold").fillColor(`rgb(${copper.join(",")})`).text(dept);
        members.forEach((m: any) => {
          doc.fontSize(9).font("Helvetica-Bold").fillColor("#1e293b").text(m.name, { continued: true });
          doc.font("Helvetica").fillColor("#6b7280").text(`  –  ${m.role}`);
          if (m.reportsTo) {
            doc.fontSize(7).fillColor("#9ca3af").text(`    Reports to: ${m.reportsTo}`);
          }
        });
        doc.moveDown(0.5);
      });
    }

    // --- QUESTIONS ---
    if (questions) {
      doc.addPage();
      addHeader("Bewertungsfragen");

      if (questions.analysis && questions.analysis.length > 0) {
        sectionTitle("Analysefragen");
        questions.analysis.forEach((q: string, i: number) => {
          bodyText(`${i + 1}. ${q}`);
        });
        doc.moveDown(0.5);
      }

      if (questions.conclusions && questions.conclusions.length > 0) {
        sectionTitle("Schlussfolgerungen");
        questions.conclusions.forEach((q: string, i: number) => {
          bodyText(`${i + 1}. ${q}`);
        });
      }
    }

    // --- FOOTER ON LAST PAGE ---
    doc.moveDown(2);
    doc.fontSize(7).font("Helvetica").fillColor("#9ca3af")
      .text("© Christoph Aldering · Private initiative / concept", 60, 595.28 - 30, { width: pageW, align: "center" });

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
