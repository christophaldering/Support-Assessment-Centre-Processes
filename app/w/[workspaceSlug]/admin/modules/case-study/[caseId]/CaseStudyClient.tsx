"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseStudyData, AssessmentQuestions } from "@/lib/case-studies/varexia";

type Tab = "overview" | "briefing" | "financials" | "dataroom" | "communications" | "assessment";

const tabList: { id: Tab; labelDe: string }[] = [
  { id: "overview", labelDe: "Übersicht" },
  { id: "briefing", labelDe: "Strategisches Briefing" },
  { id: "communications", labelDe: "Kommunikation" },
  { id: "dataroom", labelDe: "Datenraum" },
  { id: "financials", labelDe: "Finanzanalyse" },
  { id: "assessment", labelDe: "Bewertung" },
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
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedEmailId, setSelectedEmailId] = useState<string>(data.emails[0]?.id || "");

  const selectedEmail = data.emails.find((e) => e.id === selectedEmailId);
  const base = `/w/${workspaceSlug}/admin`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <nav className="bg-slate-50 border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.labelDe}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

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

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-slate-800">Business Unit Overview</h2>
                <span className="text-sm text-slate-400">FY 2025 Snapshot</span>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {data.businessUnits.map((bu) => (
                  <div key={bu.id} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors" data-testid={`bu-${bu.id}`}>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">{bu.name}</h3>
                    <div className="text-xs font-mono text-slate-500 mb-3">
                      Revenue: €{bu.revenue}bn · Margin: {bu.margin}%
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Key Performance Indicators</span>
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
            </div>
          </div>
        )}

        {activeTab === "briefing" && (
          <div className="max-w-3xl mx-auto space-y-8" data-testid="section-briefing">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Strategic Briefing</h1>
              <p className="text-sm text-slate-500">Independent Assessment · Confidential</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-8 space-y-6 text-slate-700 leading-relaxed">
              <h2 className="text-lg font-serif font-bold text-slate-900">Your Role</h2>
              <p>
                You have been appointed as an <strong>independent external assessor</strong> to evaluate the
                strategic situation of <strong>{data.name}</strong>.
              </p>
              {data.description && (
                <>
                  <hr className="border-slate-100" />
                  <h2 className="text-lg font-serif font-bold text-slate-900">Situation</h2>
                  <p>{data.description}</p>
                </>
              )}
              <hr className="border-slate-100" />
              <h2 className="text-lg font-serif font-bold text-slate-900">Your Task</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Review all available materials: financial data, business unit profiles, internal communications, and balance sheet details.</li>
                <li>Identify key patterns, tensions, and interdependencies across the organization.</li>
                <li>Formulate a structured assessment with clear recommendations for the leadership team.</li>
              </ol>
              <hr className="border-slate-100" />
              <h2 className="text-lg font-serif font-bold text-slate-900">Constraints</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Time-limited exercise: prioritize clarity over completeness.</li>
                <li>All data is fictional but structurally realistic.</li>
                <li>You may reference specific data points to support your arguments.</li>
                <li>There is no single &ldquo;correct&rdquo; answer — the quality of reasoning matters.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "communications" && (
          <div className="flex gap-4 h-[calc(100vh-12rem)]" data-testid="section-communications">
            <div className="w-1/3 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">Inbox</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{data.emails.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {data.emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`flex flex-col w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                      selectedEmailId === email.id ? "bg-slate-100 border-l-4 border-l-slate-800" : "border-l-4 border-l-transparent"
                    }`}
                    data-testid={`button-email-${email.id}`}
                  >
                    <div className="flex justify-between items-start w-full mb-1">
                      <span className={`text-xs font-semibold ${!email.read ? "text-slate-900" : "text-slate-500"}`}>
                        {email.from.split(",")[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{email.date.split(",")[1]?.trim()}</span>
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
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl" data-testid="text-email-body">
                    {selectedEmail.content}
                  </div>
                  <div className="px-8 py-4 border-t border-slate-100 text-[10px] text-slate-400 italic flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    This message is confidential and intended solely for the Executive Board.
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <p>Select an email to read</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "dataroom" && (
          <div className="space-y-8" data-testid="section-dataroom">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Data Room</h1>
              <p className="text-sm text-slate-400">Consolidated financial statements and business unit performance data</p>
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

            <div>
              <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Business Unit Profiles</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {data.businessUnits.map((bu) => (
                  <div key={bu.id} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors" data-testid={`dataroom-bu-${bu.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif font-bold text-slate-900">{bu.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">Business Unit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                        <div className="text-xl font-mono font-semibold text-slate-900">€{bu.financials.revenue}bn</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">EBITDA Margin</span>
                        <div className={`text-xl font-mono font-semibold ${bu.financials.margin > 10 ? "text-green-700" : "text-slate-900"}`}>
                          {bu.financials.margin}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">KPIs</span>
                      <ul className="space-y-1">
                        {bu.kpis.map((kpi, i) => (
                          <li key={i} className="text-xs text-slate-600">→ {kpi}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">Strategic Tension</span>
                      <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-serif font-bold text-slate-900 mb-4">Key Figures</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Overview</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                    <li><strong>Company:</strong> {data.name}</li>
                    <li><strong>Business Units:</strong> {data.businessUnits.length}</li>
                    <li><strong>Total Employees:</strong> {data.businessUnits.reduce((s, bu) => s + bu.employees, 0).toLocaleString()} FTE</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Financial Summary</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                    <li><strong>Group Revenue:</strong> €{data.businessUnits.reduce((s, bu) => s + bu.revenue, 0).toFixed(1)} bn</li>
                    <li><strong>Group EBITDA:</strong> €{data.businessUnits.reduce((s, bu) => s + bu.ebitda, 0).toFixed(1)} bn</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="space-y-8" data-testid="section-financials">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Financial Analysis</h1>
              <p className="text-sm text-slate-400">Consolidated financial visualization · FY 2025</p>
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

            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-serif font-bold text-slate-900 mb-1">Balance Sheet Structure</h3>
              <p className="text-xs text-slate-400 mb-5">Summarized (€ Billions)</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Assets</h4>
                  {data.balanceSheet.filter((b) => b.type === "asset").map((item) => (
                    <div key={item.name} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-mono font-semibold text-slate-900">€{item.value}bn</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold text-sm border-t-2 border-slate-200 mt-1">
                    <span>Total</span>
                    <span className="font-mono">€{data.balanceSheet.filter((b) => b.type === "asset").reduce((s, i) => s + i.value, 0).toFixed(2)}bn</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Equity & Liabilities</h4>
                  {data.balanceSheet.filter((b) => b.type === "liability").map((item) => (
                    <div key={item.name} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-mono font-semibold text-slate-900">€{item.value}bn</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold text-sm border-t-2 border-slate-200 mt-1">
                    <span>Total</span>
                    <span className="font-mono">€{data.balanceSheet.filter((b) => b.type === "liability").reduce((s, i) => s + i.value, 0).toFixed(2)}bn</span>
                  </div>
                </div>
              </div>
            </div>

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

        {activeTab === "assessment" && (
          <div className="max-w-3xl mx-auto space-y-8" data-testid="section-assessment">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Executive Assessment</h1>
              <p className="text-sm text-slate-400">Formulate your analysis and strategic recommendations</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Part I: Analysis</h2>
              <div className="space-y-6">
                {questions.analysis.map((q, i) => (
                  <div key={i}>
                    <label className="text-sm font-medium text-slate-700 block mb-2">{i + 1}. {q}</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors min-h-[120px] resize-y"
                      placeholder="Ihre Analyse..."
                      data-testid={`textarea-analysis-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Part II: Strategic Conclusions</h2>
              <div className="space-y-6">
                {questions.conclusions.map((q, i) => (
                  <div key={i}>
                    <label className="text-sm font-medium text-slate-700 block mb-2">{i + 1}. {q}</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors min-h-[120px] resize-y"
                      placeholder="Ihre Schlussfolgerungen..."
                      data-testid={`textarea-conclusions-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-4">
              <p className="text-xs text-slate-400 italic">
                Dies ist eine diagnostische Übung. Ihre Antworten werden nicht automatisch gespeichert.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-300">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
