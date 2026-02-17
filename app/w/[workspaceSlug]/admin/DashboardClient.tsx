"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AssessmentItem {
  id: string;
  name: string;
  status: string;
  designMode: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  candidateCount: number;
  exerciseCount: number;
  reportCount: number;
  ratingCount: number;
  consolidatedCount: number;
  competencyCoverage: number;
  ratingProgress: number;
  autoDeleteDays: number | null;
}

interface LinkItem {
  title: string;
  href: string;
  desc: string;
  icon?: string;
  badge?: string;
}

const designModeLabels: Record<string, { de: string; icon: string }> = {
  ai_full: { de: "KI-Vollautomatik", icon: "⚡" },
  ai_supported: { de: "KI-Unterstützt", icon: "🤖" },
  classic: { de: "Manuell", icon: "✋" },
};

interface Props {
  assessments: AssessmentItem[];
  workspaceSlug: string;
  primary: string;
  textColor: string;
  bgColor: string;
  headingFont: string;
  toolLinks: LinkItem[];
  governanceLinks: LinkItem[];
}

const statusLabels: Record<string, { de: string; color: string }> = {
  draft: { de: "Entwurf", color: "#94a3b8" },
  active: { de: "Aktiv", color: "#22c55e" },
  completed: { de: "Abgeschlossen", color: "#3b82f6" },
  archived: { de: "Archiviert", color: "#9ca3af" },
};

const ICON_MAP: Record<string, JSX.Element> = {
  library: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  competency: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  brand: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  intelligence: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  requirements: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  theme: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  ),
  modules: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  requests: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  ),
  consent: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

type TabKey = "projects" | "tools" | "governance";

const TABS: { key: TabKey; label: string; iconPath: string }[] = [
  {
    key: "projects",
    label: "Projekte & Assessments",
    iconPath: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  },
  {
    key: "tools",
    label: "Werkzeuge",
    iconPath: "M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655m3.586-3.586a2.123 2.123 0 013 3L12 15.75l-2.58.87.87-2.58 5.13-5.13z",
  },
  {
    key: "governance",
    label: "Governance",
    iconPath: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  },
];

type ToolKey = "exercise-library" | "intelligence" | "observation-sheets";

interface ToolDetail {
  key: ToolKey;
  title: string;
  href: string;
  shortDesc: string;
  description: string;
  features: string[];
  icon: JSX.Element;
}

type GovernanceKey = "users" | "consents" | "reports" | "analytics" | "audio" | "requests";

interface GovernanceDetail {
  key: GovernanceKey;
  title: string;
  href: string;
  shortDesc: string;
  description: string;
  features: string[];
  icon: JSX.Element;
}

