"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CaseStudyData, AssessmentQuestions, Email } from "@/lib/case-studies/varexia";

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
  | "hr-dashboard";

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
  { id: "hr-dashboard", labelDe: "HR-Dashboard", icon: "👥" },
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
      case "hr-dashboard": return !!(localData.hrSurvey && localData.hrSurvey.categories.length > 0);
      default: return true;
    }
  });

  const selectedInternalEmail = internalEmails.find((e) => e.id === selectedEmailId);
  const selectedExternalEmail = externalEmails.find((e) => e.id === selectedEmailId);
  const selectedProtocol = localData.protocols?.find((p) => p.id === selectedProtocolId);
  const selectedNews = localData.newsArticles?.find((n) => n.id === selectedNewsId);

  const base = `/w/${workspaceSlug}/admin`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`${base}/modules`}
              className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-modules"
            >
              ← Module
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
        <nav className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
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
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.labelDe}</span>
              </button>
            ))}
          </div>

          {caseStudyId && currentLogoUrl && (
            <div className="px-3 py-4 border-t border-slate-200 mt-auto">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">Branding</p>
              <div className="flex items-center gap-2 w-full">
                <img src={currentLogoUrl} alt="Logo" className="h-8 w-auto object-contain rounded bg-white border border-slate-200 p-1" />
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
                    <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Aufgabenstellung</h1>
                    <p className="text-sm text-slate-500">Independent Assessment · Confidential</p>
                  </div>
                  {caseStudyId && !editingBriefing && (
                    <button
                      onClick={startEditBriefing}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      data-testid="button-edit-briefing"
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>

                {briefingMsg && (
                  <div className={`p-3 rounded-lg text-sm ${briefingMsg === "Gespeichert" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
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
                        className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
                        data-testid="button-cancel-briefing"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : localData.briefing?.customHtml ? (
                  <div
                    className="rounded-xl border border-slate-200 p-8 text-slate-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: localData.briefing.customHtml }}
                    data-testid="briefing-custom-html"
                  />
                ) : localData.briefing ? (
                  <div className="rounded-xl border border-slate-200 p-8 space-y-6 text-slate-700 leading-relaxed">
                    <h2 className="text-lg font-serif font-bold text-slate-900">Your Role / Situation</h2>
                    <p>{localData.briefing.role}</p>
                    <p>{localData.briefing.situation}</p>
                    <p>
                      You have received a selection of internal and external documents shortly before the meeting. The material is deliberately
                      incomplete. This reflects the reality of executive decision-making.
                    </p>

                    <hr className="border-slate-100" />
                    <h2 className="text-lg font-serif font-bold text-slate-900">Your Task</h2>
                    <p>You are asked to structure and articulate your judgment along two dimensions:</p>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">1. Analysis</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          {localData.briefing.analysisQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">2. Conclusions / Assessment</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          {localData.briefing.conclusionQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      {localData.briefing.tasks.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-800 mb-2">3. Tasks</h3>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            {localData.briefing.tasks.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                      <p className="font-semibold text-amber-900 mb-1">Important:</p>
                      <p className="text-amber-800">
                        The objective is not to propose a comprehensive action plan or an &ldquo;optimal solution.&rdquo;
                        What matters is the clarity of your reasoning, the quality of your prioritization, and the explicit handling of trade-offs.
                      </p>
                    </div>

                    <hr className="border-slate-100" />
                    <h2 className="text-lg font-serif font-bold text-slate-900">Framework</h2>
                    <p>
                      You have limited time and incomplete information. This is intentional. Your task is to provide a clear, coherent and
                      senior-level assessment under uncertainty.
                    </p>
                    <div className="flex gap-8 mt-2">
                      <div className="bg-slate-100 rounded-lg px-4 py-3 text-center">
                        <div className="text-xl font-serif font-bold text-slate-900">{localData.briefing.timeMinutes}</div>
                        <div className="text-xs text-slate-500">min · Individual analysis</div>
                      </div>
                      <div className="bg-slate-100 rounded-lg px-4 py-3 text-center">
                        <div className="text-xl font-serif font-bold text-slate-900">{localData.briefing.presentationMinutes}</div>
                        <div className="text-xs text-slate-500">min · Presentation</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                    Kein Briefing vorhanden.
                  </div>
                )}
              </div>
            )}

            {activeTab === "organigramm" && localData.organigramm && localData.organigramm.length > 0 && (
              <div className="space-y-8" data-testid="section-organigramm">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
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
                        <div className="rounded-xl border border-slate-200 p-6">
                          <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Top Management</h2>
                          <div className="grid md:grid-cols-2 gap-3">
                            {topLevel.map((person) => (
                              <div key={person.name} className="rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                                  {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                                  <div className="text-xs text-slate-500">{person.role}</div>
                                  <div className="text-[10px] text-slate-400">{person.department}</div>
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
                          <div key={dept} className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                              <h3 className="font-serif font-bold text-slate-900">{dept}</h3>
                              <p className="text-xs text-slate-400">{deptPeople.length} members</p>
                            </div>
                            <div className="p-4 space-y-2">
                              {deptPeople.filter((p) => p.reportsTo === null).map((leader) => (
                                <div key={leader.name}>
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                                      {leader.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{leader.name}</div>
                                      <div className="text-xs text-slate-500">{leader.role}</div>
                                    </div>
                                  </div>
                                  {getReports(leader.name).map((report) => (
                                    <div key={report.name} className="ml-8 mt-1">
                                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="w-1 h-6 bg-slate-200 rounded-full" />
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                          {report.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-slate-800">{report.name}</div>
                                          <div className="text-xs text-slate-500">{report.role}</div>
                                        </div>
                                      </div>
                                      {getReports(report.name).map((subReport) => (
                                        <div key={subReport.name} className="ml-10 mt-1">
                                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="w-1 h-4 bg-slate-100 rounded-full" />
                                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                              {subReport.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                            </div>
                                            <div>
                                              <div className="text-xs font-medium text-slate-700">{subReport.name}</div>
                                              <div className="text-[10px] text-slate-400">{subReport.role}</div>
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
                                  <div key={orphan.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ml-4">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                      {orphan.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-800">{orphan.name}</div>
                                      <div className="text-xs text-slate-500">{orphan.role}</div>
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
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-medium mb-4">
                    Strategic Review Required
                  </div>
                  <h1 className="text-3xl font-serif font-bold mb-2">{localData.name}</h1>
                  <p className="text-slate-300 max-w-xl text-lg leading-relaxed">{localData.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {localData.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className={`rounded-xl border p-5 ${
                        metric.trend.includes("down") ? "border-l-4 border-l-red-500" : "border-l-4 border-l-slate-300"
                      }`}
                      data-testid={`kpi-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{metric.label}</span>
                      <div className="text-2xl font-serif font-bold text-slate-900 mt-1">{metric.value}</div>
                      {metric.trend.includes("down") && (
                        <p className="text-xs text-red-600 mt-1 font-medium">↓ Attention Required</p>
                      )}
                    </div>
                  ))}
                </div>

                {localData.managementTeam && localData.managementTeam.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {localData.managementTeam.map((m) => (
                        <div key={m.name} className="rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                            <div className="text-xs text-slate-500">{m.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {localData.boardImpressions && localData.boardImpressions.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 mb-4">Impressions from Supervisory Board Meeting (January 2026)</h2>
                    <div className="space-y-3">
                      {localData.boardImpressions.map((bi, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{bi.topic}</div>
                          <div className="text-sm font-medium text-slate-800">{bi.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "strategy" && (
              <div className="space-y-8" data-testid="section-strategy">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-100 border border-white/20 text-xs font-medium mb-3">
                      Strategic Analysis
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Strategie</h1>
                    <p className="text-amber-200 text-sm">Key strategic tensions, analyst assessment & leadership insights</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Key Strategic Tensions</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {localData.businessUnits.map((bu) => (
                      <div key={bu.id} className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">{bu.name}</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>

                {localData.analystReport && localData.analystReport.source && (
                  <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-3 py-1">External</span>
                      <h2 className="text-lg font-serif font-bold text-slate-900">{localData.analystReport.source}</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Key Observations</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                          {localData.analystReport.observations.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                      {localData.analystReport.criticalQuestions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Critical Questions</h3>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                            {localData.analystReport.criticalQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {localData.analystReport.indicators.map((ind) => (
                          <div key={ind.label} className="bg-white rounded-lg border border-red-100 p-3">
                            <span className="text-[10px] text-slate-400 uppercase">{ind.label}</span>
                            <div className="text-lg font-mono font-bold text-slate-900">{ind.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-red-100 p-4 text-sm italic text-slate-600">
                        {localData.analystReport.conclusion}
                      </div>
                    </div>
                  </div>
                )}

                {localData.leadershipSummary && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Internal Leadership Workshop – Executive Summary</h2>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{localData.leadershipSummary}</div>
                  </div>
                )}

                {localData.leadershipConference && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Leadership Conference 2025</h2>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{localData.leadershipConference}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-8" data-testid="section-products">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                    <div key={bu.id} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors" data-testid={`bu-${bu.id}`}>
                      <h3 className="text-base font-semibold text-slate-800 mb-1">{bu.name}</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                          <div className="text-xl font-mono font-semibold text-slate-900">€{bu.revenue}bn</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">EBITDA</span>
                          <div className="text-xl font-mono font-semibold text-slate-900">€{bu.ebitda}bn</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Margin</span>
                          <div className={`text-xl font-mono font-semibold ${bu.margin > 10 ? "text-green-700" : "text-slate-900"}`}>
                            {bu.margin}%
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-500 mb-3">
                        Employees: {bu.employees.toLocaleString()} FTE
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Top KPIs</span>
                        <ul className="space-y-1">
                          {bu.kpis.map((kpi, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                              <span className="text-slate-300">→</span> {kpi}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-bold uppercase block mb-1 text-amber-700">Strategic Tension</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                    <h3 className="font-serif font-bold text-slate-900">Year-over-Year Performance</h3>
                    <p className="text-xs text-slate-400">Revenue & EBITDA by Business Unit (€ bn)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-yoy">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Business Unit</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">FY24 Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">FY25 Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Δ Rev</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">FY24 EBITDA</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">FY25 EBITDA</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Δ EBITDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localData.businessUnits.map((bu) => (
                          <tr key={bu.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-medium text-slate-800">{bu.name}</td>
                            <td className="text-right px-4 py-3 font-mono text-slate-400">{bu.yoy.revenue}</td>
                            <td className="text-right px-4 py-3 font-mono font-semibold text-slate-900">{bu.financials.revenue}</td>
                            <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaRevenue > 0 ? "text-green-600" : bu.yoy.deltaRevenue < 0 ? "text-red-600" : "text-slate-400"}`}>
                              {bu.yoy.deltaRevenue > 0 ? `+${bu.yoy.deltaRevenue}` : bu.yoy.deltaRevenue}
                            </td>
                            <td className="text-right px-4 py-3 font-mono text-slate-400">{bu.yoy.ebitda}</td>
                            <td className="text-right px-4 py-3 font-mono font-semibold text-slate-900">{bu.financials.ebitda}</td>
                            <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaEbitda > 0 ? "text-green-600" : bu.yoy.deltaEbitda < 0 ? "text-red-600" : "text-slate-400"}`}>
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
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 border border-white/20 text-xs font-medium mb-3">
                      Financial Analysis
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">Financials</h1>
                    <p className="text-emerald-200 text-sm">Consolidated financial data · FY 2025</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Revenue vs. EBITDA by Unit</h3>
                  <p className="text-xs text-slate-400 mb-5">€ Billions</p>
                  <div className="space-y-4">
                    {localData.businessUnits.map((bu) => {
                      const maxRevenue = Math.max(1, ...localData.businessUnits.map((b) => b.revenue));
                      return (
                        <div key={bu.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700">{bu.name}</span>
                            <span className="font-mono text-slate-500">€{bu.revenue}bn / €{bu.ebitda}bn</span>
                          </div>
                          <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-slate-300 rounded-full" style={{ width: `${(bu.revenue / maxRevenue) * 100}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-slate-800 rounded-full" style={{ width: `${(bu.ebitda / maxRevenue) * 100}%` }} />
                          </div>
                          <div className="flex gap-4 text-[10px] text-slate-400">
                            <span>Margin: {bu.margin}%</span>
                            <span>Employees: {bu.employees.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-800" /> EBITDA</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-300" /> Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                      <h3 className="font-serif font-bold text-slate-900">Assets</h3>
                      <p className="text-xs text-slate-400">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-assets">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Line Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Value (€ mn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Non-Current Assets</td></tr>
                        {localData.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(localData.detailedBalanceSheet.assets.nonCurrent.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Assets</td></tr>
                        {localData.detailedBalanceSheet.assets.current.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(localData.detailedBalanceSheet.assets.current.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-800 text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL ASSETS</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...localData.detailedBalanceSheet.assets.nonCurrent, ...localData.detailedBalanceSheet.assets.current].reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                      <h3 className="font-serif font-bold text-slate-900">Equity & Liabilities</h3>
                      <p className="text-xs text-slate-400">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-equity">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Line Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Value (€ mn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Equity</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Equity</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.equity.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Non-Current Liabilities</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Liabilities</td></tr>
                        {localData.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(localData.detailedBalanceSheet.equityLiabilities.currentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-800 text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL EQUITY & LIAB.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...localData.detailedBalanceSheet.equityLiabilities.equity, ...localData.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities, ...localData.detailedBalanceSheet.equityLiabilities.currentLiabilities].reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {localData.cashFlow && localData.cashFlow.length > 0 && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                      <h3 className="font-serif font-bold text-slate-900">Cash Flow Statement FY 2025</h3>
                      <p className="text-xs text-slate-400">€ Billions</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-cashflow">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Amount (€ bn)</th>
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
                                <tr key={`cat-${cf.category}`} className="bg-slate-50/50">
                                  <td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>{cf.category}</td>
                                </tr>
                              );
                            }
                            const isSubtotal = cf.item.startsWith("Net cash") || cf.item === "NET CHANGE IN CASH" || cf.item === "Closing cash balance" || cf.item === "Opening cash balance";
                            rows.push(
                              <tr key={i} className={`border-b border-slate-50 ${isSubtotal ? "bg-slate-100 font-semibold" : ""}`}>
                                <td className={`px-6 ${isSubtotal ? "" : "pl-10"} py-1.5 text-xs text-slate-${isSubtotal ? "900" : "600"}`}>{cf.item}</td>
                                <td className={`text-right px-6 py-1.5 text-xs font-mono ${cf.value < 0 ? "text-red-600" : "text-slate-900"}`}>
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
                  <div className="rounded-xl border-2 border-red-200 bg-red-50/20 overflow-hidden">
                    <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-3 py-1">Stress Case</span>
                        <h3 className="font-serif font-bold text-slate-900">{localData.stressScenario.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Liquidity pressure caused by operational shifts, investment timing and working capital dynamics</p>
                    </div>
                    <table className="w-full text-sm" data-testid="table-stress">
                      <thead>
                        <tr className="border-b border-red-100">
                          <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Item</th>
                          <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Amount (€ bn)</th>
                          <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localData.stressScenario.items.map((si, i) => (
                          <tr key={i} className="border-b border-red-50">
                            <td className="px-6 py-2 text-xs font-medium text-slate-800">{si.item}</td>
                            <td className={`text-right px-6 py-2 text-xs font-mono font-semibold ${si.amount < 0 ? "text-red-600" : "text-slate-900"}`}>
                              {si.amount >= 0 ? si.amount.toFixed(2) : si.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-2 text-xs text-slate-500 italic">{si.comment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase text-red-700 mb-2">Key Stress Drivers</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                          {localData.stressScenario.keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-red-700 mb-2">Immediate Implications</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                          {localData.stressScenario.implications.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Profitability Profile</h3>
                  <p className="text-xs text-slate-400 mb-5">EBITDA Margin by Business Unit</p>
                  <div className="space-y-3">
                    {[...localData.businessUnits].sort((a, b) => b.margin - a.margin).map((bu) => (
                      <div key={bu.id} className="flex items-center gap-4">
                        <span className="text-xs text-slate-600 w-48 shrink-0 truncate">{bu.name}</span>
                        <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${bu.margin > 10 ? "bg-green-600" : bu.margin > 7 ? "bg-amber-500" : "bg-red-500"}`}
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
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-violet-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                    <div className="w-1/3 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <span className="font-semibold text-slate-900 text-sm">Dokumente</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 ml-2">{localData.protocols.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {localData.protocols.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProtocolId(p.id)}
                            className={`flex flex-col w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                              selectedProtocolId === p.id ? "bg-slate-100 border-l-4 border-l-slate-800" : "border-l-4 border-l-transparent"
                            }`}
                            data-testid={`button-protocol-${p.id}`}
                          >
                            <span className="text-xs font-semibold text-slate-900 line-clamp-2">{p.title}</span>
                            <span className="text-[10px] text-slate-400 mt-1">{p.date}</span>
                            <span className="text-[10px] mt-1 inline-block bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 w-fit capitalize">{p.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-200 flex flex-col overflow-hidden bg-white">
                      {selectedProtocol ? (
                        editingDoc?.type === "protocol" && editingDoc.id === selectedProtocol.id ? (
                          <div className="flex flex-col h-full" data-testid="form-edit-protocol">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-3">
                              <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                                <input
                                  type="text"
                                  value={editForm.title || ""}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full text-lg font-serif font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                  data-testid="input-edit-protocol-title"
                                />
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Content</label>
                              <textarea
                                value={editForm.content || ""}
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                className="w-full h-full min-h-[300px] text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-300"
                                data-testid="input-edit-protocol-content"
                              />
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
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
                                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                data-testid="button-cancel-protocol"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                              <div className="flex items-start justify-between mb-1">
                                <h2 className="text-lg font-serif font-bold text-slate-900 flex-1">{selectedProtocol.title}</h2>
                                {caseStudyId && (
                                  <button
                                    onClick={() => {
                                      setEditingDoc({ type: "protocol", id: selectedProtocol.id });
                                      setEditForm({ title: selectedProtocol.title, content: selectedProtocol.content });
                                    }}
                                    className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors ml-3 shrink-0"
                                    data-testid="button-edit-protocol"
                                  >
                                    Bearbeiten
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{selectedProtocol.date}</span>
                                {selectedProtocol.location && <span>· {selectedProtocol.location}</span>}
                              </div>
                              {selectedProtocol.participants && (
                                <p className="text-xs text-slate-400 mt-1">Participants: {selectedProtocol.participants}</p>
                              )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl">
                              {selectedProtocol.content}
                            </div>
                          </>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                          <p>Select a document to read</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No protocols available.</p>
                )}
              </div>
            )}

            {activeTab === "news" && (
              <div className="space-y-6" data-testid="section-news">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-rose-900 via-rose-800 to-pink-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-100 border border-white/20 text-xs font-medium mb-3">
                      News & Media
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-1">News</h1>
                    <p className="text-rose-200 text-sm">External press coverage & industry analysis</p>
                  </div>
                </div>
                {localData.newsArticles && localData.newsArticles.length > 0 ? (
                  selectedNews ? (
                    <div>
                      <button
                        onClick={() => { setSelectedNewsId(""); setEditingDoc(null); }}
                        className="text-xs text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
                        data-testid="button-back-news"
                      >
                        ← Back to articles
                      </button>
                      {editingDoc?.type === "news" && editingDoc.id === selectedNews.id ? (
                        <article className="max-w-3xl" data-testid="form-edit-news">
                          <div className="mb-6 space-y-3">
                            <span className="text-xs text-slate-400">{selectedNews.source} · {selectedNews.date}</span>
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Headline</label>
                              <input
                                type="text"
                                value={editForm.headline || ""}
                                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                                className="w-full text-2xl font-serif font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                data-testid="input-edit-news-headline"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Subtitle</label>
                              <input
                                type="text"
                                value={editForm.subtitle || ""}
                                onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                className="w-full text-base text-slate-500 italic bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                data-testid="input-edit-news-subtitle"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Content</label>
                            <textarea
                              value={editForm.content || ""}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              className="w-full min-h-[400px] text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-300"
                              data-testid="input-edit-news-content"
                            />
                          </div>
                          <div className="mt-4 flex items-center gap-3">
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
                              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                              data-testid="button-cancel-news"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </article>
                      ) : (
                        <article className="max-w-3xl">
                          <div className="mb-6">
                            <div className="flex items-start justify-between">
                              <span className="text-xs text-slate-400">{selectedNews.source} · {selectedNews.date}</span>
                              {caseStudyId && (
                                <button
                                  onClick={() => {
                                    setEditingDoc({ type: "news", id: selectedNews.id });
                                    setEditForm({ headline: selectedNews.headline, subtitle: selectedNews.subtitle, content: selectedNews.content });
                                  }}
                                  className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors ml-3 shrink-0"
                                  data-testid="button-edit-news"
                                >
                                  Bearbeiten
                                </button>
                              )}
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-slate-900 mt-2 mb-2">{selectedNews.headline}</h2>
                            <p className="text-base text-slate-500 italic">{selectedNews.subtitle}</p>
                          </div>
                          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div>
                        </article>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localData.newsArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedNewsId(article.id)}
                          className="w-full text-left rounded-xl border border-slate-200 p-6 hover:border-slate-400 transition-colors"
                          data-testid={`button-news-${article.id}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{article.source}</span>
                            <span className="text-[10px] text-slate-400">{article.date}</span>
                          </div>
                          <h3 className="text-base font-serif font-bold text-slate-900 mb-1">{article.headline}</h3>
                          <p className="text-sm text-slate-500">{article.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-slate-400">No news articles available.</p>
                )}
              </div>
            )}

            {activeTab === "internal-comms" && (
              <div className="space-y-6" data-testid="section-internal-comms">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-900 via-cyan-800 to-teal-700 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
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

            {activeTab === "hr-dashboard" && (
              <div className="space-y-8" data-testid="section-hr-dashboard">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-amber-800 p-8 text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
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
                    <div className="rounded-xl border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-serif font-bold text-slate-900">{localData.hrSurvey.title}</h2>
                          <p className="text-xs text-slate-400 mt-1">Scale: 1 = strongly disagree | 5 = strongly agree</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-slate-900">{localData.hrSurvey.participantsInvited}</div>
                            <div className="text-[10px] text-slate-400 uppercase">Invited</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-green-700">{localData.hrSurvey.responseRate}%</div>
                            <div className="text-[10px] text-slate-400 uppercase">Response Rate</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {localData.hrSurvey.categories.map((cat) => (
                          <div key={cat.name}>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{cat.name}</h3>
                            <div className="space-y-3">
                              {cat.items.map((item, i) => {
                                const pct = (item.score / 5) * 100;
                                const color = item.score >= 3 ? "bg-green-500" : item.score >= 2.5 ? "bg-amber-500" : "bg-red-500";
                                return (
                                  <div key={i} className="flex items-center gap-4">
                                    <span className="text-xs text-slate-600 w-[55%] shrink-0">{item.question}</span>
                                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                      <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-sm font-mono font-bold w-8 text-right ${item.score >= 3 ? "text-green-700" : item.score >= 2.5 ? "text-amber-600" : "text-red-600"}`}>
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
                      <div className="rounded-xl border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Selected Anonymous Comments</h3>
                        <div className="space-y-3">
                          {localData.hrSurvey.comments.map((comment, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-4 border-l-4 border-l-slate-400 text-sm italic text-slate-600">
                              &ldquo;{comment}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {localData.hrSurvey.hrComment && (
                      <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-6">
                        <h3 className="text-sm font-bold text-amber-800 mb-2">HR Assessment</h3>
                        <p className="text-sm text-amber-900">{localData.hrSurvey.hrComment}</p>
                      </div>
                    )}
                  </>
                )}

                {localData.managementTeam && localData.managementTeam.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {localData.managementTeam.map((m) => (
                        <div key={m.name} className="rounded-lg border border-slate-200 p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                            <div className="text-xs text-slate-500">{m.role}</div>
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

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-300">
          &copy; Christoph Aldering &middot; Private initiative / concept
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
    return <p className="text-sm text-slate-400">No messages available.</p>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-14rem)]">
      <div className="w-1/3 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <span className="font-semibold text-slate-900 text-sm">Inbox</span>
          <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{emails.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`flex flex-col w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                selectedEmailId === email.id ? "bg-slate-100 border-l-4 border-l-slate-800" : "border-l-4 border-l-transparent"
              }`}
              data-testid={`button-email-${email.id}`}
            >
              <div className="flex justify-between items-start w-full mb-1">
                <span className={`text-xs font-semibold ${!email.read ? "text-slate-900" : "text-slate-500"}`}>
                  {email.from.split(",")[0]}
                </span>
                <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{email.date.split(",")[1]?.trim() || email.date}</span>
              </div>
              <span className={`text-xs line-clamp-1 ${!email.read ? "font-medium text-slate-800" : "text-slate-600"}`}>
                {email.subject}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {email.content.substring(0, 90).replace(/\n/g, " ")}...
              </span>
              {email.important && (
                <span className="text-[9px] mt-1.5 inline-block border border-red-200 text-red-600 bg-red-50 rounded-full px-2 py-0.5 w-fit">
                  Important
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-200 flex flex-col overflow-hidden bg-white">
        {selectedEmail ? (
          editingId === selectedEmail.id && editForm && onEditFormChange && onSave && onCancel ? (
            <div className="flex flex-col h-full" data-testid="form-edit-email">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
                  <textarea
                    value={editForm.subject || ""}
                    onChange={(e) => onEditFormChange({ ...editForm, subject: e.target.value })}
                    className="w-full text-lg font-serif font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                    rows={2}
                    data-testid="input-edit-email-subject"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">From</label>
                  <input
                    type="text"
                    value={editForm.from || ""}
                    onChange={(e) => onEditFormChange({ ...editForm, from: e.target.value })}
                    className="w-full text-sm text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    data-testid="input-edit-email-from"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Content</label>
                <textarea
                  value={editForm.content || ""}
                  onChange={(e) => onEditFormChange({ ...editForm, content: e.target.value })}
                  className="w-full h-full min-h-[300px] text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-300"
                  data-testid="input-edit-email-content"
                />
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
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
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                  data-testid="button-cancel-email"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-serif font-bold text-slate-900 flex-1" data-testid="text-email-subject">{selectedEmail.subject}</h2>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(selectedEmail)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors ml-3 shrink-0"
                      data-testid="button-edit-email"
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {selectedEmail.from.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900" data-testid="text-email-from">{selectedEmail.from}</div>
                    <div className="text-[10px] text-slate-400">{selectedEmail.date}</div>
                    {selectedEmail.to && <div className="text-[10px] text-slate-400">To: {selectedEmail.to}</div>}
                    {selectedEmail.cc && <div className="text-[10px] text-slate-400">Cc: {selectedEmail.cc}</div>}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl" data-testid="text-email-body">
                {selectedEmail.content}
              </div>
              <div className="px-8 py-4 border-t border-slate-100 text-[10px] text-slate-400 italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Confidential - internal communication
              </div>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <p>Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
