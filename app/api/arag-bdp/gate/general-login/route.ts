import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const GATE_EMAIL = "christoph.aldering@googlemail.com";
const GATE_PASSWORD = "Christoph";

const schema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  platform: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Ungültige Eingabe." }, { status: 400 });
    }

    const { email, password, platform } = parsed.data;

    if (platform) {
      cookies().set("arag_gate_session", "authenticated", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 12,
        sameSite: "lax",
      });
      return NextResponse.json({ ok: true });
    }

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Ungültige Eingabe." }, { status: 400 });
    }

    if (email.toLowerCase().trim() !== GATE_EMAIL.toLowerCase() || password !== GATE_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Zugangsdaten nicht korrekt." }, { status: 401 });
    }

    cookies().set("arag_gate_session", "authenticated", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Fehler bei der Verarbeitung." }, { status: 500 });
  }
}
