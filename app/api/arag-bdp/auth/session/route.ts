import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookie = cookies().get("bdp_session");
    if (cookie) {
      const session = JSON.parse(cookie.value);
      const user = await prisma.bdpUser.findUnique({ where: { id: session.userId } });
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            code: user.code,
            role: user.role,
            isAdmin: user.isAdmin,
            environment: user.environment,
            photoUrl: user.photoUrl,
            viewMode: user.viewMode,
            uiPreset: user.uiPreset,
          },
        });
      }
    }

    const bdpAuth = getBdpSession();
    if (bdpAuth && bdpAuth.authSource === "platform") {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: bdpAuth.userId,
          code: bdpAuth.code,
          role: bdpAuth.role,
          isAdmin: bdpAuth.isAdmin,
          environment: bdpAuth.environment,
          viewMode: "mobile",
          uiPreset: "whatsapp_spiegel",
        },
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookie = cookies().get("bdp_session");
    if (!cookie) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    const session = JSON.parse(cookie.value);
    const body = await req.json();
    const updated = await prisma.bdpUser.update({
      where: { id: session.userId },
      data: {
        ...(body.viewMode && { viewMode: body.viewMode }),
        ...(body.uiPreset && { uiPreset: body.uiPreset }),
        ...(body.photoUrl && { photoUrl: body.photoUrl }),
      },
    });
    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function DELETE() {
  cookies().delete("bdp_session");
  return NextResponse.json({ success: true });
}
