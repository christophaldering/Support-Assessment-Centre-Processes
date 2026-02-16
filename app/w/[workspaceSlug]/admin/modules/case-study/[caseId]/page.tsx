import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { varexiaData, assessmentQuestions, cases } from "@/lib/case-studies/varexia";
import CaseStudyClient from "./CaseStudyClient";

interface Props {
  params: { workspaceSlug: string; caseId: string };
}

const caseDataMap: Record<string, typeof varexiaData> = {
  varexia: varexiaData,
};

export default function CaseStudyPage({ params }: Props) {
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

  const caseEntry = cases.find((c) => c.id === params.caseId && c.status === "active");
  const data = caseDataMap[params.caseId];

  if (!caseEntry || !data) {
    notFound();
  }

  return (
    <CaseStudyClient
      data={data}
      questions={assessmentQuestions}
      workspaceSlug={params.workspaceSlug}
    />
  );
}
