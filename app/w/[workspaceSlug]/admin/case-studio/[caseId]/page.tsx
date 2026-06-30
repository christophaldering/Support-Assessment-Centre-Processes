import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import CaseStudyClient from "./CaseStudyClient";
import type { CaseStudyData, AssessmentQuestions } from "@/lib/case-studies/varexia";

interface Props {
  params: { workspaceSlug: string; caseId: string };
}

function safeBalanceItem(item: any): { item: string; value: number } {
  return {
    item: item?.item || "Unknown",
    value: typeof item?.value === "number" ? item.value : parseFloat(item?.value) || 0,
  };
}

function safeData(raw: any): CaseStudyData {
  const n = (v: any) => (typeof v === "number" ? v : parseFloat(v) || 0);

  return {
    id: raw.id || "unknown",
    name: raw.name || "Unnamed Case Study",
    description: raw.description || "",
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    businessUnits: Array.isArray(raw.businessUnits)
      ? raw.businessUnits.map((bu: any) => ({
          id: bu.id || "bu-unknown",
          name: bu.name || "Unknown Unit",
          revenue: n(bu.revenue),
          ebitda: n(bu.ebitda),
          margin: n(bu.margin),
          employees: n(bu.employees),
          tension: bu.tension || "",
          kpis: Array.isArray(bu.kpis) ? bu.kpis : [],
          financials: {
            revenue: n(bu.financials?.revenue ?? bu.revenue),
            ebitda: n(bu.financials?.ebitda ?? bu.ebitda),
            margin: n(bu.financials?.margin ?? bu.margin),
            employees: n(bu.financials?.employees ?? bu.employees),
          },
          yoy: {
            revenue: n(bu.yoy?.revenue),
            ebitda: n(bu.yoy?.ebitda),
            deltaRevenue: n(bu.yoy?.deltaRevenue),
            deltaEbitda: n(bu.yoy?.deltaEbitda),
          },
        }))
      : [],
    emails: Array.isArray(raw.emails)
      ? raw.emails.map((e: any) => ({
          id: e.id || "e-unknown",
          from: e.from || "Unknown",
          to: e.to,
          cc: e.cc,
          subject: e.subject || "No Subject",
          date: e.date || "",
          read: e.read ?? true,
          important: e.important ?? false,
          content: e.content || "",
          category: e.category || "internal",
        }))
      : [],
    detailedBalanceSheet: {
      assets: {
        nonCurrent: Array.isArray(raw.detailedBalanceSheet?.assets?.nonCurrent)
          ? raw.detailedBalanceSheet.assets.nonCurrent.map(safeBalanceItem)
          : [],
        current: Array.isArray(raw.detailedBalanceSheet?.assets?.current)
          ? raw.detailedBalanceSheet.assets.current.map(safeBalanceItem)
          : [],
      },
      equityLiabilities: {
        equity: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.equity)
          ? raw.detailedBalanceSheet.equityLiabilities.equity.map(safeBalanceItem)
          : [],
        nonCurrentLiabilities: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.nonCurrentLiabilities)
          ? raw.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map(safeBalanceItem)
          : [],
        currentLiabilities: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.currentLiabilities)
          ? raw.detailedBalanceSheet.equityLiabilities.currentLiabilities.map(safeBalanceItem)
          : [],
      },
    },
    balanceSheet: Array.isArray(raw.balanceSheet)
      ? raw.balanceSheet.map((b: any) => ({
          name: b.name || "Unknown",
          value: n(b.value),
          type: b.type === "asset" || b.type === "liability" ? b.type : "asset",
        }))
      : [],
    cashFlow: Array.isArray(raw.cashFlow) ? raw.cashFlow : [],
    stressScenario: raw.stressScenario || { title: "", items: [], keyDrivers: [], implications: [] },
    managementTeam: Array.isArray(raw.managementTeam) ? raw.managementTeam : [],
    boardImpressions: Array.isArray(raw.boardImpressions) ? raw.boardImpressions : [],
    newsArticles: Array.isArray(raw.newsArticles) ? raw.newsArticles : [],
    analystReport: raw.analystReport || { source: "", observations: [], criticalQuestions: [], indicators: [], conclusion: "" },
    protocols: Array.isArray(raw.protocols) ? raw.protocols : [],
    hrSurvey: raw.hrSurvey || { title: "", participantsInvited: 0, responseRate: 0, categories: [], comments: [], hrComment: "" },
    leadershipSummary: raw.leadershipSummary || "",
    leadershipConference: raw.leadershipConference || "",
    organigramm: Array.isArray(raw.organigramm)
      ? raw.organigramm.map((o: any) => ({
          name: o.name || "Unknown",
          role: o.role || "",
          department: o.department || "",
          reportsTo: o.reportsTo || null,
        }))
      : [],
    briefing: raw.briefing
      ? {
          role: raw.briefing.role || "",
          situation: raw.briefing.situation || "",
          tasks: Array.isArray(raw.briefing.tasks) ? raw.briefing.tasks : [],
          analysisQuestions: Array.isArray(raw.briefing.analysisQuestions) ? raw.briefing.analysisQuestions : [],
          conclusionQuestions: Array.isArray(raw.briefing.conclusionQuestions) ? raw.briefing.conclusionQuestions : [],
          timeMinutes: typeof raw.briefing.timeMinutes === "number" ? raw.briefing.timeMinutes : 60,
          presentationMinutes: typeof raw.briefing.presentationMinutes === "number" ? raw.briefing.presentationMinutes : 15,
        }
      : undefined,
  };
}

function safeQuestions(raw: any): AssessmentQuestions {
  if (!raw) {
    return {
      analysis: [
        "Analysieren Sie die Kernherausforderungen des Unternehmens.",
        "Identifizieren Sie die wichtigsten Muster und Abhängigkeiten.",
      ],
      conclusions: [
        "Formulieren Sie Ihre strategischen Empfehlungen.",
        "Priorisieren Sie die Handlungsfelder.",
      ],
    };
  }
  return {
    analysis: Array.isArray(raw.analysis) ? raw.analysis : [],
    conclusions: Array.isArray(raw.conclusions) ? raw.conclusions : [],
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const hasUserAccess =
    userSession &&
    userSession.workspaceSlug === params.workspaceSlug &&
    !userSession.roles.includes("CANDIDATE");

  if (!masterAuth && wsAuth !== params.workspaceSlug && !hasUserAccess) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    notFound();
  }

  const caseStudy = await prisma.caseStudy.findFirst({
    where: { id: params.caseId, workspaceId: workspace.id },
  });

  if (!caseStudy) {
    notFound();
  }

  const data = safeData(caseStudy.dataJson);
  const questions = safeQuestions(caseStudy.questionsJson);

  return (
    <CaseStudyClient
      data={data}
      questions={questions}
      workspaceSlug={params.workspaceSlug}
      logoUrl={caseStudy.logoUrl}
      caseStudyId={caseStudy.id}
    />
  );
}
