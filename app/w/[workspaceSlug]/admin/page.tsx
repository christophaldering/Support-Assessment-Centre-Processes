import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth } from "@/lib/session";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string };
}

export default async function WorkspaceAdminDashboard({ params }: Props) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();

  if (!masterAuth && wsAuth !== params.workspaceSlug) {
    redirect("/admin/login");
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

  const placeholderSections = [
    { title: "Assessments", desc: "Manage assessment events, exercises, and candidate assignments." },
    { title: "Users", desc: "Manage workspace users, roles, and permissions." },
    { title: "Competency Models", desc: "Configure competency frameworks, dimensions, and scales." },
    { title: "Reports", desc: "Generate and review assessment reports." },
    { title: "Theme Editor", desc: "Customize workspace branding and visual identity." },
    { title: "Audit Log", desc: "Review system activity and compliance records." },
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
            <span className="text-xs text-white/70">{workspace.dataResidency}</span>
            <Link
              href="/admin/workspaces"
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            >
              Switch workspace
            </Link>
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
            Administration panel for <strong>{workspace.name}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderSections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl p-6 border transition-all hover:shadow-sm"
              style={{ borderColor: `${primary}20`, backgroundColor: `${bgColor}` }}
            >
              <h3
                className="font-semibold mb-2"
                style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
              >
                {s.title}
              </h3>
              <p className="text-sm opacity-60">{s.desc}</p>
            </div>
          ))}
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
            {!t && <p className="text-sm opacity-50 col-span-2">No theme configured.</p>}
          </div>
          <p className="text-xs opacity-40 mt-4">Theme editor UI coming in a future phase.</p>
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
