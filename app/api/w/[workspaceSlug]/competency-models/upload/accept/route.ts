import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string };
}

interface HierarchyNode {
  name: string;
  type: string;
  description?: string;
  children?: HierarchyNode[];
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { modelName, modelDescription, hierarchy, assessment, fileName, companyName, modelYear } = body;

    if (!modelName || !hierarchy || !Array.isArray(hierarchy)) {
      return NextResponse.json({ error: "Modellname und Hierarchie sind erforderlich" }, { status: 400 });
    }

    const nodeTypeMap: Record<string, string> = {
      cluster: "domain",
      domain: "domain",
      group: "domain",
      competency: "competency",
      criterion: "competency",
      sub: "sub",
      subcompetency: "sub",
      anchor: "anchor",
      behavioral_anchor: "anchor",
      indicator: "anchor",
    };

    const result = await prisma.$transaction(async (tx) => {
      const model = await tx.competencyModel.create({
        data: {
          workspaceId: workspace.id,
          name: modelName,
          description: modelDescription || null,
          companyName: companyName || null,
          modelYear: modelYear ? parseInt(String(modelYear), 10) || null : null,
          status: "draft",
          sourceType: "uploaded",
          sourceFileName: fileName || null,
          metadata: assessment ? {
            qualityScore: assessment.qualityScore,
            overallQuality: assessment.overallQuality,
            usability: assessment.usability,
            targetGroups: assessment.targetGroups,
            strengths: assessment.strengths,
            weaknesses: assessment.weaknesses,
            recommendations: assessment.recommendations,
            completeness: assessment.completeness,
            tags: assessment.tags,
          } : null,
        },
      });

      let sortOrder = 0;

      async function createNodes(nodes: HierarchyNode[], parentId: string | null) {
        for (const node of nodes) {
          if (!node.name) continue;
          const mappedType = nodeTypeMap[node.type?.toLowerCase()] || "competency";
          const created = await tx.competencyNode.create({
            data: {
              competencyModelId: model.id,
              parentId,
              name: node.name,
              nodeType: mappedType,
              description: node.description || null,
              sortOrder: sortOrder++,
            },
          });

          if (node.children && node.children.length > 0) {
            await createNodes(node.children, created.id);
          }
        }
      }

      await createNodes(hierarchy, null);

      return tx.competencyModel.findUnique({
        where: { id: model.id },
        include: { nodes: { orderBy: { sortOrder: "asc" } } },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Error accepting competency model:", err);
    return NextResponse.json({ error: "Fehler beim Speichern des Kompetenzmodells" }, { status: 500 });
  }
}
