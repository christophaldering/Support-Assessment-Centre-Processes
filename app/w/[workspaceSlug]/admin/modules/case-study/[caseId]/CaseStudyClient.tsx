"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseStudyData, AssessmentQuestions } from "@/lib/case-studies/varexia";

type Tab =
  | "briefing"
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
}

export default function CaseStudyClient({ data, questions, workspaceSlug }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("briefing");
  const [selectedEmailId, setSelectedEmailId] = useState<string>("");
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>("");
  const [selectedNewsId, setSelectedNewsId] = useState<string>("");

  const internalEmails = data.emails.filter((e) => e.category === "internal");
  const externalEmails = data.emails.filter((e) => e.category === "external");

  const selectedInternalEmail = internalEmails.find((e) => e.id === selectedEmailId);
  const selectedExternalEmail = externalEmails.find((e) => e.id === selectedEmailId);
  const selectedProtocol = data.protocols?.find((p) => p.id === selectedProtocolId);
  const selectedNews = data.newsArticles?.find((n) => n.id === selectedNewsId);

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
            <span className="text-sm font-bold tracking-tight font-serif">{data.name}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Case Study</span>
          </div>
          <span className="text-[10px] text-white/40">{data.id.toUpperCase()}-2026</span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="py-4 px-3 space-y-1">
            {tabList.map((tab) => (
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
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">

            {activeTab === "briefing" && (
              <div className="max-w-3xl mx-auto space-y-8" data-testid="section-briefing">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Aufgabenstellung</h1>
                  <p className="text-sm text-slate-500">Independent Assessment · Confidential</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-8 space-y-6 text-slate-700 leading-relaxed">
                  <h2 className="text-lg font-serif font-bold text-slate-900">Your Role / Situation</h2>
                  <p>
                    Please imagine the following situation: You have been asked by the Executive Board of the <strong>VAREXIA Group</strong> to
                    provide an independent, senior-level assessment of the Group's current situation. Varexia is a publicly listed European
                    stock corporation (SE) with a dual management structure.
                  </p>
                  <p>
                    You have received a selection of internal and external documents shortly before the meeting. The material is deliberately
                    incomplete. This reflects the reality of executive decision-making.
                  </p>
                  <p>
                    You are expected to work with the information available, explicitly acknowledge blind spots, and distinguish clearly between
                    what can be assessed with confidence and what cannot.
                  </p>
                  <p>
                    You will present your assessment directly to the Executive Board. You are speaking to the Board, not about it.
                  </p>

                  <hr className="border-slate-100" />
                  <h2 className="text-lg font-serif font-bold text-slate-900">Your Task</h2>
                  <p>You are asked to structure and articulate your judgment along two dimensions:</p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">1. Analysis</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>How do you assess the current situation of the Varexia Group based on the available information?</li>
                        <li>Which patterns, tensions and interdependencies do you see across the organization, the financial profile and the governance system?</li>
                        <li>Where do you see the most relevant challenges?</li>
                        <li>Where do you see uncertainty or blind spots that should be named explicitly?</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">2. Conclusions / Assessment</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>What conclusions do you draw from your analysis?</li>
                        <li>Which issues require explicit prioritization or decision at Executive Board level?</li>
                        <li>Where do you see a need for action – and where consciously not?</li>
                        <li>Which conflicting objectives do you consider structurally irresolvable and therefore requiring a deliberate choice?</li>
                      </ul>
                    </div>
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
                      <div className="text-xl font-serif font-bold text-slate-900">60</div>
                      <div className="text-xs text-slate-500">min · Individual analysis</div>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3 text-center">
                      <div className="text-xl font-serif font-bold text-slate-900">15</div>
                      <div className="text-xs text-slate-500">min · Presentation</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-8" data-testid="section-overview">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-medium mb-4">
                    Strategic Review Required
                  </div>
                  <h1 className="text-3xl font-serif font-bold mb-2">{data.name}</h1>
                  <p className="text-slate-300 max-w-xl text-lg leading-relaxed">{data.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.metrics.map((metric) => (
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

                {data.managementTeam && data.managementTeam.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {data.managementTeam.map((m) => (
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

                {data.boardImpressions && data.boardImpressions.length > 0 && (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 mb-4">Impressions from Supervisory Board Meeting (January 2026)</h2>
                    <div className="space-y-3">
                      {data.boardImpressions.map((bi, i) => (
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
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Strategie</h1>
                  <p className="text-sm text-slate-400">Key strategic tensions, analyst assessment & leadership insights</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Key Strategic Tensions</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.businessUnits.map((bu) => (
                      <div key={bu.id} className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">{bu.name}</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>

                {data.analystReport && data.analystReport.source && (
                  <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-3 py-1">External</span>
                      <h2 className="text-lg font-serif font-bold text-slate-900">{data.analystReport.source}</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Key Observations</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                          {data.analystReport.observations.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                      {data.analystReport.criticalQuestions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Critical Questions</h3>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                            {data.analystReport.criticalQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {data.analystReport.indicators.map((ind) => (
                          <div key={ind.label} className="bg-white rounded-lg border border-red-100 p-3">
                            <span className="text-[10px] text-slate-400 uppercase">{ind.label}</span>
                            <div className="text-lg font-mono font-bold text-slate-900">{ind.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-red-100 p-4 text-sm italic text-slate-600">
                        {data.analystReport.conclusion}
                      </div>
                    </div>
                  </div>
                )}

                {data.leadershipSummary && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Internal Leadership Workshop – Executive Summary</h2>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.leadershipSummary}</div>
                  </div>
                )}

                {data.leadershipConference && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Leadership Conference 2025</h2>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.leadershipConference}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-8" data-testid="section-products">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Business Unit Profiles</h1>
                  <p className="text-sm text-slate-400">FY 2025 Snapshot · Detailed business unit analysis</p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {data.businessUnits.map((bu) => (
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
                        {data.businessUnits.map((bu) => (
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
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Financials</h1>
                  <p className="text-sm text-slate-400">Consolidated financial data · FY 2025</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Revenue vs. EBITDA by Unit</h3>
                  <p className="text-xs text-slate-400 mb-5">€ Billions</p>
                  <div className="space-y-4">
                    {data.businessUnits.map((bu) => {
                      const maxRevenue = Math.max(1, ...data.businessUnits.map((b) => b.revenue));
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
                        {data.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(data.detailedBalanceSheet.assets.nonCurrent.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Assets</td></tr>
                        {data.detailedBalanceSheet.assets.current.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Assets</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(data.detailedBalanceSheet.assets.current.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-800 text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL ASSETS</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...data.detailedBalanceSheet.assets.nonCurrent, ...data.detailedBalanceSheet.assets.current].reduce((s, i) => s + i.value, 0))}</td>
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
                        {data.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Equity</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(data.detailedBalanceSheet.equityLiabilities.equity.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Non-Current Liabilities</td></tr>
                        {data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Liabilities</td></tr>
                        {data.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                          <tr key={item.item} className="border-b border-slate-50">
                            <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                            <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 border-t-2 border-slate-200">
                          <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Liab.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">{formatCurrency(data.detailedBalanceSheet.equityLiabilities.currentLiabilities.reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                        <tr className="bg-slate-800 text-white">
                          <td className="px-6 py-2 font-bold text-xs">TOTAL EQUITY & LIAB.</td>
                          <td className="text-right px-6 py-2 font-bold text-xs font-mono">{formatCurrency([...data.detailedBalanceSheet.equityLiabilities.equity, ...data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities, ...data.detailedBalanceSheet.equityLiabilities.currentLiabilities].reduce((s, i) => s + i.value, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {data.cashFlow && data.cashFlow.length > 0 && (
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
                          return data.cashFlow.map((cf, i) => {
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

                {data.stressScenario && data.stressScenario.items.length > 0 && (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50/20 overflow-hidden">
                    <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-red-100 text-red-700 rounded-full px-3 py-1">Stress Case</span>
                        <h3 className="font-serif font-bold text-slate-900">{data.stressScenario.title}</h3>
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
                        {data.stressScenario.items.map((si, i) => (
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
                          {data.stressScenario.keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-red-700 mb-2">Immediate Implications</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                          {data.stressScenario.implications.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Profitability Profile</h3>
                  <p className="text-xs text-slate-400 mb-5">EBITDA Margin by Business Unit</p>
                  <div className="space-y-3">
                    {[...data.businessUnits].sort((a, b) => b.margin - a.margin).map((bu) => (
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
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Protokolle</h1>
                  <p className="text-sm text-slate-400">Meeting minutes, workshop protocols & committee notes</p>
                </div>
                {data.protocols && data.protocols.length > 0 ? (
                  <div className="flex gap-4 h-[calc(100vh-14rem)]">
                    <div className="w-1/3 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <span className="font-semibold text-slate-900 text-sm">Dokumente</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 ml-2">{data.protocols.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {data.protocols.map((p) => (
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
                        <>
                          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-serif font-bold text-slate-900 mb-1">{selectedProtocol.title}</h2>
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
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">News</h1>
                  <p className="text-sm text-slate-400">External press coverage & industry analysis</p>
                </div>
                {data.newsArticles && data.newsArticles.length > 0 ? (
                  selectedNews ? (
                    <div>
                      <button
                        onClick={() => setSelectedNewsId("")}
                        className="text-xs text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
                        data-testid="button-back-news"
                      >
                        ← Back to articles
                      </button>
                      <article className="max-w-3xl">
                        <div className="mb-6">
                          <span className="text-xs text-slate-400">{selectedNews.source} · {selectedNews.date}</span>
                          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-2 mb-2">{selectedNews.headline}</h2>
                          <p className="text-base text-slate-500 italic">{selectedNews.subtitle}</p>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div>
                      </article>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.newsArticles.map((article) => (
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
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Interne Kommunikation</h1>
                  <p className="text-sm text-slate-400">Internal emails, memos & correspondence</p>
                </div>
                <EmailListPanel
                  emails={internalEmails}
                  selectedEmailId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                />
              </div>
            )}

            {activeTab === "external-comms" && (
              <div className="space-y-6" data-testid="section-external-comms">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Externe Kommunikation</h1>
                  <p className="text-sm text-slate-400">External correspondence, analyst requests & customer communications</p>
                </div>
                <EmailListPanel
                  emails={externalEmails}
                  selectedEmailId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                />
              </div>
            )}

            {activeTab === "hr-dashboard" && (
              <div className="space-y-8" data-testid="section-hr-dashboard">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">HR-Dashboard</h1>
                  <p className="text-sm text-slate-400">Leadership pulse survey, employee feedback & organizational health</p>
                </div>

                {data.hrSurvey && data.hrSurvey.categories.length > 0 && (
                  <>
                    <div className="rounded-xl border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-serif font-bold text-slate-900">{data.hrSurvey.title}</h2>
                          <p className="text-xs text-slate-400 mt-1">Scale: 1 = strongly disagree | 5 = strongly agree</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-slate-900">{data.hrSurvey.participantsInvited}</div>
                            <div className="text-[10px] text-slate-400 uppercase">Invited</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-green-700">{data.hrSurvey.responseRate}%</div>
                            <div className="text-[10px] text-slate-400 uppercase">Response Rate</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {data.hrSurvey.categories.map((cat) => (
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

                    {data.hrSurvey.comments.length > 0 && (
                      <div className="rounded-xl border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Selected Anonymous Comments</h3>
                        <div className="space-y-3">
                          {data.hrSurvey.comments.map((comment, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-4 border-l-4 border-l-slate-400 text-sm italic text-slate-600">
                              &ldquo;{comment}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.hrSurvey.hrComment && (
                      <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-6">
                        <h3 className="text-sm font-bold text-amber-800 mb-2">HR Assessment</h3>
                        <p className="text-sm text-amber-900">{data.hrSurvey.hrComment}</p>
                      </div>
                    )}
                  </>
                )}

                {data.managementTeam && data.managementTeam.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Management Team</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {data.managementTeam.map((m) => (
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
}: {
  emails: CaseStudyData["emails"];
  selectedEmailId: string;
  onSelect: (id: string) => void;
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
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-serif font-bold text-slate-900 mb-3" data-testid="text-email-subject">{selectedEmail.subject}</h2>
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <p>Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
