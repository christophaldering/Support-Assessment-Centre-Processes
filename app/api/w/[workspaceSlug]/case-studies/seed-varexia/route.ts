import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { varexiaData, assessmentQuestions } from "@/lib/case-studies/varexia";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const existing = await prisma.caseStudy.findFirst({
    where: {
      workspaceId: workspace.id,
      companyName: { equals: "Varexia SE", mode: "insensitive" },
    },
  });

  if (existing) {
    return NextResponse.json({ message: "Varexia-Fallstudie bereits vorhanden", caseStudy: existing });
  }

  const caseStudy = await prisma.caseStudy.create({
    data: {
      workspaceId: workspace.id,
      title: "Varexia SE \u2013 Strategische Unternehmensanalyse",
      subtitle: "Europ\u00e4ischer Mischkonzern \u00b7 Turnaround-Szenario",
      companyName: "Varexia SE",
      type: "turnaround",
      difficulty: "hard",
      sourceType: "manual",
      status: "active",
      dataJson: varexiaData as any,
      questionsJson: assessmentQuestions as any,
    },
  });

  return NextResponse.json({ message: "Varexia-Fallstudie erfolgreich angelegt", caseStudy }, { status: 201 });
}
