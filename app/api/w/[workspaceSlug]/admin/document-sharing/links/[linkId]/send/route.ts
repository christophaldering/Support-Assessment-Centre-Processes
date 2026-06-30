import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { sendDataRoomMagicLinkEmail } from "@/lib/email";

interface RouteContext {
  params: { workspaceSlug: string; linkId: string };
}

function isAdmin(session: ReturnType<typeof getUserSession>, master: boolean, workspaceSlug: string) {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  const adminRoles = ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"];
  return session.roles.some((r) => adminRoles.includes(r));
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await prisma.dataRoomAccessLink.findUnique({
    where: { id: params.linkId },
  });

  if (!link || link.workspace !== params.workspaceSlug) {
    return NextResponse.json({ ok: false, error: "Link nicht gefunden" }, { status: 404 });
  }

  if (link.revoked) {
    return NextResponse.json({ ok: false, error: "Link ist gesperrt und kann nicht versendet werden" }, { status: 400 });
  }

  if (new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ ok: false, error: "Link ist abgelaufen und kann nicht versendet werden" }, { status: 400 });
  }

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const targetEmail = body.email || link.email;
  if (!targetEmail) {
    return NextResponse.json(
      { ok: false, error: "Keine E-Mail-Adresse hinterlegt. Bitte E-Mail-Adresse angeben." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.diagnostic-suite.de";
  const magicLinkUrl = `${baseUrl}/dr/${link.token}`;

  try {
    await sendDataRoomMagicLinkEmail(
      targetEmail,
      link.label,
      magicLinkUrl,
      new Date(link.expiresAt),
      link.dataRoomSlug
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler beim E-Mail-Versand";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: targetEmail });
}
