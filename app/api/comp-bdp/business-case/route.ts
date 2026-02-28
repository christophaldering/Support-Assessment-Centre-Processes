import { NextRequest, NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";
import { PrismaClient } from "@prisma/client";
import { getDemoCase } from "@/lib/demo-business-cases";
import { getSignedDownloadUrlForPath } from "@/lib/object-storage";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = getBdpSession();
    if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const teamId = req.nextUrl.searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ error: "teamId erforderlich" }, { status: 400 });

    const team = await prisma.bdpTeam.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 });

    if (team.businessCaseType === "demo-generated") {
      const demoCase = getDemoCase(team.displayName || team.code);
      return NextResponse.json({ type: "slides", slides: demoCase.slides, teamName: team.displayName || team.code });
    }

    if (team.businessCaseType === "pdf" && team.businessCaseUrl) {
      const url = await getSignedDownloadUrlForPath(team.businessCaseUrl);
      return NextResponse.json({ type: "pdf", url, teamName: team.displayName || team.code });
    }

    return NextResponse.json({ type: "none", teamName: team.displayName || team.code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
