import { NextRequest, NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";
import { PrismaClient } from "@prisma/client";
import { uploadToObjectStorage } from "@/lib/object-storage";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = getBdpSession();
    if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const teamId = formData.get("teamId") as string;

    if (!file || !teamId) return NextResponse.json({ error: "Datei und teamId erforderlich" }, { status: 400 });

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximale Dateigröße: 15 MB" }, { status: 400 });
    }

    const team = await prisma.bdpTeam.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 });

    const objectPath = `.private/business-cases/${teamId}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToObjectStorage(objectPath, buffer, file.type);

    await prisma.bdpTeam.update({
      where: { id: teamId },
      data: {
        businessCaseUrl: objectPath,
        businessCaseType: "pdf",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload fehlgeschlagen" }, { status: 500 });
  }
}
