import { NextRequest, NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const schema = z.object({
  recipients: z.array(z.object({
    code: z.string(),
    email: z.string().optional(),
  })),
  subject: z.string().min(1),
  body: z.string().min(1),
  sessionName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });
  if (session.workspaceSlug && session.workspaceSlug !== "comp") return NextResponse.json({ error: "Workspace nicht erlaubt" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { recipients, subject, body: template, sessionName } = parsed.data;
  const link = "https://assessment-suite.replit.app/comp-bdp/login";
  const sender = "Executive Diagnostics Suite / COMP Projektteam";

  const previews = recipients.map(r => {
    const rendered = template
      .replace(/\{\{CODE\}\}/g, r.code)
      .replace(/\{\{WORKSPACE\}\}/g, "COMP")
      .replace(/\{\{LINK\}\}/g, link)
      .replace(/\{\{SESSION_OVERVIEW_LINK\}\}/g, link)
      .replace(/\{\{SESSION\}\}/g, sessionName || "Alle Sessions")
      .replace(/\{\{SENDER\}\}/g, sender);

    const renderedSubject = subject
      .replace(/\{\{CODE\}\}/g, r.code)
      .replace(/\{\{WORKSPACE\}\}/g, "COMP")
      .replace(/\{\{SESSION\}\}/g, sessionName || "Alle Sessions");

    return {
      code: r.code,
      email: r.email || "",
      subject: renderedSubject,
      body: rendered,
    };
  });

  return NextResponse.json({ previews });
}
