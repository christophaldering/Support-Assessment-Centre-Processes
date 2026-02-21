"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AI_FEATURES, PROVIDER_INFO } from "@/lib/llm/types";
import type { ProviderKey, ComplianceMode, AiFeatureKey } from "@/lib/llm/types";

interface Settings {
  activeLlmProvider: ProviderKey;
  aiMasterDisabled: boolean;
  aiFeaturesDisabled: string[];
  complianceMode: ComplianceMode;
}

interface AuditEntry {
  id: string;
  action: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  actor: string;
  createdAt: string;
}

const COMPLIANCE_MODES: { key: ComplianceMode; label: string; description: string; icon: string }[] = [
  { key: "innovation", label: "Innovation", description: "Maximale KI-Leistung, OpenAI Global", icon: "🚀" },
  { key: "eu_secure", label: "EU Secure", description: "Nur EU-gehostete Provider, DSGVO-konform", icon: "🛡️" },
  { key: "hybrid", label: "Hybrid", description: "Sensible Daten → EU, Kreative Tasks → OpenAI", icon: "⚡" },
];

export default function AiGovernancePage() {
  const params = useParams();
  const slug = params.workspaceSlug as string;
  const [settings, setSettings] = useState<Settings | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "audit">("settings");

  const fetchSettings = useCallback(async () => {
    const res = await fetch(`/api/w/${slug}/ai-governance`);
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
    setLoading(false);
  }, [slug]);

  const fetchAudit = useCallback(async () => {
    const res = await fetch(`/api/w/${slug}/ai-governance?view=audit&limit=100`);
    if (res.ok) {
      const data = await res.json();
      setAudit(data.logs);
    }
  }, [slug]);

  useEffect(() => {
    fetchSettings();
    fetchAudit();
  }, [fetchSettings, fetchAudit]);

  const updateSettings = async (updates: Partial<Settings>) => {
    setSaving(true);
    const res = await fetch(`/api/w/${slug}/ai-governance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      fetchAudit();
    }
    setSaving(false);
  };

  const toggleFeature = (featureKey: string) => {
    if (!settings) return;
    const disabled = [...settings.aiFeaturesDisabled];
    const idx = disabled.indexOf(featureKey);
    if (idx >= 0) {
      disabled.splice(idx, 1);
    } else {
      disabled.push(featureKey);
    }
    updateSettings({ aiFeaturesDisabled: disabled });
  };

  if (loading) {
    return (
      <div className="py-8 px-6 lg:px-10 space-y-6" data-testid="ai-governance-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-8 px-6 lg:px-10" data-testid="ai-governance-error">
        <p className="text-red-600">Einstellungen konnten nicht geladen werden.</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6" data-testid="ai-governance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">AI Governance & Provider Management</h1>
          <p className="text-slate-500 mt-1">KI-Provider konfigurieren, Compliance-Modus wählen und Funktionen steuern</p>
        </div>
        {saving && <span className="text-sm text-amber-600 animate-pulse">Speichern...</span>}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings" ? "border-[#A6473B] text-[#A6473B]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          data-testid="tab-settings"
        >
          Einstellungen
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "audit" ? "border-[#A6473B] text-[#A6473B]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          data-testid="tab-audit"
        >
          Audit Log ({audit.length})
        </button>
      </div>

      {activeTab === "settings" ? (
        <div className="space-y-8">
          {/* Master Kill Switch */}
          <div className={`rounded-xl border-2 p-6 ${settings.aiMasterDisabled ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50/50"}`} data-testid="section-kill-switch">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {settings.aiMasterDisabled ? "⛔" : "✅"} AI Master Switch
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {settings.aiMasterDisabled
                    ? "Alle KI-Funktionen sind deaktiviert. Es werden keine API-Calls durchgeführt."
                    : "KI-Funktionen sind aktiv. Der ausgewählte Provider wird für alle Anfragen verwendet."}
                </p>
              </div>
              <button
                onClick={() => updateSettings({ aiMasterDisabled: !settings.aiMasterDisabled })}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${settings.aiMasterDisabled ? "bg-red-500" : "bg-green-500"}`}
                data-testid="toggle-master-switch"
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${settings.aiMasterDisabled ? "translate-x-1" : "translate-x-9"}`} />
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="section-provider">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">LLM Provider</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(PROVIDER_INFO) as [ProviderKey, typeof PROVIDER_INFO[ProviderKey]][]).map(([key, info]) => {
                const isActive = settings.activeLlmProvider === key;
                const isAvailable = key === "openai";
                return (
                  <button
                    key={key}
                    onClick={() => isAvailable && updateSettings({ activeLlmProvider: key })}
                    disabled={!isAvailable}
                    className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                      isActive ? "border-[#A6473B] bg-[#A6473B]/5 ring-1 ring-[#A6473B]/20" :
                      isAvailable ? "border-slate-200 hover:border-slate-300 bg-white" :
                      "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                    }`}
                    data-testid={`provider-${key}`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2 bg-[#A6473B] text-white text-xs px-2 py-0.5 rounded-full">Aktiv</span>
                    )}
                    {!isAvailable && (
                      <span className="absolute top-2 right-2 bg-slate-400 text-white text-xs px-2 py-0.5 rounded-full">Kommt bald</span>
                    )}
                    <h3 className="font-semibold text-slate-900">{info.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{info.region}</p>
                    <p className="text-sm text-slate-600 mt-2">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance Mode */}
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="section-compliance">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Compliance-Modus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COMPLIANCE_MODES.map((mode) => {
                const isActive = settings.complianceMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => updateSettings({ complianceMode: mode.key })}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      isActive ? "border-[#297587] bg-[#297587]/5 ring-1 ring-[#297587]/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                    data-testid={`compliance-${mode.key}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{mode.icon}</span>
                      <h3 className="font-semibold text-slate-900">{mode.label}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{mode.description}</p>
                    {isActive && <p className="text-xs text-[#297587] font-medium mt-2">● Aktiv</p>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="section-features">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Feature-Steuerung</h2>
            <p className="text-sm text-slate-500 mb-4">Einzelne KI-Funktionen gezielt aktivieren oder deaktivieren</p>
            <div className="space-y-2">
              {AI_FEATURES.map((feature) => {
                const isDisabled = settings.aiFeaturesDisabled.includes(feature.key);
                return (
                  <div
                    key={feature.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isDisabled ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-slate-50/50"
                    }`}
                    data-testid={`feature-row-${feature.key}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${isDisabled ? "bg-red-400" : "bg-green-400"}`} />
                      <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.key)}
                      disabled={settings.aiMasterDisabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.aiMasterDisabled ? "bg-slate-200 cursor-not-allowed" :
                        isDisabled ? "bg-red-400" : "bg-green-500"
                      }`}
                      data-testid={`toggle-feature-${feature.key}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isDisabled ? "translate-x-1" : "translate-x-6"
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Audit Log Tab */
        <div className="bg-white rounded-xl border border-slate-200" data-testid="section-audit-log">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Änderungsprotokoll</h2>
            <p className="text-sm text-slate-500 mt-0.5">Alle Konfigurationsänderungen und blockierte Anfragen</p>
          </div>
          {audit.length === 0 ? (
            <div className="p-8 text-center text-slate-400" data-testid="audit-empty">
              Noch keine Einträge vorhanden.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {audit.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`audit-entry-${entry.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          entry.action.includes("blocked") ? "bg-red-400" :
                          entry.action.includes("disabled") ? "bg-amber-400" : "bg-blue-400"
                        }`} />
                        <span className="text-sm font-medium text-slate-900">{entry.action}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        von <span className="font-medium">{entry.actor || "System"}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  {(entry.previousValue || entry.newValue) && (
                    <details className="mt-2 text-xs">
                      <summary className="text-slate-400 cursor-pointer hover:text-slate-600">Details anzeigen</summary>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {entry.previousValue && (
                          <div className="bg-red-50 rounded p-2">
                            <span className="text-red-600 font-medium">Vorher:</span>
                            <pre className="text-slate-600 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(entry.previousValue, null, 2)}</pre>
                          </div>
                        )}
                        {entry.newValue && (
                          <div className="bg-green-50 rounded p-2">
                            <span className="text-green-600 font-medium">Nachher:</span>
                            <pre className="text-slate-600 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(entry.newValue, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
