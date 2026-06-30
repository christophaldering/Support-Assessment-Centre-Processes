"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CaseStudyData, AssessmentQuestions, Email, StrategicAnalysis } from "@/lib/case-studies/varexia";

const RichTextEditor = dynamic(() => import("@/app/components/RichTextEditor"), { ssr: false });

type Tab =
  | "briefing"
  | "organigramm"
  | "overview"
  | "strategy"
  | "products"
  | "financials"
  | "protocols"
  | "news"
  | "internal-comms"
  | "external-comms"
  | "strategic-analysis"
  | "hr-dashboard"
  | "dataroom";

const tabList: { id: Tab; labelDe: string; icon: string }[] = [
  { id: "briefing", labelDe: "Briefing", icon: "📋" },
  { id: "organigramm", labelDe: "Organigramm", icon: "🏛️" },
  { id: "overview", labelDe: "Übersicht", icon: "📊" },
  { id: "strategy", labelDe: "Strategie", icon: "🎯" },
  { id: "products", labelDe: "Produkte", icon: "🏢" },
  { id: "financials", labelDe: "Financials", icon: "💰" },
  { id: "protocols", labelDe: "Protokolle", icon: "📝" },
  { id: "news", labelDe: "News", icon: "📰" },
  { id: "internal-comms", labelDe: "Interne Kommunikation", icon: "📨" },
  { id: "external-comms", labelDe: "Externe Kommunikation", icon: "📤" },
  { id: "strategic-analysis", labelDe: "Strategische Analyse", icon: "🔍" },
  { id: "hr-dashboard", labelDe: "HR-Dashboard", icon: "👥" },
  { id: "dataroom", labelDe: "Datenraum-Dokumente", icon: "🗂️" },
];

