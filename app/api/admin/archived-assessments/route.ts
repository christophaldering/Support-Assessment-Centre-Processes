import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hasMasterAuth } from "@/lib/session";

export async function GET() {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const assessments = await prisma.assessment.findMany({
      where: { status: "archived" },
      orderBy: { updatedAt: "desc" },
      include: {
        workspace: { select: { slug: true, name: true } },
        _count: { select: { candidates: true, exercises: true, reports: true } },
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(assessments);
  } catch {
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assessmentId, password } = await req.json();

    if (!assessmentId || !password) {
      return NextResponse.json({ error: "Assessment-ID und Passwort erforderlich" }, { status: 400 });
    }

    const hash = process.env.MASTER_ADMIN_PASSWORD_HASH;
    if (!hash || !(await bcrypt.compare(password, hash))) {
      return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || assessment.status !== "archived") {
      return NextResponse.json({ error: "Archiviertes Assessment nicht gefunden" }, { status: 404 });
    }

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "draft" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
