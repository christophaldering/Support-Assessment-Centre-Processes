import { NextRequest, NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  return NextResponse.json({ environment: session.environment });
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json();
  const env = body.environment;
  if (env !== "live" && env !== "demo") {
    return NextResponse.json({ error: "Ungültige Umgebung" }, { status: 400 });
  }

  cookies().set("bdp_environment", env, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ environment: env });
}
