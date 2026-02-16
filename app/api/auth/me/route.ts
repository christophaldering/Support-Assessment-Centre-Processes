import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
      forcePasswordChange: true,
      status: true,
      assessmentId: true,
      workspace: { select: { slug: true, name: true } },
    },
  });

  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    forcePasswordChange: user.forcePasswordChange,
    workspaceSlug: user.workspace.slug,
    workspaceName: user.workspace.name,
    assessmentId: user.assessmentId,
  });
}
