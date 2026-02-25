import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const gateCookie = cookies().get("arag_gate_session");
  const gateOk = gateCookie?.value === "authenticated";

  let demoLock = false;
  const bdpCookie = cookies().get("bdp_session");
  if (bdpCookie?.value) {
    try {
      const session = JSON.parse(bdpCookie.value);
      if (session.code && session.environment === "demo") {
        const user = await prisma.bdpUser.findFirst({
          where: { code: session.code, environment: "demo" },
        });
        if (user?.demoLock) {
          demoLock = true;
        }
      }
    } catch {}
  }

  if (gateOk) {
    return NextResponse.json({ ok: true, demoLock });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
