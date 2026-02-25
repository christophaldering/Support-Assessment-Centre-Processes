import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { getUserSession } from "@/lib/session";

const prisma = new PrismaClient();

export async function GET() {
  const gateCookie = cookies().get("arag_gate_session");
  let gateOk = gateCookie?.value === "authenticated";

  if (!gateOk) {
    try {
      const session = await getUserSession();
      if (session) {
        gateOk = true;
      }
    } catch {}
  }

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
