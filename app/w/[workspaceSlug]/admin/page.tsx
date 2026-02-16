import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string };
}

export default async function WorkspaceAdminDashboard({ params }: Props) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const hasUserAccess =
    userSession &&
    userSession.workspaceSlug === params.workspaceSlug &&
    !userSession.roles.includes("CANDIDATE");

  if (!masterAuth && wsAuth !== params.workspaceSlug && !hasUserAccess) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    include: { theme: true },
  });

  if (!workspace) {
    notFound();
  }

  const t = workspace.theme;
  const primary = t?.primaryColor ?? "#3b82f6";
  const textColor = t?.textColor ?? "#1a1a1a";
  const bgColor = t?.backgroundColor ?? "#ffffff";
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const userRoles = userSession?.roles ?? [];
  const canManageUsers = masterAuth || hasPermission(userRoles, "users.read");

  const pendingCount = await prisma.accessRequest.count({
    where: { workspaceId: workspace.id, status: "pending" },
  });

  const sections = [
    { title: pendingCount > 0 ? `Zugangsanfragen (${pendingCount})` : "Zugangsanfragen", desc: "Zugangsanfragen für diesen Workspace prüfen und genehmigen.", href: canManageUsers ? `/w/${params.workspaceSlug}/admin/access-requests` : null },
    { title: "Assessments", desc: "Assessment-Veranstaltungen, Übungen und Kandidatenzuweisungen verwalten.", href: `/w/${params.workspaceSlug}/admin/assessments` },
    { title: "Anforderungsanalyse", desc: "Anforderungen analysieren und Assessment-Entwürfe per KI erstellen.", href: `/w/${params.workspaceSlug}/admin/requirements` },
    { title: "Benutzer", desc: "Workspace-Benutzer, Rollen und Berechtigungen verwalten.", href: canManageUsers ? `/w/${params.workspaceSlug}/admin/users` : null },
    { title: "Kompetenzmodelle", desc: "Kompetenzrahmen, Dimensionen und Skalen konfigurieren.", href: `/w/${params.workspaceSlug}/admin/competencies` },
    { title: "Analysen", desc: "Assessment-Analysen, Kompetenzwerte und Statistiken einsehen.", href: `/w/${params.workspaceSlug}/admin/analytics` },
    { title: "Einwilligungen", desc: "Einwilligungsvorlagen und -aufzeichnungen verwalten.", href: `/w/${params.workspaceSlug}/admin/consents` },
    { title: "Theme Editor", desc: "Workspace-Branding und visuelle Identität anpassen.", href: `/w/${params.workspaceSlug}/admin/theme` },
    { title: "Berichte", desc: "Assessment-Berichte erstellen und prüfen.", href: `/w/${params.workspaceSlug}/admin/reports` },
    { title: "Audioaufnahmen", desc: "Audioaufnahmen hochladen, transkribieren und zusammenfassen.", href: `/w/${params.workspaceSlug}/admin/audio` },
    { title: "Audit-Protokoll", desc: "Systemaktivitäten und Compliance-Aufzeichnungen prüfen.", href: null },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header
        className="text-white sticky top-0 z-50"
        style={{ backgroundColor: primary }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif` }}
          >
            {workspace.name}
          </span>
          <div className="flex items-center gap-4">
            {userSession && (
              <span className="text-xs text-white/70">{userSession.roles.join(", ")}</span>
            )}
            <span className="text-xs text-white/70">{workspace.dataResidency}</span>
            {masterAuth && (
              <Link
                href="/admin/workspaces"
                className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              >
                Workspace wechseln
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: `'${headingFont}', serif` }}
          >
            Workspace Dashboard
          </h1>
          <p className="text-sm opacity-60">
            Verwaltung für <strong>{workspace.name}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((s) => {
            const inner = (
              <>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                >
                  {s.title}
                </h3>
                <p className="text-sm opacity-60">{s.desc}</p>
                {s.href && (
                  <span className="text-xs mt-3 inline-block opacity-50">→ Öffnen</span>
                )}
              </>
            );

            if (s.href) {
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  className="rounded-xl p-6 border transition-all hover:shadow-md"
                  style={{ borderColor: `${primary}20`, backgroundColor: bgColor }}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={s.title}
                className="rounded-xl p-6 border transition-all hover:shadow-sm"
                style={{ borderColor: `${primary}20`, backgroundColor: bgColor }}
              >
                {inner}
              </div>
            );
          })}
        </div>

        <div className="mt-12 border rounded-xl p-6" style={{ borderColor: `${primary}20` }}>
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Theme Editor
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {t && (
              <>
                <ThemeField label="Primary Color" value={t.primaryColor} />
                <ThemeField label="Secondary Color" value={t.secondaryColor} />
                <ThemeField label="Accent Color" value={t.accentColor} />
                <ThemeField label="Background Color" value={t.backgroundColor} />
                <ThemeField label="Text Color" value={t.textColor} />
                <ThemeField label="Body Font" value={t.fontFamily} />
                <ThemeField label="Heading Font" value={t.fontFamilyHeading} />
              </>
            )}
            {!t && <p className="text-sm opacity-50 col-span-2">Kein Theme konfiguriert.</p>}
          </div>
          <p className="text-xs opacity-40 mt-4">Theme-Editor kommt in einer zukünftigen Phase.</p>
        </div>
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function ThemeField({ label, value }: { label: string; value: string }) {
  const isColor = value.startsWith("#") || value.startsWith("hsl") || value.startsWith("rgb");
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
      {isColor && (
        <div
          className="w-6 h-6 rounded-md border border-black/10 shrink-0"
          style={{ backgroundColor: value }}
        />
      )}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-mono text-slate-700">{value}</p>
      </div>
    </div>
  );
}