export default function DashboardClient({ assessments, workspaceSlug, primary, textColor, bgColor, headingFont, toolLinks, governanceLinks }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("projects");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    designMode: "classic",
    copyFromId: "",
    autoDeleteDays: "",
  });
  const [error, setError] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolKey>("exercise-library");
  const [localAssessments, setLocalAssessments] = useState<AssessmentItem[]>(assessments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedProjectView, setSelectedProjectView] = useState<"all" | string>("all");
  const [selectedGovernance, setSelectedGovernance] = useState<GovernanceKey>("users");

  const base = `/w/${workspaceSlug}/admin`;

  const toolDetails: ToolDetail[] = [
    {
      key: "exercise-library",
      title: "Modul- & Übungsbibliothek",
      href: `${base}/exercise-library`,
      shortDesc: "Assessment-Übungen verwalten",
      description: "Verwalten Sie Assessment-Übungen: Interview-Leitfäden, Fallstudien, Fact-Finding-Simulationen, Präsentationen, Verhaltenssimulationen und psychometrische Tests.",
      features: ["Upload & KI-Analyse", "CD-Anpassung", "Original + angepasste Version", "8 Übungstypen", "4 Hierarchie-Level"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      key: "intelligence",
      title: "Advanced Intelligence",
      href: `${base}/intelligence`,
      shortDesc: "KI-gestützte Diagnostik",
      description: "Drei KI-gestützte Diagnostik-Module für prädiktive Analyse, Entwicklungspfade und diagnostische Hypothesen.",
      features: ["Predictive Success Intelligence", "Development Path Generator", "Diagnostic Hypothesis Engine"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
    },
    {
      key: "observation-sheets",
      title: "Beobachtungsbögen",
      href: `${base}/observation-sheets`,
      shortDesc: "Bögen erstellen & verwalten",
      description: "Erstellen, importieren und verwalten Sie Beobachtungsbögen. Upload bestehender Bögen mit automatischer CD-Anpassung.",
      features: ["Upload (Word/PDF)", "KI-generierte Bögen", "CD-Anpassung", "Projektverknüpfung"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
  ];

  const governanceIconMap: Record<string, GovernanceKey> = {
    users: "users",
    requests: "requests",
    consent: "consents",
    reports: "reports",
    analytics: "analytics",
    audio: "audio",
  };

  const governanceDescriptions: Record<GovernanceKey, { description: string; features: string[] }> = {
    users: {
      description: "Verwalten Sie alle Workspace-Benutzer, weisen Sie Rollen zu und kontrollieren Sie den Zugang zu verschiedenen Bereichen der Plattform.",
      features: ["Benutzerverwaltung", "Rollenzuweisung", "Zugangskontrolle", "Benutzerprofile"],
    },
    requests: {
      description: "Prüfen und bearbeiten Sie Zugangsanfragen von neuen Benutzern, die Zugriff auf den Workspace erhalten möchten.",
      features: ["Anfragen prüfen", "Genehmigen/Ablehnen", "Benachrichtigungen", "Audit-Trail"],
    },
    consents: {
      description: "DSGVO-konforme Einwilligungsvorlagen erstellen und verwalten. Dokumentation aller Einwilligungen für Compliance-Zwecke.",
      features: ["Vorlagen erstellen", "DSGVO-Konformität", "Einwilligungsstatus", "Compliance-Berichte"],
    },
    reports: {
      description: "Ergebnisberichte generieren, exportieren und verwalten. Umfassende Assessment-Dokumentation für alle Teilnehmer.",
      features: ["PDF-Export", "Individuelle Berichte", "Vergleichsanalysen", "Automatische Generierung"],
    },
    analytics: {
      description: "Detaillierte Auswertungen und Dashboards zur Analyse von Assessment-Ergebnissen und Workspace-Aktivitäten.",
      features: ["Ergebnis-Dashboard", "Trend-Analysen", "Vergleichswerte", "Daten-Export"],
    },
    audio: {
      description: "Audioaufnahmen transkribieren und mit KI-Unterstützung zusammenfassen. Ideal für Interview-Dokumentation.",
      features: ["Automatische Transkription", "KI-Zusammenfassungen", "Sprecheridentifikation", "Export-Optionen"],
    },
  };

  const governanceDetails: GovernanceDetail[] = governanceLinks.map((link) => {
    const iconKey = link.icon || "users";
    const govKey = governanceIconMap[iconKey] || "users";
    const details = governanceDescriptions[govKey];
    return {
      key: govKey,
      title: link.title,
      href: link.href,
      shortDesc: link.desc,
      description: details.description,
      features: details.features,
      icon: ICON_MAP[iconKey] || ICON_MAP.users,
    };
  });

  const currentGovernance = governanceDetails.find((g) => g.key === selectedGovernance) ?? governanceDetails[0];

  const currentTool = toolDetails.find((t) => t.key === selectedTool) ?? toolDetails[0];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name ist erforderlich");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: "draft",
          designMode: form.designMode,
          autoDeleteDays: form.autoDeleteDays ? parseInt(form.autoDeleteDays) : null,
          ...(form.copyFromId ? { copyFromId: form.copyFromId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
        setCreating(false);
        return;
      }

      const newAssessment = await res.json();
      setShowCreate(false);
      setForm({ name: "", description: "", startDate: "", endDate: "", designMode: "classic", copyFromId: "", autoDeleteDays: "" });
      router.push(`${base}/projects/${newAssessment.id}`);
    } catch {
      setError("Netzwerkfehler");
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLocalAssessments((prev) => prev.filter((a) => a.id !== id));
        setConfirmDelete(null);
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  function renderLinkGrid(links: LinkItem[]) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="rounded-xl border p-5 transition-all hover:shadow-lg group"
            style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
            data-testid={`link-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primary}10`, color: primary }}
              >
                {link.icon && ICON_MAP[link.icon] ? ICON_MAP[link.icon] : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                  >
                    {link.title}
                  </h3>
                  {link.badge && (
                    <span
                      className="text-[10px] font-bold text-white rounded-full px-2 py-0.5"
                      style={{ backgroundColor: primary }}
                    >
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 opacity-80" style={{ color: textColor }}>{link.desc}</p>
              </div>
            </div>
            <div className="mt-3 text-right">
              <span
                className="text-[11px] font-medium opacity-0 group-hover:opacity-70 transition-opacity"
                style={{ color: primary }}
              >
                Öffnen →
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  function renderExerciseLibraryIllustration() {
    const rows = [
      { name: "Strategische Fallstudie", type: "Fallstudie", level: "C-Level" },
      { name: "Führungs-Interview", type: "Interview", level: "VP" },
      { name: "Fact-Finding Simulation", type: "Fact-Finding", level: "Director" },
      { name: "Gruppendiskussion", type: "Verhaltenssim.", level: "Manager" },
    ];
    return (
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${primary}20` }}>
        <div className="grid grid-cols-4 text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ backgroundColor: `${primary}08`, color: `${primary}cc` }}>
          <span>Übung</span>
          <span>Typ</span>
          <span>Level</span>
          <span>Status</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-4 text-xs px-3 py-2.5 border-t items-center" style={{ borderColor: `${primary}10` }}>
            <span className="font-medium truncate" style={{ color: textColor }}>{row.name}</span>
            <span className="opacity-70" style={{ color: textColor }}>{row.type}</span>
            <span className="opacity-70" style={{ color: textColor }}>{row.level}</span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: i < 2 ? "#22c55e" : `${primary}60` }} />
              <span className="opacity-70 text-[10px]" style={{ color: textColor }}>{i < 2 ? "Aktiv" : "Entwurf"}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  function renderIntelligenceIllustration() {
    const modules = [
      { name: "Predictive Success", pct: 87 },
      { name: "Development Path", pct: 62 },
      { name: "Hypothesis Engine", pct: 45 },
    ];
    return (
      <div className="space-y-3">
        {modules.map((m, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: `${primary}20`, backgroundColor: `${primary}04` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: textColor }}>{m.name}</span>
              <span className="text-[10px] font-bold" style={{ color: primary }}>{m.pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${primary}15` }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: primary, opacity: 0.7 + i * 0.1 }} />
            </div>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((dot) => (
                <span key={dot} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot <= (3 - i) ? primary : `${primary}25` }} />
              ))}
              <span className="text-[9px] opacity-60 ml-1" style={{ color: textColor }}>{i === 0 ? "Analyse abgeschlossen" : i === 1 ? "In Bearbeitung" : "Ausstehend"}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderObservationSheetIllustration() {
    const criteria = [
      { name: "Analytisches Denken", rating: 4 },
      { name: "Kommunikation", rating: 3 },
      { name: "Entscheidungsfähigkeit", rating: 5 },
      { name: "Teamführung", rating: 2 },
    ];
    return (
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${primary}20` }}>
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${primary}08`, color: `${primary}cc` }}>
          Beobachtungsbogen — Bewertungsskala
        </div>
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2.5 border-t" style={{ borderColor: `${primary}10` }}>
            <span className="text-xs font-medium" style={{ color: textColor }}>{c.name}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <span
                  key={v}
                  className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: v <= c.rating ? primary : `${primary}10`,
                    color: v <= c.rating ? "#fff" : `${primary}40`,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderToolIllustration(key: ToolKey) {
    switch (key) {
      case "exercise-library":
        return renderExerciseLibraryIllustration();
      case "intelligence":
        return renderIntelligenceIllustration();
      case "observation-sheets":
        return renderObservationSheetIllustration();
    }
  }

  function renderProjectCard(a: AssessmentItem) {
    const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8" };
    return (
      <div
        key={a.id}
        className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group flex relative"
        style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
        data-testid={`card-project-${a.id}`}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirmDelete(a.id);
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
          style={{ color: "#ef4444" }}
          data-testid={`button-delete-project-${a.id}`}
          title="Projekt löschen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
        <Link
          href={`${base}/projects/${a.id}`}
          className="flex flex-1"
          data-testid={`link-project-${a.id}`}
        >
          <div
            className="w-1.5 shrink-0 rounded-l-xl"
            style={{ backgroundColor: st.color }}
          />
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3
                    className="text-lg font-bold tracking-tight truncate"
                    style={{ fontFamily: `'${headingFont}', serif`, color: textColor }}
                  >
                    {a.name}
                  </h3>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}
                  >
                    {st.de}
                  </span>
                </div>
                {a.description && (
                  <p className="text-sm opacity-80 mt-1 line-clamp-2" style={{ color: textColor }}>{a.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs opacity-70" style={{ color: textColor }}>
                  <span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span>
                  <span>{a.candidateCount} Kandidat{a.candidateCount !== 1 ? "en" : ""}</span>
                  <span>{a.exerciseCount} Übung{a.exerciseCount !== 1 ? "en" : ""}</span>
                  <span>{a.reportCount} Bericht{a.reportCount !== 1 ? "e" : ""}</span>
                  {a.autoDeleteDays && (
                    <span className="flex items-center gap-1" data-testid={`status-auto-delete-${a.id}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Auto-Löschung: {a.autoDeleteDays} Tage
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5" data-testid={`status-indicators-${a.id}`}>
                  {(() => {
                    const dm = designModeLabels[a.designMode] ?? designModeLabels.classic;
                    return (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: a.designMode === "ai_full" ? "#faf5ff" : a.designMode === "ai_supported" ? "#eff6ff" : "#f8fafc",
                          color: a.designMode === "ai_full" ? "#7c3aed" : a.designMode === "ai_supported" ? "#2563eb" : "#64748b",
                          borderColor: a.designMode === "ai_full" ? "#7c3aed30" : a.designMode === "ai_supported" ? "#2563eb30" : "#64748b30",
                        }}
                        data-testid={`status-design-mode-${a.id}`}
                      >
                        {dm.icon} {dm.de}
                      </span>
                    );
                  })()}

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: a.competencyCoverage >= 80 ? "#f0fdf4" : a.competencyCoverage > 0 ? "#fffbeb" : "#f8fafc",
                      color: a.competencyCoverage >= 80 ? "#16a34a" : a.competencyCoverage > 0 ? "#d97706" : "#94a3b8",
                    }}
                    data-testid={`status-competency-${a.id}`}
                  >
                    Kompetenz {a.competencyCoverage}%
                  </span>

                  {(a.status === "active" || a.status === "completed") && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: a.ratingProgress >= 100 ? "#f0fdf4" : a.ratingProgress > 0 ? "#eff6ff" : "#fffbeb",
                        color: a.ratingProgress >= 100 ? "#16a34a" : a.ratingProgress > 0 ? "#2563eb" : "#d97706",
                      }}
                      data-testid={`status-evaluation-${a.id}`}
                    >
                      Bewertung {a.ratingProgress}%
                    </span>
                  )}

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: a.reportCount > 0 ? "#f0fdf4" : a.candidateCount > 0 ? "#fffbeb" : "#f8fafc",
                      color: a.reportCount > 0 ? "#16a34a" : a.candidateCount > 0 ? "#d97706" : "#94a3b8",
                    }}
                    data-testid={`status-reports-${a.id}`}
                  >
                    {a.reportCount > 0 ? `${a.reportCount} Bericht${a.reportCount !== 1 ? "e" : ""}` : a.candidateCount > 0 ? "Berichte ausstehend" : "Keine Berichte"}
                  </span>

                  {(() => {
                    const steps = [
                      a.competencyCoverage > 0,
                      a.exerciseCount > 0,
                      a.candidateCount > 0,
                      a.ratingCount > 0,
                      a.reportCount > 0,
                    ];
                    const done = steps.filter(Boolean).length;
                    const pct = Math.round((done / steps.length) * 100);
                    return (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: pct >= 100 ? "#f0fdf4" : pct >= 60 ? "#eff6ff" : pct > 0 ? "#fffbeb" : "#f8fafc",
                          color: pct >= 100 ? "#16a34a" : pct >= 60 ? "#2563eb" : pct > 0 ? "#d97706" : "#94a3b8",
                          borderColor: pct >= 100 ? "#16a34a20" : pct >= 60 ? "#2563eb20" : pct > 0 ? "#d9770620" : "#94a3b820",
                        }}
                        data-testid={`status-overall-${a.id}`}
                      >
                        Gesamt {pct}%
                      </span>
                    );
                  })()}
                </div>
              </div>
              <span
                className="text-sm font-medium opacity-0 group-hover:opacity-70 transition-opacity whitespace-nowrap"
                style={{ color: primary }}
              >
                Öffnen →
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  function renderCreateModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
        <div
          className="rounded-2xl border shadow-xl w-full max-w-lg p-8"
          style={{ backgroundColor: bgColor, borderColor: `${primary}20` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            className="text-xl font-bold mb-6"
            style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
          >
            Neues Projekt erstellen
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Projektname *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: `${primary}30`, color: textColor }}
                placeholder="z.B. Executive Assessment Q1 2026"
                data-testid="input-project-name"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Vorlage verwenden
              </label>
              <select
                value={form.copyFromId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    const source = localAssessments.find((a) => a.id === selectedId);
                    if (source && !form.name) {
                      setForm({ ...form, copyFromId: selectedId, name: `${source.name} (Kopie)` });
                      return;
                    }
                  }
                  setForm({ ...form, copyFromId: selectedId });
                }}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: `${primary}30`, color: textColor }}
                data-testid="select-copy-from"
              >
                <option value="">— Kein Vorlage —</option>
                {localAssessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[11px] mt-1 opacity-70 italic" style={{ color: textColor }}>
                (Optional) Erstellt eine Kopie eines bestehenden Projekts als Basis.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                Beschreibung
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors min-h-[80px] resize-y"
                style={{ borderColor: `${primary}30`, color: textColor }}
                placeholder="Kurze Beschreibung des Projekts..."
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                  Startdatum
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ borderColor: `${primary}30`, color: textColor }}
                  data-testid="input-project-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: textColor }}>
                  Enddatum
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ borderColor: `${primary}30`, color: textColor }}
                  data-testid="input-project-end-date"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: textColor }}>
                Design-Modus
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ai_full", "ai_supported", "classic"] as const).map((mode) => {
                  const ml = designModeLabels[mode];
                  const selected = form.designMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, designMode: mode })}
                      className="rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-center"
                      style={{
                        borderColor: selected ? primary : `${primary}20`,
                        backgroundColor: selected ? `${primary}08` : "transparent",
                        color: selected ? primary : textColor,
                        boxShadow: selected ? `0 0 0 1px ${primary}` : "none",
                      }}
                      data-testid={`button-design-mode-${mode}`}
                    >
                      <span className="block text-base mb-0.5">{ml.icon}</span>
                      {ml.de}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5 opacity-70 italic" style={{ color: textColor }}>
                {form.designMode === "ai_full" ? "KI generiert komplette Assessment-Struktur mit Modul-Vorschlägen." :
                 form.designMode === "ai_supported" ? "KI schlägt Optionen vor, Sie wählen und modifizieren." :
                 "Sie wählen Module manuell aus der Bibliothek."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Automatische Löschung</label>
              <select value={form.autoDeleteDays} onChange={(e) => setForm({ ...form, autoDeleteDays: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: `${primary}30`, color: textColor, backgroundColor: bgColor }} data-testid="select-auto-delete-days">
                <option value="">Keine automatische Löschung</option>
                <option value="30">30 Tage nach Abschluss</option>
                <option value="60">60 Tage nach Abschluss</option>
                <option value="90">90 Tage nach Abschluss</option>
                <option value="180">180 Tage nach Abschluss</option>
                <option value="365">365 Tage nach Abschluss</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium" data-testid="text-create-error">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-slate-50"
                style={{ borderColor: `${primary}20`, color: textColor }}
                data-testid="button-cancel-create"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
                data-testid="button-submit-create"
              >
                {creating ? "Wird erstellt..." : "Erstellen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderDeleteConfirmation() {
    if (!confirmDelete) return null;
    const project = localAssessments.find((a) => a.id === confirmDelete);
    if (!project) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
        <div
          className="rounded-2xl border shadow-xl w-full max-w-md p-8"
          style={{ backgroundColor: bgColor, borderColor: `${primary}20` }}
          onClick={(e) => e.stopPropagation()}
          data-testid="dialog-confirm-delete"
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: `'${headingFont}', serif`, color: "#ef4444" }}
          >
            Projekt löschen
          </h3>
          <p className="text-sm mb-6" style={{ color: textColor }}>
            Möchten Sie das Projekt &apos;{project.name}&apos; wirklich löschen? Alle zugehörigen Daten werden unwiderruflich gelöscht.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-slate-50"
              style={{ borderColor: `${primary}20`, color: textColor }}
              data-testid="button-cancel-delete"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => handleDelete(confirmDelete)}
              disabled={deletingId === confirmDelete}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#ef4444" }}
              data-testid="button-confirm-delete"
            >
              {deletingId === confirmDelete ? "Wird gelöscht..." : "Endgültig löschen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="section-cockpit-tabs">
      <nav
        className="flex gap-1 mb-8 rounded-xl p-1.5"
        style={{ backgroundColor: `${primary}08`, border: `1px solid ${primary}12` }}
        data-testid="nav-cockpit-tabs"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
              style={{
                backgroundColor: isActive ? bgColor : "transparent",
                color: isActive ? primary : `${textColor}80`,
                boxShadow: isActive ? `0 1px 3px ${primary}15` : "none",
                fontFamily: `'${headingFont}', serif`,
              }}
              data-testid={`tab-${tab.key}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.iconPath} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {renderCreateModal()}
      {renderDeleteConfirmation()}

      {activeTab === "projects" && (
        <section data-testid="section-projects">
          <div className="mb-5">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
            >
              Projekte & Assessments
            </h2>
            <p className="text-sm mt-0.5 opacity-70 italic" style={{ color: textColor }}>
              Wählen Sie ein Projekt oder erstellen Sie ein neues.
            </p>
          </div>

          <div className="flex gap-6" data-testid="projects-split-layout">
            <div className="w-[30%] shrink-0 space-y-2" data-testid="projects-sidebar">
              <button
                onClick={() => setSelectedProjectView("all")}
                className="w-full text-left rounded-xl border p-4 transition-all"
                style={{
                  borderColor: selectedProjectView === "all" ? primary : `${primary}15`,
                  backgroundColor: selectedProjectView === "all" ? `${primary}08` : bgColor,
                  boxShadow: selectedProjectView === "all" ? `0 0 0 1px ${primary}40, 0 2px 8px ${primary}10` : "none",
                }}
                data-testid="project-menu-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: selectedProjectView === "all" ? primary : `${primary}10`,
                      color: selectedProjectView === "all" ? "#fff" : primary,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold leading-tight"
                      style={{
                        color: selectedProjectView === "all" ? primary : textColor,
                        fontFamily: `'${headingFont}', serif`,
                      }}
                    >
                      Alle Projekte
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-70 leading-snug" style={{ color: textColor }}>
                      {localAssessments.length} Projekt{localAssessments.length !== 1 ? "e" : ""}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm"
                style={{
                  borderColor: `${primary}15`,
                  backgroundColor: bgColor,
                }}
                data-testid="project-menu-new"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primary}10`, color: primary }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold leading-tight"
                      style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                    >
                      Neues Projekt
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-70 leading-snug" style={{ color: textColor }}>
                      Projekt erstellen
                    </p>
                  </div>
                </div>
              </button>

              {localAssessments.map((a) => {
                const st = statusLabels[a.status] ?? { de: a.status, color: "#94a3b8" };
                const isSelected = selectedProjectView === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`${base}/projects/${a.id}`)}
                    className="w-full text-left rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: isSelected ? primary : `${primary}15`,
                      backgroundColor: isSelected ? `${primary}08` : bgColor,
                      boxShadow: isSelected ? `0 0 0 1px ${primary}40, 0 2px 8px ${primary}10` : "none",
                    }}
                    data-testid={`project-menu-${a.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? primary : `${primary}10`,
                          color: isSelected ? "#fff" : primary,
                        }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-semibold leading-tight truncate"
                          style={{
                            color: isSelected ? primary : textColor,
                            fontFamily: `'${headingFont}', serif`,
                          }}
                        >
                          {a.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${st.color}15`, color: st.color }}
                          >
                            {st.de}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0" data-testid="projects-detail-panel">
              {localAssessments.length === 0 ? (
                <div
                  className="rounded-xl border-2 border-dashed p-12 text-center"
                  style={{ borderColor: `${primary}20` }}
                  data-testid="empty-projects"
                >
                  <p className="text-lg font-medium opacity-70 mb-2" style={{ color: textColor }}>Noch keine Projekte vorhanden</p>
                  <p className="text-sm opacity-60 mb-4" style={{ color: textColor }}>Erstellen Sie Ihr erstes Assessment-Projekt, um loszulegen.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: primary }}
                    data-testid="button-create-first-project"
                  >
                    + Erstes Projekt erstellen
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {localAssessments.map((a) => renderProjectCard(a))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "tools" && (
        <section data-testid="section-tools">
          <div className="mb-5">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
            >
              Werkzeuge
            </h2>
            <p className="text-sm mt-0.5 opacity-70 italic" style={{ color: textColor }}>
              Assessment-Instrumente, Bibliotheken und Design-Werkzeuge
            </p>
          </div>
          <div className="flex gap-6" data-testid="tools-split-layout">
            <div className="w-[30%] shrink-0 space-y-2" data-testid="tools-sidebar">
              {toolDetails.map((tool) => {
                const isSelected = selectedTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => setSelectedTool(tool.key)}
                    className="w-full text-left rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: isSelected ? primary : `${primary}15`,
                      backgroundColor: isSelected ? `${primary}08` : bgColor,
                      boxShadow: isSelected ? `0 0 0 1px ${primary}40, 0 2px 8px ${primary}10` : "none",
                    }}
                    data-testid={`tool-menu-${tool.key}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: isSelected ? primary : `${primary}10`,
                          color: isSelected ? "#fff" : primary,
                        }}
                      >
                        {tool.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-semibold leading-tight"
                          style={{
                            color: isSelected ? primary : textColor,
                            fontFamily: `'${headingFont}', serif`,
                          }}
                        >
                          {tool.title}
                        </h4>
                        <p className="text-[11px] mt-0.5 opacity-70 leading-snug" style={{ color: textColor }}>{tool.shortDesc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0" data-testid="tools-detail-panel">
              <div
                className="rounded-xl border p-6"
                style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                data-testid={`tool-detail-${currentTool.key}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primary}10`, color: primary }}
                  >
                    <div className="scale-125">{currentTool.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-bold tracking-tight"
                      style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                    >
                      {currentTool.title}
                    </h3>
                    <p className="text-sm mt-1 opacity-80 leading-relaxed" style={{ color: textColor }}>{currentTool.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: `${primary}99` }}>
                    Features
                  </h4>
                  <ul className="space-y-1.5">
                    {currentTool.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: primary }}
                        />
                        <span style={{ color: textColor }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: `${primary}99` }}>
                    Vorschau
                  </h4>
                  {renderToolIllustration(currentTool.key)}
                </div>

                <div className="pt-2">
                  <Link
                    href={currentTool.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: primary }}
                    data-testid={`button-open-tool-${currentTool.key}`}
                  >
                    Öffnen →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "governance" && (
        <section data-testid="section-governance">
          <div className="mb-5">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
            >
              Governance
            </h2>
            <p className="text-sm mt-0.5 opacity-70 italic" style={{ color: textColor }}>
              Benutzer, Compliance, Berichte und Auswertungen
            </p>
          </div>
          <div className="flex gap-6" data-testid="governance-split-layout">
            <div className="w-[30%] shrink-0 space-y-2" data-testid="governance-sidebar">
              {governanceDetails.map((item) => {
                const isSelected = selectedGovernance === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedGovernance(item.key)}
                    className="w-full text-left rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: isSelected ? primary : `${primary}15`,
                      backgroundColor: isSelected ? `${primary}08` : bgColor,
                      boxShadow: isSelected ? `0 0 0 1px ${primary}40, 0 2px 8px ${primary}10` : "none",
                    }}
                    data-testid={`governance-menu-${item.key}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: isSelected ? primary : `${primary}10`,
                          color: isSelected ? "#fff" : primary,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-semibold leading-tight"
                          style={{
                            color: isSelected ? primary : textColor,
                            fontFamily: `'${headingFont}', serif`,
                          }}
                        >
                          {item.title}
                        </h4>
                        <p className="text-[11px] mt-0.5 opacity-70 leading-snug" style={{ color: textColor }}>{item.shortDesc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0" data-testid="governance-detail-panel">
              <div
                className="rounded-xl border p-6"
                style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                data-testid={`governance-detail-${currentGovernance.key}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primary}10`, color: primary }}
                  >
                    <div className="scale-125">{currentGovernance.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-bold tracking-tight"
                      style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                    >
                      {currentGovernance.title}
                    </h3>
                    <p className="text-sm mt-1 opacity-80 leading-relaxed" style={{ color: textColor }}>{currentGovernance.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: `${primary}99` }}>
                    Features
                  </h4>
                  <ul className="space-y-1.5">
                    {currentGovernance.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: primary }}
                        />
                        <span style={{ color: textColor }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href={currentGovernance.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: primary }}
                    data-testid={`button-open-governance-${currentGovernance.key}`}
                  >
                    Öffnen →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
