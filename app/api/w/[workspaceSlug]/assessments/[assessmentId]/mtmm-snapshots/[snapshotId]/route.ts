import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; snapshotId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await prisma.mtmmSnapshot.findFirst({
    where: { id: params.snapshotId, assessmentId: params.assessmentId },
    include: {
      mappings: {
        include: {
          exercise: { select: { id: true, name: true } },
          competencyNode: { select: { id: true, name: true, description: true, sortOrder: true } },
        },
      },
      _count: { select: { mappings: true } },
    },
  });

  if (!snapshot) return NextResponse.json({ error: "Snapshot nicht gefunden" }, { status: 404 });

  return NextResponse.json(snapshot);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await prisma.mtmmSnapshot.findFirst({
    where: { id: params.snapshotId, assessmentId: params.assessmentId },
  });
  if (!snapshot) return NextResponse.json({ error: "Snapshot nicht gefunden" }, { status: 404 });

  const body = await req.json();
  const { action, label } = body;

  if (action === "activate") {
    if (snapshot.status === "archived") {
      return NextResponse.json({ error: "Archivierte Snapshots können nicht aktiviert werden. Erstellen Sie eine neue Version." }, { status: 400 });
    }

    const ratingsCount = await prisma.observerRating.count({
      where: { assessmentId: params.assessmentId },
    });

    const result = await prisma.$transaction(async (tx) => {
      const currentActive = await tx.mtmmSnapshot.findFirst({
        where: { assessmentId: params.assessmentId, status: "active" },
      });

      if (currentActive && currentActive.id !== snapshot.id) {
        if (currentActive.lockedAt) {
          return { error: "Die aktive Matrix ist gesperrt. Archivieren Sie sie zuerst, wenn Sie eine andere Version aktivieren möchten.", locked: true, ratingsCount };
        }
        await tx.mtmmSnapshot.update({
          where: { id: currentActive.id },
          data: { status: "archived" },
        });
      }

      const updated = await tx.mtmmSnapshot.update({
        where: { id: params.snapshotId },
        data: {
          status: "active",
          lockedAt: ratingsCount > 0 ? new Date() : null,
          lockedReason: ratingsCount > 0 ? `Automatisch gesperrt: ${ratingsCount} Bewertung(en) vorhanden` : null,
        },
      });
      return { snapshot: updated, ratingsCount };
    });

    if ("error" in result) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result);
  }

  if (action === "archive") {
    if (snapshot.lockedAt) {
      const ratingsCount = await prisma.observerRating.count({
        where: { assessmentId: params.assessmentId },
      });
      if (ratingsCount > 0) {
        return NextResponse.json({
          error: `Diese Matrix ist gesperrt, da ${ratingsCount} Bewertung(en) darauf basieren. Archivierung ist nicht möglich, solange Bewertungen existieren.`,
          ratingsCount,
        }, { status: 409 });
      }
    }

    const updated = await prisma.mtmmSnapshot.update({
      where: { id: params.snapshotId },
      data: { status: "archived" },
    });
    return NextResponse.json(updated);
  }

  if (action === "rename") {
    if (snapshot.lockedAt) {
      return NextResponse.json({ error: "Gesperrte Snapshots können nicht umbenannt werden." }, { status: 409 });
    }
    const updated = await prisma.mtmmSnapshot.update({
      where: { id: params.snapshotId },
      data: { label: label || snapshot.label },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await prisma.mtmmSnapshot.findFirst({
    where: { id: params.snapshotId, assessmentId: params.assessmentId },
  });
  if (!snapshot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (snapshot.lockedAt) {
    return NextResponse.json({ error: "Gesperrte Snapshots können nicht gelöscht werden." }, { status: 409 });
  }
  if (snapshot.status === "active") {
    return NextResponse.json({ error: "Aktive Snapshots können nicht gelöscht werden. Archivieren Sie sie zuerst." }, { status: 409 });
  }

  await prisma.mtmmSnapshot.delete({ where: { id: params.snapshotId } });
  return NextResponse.json({ ok: true });
}
