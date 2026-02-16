import { redirect } from "next/navigation";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface Props {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}

export default function UsersLayout({ children, params }: Props) {
  const master = hasMasterAuth();
  if (master) return <>{children}</>;

  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  if (!hasPermission(session.roles, "users.read")) {
    redirect(`/w/${params.workspaceSlug}/admin`);
  }

  return <>{children}</>;
}
