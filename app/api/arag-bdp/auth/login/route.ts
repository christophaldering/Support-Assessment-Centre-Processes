import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === "Demo" && password === "Demo") {
      let demoUser = await prisma.bdpUser.findFirst({
        where: { username: "Demo", environment: "demo" },
      });

      if (!demoUser) {
        demoUser = await prisma.bdpUser.create({
          data: {
            code: "Demo",
            role: "BOARD",
            isAdmin: true,
            environment: "demo",
            username: "Demo",
            passwordHash: "Demo",
          },
        });
      }

      const sessionData = JSON.stringify({
        userId: demoUser.id,
        code: demoUser.code,
        role: demoUser.role,
        isAdmin: demoUser.isAdmin,
        environment: "demo",
      });

      cookies().set("bdp_session", sessionData, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      return NextResponse.json({ success: true, user: { code: demoUser.code, role: demoUser.role, isAdmin: demoUser.isAdmin, environment: "demo" } });
    }

    const user = await prisma.bdpUser.findFirst({
      where: { username, passwordHash: password },
    });

    if (!user) {
      return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 });
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

    return NextResponse.json({ success: true, user: { code: user.code, role: user.role, isAdmin: user.isAdmin, environment: user.environment } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
