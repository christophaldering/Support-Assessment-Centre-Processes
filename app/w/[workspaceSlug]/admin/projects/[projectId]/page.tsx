import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string; projectId: string };
}

const processSteps = [
  { num: 1, label: "Anforderung", desc: "Rollenanalyse & Anforderungsprofil" },
  { num: 2, label: "Design", desc: "Kompetenzen, Skalen & Architektur" },
  { num: 3, label: "Durchführung", desc: "Beobachtung & Bewertung" },
  { num: 4, label: "Analyse", desc: "Konsolidierung & Ergebnisse" },
  { num: 5, label: "Berichterstattung", desc: "Reports & Export" },
];

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
      step: 1,
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
          title: "Kompetenzrahmen",
          titleEn: "COMPETENCY FRAMEWORKS",
          desc: "Kompetenzen, Skalen, Anker und Gewichtungslogik konfigurieren.",
          href: `${base}/competencies`,
        },
        {
          title: "Assessment-Architektur",
          titleEn: "ASSESSMENT ARCHITECTURE",
          desc: "Validierte Module im Einklang mit DIN 33430 zusammenstellen.",
          href: `${base}/assessments`,
        },
      ],
    },
    {
      step: 3,
      titleDe: "Durchführung & Beobachtung",
      subtitleDe: "Wo Evidenz entsteht.",
      cards: [
        {
          title: "Assessments",
          titleEn: "ASSESSMENTS",
          desc: "Sitzungen verwalten, Kandidaten zuweisen und Moderation steuern.",
          href: `${base}/assessments`,
        },
        {
          title: "Beobachtung & Bewertung",
          titleEn: "OBSERVATION & RATINGS",
          desc: "Live-Bewertung, Sitzungs-Tracking, offline-fähige Erfassung.",
          href: `${base}/assessments`,
        },
        {
          title: "Audio & Transkripte",
          titleEn: "AUDIO & TRANSCRIPTS",
          desc: "Audio hochladen, transkribieren und zusammenfassen.",
          href: `${base}/audio`,
        },
      ],
    },
    {
      step: 3,
      titleDe: "Tools & Module",
      subtitleDe: "Wiederverwendbare Diagnostik-Instrumente und Fallstudien.",
      cards: [
        {
          title: "Tools & Module",
          titleEn: "TOOLS & MODULES",
          desc: "Fallstudien, Übungen und Assessment-Instrumente verwalten und einsetzen.",
          href: `${base}/modules`,
          badge: "1 aktiv",
        },
      ],
    },
    {
      step: 4,
      titleDe: "Analyse & Urteilsbildung",
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
          desc: "Vorstandstaugliche Berichte erstellen, prüfen und exportieren (PDF/DOCX).",
          href: `${base}/reports`,
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

        <section className="mb-10" data-testid="section-process-bar">
          <div className="flex items-center gap-0 overflow-x-auto">
            {processSteps.map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: `${primary}08`,
                    color: primary,
                    border: `1px solid ${primary}20`,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {step.num}
                  </span>
                  {step.label}
                </div>
                {i < processSteps.length - 1 && (
                  <div className="w-6 h-px mx-1" style={{ backgroundColor: `${primary}30` }} />
                )}
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
              <h2
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
              >
                {section.titleDe}
              </h2>
              <p className="mt-0.5 text-sm italic opacity-40">{section.subtitleDe}</p>
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
