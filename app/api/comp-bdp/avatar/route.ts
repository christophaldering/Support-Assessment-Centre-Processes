import { NextRequest, NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";
import { PrismaClient } from "@prisma/client";
import { uploadToObjectStorage, getSignedDownloadUrlForPath } from "@/lib/object-storage";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = getBdpSession();
    if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Keine Datei" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Nur JPEG, PNG, WebP oder SVG erlaubt" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximale Dateigröße: 5 MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const objectPath = `.private/avatars/${session.userId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToObjectStorage(objectPath, buffer, file.type);

    await prisma.bdpUser.update({
      where: { id: session.userId },
      data: {
        avatarUrl: objectPath,
        avatarUpdatedAt: new Date(),
      },
    });

    const downloadUrl = await getSignedDownloadUrlForPath(objectPath);

    return NextResponse.json({ success: true, avatarUrl: downloadUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload fehlgeschlagen" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = getBdpSession();
    if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const user = await prisma.bdpUser.findUnique({ where: { id: session.userId } });
    if (!user?.avatarUrl) return NextResponse.json({ avatarUrl: null });

    if (user.avatarUrl.startsWith("/demo-avatars/") || user.avatarUrl.startsWith("http")) {
      return NextResponse.json({ avatarUrl: user.avatarUrl });
    }

    const downloadUrl = await getSignedDownloadUrlForPath(user.avatarUrl);
    return NextResponse.json({ avatarUrl: downloadUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
