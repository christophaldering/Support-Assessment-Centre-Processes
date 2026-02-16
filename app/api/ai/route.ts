import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { coCreationQuestion } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!session && !master) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Aktion ist erforderlich" }, { status: 400 });
    }

    if (action === "co_creation_question") {
      const { step, history } = body;
      try {
        const message = await coCreationQuestion(history || [], step || "target_role");
        return NextResponse.json({ success: true, action, message });
      } catch (err) {
        console.error("Co-creation AI error:", err);
        return NextResponse.json({ error: "KI-Verarbeitung fehlgeschlagen" }, { status: 500 });
      }
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