function formatCurrency(value: number): string {
  return `€${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  data: CaseStudyData;
  questions: AssessmentQuestions;
  workspaceSlug: string;
  logoUrl?: string | null;
  caseStudyId?: string | null;
}

interface DataRoomCategory {
  id: string; slug: string; label: string; labelEn: string | null;
  icon: string | null; color: string | null; sortOrder: number;
  _count?: { documents: number };
}
interface DataRoomDoc {
  id: string; title: string; description: string | null;
  documentType: string; isImportant: boolean; isNew: boolean;
  sortOrder: number; categoryId: string | null;
  dataRoomCategory: { label: string; icon: string | null; color: string | null } | null;
}

export default function CaseStudyClient({ data, questions, workspaceSlug, logoUrl, caseStudyId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("briefing");
  const [selectedEmailId, setSelectedEmailId] = useState<string>("");
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>("");
  const [selectedNewsId, setSelectedNewsId] = useState<string>("");
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(logoUrl || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editingDoc, setEditingDoc] = useState<{ type: string; id: string } | null>(null);
  const [drCategories, setDrCategories] = useState<DataRoomCategory[]>([]);
  const [drDocuments, setDrDocuments] = useState<DataRoomDoc[]>([]);
  const [drLoading, setDrLoading] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [localData, setLocalData] = useState<CaseStudyData>(data);
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingHtml, setBriefingHtml] = useState("");
  const [savingBriefing, setSavingBriefing] = useState(false);
  const [briefingMsg, setBriefingMsg] = useState("");

  const saveDocument = async () => {
    if (!editingDoc || !caseStudyId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/${caseStudyId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: editingDoc.type,
          documentId: editingDoc.id,
          updates: editForm,
        }),
      });
      if (res.ok) {
        if (editingDoc.type === "email") {
          setLocalData(prev => ({
            ...prev,
            emails: prev.emails.map(e => e.id === editingDoc.id ? { ...e, ...editForm } : e),
          }));
        } else if (editingDoc.type === "protocol") {
          setLocalData(prev => ({
            ...prev,
            protocols: prev.protocols.map(p => p.id === editingDoc.id ? { ...p, ...editForm } : p),
          }));
        } else if (editingDoc.type === "news") {
          setLocalData(prev => ({
            ...prev,
            newsArticles: prev.newsArticles.map(n => n.id === editingDoc.id ? { ...n, ...editForm } : n),
          }));
        }
        setEditingDoc(null);
      }
    } catch {}
    setSaving(false);
  };

  const briefingToHtml = () => {
    const b = localData.briefing;
    if (!b) return "<p>Keine Briefing-Daten vorhanden.</p>";
    if (b.customHtml) return b.customHtml;
    let html = "";
    html += `<h2>Your Role / Situation</h2>`;
    html += `<p>${b.role || ""}</p>`;
    html += `<p>${b.situation || ""}</p>`;
    html += `<p>You have received a selection of internal and external documents shortly before the meeting. The material is deliberately incomplete. This reflects the reality of executive decision-making.</p>`;
    html += `<h2>Your Task</h2>`;
    html += `<p>You are asked to structure and articulate your judgment along two dimensions:</p>`;
    if (b.analysisQuestions?.length) {
      html += `<h3>1. Analysis</h3><ul>`;
      b.analysisQuestions.forEach((q: string) => { html += `<li>${q}</li>`; });
      html += `</ul>`;
    }
    if (b.conclusionQuestions?.length) {
      html += `<h3>2. Conclusions / Assessment</h3><ul>`;
      b.conclusionQuestions.forEach((q: string) => { html += `<li>${q}</li>`; });
      html += `</ul>`;
    }
    if (b.tasks?.length) {
      html += `<h3>3. Tasks</h3><ul>`;
      b.tasks.forEach((t: string) => { html += `<li>${t}</li>`; });
      html += `</ul>`;
    }
    html += `<h2>Framework</h2>`;
    html += `<p>You have limited time and incomplete information. This is intentional.</p>`;
    html += `<p>Individual analysis: ${b.timeMinutes || "?"} min · Presentation: ${b.presentationMinutes || "?"} min</p>`;
    return html;
  };

  const startEditBriefing = () => {
    setBriefingHtml(briefingToHtml());
    setEditingBriefing(true);
    setBriefingMsg("");
  };

  const saveBriefing = async () => {
    if (!caseStudyId) return;
    setSavingBriefing(true);
    setBriefingMsg("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/${caseStudyId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "briefing",
          documentId: "briefing",
          updates: { ...localData.briefing, customHtml: briefingHtml },
        }),
      });
      if (res.ok) {
        setLocalData(prev => ({
          ...prev,
          briefing: { ...prev.briefing!, customHtml: briefingHtml },
        }));
        setEditingBriefing(false);
        setBriefingMsg("Gespeichert");
        setTimeout(() => setBriefingMsg(""), 2500);
      } else {
        setBriefingMsg("Fehler beim Speichern");
      }
    } catch {
      setBriefingMsg("Fehler beim Speichern");
    }
    setSavingBriefing(false);
  };

  // Load data-room data when tab becomes active
  useEffect(() => {
    if (activeTab === "dataroom" && caseStudyId && !drLoading && drCategories.length === 0) {
      setDrLoading(true);
      Promise.all([
        fetch(`/api/w/${workspaceSlug}/case-studies/${caseStudyId}/data-room/categories`).then((r) => r.json()),
        fetch(`/api/w/${workspaceSlug}/case-studies/${caseStudyId}/data-room/documents`).then((r) => r.json()),
      ])
        .then(([cats, docs]) => {
          setDrCategories(Array.isArray(cats) ? cats : []);
          setDrDocuments(Array.isArray(docs) ? docs : []);
        })
        .catch(() => {})
        .finally(() => setDrLoading(false));
    }
  }, [activeTab, caseStudyId, workspaceSlug]);

  const internalEmails = localData.emails.filter((e) => e.category === "internal" || !e.category);
  const externalEmails = localData.emails.filter((e) => e.category === "external");

  const visibleTabs = tabList.filter((tab) => {
    switch (tab.id) {
      case "briefing": return true;
      case "organigramm": return !!(localData.organigramm && localData.organigramm.length > 0);
      case "overview": return true;
      case "strategy": return localData.businessUnits.length > 0;
      case "products": return localData.businessUnits.length > 0;
      case "financials": return true;
      case "protocols": return !!(localData.protocols && localData.protocols.length > 0);
      case "news": return !!(localData.newsArticles && localData.newsArticles.length > 0);
      case "internal-comms": return internalEmails.length > 0;
      case "external-comms": return externalEmails.length > 0;
      case "strategic-analysis": return !!(localData.strategicAnalysis);
      case "hr-dashboard": return !!(localData.hrSurvey && localData.hrSurvey.categories.length > 0);
      case "dataroom": return !!caseStudyId;
      default: return true;
    }
  });

  const selectedInternalEmail = internalEmails.find((e) => e.id === selectedEmailId);
  const selectedExternalEmail = externalEmails.find((e) => e.id === selectedEmailId);
  const selectedProtocol = localData.protocols?.find((p) => p.id === selectedProtocolId);
  const selectedNews = localData.newsArticles?.find((n) => n.id === selectedNewsId);

  const base = `/w/${workspaceSlug}/admin`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[var(--eds-text-primary)]">
      <header className="bg-[var(--eds-text-primary)] text-white sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`${base}/case-studio`}
              className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-case-studio"
            >
              ← Fallstudien-Werkstatt
            </Link>
            {currentLogoUrl && (
              <img src={currentLogoUrl} alt={`${localData.name} Logo`} className="h-7 w-auto object-contain" data-testid="img-case-logo" />
            )}
            <span className="text-sm font-bold tracking-tight font-serif">{localData.name}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Case Study</span>
          </div>
          <span className="text-[10px] text-white/40">{localData.id.toUpperCase()}-2026</span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-64 shrink-0 bg-[var(--eds-bg-sunken)] border-r border-[var(--eds-border)] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="py-4 px-3 space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedEmailId("");
                  setSelectedProtocolId("");
                  setSelectedNewsId("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-[var(--eds-text-primary)] text-white shadow-sm"
                    : "text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] hover:text-[var(--eds-text-primary)]"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.labelDe}</span>
              </button>
            ))}
          </div>

          {caseStudyId && currentLogoUrl && (
            <div className="px-3 py-4 border-t border-[var(--eds-border)] mt-auto">
              <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase tracking-wider mb-2 px-1">Branding</p>
              <div className="flex items-center gap-2 w-full">
                <img src={currentLogoUrl} alt="Logo" className="h-8 w-auto object-contain rounded bg-white border border-[var(--eds-border)] p-1" />
              </div>
            </div>
          )}
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">

            {activeTab === "briefing" && (
              <div className="max-w-3xl mx-auto space-y-8" data-testid="section-briefing">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-[var(--eds-text-primary)] mb-2">Aufgabenstellung</h1>
                    <p className="text-sm text-[var(--eds-text-tertiary)]">Independent Assessment · Confidential</p>
                  </div>
                  {caseStudyId && !editingBriefing && (
                    <button
                      onClick={startEditBriefing}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
                      data-testid="button-edit-briefing"
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>

                {briefingMsg && (
                  <div className={`p-3 rounded-lg text-sm ${briefingMsg === "Gespeichert" ? "bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" : "bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] text-[var(--eds-status-red)]"}`}>
                    {briefingMsg}
                  </div>
                )}

                {editingBriefing ? (
                  <div className="space-y-4">
                    <RichTextEditor
                      content={briefingHtml}
                      onChange={setBriefingHtml}
                      placeholder="Briefing-Text eingeben..."
                      minHeight="400px"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={saveBriefing}
                        disabled={savingBriefing}
                        className="px-5 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                        style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                        data-testid="button-save-briefing"
                      >
                        {savingBriefing ? "Wird gespeichert..." : "Speichern"}
                      </button>
                      <button
                        onClick={() => setEditingBriefing(false)}
                        className="px-4 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-secondary)] rounded-lg text-sm hover:bg-[var(--eds-bg-sunken)] transition"
                        data-testid="button-cancel-briefing"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : localData.briefing?.customHtml ? (
                  <div
                    className="rounded-xl border border-[var(--eds-border)] p-8 text-[var(--eds-text-primary)] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: localData.briefing.customHtml }}
                    data-testid="briefing-custom-html"
                  />
                ) : localData.briefing ? (
                  <div className="rounded-xl border border-[var(--eds-border)] p-8 space-y-6 text-[var(--eds-text-primary)] leading-relaxed">
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)]">Your Role / Situation</h2>
                    <p>{localData.briefing.role}</p>
                    <p>{localData.briefing.situation}</p>
                    <p>
                      You have received a selection of internal and external documents shortly before the meeting. The material is deliberately
                      incomplete. This reflects the reality of executive decision-making.
                    </p>

                    <hr className="border-[var(--eds-border)]" />
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)]">Your Task</h2>
                    <p>You are asked to structure and articulate your judgment along two dimensions:</p>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-[var(--eds-text-primary)] mb-2">1. Analysis</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          {localData.briefing.analysisQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--eds-text-primary)] mb-2">2. Conclusions / Assessment</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          {localData.briefing.conclusionQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      {localData.briefing.tasks.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-[var(--eds-text-primary)] mb-2">3. Tasks</h3>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            {localData.briefing.tasks.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-lg p-4 text-sm">
                      <p className="font-semibold text-amber-900 mb-1">Important:</p>
                      <p className="text-[var(--eds-status-amber)]">
                        The objective is not to propose a comprehensive action plan or an &ldquo;optimal solution.&rdquo;
                        What matters is the clarity of your reasoning, the quality of your prioritization, and the explicit handling of trade-offs.
                      </p>
                    </div>

                    <hr className="border-[var(--eds-border)]" />
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)]">Framework</h2>
                    <p>
                      You have limited time and incomplete information. This is intentional. Your task is to provide a clear, coherent and
                      senior-level assessment under uncertainty.
                    </p>
                    <div className="flex gap-8 mt-2">
                      <div className="bg-[var(--eds-bg-sunken)] rounded-lg px-4 py-3 text-center">
                        <div className="text-xl font-serif font-bold text-[var(--eds-text-primary)]">{localData.briefing.timeMinutes}</div>
                        <div className="text-xs text-[var(--eds-text-tertiary)]">min · Individual analysis</div>
                      </div>
                      <div className="bg-[var(--eds-bg-sunken)] rounded-lg px-4 py-3 text-center">
                        <div className="text-xl font-serif font-bold text-[var(--eds-text-primary)]">{localData.briefing.presentationMinutes}</div>
                        <div className="text-xs text-[var(--eds-text-tertiary)]">min · Presentation</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--eds-border)] p-8 text-center text-[var(--eds-text-disabled)]">
                    Kein Briefing vorhanden.
                  </div>
                )}
              </div>
            )}

            {activeTab === "organigramm" && localData.organigramm && localData.organigramm.length > 0 && (
              <div className="space-y-8" data-testid="section-organigramm">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d9488]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-[var(--eds-status-green)]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-100 border border-white/20 text-xs font-medium mb-3">
                      Organization Structure
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Organigramm</h1>
                    <p className="text-teal-200 text-sm">Organizational hierarchy &amp; reporting structure</p>
                  </div>
                </div>

                {(() => {
                  const org = localData.organigramm!;
                  const departments = [...new Set(org.map((p) => p.department))];
                  const topLevel = org.filter((p) => p.reportsTo === null);
                  const getReports = (name: string) => org.filter((p) => p.reportsTo === name);

                  return (
                    <div className="space-y-6">
                      {topLevel.length > 0 && (
                        <div className="rounded-xl border border-[var(--eds-border)] p-6">
                          <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-4">Top Management</h2>
                          <div className="grid md:grid-cols-2 gap-3">
                            {topLevel.map((person) => (
                              <div key={person.name} className="rounded-xl border border-[var(--eds-border)] p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                                  {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-[var(--eds-text-primary)]">{person.name}</div>
                                  <div className="text-xs text-[var(--eds-text-tertiary)]">{person.role}</div>
                                  <div className="text-[10px] text-[var(--eds-text-disabled)]">{person.department}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {departments.map((dept) => {
                        const deptPeople = org.filter((p) => p.department === dept);
                        const deptTopLevel = deptPeople.filter((p) => p.reportsTo === null);
                        const deptReports = deptPeople.filter((p) => p.reportsTo !== null);
                        if (deptReports.length === 0 && deptTopLevel.length > 0) return null;

                        return (
                          <div key={dept} className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                            <div className="bg-[var(--eds-bg-sunken)] px-6 py-3 border-b border-[var(--eds-border)]">
                              <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">{dept}</h3>
                              <p className="text-xs text-[var(--eds-text-disabled)]">{deptPeople.length} members</p>
                            </div>
                            <div className="p-4 space-y-2">
                              {deptPeople.filter((p) => p.reportsTo === null).map((leader) => (
                                <div key={leader.name}>
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                                      {leader.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-[var(--eds-text-primary)]">{leader.name}</div>
                                      <div className="text-xs text-[var(--eds-text-tertiary)]">{leader.role}</div>
                                    </div>
                                  </div>
                                  {getReports(leader.name).map((report) => (
                                    <div key={report.name} className="ml-8 mt-1">
                                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--eds-bg-sunken)] transition-colors">
                                        <div className="w-1 h-6 bg-[var(--eds-border)] rounded-full" />
                                        <div className="w-7 h-7 rounded-full bg-[var(--eds-bg-sunken)] flex items-center justify-center text-[10px] font-bold text-[var(--eds-text-tertiary)]">
                                          {report.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-[var(--eds-text-primary)]">{report.name}</div>
                                          <div className="text-xs text-[var(--eds-text-tertiary)]">{report.role}</div>
                                        </div>
                                      </div>
                                      {getReports(report.name).map((subReport) => (
                                        <div key={subReport.name} className="ml-10 mt-1">
                                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--eds-bg-sunken)] transition-colors">
                                            <div className="w-1 h-4 bg-[var(--eds-bg-sunken)] rounded-full" />
                                            <div className="w-6 h-6 rounded-full bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] flex items-center justify-center text-[9px] font-bold text-[var(--eds-text-disabled)]">
                                              {subReport.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                            </div>
                                            <div>
                                              <div className="text-xs font-medium text-[var(--eds-text-primary)]">{subReport.name}</div>
                                              <div className="text-[10px] text-[var(--eds-text-disabled)]">{subReport.role}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ))}
                              {deptPeople.filter((p) => p.reportsTo !== null && !deptPeople.some((l) => l.reportsTo === null && p.reportsTo === l.name)).map((orphan) => {
                                const alreadyRendered = deptPeople.some((l) => l.reportsTo === null && (orphan.reportsTo === l.name || org.some((m) => m.name === orphan.reportsTo && m.reportsTo === l.name)));
                                if (alreadyRendered) return null;
                                return (
                                  <div key={orphan.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--eds-bg-sunken)] transition-colors ml-4">
                                    <div className="w-7 h-7 rounded-full bg-[var(--eds-bg-sunken)] flex items-center justify-center text-[10px] font-bold text-[var(--eds-text-tertiary)]">
                                      {orphan.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-[var(--eds-text-primary)]">{orphan.name}</div>
                                      <div className="text-xs text-[var(--eds-text-tertiary)]">{orphan.role}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-8" data-testid="section-overview">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] p-8 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-medium mb-4">
                    Strategic Review Required
                  </div>
                  <h1 className="text-3xl font-serif font-bold mb-2">{localData.name}</h1>
                  <p className="text-[var(--eds-text-disabled)] max-w-xl text-lg leading-relaxed">{localData.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {localData.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className={`rounded-xl border p-5 ${
                        metric.trend.includes("down") ? "border-l-4 border-l-[var(--eds-status-red)]" : "border-l-4 border-l-[var(--eds-border-strong)]"
                      }`}
                      data-testid={`kpi-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="text-xs font-medium text-[var(--eds-text-disabled)] uppercase tracking-wider">{metric.label}</span>
                      <div className="text-2xl font-serif font-bold text-[var(--eds-text-primary)] mt-1">{metric.value}</div>
                      {metric.trend.includes("down") && (
                        <p className="text-xs text-[var(--eds-status-red)] mt-1 font-medium">↓ Attention Required</p>
                      )}
                    </div>
                  ))}
                </div>

                {localData.managementTeam && localData.managementTeam.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[var(--eds-text-primary)] mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {localData.managementTeam.map((m) => (
                        <div key={m.name} className="rounded-xl border border-[var(--eds-border)] p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--eds-border)] flex items-center justify-center text-xs font-bold text-[var(--eds-text-secondary)]">
                            {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--eds-text-primary)]">{m.name}</div>
                            <div className="text-xs text-[var(--eds-text-tertiary)]">{m.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {localData.boardImpressions && localData.boardImpressions.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[var(--eds-text-primary)] mb-4">Impressions from Supervisory Board Meeting (January 2026)</h2>
                    <div className="space-y-3">
                      {localData.boardImpressions.map((bi, i) => (
                        <div key={i} className="rounded-xl border border-[var(--eds-border)] p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-xs font-bold">{bi.topic}</div>
                          <div className="text-sm font-medium text-[var(--eds-text-primary)]">{bi.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "strategy" && (
              <div className="space-y-8" data-testid="section-strategy">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--eds-status-amber)]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-[var(--eds-status-amber-bg)]0/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-100 border border-white/20 text-xs font-medium mb-3">
                      Strategic Analysis
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Strategie</h1>
                    <p className="text-amber-200 text-sm">Key strategic tensions, analyst assessment & leadership insights</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-4">Key Strategic Tensions</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {localData.businessUnits.map((bu) => (
                      <div key={bu.id} className="bg-[var(--eds-status-amber-bg)] p-4 rounded-lg border border-[var(--eds-border)]">
                        <span className="text-[10px] font-bold uppercase text-[var(--eds-status-amber)] block mb-1">{bu.name}</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>

                {localData.analystReport && localData.analystReport.source && (
                  <div className="rounded-xl border border-[var(--eds-status-red-bg)] bg-[var(--eds-status-red-bg)]/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-medium bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] rounded-full px-3 py-1">External</span>
                      <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)]">{localData.analystReport.source}</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-2">Key Observations</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--eds-text-secondary)]">
                          {localData.analystReport.observations.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                      {localData.analystReport.criticalQuestions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-2">Critical Questions</h3>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--eds-text-secondary)]">
                            {localData.analystReport.criticalQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {localData.analystReport.indicators.map((ind) => (
                          <div key={ind.label} className="bg-white rounded-lg border border-[var(--eds-border)] p-3">
                            <span className="text-[10px] text-[var(--eds-text-disabled)] uppercase">{ind.label}</span>
                            <div className="text-lg font-mono font-bold text-[var(--eds-text-primary)]">{ind.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-[var(--eds-border)] p-4 text-sm italic text-[var(--eds-text-secondary)]">
                        {localData.analystReport.conclusion}
                      </div>
                    </div>
                  </div>
                )}

                {localData.leadershipSummary && (
                  <div className="rounded-xl border border-[var(--eds-border)] p-6">
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-4">Internal Leadership Workshop – Executive Summary</h2>
                    <div className="text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-wrap">{localData.leadershipSummary}</div>
                  </div>
                )}

                {localData.leadershipConference && (
                  <div className="rounded-xl border border-[var(--eds-border)] p-6">
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-4">Leadership Conference 2025</h2>
                    <div className="text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-wrap">{localData.leadershipConference}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-8" data-testid="section-products">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--eds-status-blue)]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 border border-white/20 text-xs font-medium mb-3">
                      Business Units
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Business Unit Profiles</h1>
                    <p className="text-blue-200 text-sm">FY 2025 Snapshot · Detailed business unit analysis</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {localData.businessUnits.map((bu) => (
                    <div key={bu.id} className="rounded-xl border border-[var(--eds-border)] p-5 hover:border-[var(--eds-border-strong)] transition-colors" data-testid={`bu-${bu.id}`}>
                      <h3 className="text-base font-semibold text-[var(--eds-text-primary)] mb-1">{bu.name}</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-[var(--eds-text-disabled)] uppercase">Revenue</span>
                          <div className="text-xl font-mono font-semibold text-[var(--eds-text-primary)]">€{bu.revenue}bn</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--eds-text-disabled)] uppercase">EBITDA</span>
                          <div className="text-xl font-mono font-semibold text-[var(--eds-text-primary)]">€{bu.ebitda}bn</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--eds-text-disabled)] uppercase">Margin</span>
                          <div className={`text-xl font-mono font-semibold ${bu.margin > 10 ? "text-[var(--eds-status-green)]" : "text-[var(--eds-text-primary)]"}`}>
                            {bu.margin}%
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-[var(--eds-text-tertiary)] mb-3">
                        Employees: {bu.employees.toLocaleString()} FTE
                      </div>
                      <div className="bg-[var(--eds-bg-sunken)] p-3 rounded-lg border border-[var(--eds-border)] mb-3">
                        <span className="text-[10px] font-bold text-[var(--eds-text-disabled)] uppercase block mb-1.5">Top KPIs</span>
                        <ul className="space-y-1">
                          {bu.kpis.map((kpi, i) => (
                            <li key={i} className="text-xs text-[var(--eds-text-secondary)] flex items-center gap-1.5">
                              <span className="text-[var(--eds-text-disabled)]">→</span> {kpi}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-[var(--eds-status-amber-bg)] p-3 rounded-lg border border-[var(--eds-border)]">
                        <span className="text-[10px] font-bold uppercase block mb-1 text-[var(--eds-status-amber)]">Strategic Tension</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                  <div className="bg-[var(--eds-bg-sunken)] px-6 py-3 border-b border-[var(--eds-border)]">
                    <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">Year-over-Year Performance</h3>
                    <p className="text-xs text-[var(--eds-text-disabled)]">Revenue & EBITDA by Business Unit (€ bn)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-yoy">
                      <thead>
                        <tr className="border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--eds-text-tertiary)] uppercase">Business Unit</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-disabled)]">FY24 Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-tertiary)]">FY25 Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-disabled)]">Δ Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-disabled)]">FY24 EBITDA</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-tertiary)]">FY25 EBITDA</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--eds-text-disabled)]">Δ EBITDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localData.businessUnits.map((bu) => (
                          <tr key={bu.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50">
                            <td className="px-6 py-3 font-medium text-[var(--eds-text-primary)]">{bu.name}</td>
                            <td className="text-right px-4 py-3 font-mono text-[var(--eds-text-disabled)]">{bu.yoy.revenue}</td>
                            <td className="text-right px-4 py-3 font-mono font-semibold text-[var(--eds-text-primary)]">{bu.financials.revenue}</td>
                            <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaRevenue > 0 ? "text-[var(--eds-status-green)]" : bu.yoy.deltaRevenue < 0 ? "text-[var(--eds-status-red)]" : "text-[var(--eds-text-disabled)]"}`}>
                              {bu.yoy.deltaRevenue > 0 ? `+${bu.yoy.deltaRevenue}` : bu.yoy.deltaRevenue}
                            </td>
                            <td className="text-right px-4 py-3 font-mono text-[var(--eds-text-disabled)]">{bu.yoy.ebitda}</td>
                            <td className="text-right px-4 py-3 font-mono font-semibold text-[var(--eds-text-primary)]">{bu.financials.ebitda}</td>
                            <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaEbitda > 0 ? "text-[var(--eds-status-green)]" : bu.yoy.deltaEbitda < 0 ? "text-[var(--eds-status-red)]" : "text-[var(--eds-text-disabled)]"}`}>
                              {bu.yoy.deltaEbitda > 0 ? `+${bu.yoy.deltaEbitda}` : bu.yoy.deltaEbitda === 0 ? "0" : bu.yoy.deltaEbitda}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "financials" && (
              <div className="space-y-8" data-testid="section-financials">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#059669]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 border border-white/20 text-xs font-medium mb-3">
                      Financial Analysis
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Financials</h1>
                    <p className="text-emerald-200 text-sm">Consolidated financial data · FY 2025</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h3 className="font-serif font-bold text-[var(--eds-text-primary)] mb-1">Revenue vs. EBITDA by Unit</h3>
                  <p className="text-xs text-[var(--eds-text-disabled)] mb-5">€ Billions</p>
                  <div className="space-y-4">
                    {localData.businessUnits.map((bu) => {
                      const maxRevenue = Math.max(1, ...localData.businessUnits.map((b) => b.revenue));
                      return (
                        <div key={bu.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-[var(--eds-text-primary)]">{bu.name}</span>
                            <span className="font-mono text-[var(--eds-text-tertiary)]">€{bu.revenue}bn / €{bu.ebitda}bn</span>
                          </div>
                          <div className="relative h-6 bg-[var(--eds-bg-sunken)] rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-[#cbd5e1] rounded-full" style={{ width: `${(bu.revenue / maxRevenue) * 100}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-[#1e293b] rounded-full" style={{ width: `${(bu.ebitda / maxRevenue) * 100}%` }} />
                          </div>
                          <div className="flex gap-4 text-[10px] text-[var(--eds-text-disabled)]">
                            <span>Margin: {bu.margin}%</span>
                            <span>Employees: {bu.employees.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-4 text-[10px] text-[var(--eds-text-disabled)] mt-4 pt-4 border-t border-[var(--eds-border)]">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#1e293b]" /> EBITDA</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#cbd5e1]" /> Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                    <div className="bg-[var(--eds-bg-sunken)] px-6 py-3 border-b border-[var(--eds-border)]">
                      <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">Assets</h3>
                      <p className="text-xs text-[var(--eds-text-disabled)]">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-assets">
                      <thead>
                        <tr className="border-b border-[var(--eds-border)]">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Line Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Value (€ mn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[var(--eds-bg-sunken)]/50"><td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>Non-Current Assets</td></tr>
                        {localData.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                          <tr key={item.item} className="border-b border-[var(--eds-border)]">
                            <td className="px-6 pl-10 py-1.5 text-xs text-[var(--eds-text-secondary)]">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--eds-bg-sunken)] border-t-2 border-[var(--eds-border)]">
                          <td className="px-6 py-2 font-bold text-xs text-[var(--eds-text-primary)]">Total Non-Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(localData.detailedBalanceSheet.assets.nonCurrent.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-[var(--eds-bg-sunken)]/50"><td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>Current Assets</td></tr>
                        {localData.detailedBalanceSheet.assets.current.map((item) => (
                          <tr key={item.item} className="border-b border-[var(--eds-border)]">
                            <td className="px-6 pl-10 py-1.5 text-xs text-[var(--eds-text-secondary)]">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--eds-bg-sunken)] border-t-2 border-[var(--eds-border)]">
                          <td className="px-6 py-2 font-bold text-xs text-[var(--eds-text-primary)]">Total Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(localData.detailedBalanceSheet.assets.current.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-[#1e293b] text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL ASSETS</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...localData.detailedBalanceSheet.assets.nonCurrent, ...localData.detailedBalanceSheet.assets.current].reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                    <div className="bg-[var(--eds-bg-sunken)] px-6 py-3 border-b border-[var(--eds-border)]">
                      <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">Equity & Liabilities</h3>
                      <p className="text-xs text-[var(--eds-text-disabled)]">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-equity">
                      <thead>
                        <tr className="border-b border-[var(--eds-border)]">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Line Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Value (€ mn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[var(--eds-bg-sunken)]/50"><td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>Equity</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                          <tr key={item.item} className="border-b border-[var(--eds-border)]">
                            <td className="px-6 pl-10 py-1.5 text-xs text-[var(--eds-text-secondary)]">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--eds-bg-sunken)] border-t-2 border-[var(--eds-border)]">
                          <td className="px-6 py-2 font-bold text-xs text-[var(--eds-text-primary)]">Total Equity</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.equity.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-[var(--eds-bg-sunken)]/50"><td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>Non-Current Liabilities</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-[var(--eds-border)]">
                            <td className="px-6 pl-10 py-1.5 text-xs text-[var(--eds-text-secondary)]">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--eds-bg-sunken)] border-t-2 border-[var(--eds-border)]">
                          <td className="px-6 py-2 font-bold text-xs text-[var(--eds-text-primary)]">Total Non-Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-[var(--eds-bg-sunken)]/50"><td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>Current Liabilities</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-[var(--eds-border)]">
                            <td className="px-6 pl-10 py-1.5 text-xs text-[var(--eds-text-secondary)]">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--eds-bg-sunken)] border-t-2 border-[var(--eds-border)]">
                          <td className="px-6 py-2 font-bold text-xs text-[var(--eds-text-primary)]">Total Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-[var(--eds-text-primary)]">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.currentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-[#1e293b] text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL EQUITY & LIAB.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...localData.detailedBalanceSheet.equityLiabilities.equity, ...localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities, ...localData.detailedBalanceSheet.equityLiabilities.currentLiabilities].reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {localData.cashFlow && localData.cashFlow.length > 0 && (
                  <div className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                    <div className="bg-[var(--eds-bg-sunken)] px-6 py-3 border-b border-[var(--eds-border)]">
                      <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">Cash Flow Statement FY 2025</h3>
                      <p className="text-xs text-[var(--eds-text-disabled)]">€ Billions</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-cashflow">
                      <thead>
                        <tr className="border-b border-[var(--eds-border)]">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Amount (€ bn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let currentCat = "";
                          return localData.cashFlow.map((cf, i) => {
                            const rows = [];
                            if (cf.category !== currentCat) {
                              currentCat = cf.category;
                              rows.push(
                                <tr key={`cat-${cf.category}`} className="bg-[var(--eds-bg-sunken)]/50">
                                  <td className="px-6 py-2 font-bold text-[var(--eds-text-primary)] text-xs uppercase" colSpan={2}>{cf.category}</td>
                                </tr>
                              );
                            }
                            const isSubtotal = cf.item.startsWith("Net cash") || cf.item === "NET CHANGE IN CASH" || cf.item === "Closing cash balance" || cf.item === "Opening cash balance";
                            rows.push(
                              <tr key={i} className={`border-b border-[var(--eds-border)] ${isSubtotal ? "bg-[var(--eds-bg-sunken)] font-semibold" : ""}`}>
                                <td className={`px-6 ${isSubtotal ? "" : "pl-10"} py-1.5 text-xs ${isSubtotal ? "text-[#0f172a]" : "text-[#475569]"}`}>{cf.item}</td>
                                <td className={`text-right px-6 py-1.5 text-xs font-mono ${cf.value < 0 ? "text-[var(--eds-status-red)]" : "text-[var(--eds-text-primary)]"}`}>
                                  {cf.value >= 0 ? cf.value.toFixed(3) : cf.value.toFixed(3)}
                                </td>
                              </tr>
                            );
                            return rows;
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}

                {localData.stressScenario && localData.stressScenario.items.length > 0 && (
                  <div className="rounded-xl border-2 border-[var(--eds-status-red-bg)] bg-[var(--eds-status-red-bg)]/20 overflow-hidden">
                    <div className="bg-[var(--eds-status-red-bg)] px-6 py-3 border-b border-[var(--eds-status-red-bg)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] rounded-full px-3 py-1">Stress Case</span>
                        <h3 className="font-serif font-bold text-[var(--eds-text-primary)]">{localData.stressScenario.title}</h3>
                      </div>
                      <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Liquidity pressure caused by operational shifts, investment timing and working capital dynamics</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-stress">
                      <thead>
                        <tr className="border-b border-[var(--eds-border)]">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Amount (€ bn)</th>
                          <th className="text-left px-6 py-2 text-xs font-semibold text-[var(--eds-text-tertiary)]">Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localData.stressScenario.items.map((si, i) => (
                          <tr key={i} className="border-b border-red-50">
                            <td className="px-6 py-2 text-xs font-medium text-[var(--eds-text-primary)]">{si.item}</td>
                            <td className={`text-right px-6 py-2 text-xs font-mono font-semibold ${si.amount < 0 ? "text-[var(--eds-status-red)]" : "text-[var(--eds-text-primary)]"}`}>
                              {si.amount >= 0 ? si.amount.toFixed(2) : si.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-2 text-xs text-[var(--eds-text-tertiary)] italic">{si.comment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase text-[var(--eds-status-red)] mb-2">Key Stress Drivers</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--eds-text-secondary)]">
                          {localData.stressScenario.keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-[var(--eds-status-red)] mb-2">Immediate Implications</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--eds-text-secondary)]">
                          {localData.stressScenario.implications.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h3 className="font-serif font-bold text-[var(--eds-text-primary)] mb-1">Profitability Profile</h3>
                  <p className="text-xs text-[var(--eds-text-disabled)] mb-5">EBITDA Margin by Business Unit</p>
                  <div className="space-y-3">
                    {[...localData.businessUnits].sort((a, b) => b.margin - a.margin).map((bu) => (
                      <div key={bu.id} className="flex items-center gap-4">
                        <span className="text-xs text-[var(--eds-text-secondary)] w-48 shrink-0 truncate">{bu.name}</span>
                        <div className="flex-1 h-8 bg-[var(--eds-bg-sunken)] rounded-full overflow-hidden relative">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${bu.margin > 10 ? "bg-green-600" : bu.margin > 7 ? "bg-[var(--eds-status-amber-bg)]0" : "bg-[var(--eds-status-red-bg)]0"}`}
                            style={{ width: `${(bu.margin / 20) * 100}%` }}
                          />
                          <span className="absolute inset-0 flex items-center pl-3 text-xs font-mono font-bold text-white drop-shadow">
                            {bu.margin}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "protocols" && (
              <div className="space-y-6" data-testid="section-protocols">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-violet-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#9333ea]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-100 border border-white/20 text-xs font-medium mb-3">
                      Meeting Protocols
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Protokolle</h1>
                    <p className="text-purple-200 text-sm">Meeting minutes, workshop protocols & committee notes</p>
                  </div>
                </div>
                {localData.protocols && localData.protocols.length > 0 ? (
                  <div className="flex gap-4 h-[calc(100vh-14rem)]">
                    <div className="w-1/3 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden">
                      <div className="p-4 bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)]">
                        <span className="font-semibold text-[var(--eds-text-primary)] text-sm">Dokumente</span>
                        <span className="text-[10px] bg-[var(--eds-border)] text-[var(--eds-text-secondary)] rounded-full px-2 py-0.5 ml-2">{localData.protocols.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {localData.protocols.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProtocolId(p.id)}
                            className={`flex flex-col w-full text-left p-4 border-b border-[var(--eds-border)] transition-colors hover:bg-[var(--eds-bg-sunken)] ${
                              selectedProtocolId === p.id ? "bg-[var(--eds-bg-sunken)] border-l-4 border-l-[#1e293b]" : "border-l-4 border-l-transparent"
                            }`}
                            data-testid={`button-protocol-${p.id}`}
                          >
                            <span className="text-xs font-semibold text-[var(--eds-text-primary)] line-clamp-2">{p.title}</span>
                            <span className="text-[10px] text-[var(--eds-text-disabled)] mt-1">{p.date}</span>
                            <span className="text-[10px] mt-1 inline-block bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)] rounded-full px-2 py-0.5 w-fit capitalize">{p.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden bg-white">
                      {selectedProtocol ? (
                        editingDoc?.type === "protocol" && editingDoc.id === selectedProtocol.id ? (
                          <div className="flex flex-col h-full" data-testid="form-edit-protocol">
                            <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50 space-y-3">
                              <div>
                                <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Title</label>
                                <input
                                  type="text"
                                  value={editForm.title || ""}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full text-lg font-serif font-bold text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                                  data-testid="input-edit-protocol-title"
                                />
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                              <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Content</label>
                              <textarea
                                value={editForm.content || ""}
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                className="w-full h-full min-h-[300px] text-sm text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                                data-testid="input-edit-protocol-content"
                              />
                            </div>
                            <div className="px-6 py-4 border-t border-[var(--eds-border)] flex items-center gap-3">
                              <button
                                onClick={saveDocument}
                                disabled={saving}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                                style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                                data-testid="button-save-protocol"
                              >
                                {saving ? "Speichern..." : "Speichern"}
                              </button>
                              <button
                                onClick={() => setEditingDoc(null)}
                                className="px-4 py-2 text-xs font-medium text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] transition-colors"
                                data-testid="button-cancel-protocol"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50">
                              <div className="flex items-start justify-between mb-1">
                                <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] flex-1">{selectedProtocol.title}</h2>
                                {caseStudyId && (
                                  <button
                                    onClick={() => {
                                      setEditingDoc({ type: "protocol", id: selectedProtocol.id });
                                      setEditForm({ title: selectedProtocol.title, content: selectedProtocol.content });
                                    }}
                                    className="text-[11px] text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] transition-colors ml-3 shrink-0"
                                    data-testid="button-edit-protocol"
                                  >
                                    Bearbeiten
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[var(--eds-text-tertiary)]">
                                <span>{selectedProtocol.date}</span>
                                {selectedProtocol.location && <span>· {selectedProtocol.location}</span>}
                              </div>
                              {selectedProtocol.participants && (
                                <p className="text-xs text-[var(--eds-text-disabled)] mt-1">Participants: {selectedProtocol.participants}</p>
                              )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-wrap max-w-3xl">
                              {selectedProtocol.content}
                            </div>
                          </>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--eds-text-disabled)]">
                          <p>Select a document to read</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--eds-text-disabled)]">No protocols available.</p>
                )}
              </div>
            )}

            {activeTab === "news" && (
              <div className="space-y-6" data-testid="section-news">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-rose-900 via-rose-800 to-pink-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#e11d48]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-100 border border-white/20 text-xs font-medium mb-3">
                      News & Media
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">News</h1>
                    <p className="text-rose-200 text-sm">External press coverage & industry analysis</p>
                  </div>
                </div>
                {localData.newsArticles && localData.newsArticles.length > 0 ? (
                  <div className="flex gap-4 h-[calc(100vh-14rem)]">
                    <div className="w-1/3 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden">
                      <div className="p-4 bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)] flex items-center gap-2">
                        <span className="font-semibold text-[var(--eds-text-primary)] text-sm">Artikel</span>
                        <span className="text-[10px] bg-[var(--eds-border)] text-[var(--eds-text-secondary)] rounded-full px-2 py-0.5">{localData.newsArticles.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {localData.newsArticles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => { setSelectedNewsId(article.id); setEditingDoc(null); }}
                            className={`flex flex-col w-full text-left p-4 border-b border-[var(--eds-border)] transition-colors hover:bg-[var(--eds-bg-sunken)] ${
                              selectedNewsId === article.id ? "bg-[var(--eds-bg-sunken)] border-l-4 border-l-rose-700" : "border-l-4 border-l-transparent"
                            }`}
                            data-testid={`button-news-${article.id}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)] rounded-full px-2 py-0.5">{article.source}</span>
                              <span className="text-[10px] text-[var(--eds-text-disabled)]">{article.date}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--eds-text-primary)] line-clamp-2">{article.headline}</span>
                            <span className="text-[11px] text-[var(--eds-text-disabled)] mt-1 line-clamp-1">{article.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden bg-white">
                      {selectedNews ? (
                        editingDoc?.type === "news" && editingDoc.id === selectedNews.id ? (
                          <div className="flex flex-col h-full" data-testid="form-edit-news">
                            <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50 space-y-3">
                              <span className="text-xs text-[var(--eds-text-disabled)]">{selectedNews.source} · {selectedNews.date}</span>
                              <div>
                                <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Headline</label>
                                <input
                                  type="text"
                                  value={editForm.headline || ""}
                                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                                  className="w-full text-lg font-serif font-bold text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                                  data-testid="input-edit-news-headline"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Subtitle</label>
                                <input
                                  type="text"
                                  value={editForm.subtitle || ""}
                                  onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                  className="w-full text-sm text-[var(--eds-text-tertiary)] italic bg-white border border-[var(--eds-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                                  data-testid="input-edit-news-subtitle"
                                />
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                              <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Content</label>
                              <textarea
                                value={editForm.content || ""}
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                className="w-full h-full min-h-[300px] text-sm text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                                data-testid="input-edit-news-content"
                              />
                            </div>
                            <div className="px-6 py-3 border-t border-[var(--eds-border)] flex items-center gap-3">
                              <button
                                onClick={saveDocument}
                                disabled={saving}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                                style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                                data-testid="button-save-news"
                              >
                                {saving ? "Speichern..." : "Speichern"}
                              </button>
                              <button
                                onClick={() => setEditingDoc(null)}
                                className="px-4 py-2 text-xs font-medium text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] transition-colors"
                                data-testid="button-cancel-news"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs text-[var(--eds-text-disabled)]">{selectedNews.source} · {selectedNews.date}</span>
                                {caseStudyId && (
                                  <button
                                    onClick={() => {
                                      setEditingDoc({ type: "news", id: selectedNews.id });
                                      setEditForm({ headline: selectedNews.headline, subtitle: selectedNews.subtitle, content: selectedNews.content });
                                    }}
                                    className="text-[11px] text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] transition-colors ml-3 shrink-0"
                                    data-testid="button-edit-news"
                                  >
                                    Bearbeiten
                                  </button>
                                )}
                              </div>
                              <h2 className="text-xl font-serif font-bold text-[var(--eds-text-primary)] mb-1" data-testid="text-news-headline">{selectedNews.headline}</h2>
                              <p className="text-sm text-[var(--eds-text-tertiary)] italic">{selectedNews.subtitle}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-wrap" data-testid="text-news-body">
                              {selectedNews.content}
                            </div>
                          </>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--eds-text-disabled)]">
                          <p>Artikel auswählen</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--eds-text-disabled)]">No news articles available.</p>
                )}
              </div>
            )}

            {activeTab === "internal-comms" && (
              <div className="space-y-6" data-testid="section-internal-comms">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-900 via-cyan-800 to-teal-700 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#0891b2]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-100 border border-white/20 text-xs font-medium mb-3">
                      Internal Communications
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Interne Kommunikation</h1>
                    <p className="text-cyan-200 text-sm">Internal emails, memos & correspondence</p>
                  </div>
                </div>
                <EmailListPanel
                  emails={internalEmails}
                  selectedEmailId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                  onEdit={caseStudyId ? (email) => {
                    setEditingDoc({ type: "email", id: email.id });
                    setEditForm({ subject: email.subject, from: email.from, content: email.content });
                  } : undefined}
                  editingId={editingDoc?.type === "email" ? editingDoc.id : undefined}
                  editForm={editingDoc?.type === "email" ? editForm : undefined}
                  onEditFormChange={editingDoc?.type === "email" ? setEditForm : undefined}
                  onSave={editingDoc?.type === "email" ? saveDocument : undefined}
                  onCancel={editingDoc?.type === "email" ? () => setEditingDoc(null) : undefined}
                  saving={saving}
                />
              </div>
            )}

            {activeTab === "external-comms" && (
              <div className="space-y-6" data-testid="section-external-comms">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#4f46e5]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-100 border border-white/20 text-xs font-medium mb-3">
                      External Communications
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Externe Kommunikation</h1>
                    <p className="text-indigo-200 text-sm">External correspondence, analyst requests & customer communications</p>
                  </div>
                </div>
                <EmailListPanel
                  emails={externalEmails}
                  selectedEmailId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                  onEdit={caseStudyId ? (email) => {
                    setEditingDoc({ type: "email", id: email.id });
                    setEditForm({ subject: email.subject, from: email.from, content: email.content });
                  } : undefined}
                  editingId={editingDoc?.type === "email" ? editingDoc.id : undefined}
                  editForm={editingDoc?.type === "email" ? editForm : undefined}
                  onEditFormChange={editingDoc?.type === "email" ? setEditForm : undefined}
                  onSave={editingDoc?.type === "email" ? saveDocument : undefined}
                  onCancel={editingDoc?.type === "email" ? () => setEditingDoc(null) : undefined}
                  saving={saving}
                />
              </div>
            )}

            {activeTab === "strategic-analysis" && localData.strategicAnalysis && (
              <div className="space-y-8" data-testid="section-strategic-analysis">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-violet-100 border border-white/20 text-xs font-medium mb-3">
                      Strategic Assessment
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Strategische Analyse</h1>
                    <p className="text-violet-200 text-sm">SWOT, BSC-Perspektiven & operative Quickwins</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-3">Executive Summary</h2>
                  <p className="text-sm text-[var(--eds-text-primary)] leading-relaxed">{localData.strategicAnalysis.executiveSummary}</p>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-6">SWOT-Analyse</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-status-green)] mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">S</span>
                        Stärken
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.swot.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-[var(--eds-status-green)] flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-status-red)] mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[var(--eds-status-red)] text-white flex items-center justify-center text-xs font-bold">W</span>
                        Schwächen
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.swot.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-red-900 flex items-start gap-2">
                            <span className="text-[var(--eds-status-red)] mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] p-4">
                      <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[var(--eds-status-blue)] text-white flex items-center justify-center text-xs font-bold">O</span>
                        Chancen
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.swot.opportunities.map((o, i) => (
                          <li key={i} className="text-xs text-blue-900 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-status-amber)] mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-amber-600 text-white flex items-center justify-center text-xs font-bold">T</span>
                        Risiken
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.swot.threats.map((t, i) => (
                          <li key={i} className="text-xs text-amber-900 flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-6">Lösungsansätze — Strategie</h2>
                  <div className="space-y-4">
                    {localData.strategicAnalysis.solutionApproaches.strategic.map((s, i) => (
                      <div key={i} className="rounded-lg border border-[var(--eds-border)] p-4">
                        <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-1">{s.title}</h3>
                        <p className="text-xs text-[var(--eds-text-secondary)] leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-6">BSC-Perspektiven</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[var(--eds-border)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 flex items-center gap-2">
                        <span className="text-lg">💰</span> Finanzen
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.solutionApproaches.bscPerspectives.financial.map((f, i) => (
                          <li key={i} className="text-xs text-[var(--eds-text-primary)] flex items-start gap-2">
                            <span className="text-[var(--eds-text-disabled)] mt-0.5">→</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-[var(--eds-border)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 flex items-center gap-2">
                        <span className="text-lg">👥</span> Kunden
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.solutionApproaches.bscPerspectives.customer.map((c, i) => (
                          <li key={i} className="text-xs text-[var(--eds-text-primary)] flex items-start gap-2">
                            <span className="text-[var(--eds-text-disabled)] mt-0.5">→</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-[var(--eds-border)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 flex items-center gap-2">
                        <span className="text-lg">⚙️</span> Prozesse
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.solutionApproaches.bscPerspectives.processes.map((p, i) => (
                          <li key={i} className="text-xs text-[var(--eds-text-primary)] flex items-start gap-2">
                            <span className="text-[var(--eds-text-disabled)] mt-0.5">→</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-[var(--eds-border)] p-4">
                      <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 flex items-center gap-2">
                        <span className="text-lg">📚</span> Lernen & Entwicklung
                      </h3>
                      <ul className="space-y-1.5">
                        {localData.strategicAnalysis.solutionApproaches.bscPerspectives.learningGrowth.map((l, i) => (
                          <li key={i} className="text-xs text-[var(--eds-text-primary)] flex items-start gap-2">
                            <span className="text-[var(--eds-text-disabled)] mt-0.5">→</span>
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--eds-border)] p-6">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-6">Operative Quickwins</h2>
                  <div className="space-y-3">
                    {localData.strategicAnalysis.solutionApproaches.quickwins.map((q, i) => (
                      <div key={i} className="flex items-start gap-4 rounded-lg border border-[var(--eds-border)] p-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--eds-status-green-bg)] flex items-center justify-center text-sm font-bold text-[var(--eds-status-green)] shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[var(--eds-text-primary)]">{q.title}</h3>
                          <div className="flex gap-4 mt-1.5">
                            <span className="text-[10px] text-[var(--eds-status-green)] bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-full px-2 py-0.5">
                              Impact: {q.impact}
                            </span>
                            <span className="text-[10px] text-[var(--eds-status-blue)] bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-full px-2 py-0.5">
                              Aufwand: {q.effort}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hr-dashboard" && (
              <div className="space-y-8" data-testid="section-hr-dashboard">
                {/* no-eds-token: dekorativer Demo-Gradient ohne EDS-Äquivalent */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-amber-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#ea580c]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-100 border border-white/20 text-xs font-medium mb-3">
                      HR Analytics
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">HR-Dashboard</h1>
                    <p className="text-orange-200 text-sm">Leadership pulse survey, employee feedback & organizational health</p>
                  </div>
                </div>

                {localData.hrSurvey && localData.hrSurvey.categories.length > 0 && (
                  <>
                    <div className="rounded-xl border border-[var(--eds-border)] p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)]">{localData.hrSurvey.title}</h2>
                          <p className="text-xs text-[var(--eds-text-disabled)] mt-1">Scale: 1 = strongly disagree | 5 = strongly agree</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-[var(--eds-text-primary)]">{localData.hrSurvey.participantsInvited}</div>
                            <div className="text-[10px] text-[var(--eds-text-disabled)] uppercase">Invited</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-[var(--eds-status-green)]">{localData.hrSurvey.responseRate}%</div>
                            <div className="text-[10px] text-[var(--eds-text-disabled)] uppercase">Response Rate</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {localData.hrSurvey.categories.map((cat) => (
                          <div key={cat.name}>
                            <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 uppercase tracking-wider">{cat.name}</h3>
                            <div className="space-y-3">
                              {cat.items.map((item, i) => {
                                const pct = (item.score / 5) * 100;
                                const color = item.score >= 3 ? "bg-[var(--eds-status-green-bg)]0" : item.score >= 2.5 ? "bg-[var(--eds-status-amber-bg)]0" : "bg-[var(--eds-status-red-bg)]0";
                                return (
                                  <div key={i} className="flex items-center gap-4">
                                    <span className="text-xs text-[var(--eds-text-secondary)] w-[55%] shrink-0">{item.question}</span>
                                    <div className="flex-1 h-6 bg-[var(--eds-bg-sunken)] rounded-full overflow-hidden relative">
                                      <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-sm font-mono font-bold w-8 text-right ${item.score >= 3 ? "text-[var(--eds-status-green)]" : item.score >= 2.5 ? "text-[var(--eds-status-amber)]" : "text-[var(--eds-status-red)]"}`}>
                                      {item.score.toFixed(1)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {localData.hrSurvey.comments.length > 0 && (
                      <div className="rounded-xl border border-[var(--eds-border)] p-6">
                        <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-4 uppercase tracking-wider">Selected Anonymous Comments</h3>
                        <div className="space-y-3">
                          {localData.hrSurvey.comments.map((comment, i) => (
                            <div key={i} className="bg-[var(--eds-bg-sunken)] rounded-lg p-4 border-l-4 border-l-[#94a3b8] text-sm italic text-[var(--eds-text-secondary)]">
                              &ldquo;{comment}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {localData.hrSurvey.hrComment && (
                      <div className="rounded-xl border-2 border-[var(--eds-status-amber-bg)] bg-[var(--eds-status-amber-bg)]/50 p-6">
                        <h3 className="text-sm font-bold text-[var(--eds-status-amber)] mb-2">HR Assessment</h3>
                        <p className="text-sm text-amber-900">{localData.hrSurvey.hrComment}</p>
                      </div>
                    )}
                  </>
                )}

                {localData.managementTeam && localData.managementTeam.length > 0 && (
                  <div className="rounded-xl border border-[var(--eds-border)] p-6">
                    <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {localData.managementTeam.map((m) => (
                        <div key={m.name} className="rounded-lg border border-[var(--eds-border)] p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--eds-border)] flex items-center justify-center text-xs font-bold text-[var(--eds-text-secondary)]">
                            {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--eds-text-primary)]">{m.name}</div>
                            <div className="text-xs text-[var(--eds-text-tertiary)]">{m.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-[var(--eds-border)] py-6">
        <p className="text-center text-xs text-[var(--eds-text-tertiary)]">
          &copy; Christoph Aldering &middot; Private initiative &ndash; for training reasons only &ndash; no data from reality so far!
        </p>
      </footer>
    </div>
  );
}

function EmailListPanel({
  emails,
  selectedEmailId,
  onSelect,
  onEdit,
  editingId,
  editForm,
  onEditFormChange,
  onSave,
  onCancel,
  saving,
}: {
  emails: CaseStudyData["emails"];
  selectedEmailId: string;
  onSelect: (id: string) => void;
  onEdit?: (email: Email) => void;
  editingId?: string;
  editForm?: any;
  onEditFormChange?: (updates: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  if (emails.length === 0) {
    return <p className="text-sm text-[var(--eds-text-disabled)]">No messages available.</p>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-14rem)]">
      <div className="w-1/3 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden">
        <div className="p-4 bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)] flex items-center gap-2">
          <span className="font-semibold text-[var(--eds-text-primary)] text-sm">Inbox</span>
          <span className="text-[10px] bg-[var(--eds-border)] text-[var(--eds-text-secondary)] rounded-full px-2 py-0.5">{emails.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`flex flex-col w-full text-left p-4 border-b border-[var(--eds-border)] transition-colors hover:bg-[var(--eds-bg-sunken)] ${
                selectedEmailId === email.id ? "bg-[var(--eds-bg-sunken)] border-l-4 border-l-[#1e293b]" : "border-l-4 border-l-transparent"
              }`}
              data-testid={`button-email-${email.id}`}
            >
              <div className="flex justify-between items-start w-full mb-1">
                <span className={`text-xs font-semibold ${!email.read ? "text-[var(--eds-text-primary)]" : "text-[var(--eds-text-tertiary)]"}`}>
                  {email.from.split(",")[0]}
                </span>
                <span className="text-[10px] text-[var(--eds-text-disabled)] ml-2 whitespace-nowrap">{email.date.split(",")[1]?.trim() || email.date}</span>
              </div>
              <span className={`text-xs line-clamp-1 ${!email.read ? "font-medium text-[var(--eds-text-primary)]" : "text-[var(--eds-text-secondary)]"}`}>
                {email.subject}
              </span>
              <span className="text-[11px] text-[var(--eds-text-disabled)] mt-1 line-clamp-2">
                {email.content.substring(0, 90).replace(/\n/g, " ")}...
              </span>
              {email.important && (
                <span className="text-[9px] mt-1.5 inline-block border border-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] bg-[var(--eds-status-red-bg)] rounded-full px-2 py-0.5 w-fit">
                  Important
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[var(--eds-border)] flex flex-col overflow-hidden bg-white">
        {selectedEmail ? (
          editingId === selectedEmail.id && editForm && onEditFormChange && onSave && onCancel ? (
            <div className="flex flex-col h-full" data-testid="form-edit-email">
              <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50 space-y-3">
                <div>
                  <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Subject</label>
                  <textarea
                    value={editForm.subject || ""}
                    onChange={(e) => onEditFormChange({ ...editForm, subject: e.target.value })}
                    className="w-full text-lg font-serif font-bold text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                    rows={2}
                    data-testid="input-edit-email-subject"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">From</label>
                  <input
                    type="text"
                    value={editForm.from || ""}
                    onChange={(e) => onEditFormChange({ ...editForm, from: e.target.value })}
                    className="w-full text-sm text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                    data-testid="input-edit-email-from"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <label className="text-[10px] text-[var(--eds-text-disabled)] uppercase tracking-wider block mb-1">Content</label>
                <textarea
                  value={editForm.content || ""}
                  onChange={(e) => onEditFormChange({ ...editForm, content: e.target.value })}
                  className="w-full h-full min-h-[300px] text-sm text-[var(--eds-text-primary)] bg-white border border-[var(--eds-border)] rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--eds-border-strong)]"
                  data-testid="input-edit-email-content"
                />
              </div>
              <div className="px-6 py-4 border-t border-[var(--eds-border)] flex items-center gap-3">
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                  data-testid="button-save-email"
                >
                  {saving ? "Speichern..." : "Speichern"}
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-medium text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] transition-colors"
                  data-testid="button-cancel-email"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-serif font-bold text-[var(--eds-text-primary)] flex-1" data-testid="text-email-subject">{selectedEmail.subject}</h2>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(selectedEmail)}
                      className="text-[11px] text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] transition-colors ml-3 shrink-0"
                      data-testid="button-edit-email"
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--eds-border)] flex items-center justify-center text-xs font-bold text-[var(--eds-text-secondary)]">
                    {selectedEmail.from.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--eds-text-primary)]" data-testid="text-email-from">{selectedEmail.from}</div>
                    <div className="text-[10px] text-[var(--eds-text-disabled)]">{selectedEmail.date}</div>
                    {selectedEmail.to && <div className="text-[10px] text-[var(--eds-text-disabled)]">To: {selectedEmail.to}</div>}
                    {selectedEmail.cc && <div className="text-[10px] text-[var(--eds-text-disabled)]">Cc: {selectedEmail.cc}</div>}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-wrap max-w-3xl" data-testid="text-email-body">
                {selectedEmail.content}
              </div>
              <div className="px-8 py-4 border-t border-[var(--eds-border)] text-[10px] text-[var(--eds-text-disabled)] italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--eds-status-green-bg)]0 inline-block" />
                Confidential - internal communication
              </div>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--eds-text-disabled)]">
            <p>Select an email to read</p>
          </div>
        )}
      </div>

      {/* ── Datenraum-Dokumente Tab ── */}
      {activeTab === "dataroom" && (
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-[var(--eds-text-primary)] mb-2">Datenraum-Dokumente</h2>
            <p className="text-sm text-[var(--eds-text-tertiary)] mb-6">
              Diese Dokumente und Kategorien sind direkt mit der Fallstudie verknüpft und im Kandidaten-Portal verfügbar.
            </p>

            {drLoading && (
              <div className="flex items-center gap-2 text-sm text-[var(--eds-text-disabled)] py-8">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Lade Datenraum-Daten…
              </div>
            )}

            {!drLoading && drCategories.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--eds-border)] bg-[var(--eds-bg-sunken)] p-12 text-center">
                <div className="text-4xl mb-3">🗂️</div>
                <p className="text-sm font-medium text-[var(--eds-text-secondary)]">Keine Kategorien vorhanden</p>
                <p className="text-xs text-[var(--eds-text-disabled)] mt-1">
                  Kategorien und Dokumente werden über die Admin-Datenraum-Verwaltung gepflegt.
                </p>
              </div>
            )}

            {!drLoading && drCategories.length > 0 && (
              <div className="space-y-6">
                {drCategories.map((cat) => {
                  const catDocs = drDocuments.filter((d) => d.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                      <div className="bg-[var(--eds-text-primary)] text-white px-5 py-3 flex items-center gap-3">
                        {cat.icon && <span className="text-lg">{cat.icon}</span>}
                        <span className="font-semibold text-sm">{cat.label}</span>
                        <span className="ml-auto text-xs text-white/50">{catDocs.length} Dokument{catDocs.length !== 1 ? "e" : ""}</span>
                      </div>
                      {catDocs.length === 0 ? (
                        <div className="px-5 py-4 text-xs text-[var(--eds-text-disabled)] italic">Keine Dokumente in dieser Kategorie</div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)] text-xs text-[var(--eds-text-tertiary)] uppercase tracking-wide">
                              <th className="px-5 py-2 text-left font-medium">Titel</th>
                              <th className="px-5 py-2 text-left font-medium">Typ</th>
                              <th className="px-5 py-2 text-left font-medium">Flags</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catDocs.map((doc) => (
                              <tr key={doc.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)] transition-colors">
                                <td className="px-5 py-3 font-medium text-[var(--eds-text-primary)]">{doc.title}</td>
                                <td className="px-5 py-3 text-[var(--eds-text-tertiary)]">
                                  <span className="inline-block bg-[var(--eds-bg-sunken)] rounded px-2 py-0.5 text-xs">{doc.documentType}</span>
                                </td>
                                <td className="px-5 py-3 flex gap-1.5">
                                  {doc.isImportant && <span className="text-[10px] bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)] rounded px-1.5 py-0.5 font-medium">Wichtig</span>}
                                  {doc.isNew && <span className="text-[10px] bg-teal-100 text-teal-700 rounded px-1.5 py-0.5 font-medium">Neu</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}

                {/* Docs without category */}
                {drDocuments.filter((d) => !d.categoryId).length > 0 && (
                  <div className="rounded-xl border border-[var(--eds-border)] overflow-hidden">
                    <div className="bg-[#334155] text-white px-5 py-3 flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <span className="font-semibold text-sm">Ohne Kategorie</span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {drDocuments.filter((d) => !d.categoryId).map((doc) => (
                          <tr key={doc.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)] transition-colors">
                            <td className="px-5 py-3 font-medium text-[var(--eds-text-primary)]">{doc.title}</td>
                            <td className="px-5 py-3 text-[var(--eds-text-tertiary)]">
                              <span className="inline-block bg-[var(--eds-bg-sunken)] rounded px-2 py-0.5 text-xs">{doc.documentType}</span>
                            </td>
                            <td className="px-5 py-3 flex gap-1.5">
                              {doc.isImportant && <span className="text-[10px] bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)] rounded px-1.5 py-0.5 font-medium">Wichtig</span>}
                              {doc.isNew && <span className="text-[10px] bg-teal-100 text-teal-700 rounded px-1.5 py-0.5 font-medium">Neu</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
