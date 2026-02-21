import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";

function getStorageClient() {
  const { Client } = require("@replit/object-storage");
  return new Client();
}

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAIDisabled("case_study_generation")) {
    const err = create503Response("case_study_generation");
    return NextResponse.json(err.body, { status: err.status });
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
    return NextResponse.json({ error: "Case study not found" }, { status: 404 });
  }

  try {
    const dataJson = caseStudy.dataJson as any;
    const companyName = dataJson?.name || caseStudy.companyName || "Company";
    const industry = caseStudy.subtitle || "";
    const description = dataJson?.description || "";

    const result = await generateLLMOutput<string>({
      taskName: "generate_logo",
      featureName: "case_study_generation",
      input: `Create a professional corporate logo SVG for "${companyName}". ${industry ? `Industry: ${industry}.` : ""} ${description ? `Description: ${description.substring(0, 150)}.` : ""} Return only the SVG code.`,
      route: `/api/w/${params.workspaceSlug}/case-studies/${params.caseStudyId}/generate-logo`,
      options: {
        systemPrompt: "You are a professional graphic designer. Generate clean, minimal SVG logos for corporate companies. Return ONLY valid SVG code, nothing else. The SVG should be 200x200 pixels, use a professional color palette, and contain only geometric shapes/paths — no text elements. Keep it simple and elegant.",
        maxTokens: 2000,
        temperature: 0.7,
      },
    });

    if ('aiDisabled' in result) {
      const err = create503Response("case_study_generation");
      return NextResponse.json(err.body, { status: err.status });
    }

    let svgContent = String(result.data);
    svgContent = svgContent.replace(/```svg\n?/g, "").replace(/```\n?/g, "").trim();

    if (!svgContent.includes("<svg") || !svgContent.includes("</svg>")) {
      return NextResponse.json({ error: "Kein gültiges SVG generiert" }, { status: 500 });
    }

    svgContent = svgContent.replace(/<script[\s\S]*?<\/script>/gi, "");
    svgContent = svgContent.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
    svgContent = svgContent.replace(/on\w+\s*=\s*'[^']*'/gi, "");

    const svgStart = svgContent.indexOf("<svg");
    const svgEnd = svgContent.lastIndexOf("</svg>") + 6;
    svgContent = svgContent.substring(svgStart, svgEnd);

    const svgBuffer = Buffer.from(svgContent, "utf-8");
    const key = `.private/case-study-logos/${params.caseStudyId}.svg`;
    const storageClient = getStorageClient();
    const uploadResult = await storageClient.uploadFromBytes(key, svgBuffer);
    if (uploadResult && !uploadResult.ok) {
      console.error("Logo storage upload error:", uploadResult.error);
      return NextResponse.json({ error: "Logo konnte nicht gespeichert werden" }, { status: 500 });
    }

    const logoUrl = `/api/w/${params.workspaceSlug}/case-studies/${params.caseStudyId}/logo`;

    await prisma.caseStudy.update({
      where: { id: params.caseStudyId },
      data: { logoUrl },
    });

    return NextResponse.json({ logoUrl });
  } catch (err) {
    console.error("Logo generation error:", err);
    return NextResponse.json({ error: "Fehler bei der Logo-Generierung" }, { status: 500 });
  }
}
