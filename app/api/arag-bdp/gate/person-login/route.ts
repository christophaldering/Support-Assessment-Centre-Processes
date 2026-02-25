import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

const prisma = new PrismaClient();

const schema = z.object({
  environment: z.enum(["live", "demo"]),
  code: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Ungültige Eingabe." }, { status: 400 });
    }

    const { environment, code, password } = parsed.data;

    const user = await prisma.bdpUser.findFirst({
      where: { code, environment },
    });

    if (user) {
      if (user.demoLock && environment === "live") {
        return NextResponse.json({ ok: false, error: "Sie befinden sich in der DEMO-Umgebung." }, { status: 403 });
      }

      if (user.passwordHash !== password) {
        return NextResponse.json({ ok: false, error: "Falsches Passwort." }, { status: 401 });
      }

      const sessionData = JSON.stringify({
        userId: user.id,
        code: user.code,
        role: user.role,
        isAdmin: user.isAdmin,
        environment: user.environment,
      });

      cookies().set("bdp_session", sessionData, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      cookies().set("bdp_environment", environment, {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      let redirectTo = "/arag-bdp";
      if (user.isAdmin) {
        redirectTo = "/arag-bdp/admin";
      } else if (user.role === "BOARD" || user.role === "EXPERT") {
        redirectTo = "/arag-bdp/sessions";
      } else if (user.role === "MANAGEMENT_DIAGNOSTICS") {
        redirectTo = "/arag-bdp/sessions";
      }

      return NextResponse.json({ ok: true, redirectTo });
    }

    const participant = await prisma.bdpParticipant.findFirst({
      where: { code, environment },
    });

    if (participant) {
      if (participant.passwordHash && participant.passwordHash !== password) {
        return NextResponse.json({ ok: false, error: "Falsches Passwort." }, { status: 401 });
      }

      const sessionData = JSON.stringify({
        userId: participant.id,
        code: participant.code,
        role: "PARTICIPANT",
        isAdmin: false,
        environment: participant.environment,
      });

      cookies().set("bdp_session", sessionData, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      cookies().set("bdp_environment", environment, {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      const redirectTo = "/arag-bdp/portal";
      return NextResponse.json({ ok: true, redirectTo });
    }

    return NextResponse.json({ ok: false, error: "Benutzer nicht gefunden." }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Fehler bei der Verarbeitung." }, { status: 500 });
  }
}
