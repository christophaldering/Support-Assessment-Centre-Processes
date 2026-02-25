import { NextResponse } from "next/server";
import { getBdpSession } from "@/lib/bdp-auth";

export async function GET() {
  const session = getBdpSession();

  if (!session) {
    return NextResponse.json({
      ok: false,
      auth: null,
      workspaceSlug: null,
      bdpUserCode: null,
      isAdmin: false,
      environment: null,
      error: "Nicht authentifiziert",
    }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    auth: session.authSource,
    workspaceSlug: session.workspaceSlug,
    bdpUserCode: session.code,
    isAdmin: session.isAdmin,
    environment: session.environment,
  });
}
