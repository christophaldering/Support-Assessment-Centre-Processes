import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookie = cookies().get("arag_gate_session");
  if (cookie?.value === "authenticated") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
