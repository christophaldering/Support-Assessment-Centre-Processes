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

    const prompt = `Create a professional, modern corporate logo for a company called "${companyName}". ${industry ? `The company operates in: ${industry}.` : ""} ${description ? `Company description: ${description.substring(0, 200)}.` : ""} The logo should be clean, minimal, and suitable for a corporate annual report. Use a professional color palette. The design should work well at small sizes. White or transparent-style background. No text in the logo, just an abstract icon/symbol.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "Keine Bild-URL von der KI erhalten" }, { status: 500 });
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Bild konnte nicht heruntergeladen werden" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    const key = `.private/case-study-logos/${params.caseStudyId}.png`;
    const storageClient = getStorageClient();
    await storageClient.uploadFromBytes(key, imageBuffer);

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
