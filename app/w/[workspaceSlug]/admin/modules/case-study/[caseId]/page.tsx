import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { varexiaData, assessmentQuestions, cases } from "@/lib/case-studies/varexia";
import { prisma } from "@/lib/db";
import CaseStudyClient from "./CaseStudyClient";
import type { CaseStudyData, AssessmentQuestions } from "@/lib/case-studies/varexia";

interface Props {
  params: { workspaceSlug: string; caseId: string };
}

const caseDataMap: Record<string, typeof varexiaData> = {
  varexia: varexiaData,
};

function safeData(raw: any): CaseStudyData {
  return {
    id: raw.id || "unknown",
    name: raw.name || "Unnamed Case Study",
    description: raw.description || "",
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    businessUnits: Array.isArray(raw.businessUnits)
      ? raw.businessUnits.map((bu: any) => ({
          id: bu.id || "bu-unknown",
          name: bu.name || "Unknown Unit",
          revenue: bu.revenue ?? 0,
          ebitda: bu.ebitda ?? 0,
          margin: bu.margin ?? 0,
          employees: bu.employees ?? 0,
          tension: bu.tension || "",
          kpis: Array.isArray(bu.kpis) ? bu.kpis : [],
          financials: {
            revenue: bu.financials?.revenue ?? bu.revenue ?? 0,
            ebitda: bu.financials?.ebitda ?? bu.ebitda ?? 0,
            margin: bu.financials?.margin ?? bu.margin ?? 0,
            employees: bu.financials?.employees ?? bu.employees ?? 0,
          },
          yoy: {
            revenue: bu.yoy?.revenue ?? 0,
            ebitda: bu.yoy?.ebitda ?? 0,
            deltaRevenue: bu.yoy?.deltaRevenue ?? 0,
            deltaEbitda: bu.yoy?.deltaEbitda ?? 0,
          },
        }))
      : [],
    emails: Array.isArray(raw.emails)
      ? raw.emails.map((e: any) => ({
          id: e.id || "e-unknown",
          from: e.from || "Unknown",
          subject: e.subject || "No Subject",
          date: e.date || "",
          read: e.read ?? true,
          important: e.important ?? false,
          content: e.content || "",
        }))
      : [],
    detailedBalanceSheet: {
      assets: {
        nonCurrent: Array.isArray(raw.detailedBalanceSheet?.assets?.nonCurrent)
          ? raw.detailedBalanceSheet.assets.nonCurrent
          : [],
        current: Array.isArray(raw.detailedBalanceSheet?.assets?.current)
          ? raw.detailedBalanceSheet.assets.current
          : [],
      },
      equityLiabilities: {
        equity: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.equity)
          ? raw.detailedBalanceSheet.equityLiabilities.equity
          : [],
        nonCurrentLiabilities: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.nonCurrentLiabilities)
          ? raw.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities
          : [],
        currentLiabilities: Array.isArray(raw.detailedBalanceSheet?.equityLiabilities?.currentLiabilities)
          ? raw.detailedBalanceSheet.equityLiabilities.currentLiabilities
          : [],
      },
    },
    balanceSheet: Array.isArray(raw.balanceSheet) ? raw.balanceSheet : [],
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

  const hardcodedEntry = cases.find((c) => c.id === params.caseId && c.status === "active");
  const hardcodedData = caseDataMap[params.caseId];

  if (hardcodedEntry && hardcodedData) {
    return (
      <CaseStudyClient
        data={hardcodedData}
        questions={assessmentQuestions}
        workspaceSlug={params.workspaceSlug}
      />
    );
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
    />
  );
}
