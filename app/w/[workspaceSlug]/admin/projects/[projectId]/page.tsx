import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { ensureHex } from "@/lib/color-utils";
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
  const primary = ensureHex(t?.primaryColor ?? "#3b82f6");
  const textColor = ensureHex(t?.textColor ?? "#1a1a1a");
  const bgColor = ensureHex(t?.backgroundColor ?? "#ffffff");
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const base = `/w/${params.workspaceSlug}/admin`;

  const statusLabels: Record<string, { de: string; color: string }> = {
    draft: { de: "Entwurf", color: "#94a3b8" },
    active: { de: "Aktiv", color: "#22c55e" },
    completed: { de: "Abgeschlossen", color: "#3b82f6" },
    archived: { de: "Archiviert", color: "#9ca3af" },
  };

  const st = statusLabels[assessment.status] ?? { de: assessment.status, color: "#94a3b8" };

  const designModeLabels: Record<string, { de: string; icon: string }> = {
    ai_full: { de: "KI-Vollautomatik", icon: "⚡" },
    ai_supported: { de: "KI-Unterstützt", icon: "🤖" },
    classic: { de: "Manuell", icon: "✋" },
  };
  const dm = designModeLabels[assessment.designMode] ?? designModeLabels.classic;

  const projectKpis = [
    { label: "Kandidaten", value: String(assessment._count.candidates) },
    { label: "Übungen", value: String(assessment._count.exercises) },
    { label: "Bewertungen", value: String(assessment._count.observerRatings) },
    { label: "Berichte", value: String(assessment._count.reports) },
  ];

  const assessmentBase = `${base}/assessments/${assessment.id}`;

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
          href: `${base}/requirements?assessmentId=${assessment.id}`,
        },
        {
          title: "Anforderungsprofil & Kompetenzmodell",
          titleEn: "COMPETENCY MODEL",
          desc: "Abgeleitet aus der Anforderungsanalyse. Kompetenzen, Gewichtung, Skalen und Verhaltensanker definieren.",
          href: `${base}/competencies?assessmentId=${assessment.id}`,
          hint: "Kompetenzmodell abgeleitet aus Anforderungsanalyse.",
        },
        {
          title: "Übungen & Module",
          titleEn: "EXERCISES & MODULES",
          desc: "Übungen verwalten, aus der Bibliothek importieren oder KI-gestützt anpassen. Kompetenzabdeckung prüfen (DIN 33430).",
          href: assessmentBase,
          badge: `${dm.icon} ${dm.de}`,
        },
      ],
    },
    {
      phase: "II",
      titleDe: "Durchführung & Beobachtung",
      subtitleDe: "Wo Evidenz entsteht.",
      cards: [
        {
          title: "Teilnehmer & Planung",
          titleEn: "PARTICIPANTS & PLANNING",
          desc: "Kandidaten zuweisen, Sitzungen planen und Moderation steuern.",
          href: `${assessmentBase}#participants`,
        },
        {
          title: "Beobachtungsbögen",
          titleEn: "OBSERVATION SHEETS",
          desc: "Beobachtungsbögen erstellen, hochladen oder KI-gestützt generieren lassen.",
          href: `${assessmentBase}#observation-sheets`,
        },
        {
          title: "Beobachtung & Bewertung",
          titleEn: "OBSERVATION & RATINGS",
          desc: "Übungsspezifische Live-Bewertung, Audio-Aufnahme, Transkription und offline-fähige Erfassung.",
          href: `${assessmentBase}#ratings`,
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
          href: `${base}/analytics?assessmentId=${assessment.id}`,
        },
        {
          title: "Berichte",
          titleEn: "REPORTS",
          desc: `Berichte für Assessment: ${assessment.name}. KI-gestützte Entwürfe, kompetenzbasierte Aggregation, Export (PDF/DOCX).`,
          href: `${base}/reports?assessmentId=${assessment.id}`,
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
    <div className="py-8 px-6 lg:px-10 space-y-6" style={{ color: textColor }}>
      <div className="flex items-center gap-4 mb-4">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: `'${headingFont}', serif` }}
        >
          {assessment.name}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${st.color}40`, color: st.color }}
        >
          {st.de}
        </span>
        <span
          className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)]"
          data-testid="badge-design-mode"
        >
          {dm.icon} {dm.de}
        </span>
      </div>

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

        <section className="mb-8" data-testid="section-candidate-portal">
          <div
            className="rounded-xl border p-5 flex items-center justify-between"
            style={{ borderColor: `${primary}20`, backgroundColor: bgColor }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primary}10`, color: primary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textColor, fontFamily: `'${headingFont}', serif` }}>
                  Kandidat*innen-Portal
                </h3>
                <p className="text-xs opacity-50 mt-0.5">
                  Zugewiesene Kandidat*innen sehen hier ihre Übungen und Unterlagen.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs opacity-40 hidden sm:inline" style={{ color: textColor }}>
                /w/{params.workspaceSlug}/assessment
              </span>
              <Link
                href={`/w/${params.workspaceSlug}/assessment`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primary }}
                data-testid="link-candidate-portal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Portal öffnen
              </Link>
            </div>
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
    </div>
  );
}
