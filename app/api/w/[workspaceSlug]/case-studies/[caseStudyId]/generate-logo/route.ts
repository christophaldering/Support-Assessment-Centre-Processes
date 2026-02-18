import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";

function getStorageClient() {
  const { Client } = require("@replit/object-storage");
  return new Client();
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

    const svgResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional graphic designer. Generate clean, minimal SVG logos for corporate companies. Return ONLY valid SVG code, nothing else. The SVG should be 200x200 pixels, use a professional color palette, and contain only geometric shapes/paths — no text elements. Keep it simple and elegant.",
        },
        {
          role: "user",
          content: `Create a professional corporate logo SVG for "${companyName}". ${industry ? `Industry: ${industry}.` : ""} ${description ? `Description: ${description.substring(0, 150)}.` : ""} Return only the SVG code.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    let svgContent = svgResponse.choices[0]?.message?.content || "";
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
    await storageClient.uploadFromBytes(key, svgBuffer);

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
