import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { varexiaData, cases, assessmentQuestions } from "@/lib/case-studies/varexia";

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

  const existing = await prisma.exerciseLibraryItem.findFirst({
    where: {
      workspaceId: workspace.id,
      title: { contains: "Varexia", mode: "insensitive" },
    },
  });

  if (existing) {
    return NextResponse.json({ message: "Varexia-Fallstudie bereits vorhanden", item: existing });
  }

  const item = await prisma.exerciseLibraryItem.create({
    data: {
      workspaceId: workspace.id,
      title: "Varexia SE – Strategische Unternehmensanalyse",
      exerciseType: "case_study",
      tags: ["Fallstudie", "Strategie", "C-Level", "Turnaround", "Finanzanalyse", "Portfolio-Management", "Varexia"],
      targetLevels: ["C-Level", "Vorstand", "Director"],
      languagesAvailable: ["DE", "EN"],
      qualityStatus: "validated",
      metadataJson: {
        caseStudyId: varexiaData.id,
        companyName: varexiaData.name,
        description: varexiaData.description,
        metrics: varexiaData.metrics,
        businessUnitCount: varexiaData.businessUnits.length,
        businessUnits: varexiaData.businessUnits.map(bu => ({
          id: bu.id,
          name: bu.name,
          revenue: bu.revenue,
          margin: bu.margin,
          tension: bu.tension,
        })),
        emailCount: varexiaData.emails.length,
        exerciseModules: cases.map(e => ({
          id: e.id,
          title: e.title,
          subtitle: e.subtitle,
          type: e.type,
          difficulty: e.difficulty,
          description: e.description,
        })),
        assessmentQuestions,
        duration: 120,
        instructions: `Als Kandidat für die Position des Chief Strategy Officer (CSO) bei Varexia SE führen Sie eine umfassende strategische Analyse durch. 

Sie erhalten:
- Finanzdaten und KPIs aller ${varexiaData.businessUnits.length} Geschäftsbereiche
- Vertrauliche E-Mails von Vorstand und Aufsichtsrat
- Bilanz- und Ergebnisdaten

Aufgabe: Entwickeln Sie eine Turnaround-Strategie mit klaren Handlungsempfehlungen für den Aufsichtsrat.

Bewertungskriterien: Strategische Tiefe, finanzielle Urteilsfähigkeit, Entscheidungsfähigkeit unter Unsicherheit.`,
      },
    },
    include: {
      _count: { select: { variants: true } },
    },
  });

  return NextResponse.json({ message: "Varexia-Fallstudie erfolgreich angelegt", item }, { status: 201 });
}
