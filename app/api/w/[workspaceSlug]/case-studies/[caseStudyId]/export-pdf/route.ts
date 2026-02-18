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
    const pageH = 841.89;
    const copper = [163, 82, 55] as [number, number, number];
    const navy = [15, 23, 42] as [number, number, number];
    const copperStr = `rgb(${copper.join(",")})`;
    const navyStr = `rgb(${navy.join(",")})`;

    function addHeader(title: string, subtitle?: string) {
      doc.rect(0, 0, 595.28, 70).fill(copperStr);
      doc.fillColor("white").fontSize(18).font("Helvetica-Bold").text(title, 55, 20, { width: pageW });
      if (subtitle) {
        doc.fontSize(9).font("Helvetica").text(subtitle, 55, 44, { width: pageW });
      }
      doc.fillColor("black");
      doc.y = 90;
    }

    function addFooter() {
      doc.fontSize(7).font("Helvetica").fillColor("#9ca3af")
        .text("© Christoph Aldering · Private initiative / concept", 55, pageH - 35, { width: pageW, align: "center" });
    }

    function sectionTitle(text: string) {
      doc.fontSize(13).font("Helvetica-Bold").fillColor(copperStr).text(text);
      doc.moveDown(0.3);
      doc.fillColor("black");
    }

    function bodyText(text: string) {
      doc.fontSize(9).font("Helvetica").fillColor("#374151").text(text, { width: pageW, lineGap: 2 });
      doc.moveDown(0.4);
    }

    function checkPage(needed: number = 100) {
      if (doc.y > pageH - 60 - needed) {
        addFooter();
        doc.addPage();
      }
    }

    // --- COVER PAGE (eco-friendly: white background) ---
    doc.rect(0, 0, 595.28, 4).fill(copperStr);
    doc.rect(0, pageH - 4, 595.28, 4).fill(copperStr);
    doc.rect(0, 0, 4, pageH).fill(copperStr);
    doc.rect(595.28 - 4, 0, 4, pageH).fill(copperStr);

    doc.fillColor(navyStr).fontSize(32).font("Helvetica-Bold")
      .text(data.name || caseStudy.companyName || "Case Study", 55, 220, { width: pageW, align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(13).font("Helvetica").fillColor("#64748b")
      .text(data.description || "", 55, undefined, { width: pageW, align: "center" });
    doc.moveDown(2);
    doc.fontSize(11).fillColor(copperStr).font("Helvetica-Bold")
      .text("Executive Assessment – Case Study", 55, undefined, { width: pageW, align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(9).font("Helvetica").fillColor("#94a3b8")
      .text(`Erstellt: ${new Date().toLocaleDateString("de-DE")}`, 55, undefined, { width: pageW, align: "center" });
    if (caseStudy.referenceDate) {
      doc.text(`Referenzdatum: ${caseStudy.referenceDate}`, 55, undefined, { width: pageW, align: "center" });
    }
    addFooter();

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
      addFooter();
    }

    // --- OVERVIEW ---
    doc.addPage();
    addHeader("Übersicht", data.name);

    if (data.metrics && data.metrics.length > 0) {
      sectionTitle("Key Performance Indicators");
      const colW = pageW / Math.min(data.metrics.length, 4);
      const startX = 55;
      const startY = doc.y;
      data.metrics.forEach((m: any, i: number) => {
        const x = startX + (i % 4) * colW;
        const row = Math.floor(i / 4);
        const y = startY + row * 50;
        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(s(m.label), x, y, { width: colW - 10 });
        doc.fontSize(13).font("Helvetica-Bold").fillColor(navyStr).text(s(m.value), x, y + 12, { width: colW - 10 });
        const trendColor = s(m.trend).includes("down") ? "#ef4444" : m.trend === "up" ? "#22c55e" : "#6b7280";
        doc.fontSize(8).font("Helvetica").fillColor(trendColor).text(s(m.trend), x, y + 28, { width: colW - 10 });
      });
      doc.y = startY + (Math.ceil(data.metrics.length / 4)) * 50 + 10;
      doc.moveDown(0.5);
    }

    // --- BUSINESS UNITS ---
    if (data.businessUnits && data.businessUnits.length > 0) {
      checkPage();
      sectionTitle(`Geschäftseinheiten (${data.businessUnits.length})`);
      data.businessUnits.forEach((bu: any) => {
        if (!bu) return;
        checkPage(70);
        doc.fontSize(11).font("Helvetica-Bold").fillColor(navyStr).text(s(bu.name));
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280")
          .text(`Umsatz: €${n(bu.revenue).toFixed(2)} Mrd  |  EBITDA: €${n(bu.ebitda).toFixed(2)} Mrd  |  Marge: ${n(bu.margin)}%  |  MA: ${n(bu.employees).toLocaleString()}`);
        if (bu.tension) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(copperStr).text(s(bu.tension));
        }
        doc.moveDown(0.5);
      });
    }
    addFooter();

    // --- EMAILS: each email gets its own page ---
    if (data.emails && data.emails.length > 0) {
      data.emails.forEach((email: any, idx: number) => {
        if (!email) return;
        doc.addPage();
        addHeader("E-Mail", `Vorgang ${idx + 1} von ${data.emails.length}`);

        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text("Betreff:", 55, doc.y, { continued: true });
        doc.fontSize(11).font("Helvetica-Bold").fillColor(navyStr).text(`  ${s(email.subject) || "Kein Betreff"}`);
        doc.moveDown(0.3);

        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text("Von: ", { continued: true });
        doc.fillColor("#374151").text(s(email.from));

        if (email.to) {
          doc.fontSize(8).fillColor("#9ca3af").text("An: ", { continued: true });
          doc.fillColor("#374151").text(s(email.to));
        }

        if (email.cc) {
          doc.fontSize(8).fillColor("#9ca3af").text("CC: ", { continued: true });
          doc.fillColor("#374151").text(s(email.cc));
        }

        doc.fontSize(8).fillColor("#9ca3af").text("Datum: ", { continued: true });
        doc.fillColor("#374151").text(s(email.date));

        if (email.important) {
          doc.fontSize(8).fillColor("#dc2626").text("WICHTIG / PRIORITY");
        }

        doc.moveDown(0.5);
        doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        doc.moveDown(0.5);

        const content = s(email.content);
        const lines = content.split("\n");
        lines.forEach((line: string) => {
          checkPage(14);
          if (line.trim() === "") {
            doc.moveDown(0.3);
          } else if (line.startsWith("  ") || line.startsWith("\t")) {
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, 75, undefined, { width: pageW - 20, lineGap: 2 });
          } else if (line.match(/^[-–—]/)) {
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, 65, undefined, { width: pageW - 10, lineGap: 2 });
          } else if (line.match(/^(Best regards|Mit freundlichen Grüßen|Kind regards|Viele Grüße|Herzliche Grüße)/i)) {
            doc.moveDown(0.3);
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, { width: pageW, lineGap: 2 });
          } else if (line.match(/^(Tel|Phone|Fax|Mobile|E-Mail|Email|Web|www\.|http|\+49|\+1|\+44)/i) || line.match(/^[A-Z][a-zäöü]+ [A-Z][a-zäöü]+\s*$/)) {
            doc.fontSize(8).font("Helvetica").fillColor("#6b7280").text(line, { width: pageW, lineGap: 1 });
          } else if (line.match(/^(Diese E-Mail|This email|Confidential|DISCLAIMER|Vertraulich)/i)) {
            doc.fontSize(7).font("Helvetica-Oblique").fillColor("#9ca3af").text(line, { width: pageW, lineGap: 1 });
          } else {
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, { width: pageW, lineGap: 2 });
          }
        });

        addFooter();
      });
    }

    // --- PROTOCOLS: each protocol gets its own page ---
    if (data.protocols && data.protocols.length > 0) {
      data.protocols.forEach((p: any, idx: number) => {
        if (!p) return;
        doc.addPage();
        addHeader("Protokoll", `Dokument ${idx + 1} von ${data.protocols.length}`);

        doc.fontSize(12).font("Helvetica-Bold").fillColor(navyStr).text(s(p.title));
        doc.moveDown(0.3);
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280")
          .text(`Datum: ${s(p.date)}${p.location ? `  ·  Ort: ${s(p.location)}` : ""}`);
        if (p.participants) {
          doc.fontSize(8).fillColor("#6b7280").text(`Teilnehmer: ${s(p.participants)}`);
        }
        doc.moveDown(0.5);
        doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        doc.moveDown(0.5);

        const content = s(p.content);
        const lines = content.split("\n");
        lines.forEach((line: string) => {
          checkPage(14);
          if (line.trim() === "") {
            doc.moveDown(0.3);
          } else {
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, { width: pageW, lineGap: 2 });
          }
        });

        addFooter();
      });
    }

    // --- NEWS: each article gets its own page ---
    if (data.newsArticles && data.newsArticles.length > 0) {
      data.newsArticles.forEach((article: any, idx: number) => {
        if (!article) return;
        doc.addPage();
        addHeader("Nachrichtenartikel", `Artikel ${idx + 1} von ${data.newsArticles.length}`);

        doc.fontSize(14).font("Helvetica-Bold").fillColor(navyStr).text(s(article.headline) || s(article.title));
        if (article.subtitle) {
          doc.fontSize(10).font("Helvetica-Oblique").fillColor("#64748b").text(s(article.subtitle));
        }
        doc.moveDown(0.3);
        doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(`${s(article.source)}  ·  ${s(article.date)}`);
        doc.moveDown(0.5);
        doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        doc.moveDown(0.5);

        const content = s(article.content);
        const lines = content.split("\n");
        lines.forEach((line: string) => {
          checkPage(14);
          if (line.trim() === "") {
            doc.moveDown(0.3);
          } else {
            doc.fontSize(9).font("Helvetica").fillColor("#374151").text(line, { width: pageW, lineGap: 2 });
          }
        });

        addFooter();
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
        if (data.detailedBalanceSheet.assets.nonCurrent?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Non-Current Assets");
          data.detailedBalanceSheet.assets.nonCurrent.forEach((a: any) => {
            doc.fontSize(8).font("Helvetica").fillColor("#374151")
              .text(`  ${a.item}: €${n(a.value).toFixed(0)} Mio`, { width: pageW });
          });
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.assets.current?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Current Assets");
          data.detailedBalanceSheet.assets.current.forEach((a: any) => {
            doc.fontSize(8).font("Helvetica").fillColor("#374151")
              .text(`  ${a.item}: €${n(a.value).toFixed(0)} Mio`, { width: pageW });
          });
        }
        doc.moveDown(0.5);
      }

      if (data.detailedBalanceSheet?.equityLiabilities) {
        checkPage();
        sectionTitle("Detailed Balance Sheet - Equity & Liabilities");
        if (data.detailedBalanceSheet.equityLiabilities.equity?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Equity");
          data.detailedBalanceSheet.equityLiabilities.equity.forEach((l: any) => {
            doc.fontSize(8).font("Helvetica").fillColor("#374151")
              .text(`  ${l.item}: €${n(l.value).toFixed(0)} Mio`, { width: pageW });
          });
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Non-Current Liabilities");
          data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.forEach((l: any) => {
            doc.fontSize(8).font("Helvetica").fillColor("#374151")
              .text(`  ${l.item}: €${n(l.value).toFixed(0)} Mio`, { width: pageW });
          });
          doc.moveDown(0.3);
        }
        if (data.detailedBalanceSheet.equityLiabilities.currentLiabilities?.length > 0) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text("Current Liabilities");
          data.detailedBalanceSheet.equityLiabilities.currentLiabilities.forEach((l: any) => {
            doc.fontSize(8).font("Helvetica").fillColor("#374151")
              .text(`  ${l.item}: €${n(l.value).toFixed(0)} Mio`, { width: pageW });
          });
        }
        doc.moveDown(0.5);
      }
      addFooter();
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
        doc.fontSize(10).font("Helvetica-Bold").fillColor(navyStr).text(cat.name);
        cat.items.forEach((item: any) => {
          const color = item.score >= 3 ? "#22c55e" : item.score >= 2.5 ? "#f59e0b" : "#ef4444";
          doc.fontSize(8).font("Helvetica").fillColor(color)
            .text(`  ${item.score.toFixed(1)}  `, { continued: true })
            .fillColor("#374151").text(item.question);
        });
        doc.moveDown(0.5);
      });
      addFooter();
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
        doc.fontSize(10).font("Helvetica-Bold").fillColor(copperStr).text(dept);
        members.forEach((m: any) => {
          doc.fontSize(9).font("Helvetica-Bold").fillColor(navyStr).text(m.name, { continued: true });
          doc.font("Helvetica").fillColor("#6b7280").text(`  –  ${m.role}`);
          if (m.reportsTo) {
            doc.fontSize(7).fillColor("#9ca3af").text(`    Reports to: ${m.reportsTo}`);
          }
        });
        doc.moveDown(0.5);
      });
      addFooter();
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
      addFooter();
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
