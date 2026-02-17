import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string; projectId: string };
}


export default async function ProjectDetailPage({ params }: Props) {
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

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.projectId, workspaceId: workspace.id },
    include: {
      _count: {
        select: {
          candidates: true,
          exercises: true,
          reports: true,
          observerRatings: true,
          consolidatedScores: true,
        },
      },
    },
  });

  if (!assessment) {
    notFound();
  }

  const t = workspace.theme;
  const primary = t?.primaryColor ?? "#3b82f6";
  const textColor = t?.textColor ?? "#1a1a1a";
  const bgColor = t?.backgroundColor ?? "#ffffff";
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const base = `/w/${params.workspaceSlug}/admin`;

  const statusLabels: Record<string, { de: string; color: string }> = {
    draft: { de: "Entwurf", color: "#94a3b8" },
    active: { de: "Aktiv", color: "#22c55e" },
    completed: { de: "Abgeschlossen", color: "#3b82f6" },
    archived: { de: "Archiviert", color: "#9ca3af" },
  };

  const st = statusLabels[assessment.status] ?? { de: assessment.status, color: "#94a3b8" };

  const projectKpis = [
    { label: "Kandidaten", value: String(assessment._count.candidates) },
    { label: "Übungen", value: String(assessment._count.exercises) },
    { label: "Bewertungen", value: String(assessment._count.observerRatings) },
    { label: "Berichte", value: String(assessment._count.reports) },
  ];

  const sections = [
    {
      phase: "I",
      titleDe: "Auftrag & Diagnostik-Design",
      subtitleDe: "Wo Struktur dem Urteil vorausgeht.",
      cards: [
        {
          title: "Anforderungsanalyse",
          titleEn: "REQUIREMENT ANALYSIS",
          desc: "Rollenanforderungen analysieren und Assessment-Blaupausen erstellen (KI-gestützt).",
          href: `${base}/requirements`,
        },
        {
          title: "Anforderungsprofil & Kompetenzmodell",
          titleEn: "COMPETENCY MODEL",
          desc: "Abgeleitet aus der Anforderungsanalyse. Kompetenzen, Gewichtung, Skalen und Verhaltensanker definieren.",
          href: `${base}/competencies`,
          hint: "Kompetenzmodell abgeleitet aus Anforderungsanalyse.",
        },
        {
          title: "Assessment-Design & Module",
          titleEn: "ASSESSMENT DESIGN",
          desc: "Validierte Module auswählen, Reihenfolge festlegen und Kompetenzabdeckung prüfen (DIN 33430).",
          href: `${base}/assessments`,
        },
      ],
    },
    {
      phase: "II",
      titleDe: "Durchführung & Beobachtung",
      subtitleDe: "Wo Evidenz entsteht.",
      cards: [
        {
          title: "Assessment-Management",
          titleEn: "EXECUTION",
          desc: "Sitzungen planen, Kandidaten zuweisen und Moderation steuern.",
          href: `${base}/assessments`,
        },
        {
          title: "Beobachtung & Bewertung",
          titleEn: "OBSERVATION & RATINGS",
          desc: "Übungsspezifische Live-Bewertung, Audio-Aufnahme, Transkription und offline-fähige Erfassung.",
          href: `${base}/assessments`,
        },
      ],
    },
    {
      phase: "III",
      titleDe: "Berichte & Diagnostik-Zusammenfassungen",
      subtitleDe: "Von strukturierten Daten zu belastbaren Erkenntnissen.",
      cards: [
        {
          title: "Analysen",
          titleEn: "ANALYSES",
          desc: "Kompetenzergebnisse, Muster und Statistiken einsehen.",
          href: `${base}/analytics`,
        },
        {
          title: "Berichte",
          titleEn: "REPORTS",
          desc: `Berichte für Assessment: ${assessment.name}. KI-gestützte Entwürfe, kompetenzbasierte Aggregation, Export (PDF/DOCX).`,
          href: `${base}/reports`,
        },
        {
          title: "Advanced Intelligence",
          titleEn: "INTELLIGENCE",
          desc: "Prädiktive Analysen, Entwicklungspfade und Diagnostik-Hypothesen (KI-gestützt).",
          href: `${base}/intelligence?assessmentId=${assessment.id}`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header
        className="text-white sticky top-0 z-50"
        style={{ backgroundColor: primary }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={base}
              className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-dashboard"
            >
              ← Cockpit
            </Link>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif` }}
            >
              {assessment.name}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${st.color}40`, color: "white" }}
            >
              {st.de}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/70">{workspace.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {assessment.description && (
          <p className="text-sm opacity-50 mb-6 max-w-3xl">{assessment.description}</p>
        )}

        <section className="mb-6" data-testid="section-project-kpis">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {projectKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border px-4 py-3 text-center"
                style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                data-testid={`kpi-project-${kpi.label.toLowerCase()}`}
              >
                <p className="text-xl font-bold" style={{ color: textColor }}>
                  {kpi.value}
                </p>
                <p className="text-[11px] leading-tight mt-1 opacity-50">{kpi.label}</p>
              </div>
            ))}
          </div>
        </section>

        {sections.map((section) => (
          <section
            key={section.titleDe}
            className="mb-10"
            data-testid={`section-${section.titleDe.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                  style={{ backgroundColor: `${primary}10`, color: primary }}
                >
                  Phase {section.phase}
                </span>
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                >
                  {section.titleDe}
                </h2>
              </div>
              <p className="mt-1 text-sm italic opacity-40 ml-0">{section.subtitleDe}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.cards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="rounded-xl border p-6 transition-all hover:shadow-md cursor-pointer"
                  style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                  data-testid={`link-card-${card.titleEn?.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                    >
                      {card.title}
                    </h3>
                    {card.badge && (
                      <span
                        className="text-[10px] font-bold text-white rounded-full px-2 py-0.5"
                        style={{ backgroundColor: primary }}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  {card.hint && (
                    <p className="text-[11px] mt-1.5 italic opacity-40">{card.hint}</p>
                  )}
                  <p className="text-sm mt-1.5 opacity-50 leading-relaxed">{card.desc}</p>
                  <p className="text-[10px] mt-2 opacity-30 uppercase tracking-wider">{card.titleEn}</p>
                  <span className="text-[11px] mt-3 inline-block opacity-40">→ Öffnen</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
