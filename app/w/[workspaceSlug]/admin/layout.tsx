import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import ShellClient from "@/components/shell/ShellClient";

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

  if (params.workspaceSlug === "comp" && !masterAuth) {
    redirect("/w/comp");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    notFound();
  }

  const isMaster = !!masterAuth;
  const userRoles: string[] = userSession?.roles ?? [];

  let userDisplayName = isMaster ? "Master Admin" : "Nutzer";
  if (userSession?.userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userSession.userId },
      select: { name: true, email: true },
    }).catch(() => null);
    if (dbUser) {
      userDisplayName = dbUser.name ?? dbUser.email ?? userDisplayName;
    }
  }

  return (
    <ShellClient
      workspaceSlug={params.workspaceSlug}
      workspaceName={workspace.name}
      userDisplayName={userDisplayName}
      userRoles={userRoles}
      isMaster={isMaster}
    >
      {children}
    </ShellClient>
  );
}
