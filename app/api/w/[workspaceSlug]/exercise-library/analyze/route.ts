import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import { generateTagsAndTitle } from "@/lib/ai";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, exerciseType, fileName, description, sourceContext, author } = body;

    if (!title || !exerciseType) {
      return NextResponse.json({ error: "Title and exerciseType are required" }, { status: 400 });
    }

    const { tags, suggestedTitle } = await generateTagsAndTitle({
      title,
      description: description || null,
      type: exerciseType,
      fileName: fileName || null,
      sourceContext: sourceContext || null,
      author: author || null,
    });

    return NextResponse.json({ tags, suggestedTitle, title });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
