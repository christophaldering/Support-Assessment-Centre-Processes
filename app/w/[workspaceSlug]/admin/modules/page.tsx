import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { ensureHex } from "@/lib/color-utils";
import Link from "next/link";
import { cases } from "@/lib/case-studies/varexia";

interface Props {
  params: { workspaceSlug: string };
}

export default async function ModulesPage({ params }: Props) {
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
  const primary = ensureHex(t?.primaryColor ?? "#3b82f6");
  const textColor = ensureHex(t?.textColor ?? "#1a1a1a");
  const bgColor = ensureHex(t?.backgroundColor ?? "#ffffff");
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const base = `/w/${params.workspaceSlug}/admin`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header className="text-white sticky top-0 z-50" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`${base}`}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-dashboard"
            >
              ← Dashboard
            </Link>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif` }}
            >
              {workspace.name}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif` }}
            data-testid="text-modules-title"
          >
            Tools & Module
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Wiederverwendbare Diagnostik-Module für Assessment-Veranstaltungen
          </p>
        </div>

        <section className="mb-10">
          <h2
            className="text-lg font-bold mb-1 tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Fallstudien
          </h2>
          <p className="text-xs opacity-40 mb-4 italic">Case Studies for executive assessment exercises</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c) => {
              const isActive = c.status === "active";
              return (
                <div key={c.id} data-testid={`card-module-${c.id}`}>
                  {isActive ? (
                    <Link href={`${base}/modules/case-study/${c.id}`} data-testid={`link-case-study-${c.id}`}>
                      <div
                        className="rounded-xl border p-6 transition-all hover:shadow-lg group cursor-pointer"
                        style={{ borderColor: `${primary}20`, backgroundColor: bgColor }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3
                              className="font-semibold text-base group-hover:underline"
                              style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                            >
                              {c.title}
                            </h3>
                            <p className="text-xs opacity-50 mt-0.5">{c.subtitle}</p>
                          </div>
                          <span
                            className="text-[10px] font-bold text-white rounded-full px-2.5 py-1"
                            style={{ backgroundColor: "#16a34a" }}
                          >
                            Aktiv
                          </span>
                        </div>
                        <p className="text-sm opacity-60 leading-relaxed mb-3">{c.description}</p>
                        <div className="flex items-center gap-3 text-[11px] opacity-40">
                          <span>Typ: {c.type}</span>
                          <span>·</span>
                          <span>Schwierigkeit: {c.difficulty}</span>
                        </div>
                        <span className="text-xs mt-3 inline-block opacity-40">→ Öffnen</span>
                      </div>
                    </Link>
                  ) : (
                    <div
                      className="rounded-xl border p-6 opacity-50"
                      style={{ borderColor: `${primary}10`, backgroundColor: bgColor }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3
                            className="font-semibold text-base"
                            style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                          >
                            {c.title}
                          </h3>
                          <p className="text-xs opacity-50 mt-0.5">{c.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 border border-slate-300 rounded-full px-2.5 py-1">
                          Bald verfügbar
                        </span>
                      </div>
                      <p className="text-sm opacity-60 leading-relaxed mb-3">{c.description}</p>
                      <div className="flex items-center gap-3 text-[11px] opacity-40">
                        <span>Typ: {c.type}</span>
                        <span>·</span>
                        <span>Schwierigkeit: {c.difficulty}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2
            className="text-lg font-bold mb-1 tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Weitere Module
          </h2>
          <p className="text-xs opacity-40 mb-4 italic">Additional tools and assessment instruments</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Postkorbübung", desc: "Priorisierungsaufgabe mit Zeitdruck und konkurrierenden Anforderungen.", status: "planned" },
              { title: "Rollenspiel-Szenarien", desc: "Strukturierte Gesprächssimulationen für Führungssituationen.", status: "planned" },
              { title: "Gruppendiskussion", desc: "Themenbasierte Diskussionsformate mit Beobachtungsprotokollen.", status: "planned" },
            ].map((mod) => (
              <div
                key={mod.title}
                className="rounded-xl border p-6 opacity-40"
                style={{ borderColor: `${primary}10`, backgroundColor: bgColor }}
                data-testid={`card-module-${mod.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <h3
                  className="font-semibold text-sm mb-1"
                  style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                >
                  {mod.title}
                </h3>
                <p className="text-xs opacity-60 leading-relaxed mb-2">{mod.desc}</p>
                <span className="text-[10px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
                  In Planung
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
