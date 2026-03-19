import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  children: ReactNode;
  params: { workspaceSlug: string };
}

export default async function ObserverLayout({ children, params }: Props) {
  const masterAuth = hasMasterAuth();
  const wsAuth = getWorkspaceAuth();
  const userSession = getUserSession();

  const observerRoles = ["OBSERVER", "MODERATOR", "ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "PROJECT_OFFICE", "PROJECT_ASSISTANT", "HR_CLIENT", "CLIENT"];

  const hasAccess =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    (userSession?.workspaceSlug === params.workspaceSlug &&
      userSession.roles.some((r) => observerRoles.includes(r)));

  if (!hasAccess) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { name: true, theme: { select: { primaryColor: true } } },
  }).catch(() => null);

  const primaryColor = workspace?.theme?.primaryColor ?? "#A6473B";
  const workspaceName = workspace?.name ?? params.workspaceSlug;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#f8f9fa",
        fontFamily: "var(--eds-font-sans, system-ui, sans-serif)",
      }}
    >
      <header
        data-testid="observer-shell-topbar"
        style={{
          height: "44px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: primaryColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#111827",
            flex: 1,
          }}
        >
          {workspaceName}
          <span
            style={{
              fontWeight: 400,
              color: "#6b7280",
              marginLeft: "8px",
            }}
          >
            — Beobachtungsbogen
          </span>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={`/w/${params.workspaceSlug}/admin`}
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textDecoration: "none",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Admin-Cockpit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Cockpit
          </a>

          <a
            href={`/api/auth/logout`}
            data-testid="observer-logout"
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textDecoration: "none",
              padding: "4px 8px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Abmelden"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Abmelden
          </a>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
