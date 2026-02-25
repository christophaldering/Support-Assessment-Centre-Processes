import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { ensureHex } from "@/lib/color-utils";
import { getModuleFlags } from "@/lib/feature-flags";
import AdminSidebar from "./AdminSidebar";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}

export default async function AdminLayout({ children, params }: Props) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const cockpitRoles = ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR", "PROJECT_OFFICE", "PROJECT_ASSISTANT", "HR_CLIENT", "CLIENT", "OBSERVER"];
  const hasUserAccess =
    userSession &&
    userSession.workspaceSlug === params.workspaceSlug &&
    userSession.roles.some((r: string) => cockpitRoles.includes(r));

  if (!masterAuth && wsAuth !== params.workspaceSlug && !hasUserAccess) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  if (params.workspaceSlug === "arag" && !masterAuth) {
    redirect("/w/arag");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    include: { theme: true },
  });

  if (!workspace) {
    notFound();
  }

  const t = workspace.theme;
  const primary = ensureHex(t?.primaryColor ?? "#A6473B");
  const headingFont = t?.fontFamilyHeading ?? "Satoshi";

  const isAdmin = !!masterAuth || userSession?.roles?.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r));
  const featureFlags = getModuleFlags(workspace.featureFlags as Record<string, boolean> | null);

  const [exerciseLibCount, observationTemplateCount, teamCount] = await Promise.all([
    prisma.exerciseLibraryItem.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.observationSheetTemplate.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.user.count({
      where: {
        workspaceId: workspace.id,
        NOT: { roles: { equals: ["CANDIDATE"] } },
      },
    }).catch(() => 0),
  ]);

  const base = `/w/${params.workspaceSlug}/admin`;

  const modules = [
    { title: "Kompetenzmanagement", href: `${base}/competencies`, icon: "competency", moduleKey: "competencies" },
    { title: "Anforderungsanalyse", href: `${base}/requirements`, icon: "target", moduleKey: "requirements" },
    { title: "Baustein-Bibliothek", href: `${base}/exercise-library`, icon: "library", count: exerciseLibCount, moduleKey: "exercise_library" },
    { title: "Modul-Designer", href: `${base}/modules`, icon: "builder", moduleKey: "modules" },
    { title: "Case-Studio", href: `${base}/modules/case-study-builder`, icon: "casestudy", moduleKey: "case_studio" },
    { title: "Beobachtungsbogen-Tool", href: `${base}/observation-sheets`, icon: "clipboard", count: observationTemplateCount, moduleKey: "observation_sheets" },
    { title: "Analytics & Berichte", href: `${base}/analytics`, icon: "chart", moduleKey: "analytics" },
    { title: "Gutachten-Generator", href: `${base}/gutachten`, icon: "report", moduleKey: "reports" },
    { title: "Corporate Design", href: `${base}/brand-rules`, icon: "palette", moduleKey: "brand_rules" },
    { title: "Advanced Intelligence", href: `${base}/intelligence`, icon: "brain", moduleKey: "intelligence" },
    { title: "Einwilligungen", href: `${base}/consents`, icon: "consent", moduleKey: "consents" },
    { title: "AI Governance", href: `${base}/ai-governance`, icon: "governance", moduleKey: "ai_governance" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: `'${headingFont}', 'Inter', system-ui, sans-serif` }}>
      <header className="text-white sticky top-0 z-40" style={{ background: "linear-gradient(135deg, #5F1A11 0%, #A6473B 60%, #297587 100%)" }}>
        <div className="max-w-full mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 pl-8 md:pl-0">
            <Link
              href={base}
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity no-underline text-white"
              style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}
            >
              {workspace.name}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Enterprise Cockpit</span>
          </div>
          <div className="flex items-center gap-3">
            {userSession?.roles && userSession.roles.length > 0 && (
              <span className="text-[11px] text-white/50 hidden sm:inline">{userSession.roles.join(", ")}</span>
            )}
            {masterAuth && (
              <Link
                href="/admin/workspaces"
                className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors no-underline"
                data-testid="link-switch-workspace"
              >
                Workspace wechseln
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <AdminSidebar
          workspaceSlug={params.workspaceSlug}
          workspaceName={workspace.name}
          modules={modules}
          featureFlags={featureFlags}
          isMaster={!!masterAuth}
          isAdmin={!!isAdmin}
          userRoles={userSession?.roles ?? []}
          teamCount={teamCount}
        />
        <main className="flex-1 min-w-0 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
