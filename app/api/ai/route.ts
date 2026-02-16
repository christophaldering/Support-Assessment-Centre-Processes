import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!session && !master) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, context } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Aktion ist erforderlich" }, { status: 400 });
    }

    const stubResponses: Record<string, string> = {
      generate_model: "KI-Modellgenerierung wird in einer zukünftigen Version verfügbar sein.",
      write_anchors: "KI-Ankerformulierung wird in einer zukünftigen Version verfügbar sein.",
      suggest_weights: "KI-Gewichtungsvorschläge werden in einer zukünftigen Version verfügbar sein.",
    };

    const message = stubResponses[action];

    if (!message) {
      return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      message,
      data: null,
    });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
