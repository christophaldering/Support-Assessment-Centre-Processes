"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";


const ACCENT = "hsl(14, 48%, 44%)";

type TabKey = "predictive" | "development" | "hypotheses";

interface Assessment {
  id: string;
  name: string;
  status: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface RiskIndicator {
  category: string;
  score: number;
  explanation: string;
  contributingFactors: string[];
}

interface ScenarioResult {
  scenario: string;
  predictedBehavior: string;
  riskFlags: string[];
  compensatingStrengths: string[];
  confidence: number;
}

interface PredictiveProfile {
  id: string;
  assessmentId: string;
  candidateId: string;
  riskIndicators: RiskIndicator[];
  successScenarios: { scenarios: ScenarioResult[]; summary: string };
  confidenceScore: number;
  evidenceCoverage: number;
  createdAt: string;
}

interface FocusArea {
  area: string;
  priority: string;
  currentState: string;
  targetBehavior: string;
  actions: string[];
  ifUnaddressedRisk: string;
}

interface GrowthTarget {
  target: string;
  measurableShift: string;
  milestones: string[];
  supportNeeded: string;
}

interface PositioningGoal {
  goal: string;
  strategicRationale: string;
  successIndicators: string[];
}

interface CoachingQuestion {
  theme: string;
  question: string;
  purpose: string;
}

interface Intervention {
  type: string;
  title: string;
  description: string;
  duration: string;
  priority: string;
}

interface RiskMitigation {
  risk: string;
  mitigationAction: string;
  timeline: string;
  owner: string;
}

interface DevelopmentBlueprint {
  id: string;
  assessmentId: string;
  candidateId: string;
  focusAreas90d: FocusArea[];
  growthTargets6m: GrowthTarget[];
  positioningGoals12m: PositioningGoal[];
  coachingQuestions: CoachingQuestion[];
  suggestedInterventions: Intervention[];
  riskMitigationSteps: RiskMitigation[];
  confidenceScore: number;
  createdAt: string;
  summary?: string;
}

interface EvidenceRef {
  type: string;
  reference: string;
  strength?: string;
  weight?: string;
}

interface ValidationStep {
  method: string;
  question: string;
  rationale: string;
}

interface DiagnosticHypothesis {
  id: string;
  assessmentId: string;
  candidateId: string;
  hypothesisText: string;
  alternativeText: string | null;
  supportingEvidence: EvidenceRef[];
  counterEvidence: EvidenceRef[];
  requiredValidation: ValidationStep[];
  confidenceScore: number;
  evidenceCoverage: number;
  createdAt: string;
}

const RISK_COLORS: Record<string, string> = {
  execution_risk: "#ef4444",
  stakeholder_risk: "#f59e0b",
  resilience_risk: "#8b5cf6",
  governance_risk: "#3b82f6",
  transformation_risk: "#10b981",
};

const RISK_LABELS: Record<string, string> = {
  execution_risk: "Umsetzungsrisiko",
  stakeholder_risk: "Stakeholder-Risiko",
  resilience_risk: "Resilienz-Risiko",
  governance_risk: "Governance-Risiko",
  transformation_risk: "Transformationsrisiko",
};

const PRIORITY_BADGES: Record<string, { bg: string; text: string }> = {
  hoch: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]" },
  mittel: { bg: "bg-[var(--eds-status-amber-bg)]", text: "text-[var(--eds-status-amber)]" },
  niedrig: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]" },
};

const INTERVENTION_ICONS: Record<string, string> = {
  coaching: "🎯",
  training: "📚",
  mentoring: "🤝",
  shadowing: "👁",
  project_assignment: "📋",
  "360_feedback": "🔄",
};

export default function AdvancedIntelligencePage() {
  return (
    <Suspense fallback={<div className="py-8 px-6 lg:px-10 flex items-center justify-center text-[var(--eds-text-disabled)]">Laden...</div>}>
      <IntelligenceContent />
    </Suspense>
  );
}

function IntelligenceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const lockedAssessmentId = searchParams.get("assessmentId") || "";

  const [tab, setTab] = useState<TabKey>("predictive");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState(lockedAssessmentId);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [predictiveProfiles, setPredictiveProfiles] = useState<PredictiveProfile[]>([]);
  const [blueprints, setBlueprints] = useState<DevelopmentBlueprint[]>([]);
  const [hypotheses, setHypotheses] = useState<DiagnosticHypothesis[]>([]);
  const [hypothesesSummary, setHypothesesSummary] = useState("");

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments`);
      if (res.ok) setAssessments(await res.json());
    } catch {}
  }, [workspaceSlug]);

  const fetchCandidates = useCallback(async () => {
    if (!selectedAssessment) { setCandidates([]); return; }
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users`);
      if (res.ok) {
        const users = await res.json();
        setCandidates(users.filter((u: any) => u.roles?.includes("CANDIDATE") && (!u.assessmentId || u.assessmentId === selectedAssessment)));
      }
    } catch {}
  }, [workspaceSlug, selectedAssessment]);

  const fetchExistingData = useCallback(async () => {
    if (!selectedAssessment || !selectedCandidate) return;
    const params = `assessmentId=${selectedAssessment}&candidateId=${selectedCandidate}`;
    try {
      const [predRes, devRes, hypRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/intelligence/predictive?${params}`),
        fetch(`/api/w/${workspaceSlug}/intelligence/development?${params}`),
        fetch(`/api/w/${workspaceSlug}/intelligence/hypotheses?${params}`),
      ]);
      if (predRes.ok) setPredictiveProfiles(await predRes.json());
      if (devRes.ok) setBlueprints(await devRes.json());
      if (hypRes.ok) setHypotheses(await hypRes.json());
    } catch {}
  }, [workspaceSlug, selectedAssessment, selectedCandidate]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);
  useEffect(() => { fetchExistingData(); }, [fetchExistingData]);

  const generate = async (type: TabKey) => {
    if (!selectedAssessment || !selectedCandidate) {
      setError("Bitte Assessment und Kandidat auswählen.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const endpoint = type === "predictive" ? "predictive" : type === "development" ? "development" : "hypotheses";
      const body: any = { assessmentId: selectedAssessment, candidateId: selectedCandidate };
      if (targetRole) body.targetRole = targetRole;

      const res = await fetch(`/api/w/${workspaceSlug}/intelligence/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler bei der Generierung");
        return;
      }

      const data = await res.json();

      if (type === "predictive") {
        setPredictiveProfiles(prev => [data, ...prev]);
      } else if (type === "development") {
        setBlueprints(prev => [data, ...prev]);
      } else {
        setHypotheses(prev => [...(data.hypotheses || []), ...prev]);
        setHypothesesSummary(data.summary || "");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "predictive", label: "Prädiktiv" },
    { key: "development", label: "Entwicklung" },
    { key: "hypotheses", label: "Hypothesen" },
  ];

  const latestProfile = predictiveProfiles[0];
  const latestBlueprint = blueprints[0];

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
        {error && (
          <div className="mb-4 p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-sm text-[var(--eds-status-red)]" data-testid="text-error">
            {error}
          </div>
        )}

        {lockedAssessmentId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Assessment</label>
              <div className="w-full rounded-lg border border-[var(--eds-border)] bg-[var(--eds-bg-sunken)] px-3 py-2 text-sm text-[var(--eds-text-primary)] font-medium" data-testid="text-locked-assessment">
                {assessments.find(a => a.id === lockedAssessmentId)?.name || "Wird geladen..."}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Kandidat</label>
              <select
                data-testid="select-candidate"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm"
                value={selectedCandidate}
                onChange={e => setSelectedCandidate(e.target.value)}
              >
                <option value="">Auswählen...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Zielrolle (optional)</label>
                <input
                  data-testid="input-target-role"
                  className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm"
                  placeholder="z.B. CFO DAX, CEO Turnaround"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                />
              </div>
              <button
                data-testid="button-generate"
                className="rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
                disabled={loading || !selectedCandidate}
                onClick={() => generate(tab)}
              >
                {loading ? "Generiere..." : "Analyse generieren"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Assessment</label>
              <select
                data-testid="select-assessment"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm"
                value={selectedAssessment}
                onChange={e => { setSelectedAssessment(e.target.value); setSelectedCandidate(""); }}
              >
                <option value="">Auswählen...</option>
                {assessments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Kandidat</label>
              <select
                data-testid="select-candidate"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm"
                value={selectedCandidate}
                onChange={e => setSelectedCandidate(e.target.value)}
                disabled={!selectedAssessment}
              >
                <option value="">Auswählen...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] mb-1">Zielrolle (optional)</label>
              <input
                data-testid="input-target-role"
                className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm"
                placeholder="z.B. CFO DAX, CEO Turnaround"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                data-testid="button-generate"
                className="w-full rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
                disabled={loading || !selectedAssessment || !selectedCandidate}
                onClick={() => generate(tab)}
              >
                {loading ? "Generiere..." : "Analyse generieren"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-6 border-b border-[var(--eds-border)]">
          {tabs.map(t => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? "border-current text-[var(--eds-text-primary)]"
                  : "border-transparent text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
              }`}
              style={tab === t.key ? { color: ACCENT, borderColor: ACCENT } : {}}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "predictive" && (
          <PredictiveTab profile={latestProfile} />
        )}

        {tab === "development" && (
          <DevelopmentTab blueprint={latestBlueprint} />
        )}

        {tab === "hypotheses" && (
          <HypothesesTab hypotheses={hypotheses} summary={hypothesesSummary} />
        )}
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-[var(--eds-status-green)] bg-[var(--eds-status-green-bg)]" : pct >= 40 ? "text-[var(--eds-status-amber)] bg-[var(--eds-status-amber-bg)]" : "text-[var(--eds-status-red)] bg-[var(--eds-status-red-bg)]";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>Konfidenz: {pct}%</span>;
}

function AILabel() {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--eds-text-tertiary)] bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg px-3 py-2 mb-4">
      <span className="font-medium text-[var(--eds-text-secondary)]">KI-gestützte Analyse</span>
      <span>·</span>
      <span>Ergebnisse sollten durch menschliche Expertise validiert werden</span>
    </div>
  );
}

function PredictiveTab({ profile }: { profile: PredictiveProfile | undefined }) {
  if (!profile) {
    return (
      <div className="text-center py-16 text-[var(--eds-text-disabled)]" data-testid="text-no-predictive">
        <p className="text-lg mb-2">Kein prädiktives Profil vorhanden</p>
        <p className="text-sm">Wählen Sie ein Assessment und einen Kandidaten aus und klicken Sie auf "Analyse generieren".</p>
      </div>
    );
  }

  const risks = Array.isArray(profile.riskIndicators) ? profile.riskIndicators : [];
  const scenarios = profile.successScenarios?.scenarios || [];
  const summary = profile.successScenarios?.summary || "";

  return (
    <div data-testid="section-predictive">
      <AILabel />
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-[var(--eds-text-primary)]">Prädiktives Profil</h2>
        <ConfidenceBadge score={profile.confidenceScore} />
        <span className="text-xs text-[var(--eds-text-disabled)]">Evidenzabdeckung: {Math.round(profile.evidenceCoverage * 100)}%</span>
      </div>

      {summary && (
        <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--eds-text-primary)]">{summary}</p>
        </div>
      )}

      <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Risikoindikatoren</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {risks.map((risk, i) => (
          <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-risk-${risk.category}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)]">{RISK_LABELS[risk.category] || risk.category}</span>
              <span
                className="text-lg font-bold"
                style={{ color: RISK_COLORS[risk.category] || "#64748b" }}
              >
                {risk.score}
              </span>
            </div>
            <div className="w-full bg-[var(--eds-bg-sunken)] rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${risk.score}%`,
                  backgroundColor: RISK_COLORS[risk.category] || "#64748b",
                }}
              />
            </div>
            <p className="text-xs text-[var(--eds-text-secondary)] mb-2">{risk.explanation}</p>
            {risk.contributingFactors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {risk.contributingFactors.map((f, j) => (
                  <span key={j} className="text-[10px] bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)] px-1.5 py-0.5 rounded">{f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Szenario-Simulationen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((s, i) => (
          <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-scenario-${i}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--eds-text-primary)]">{s.scenario}</h4>
              <ConfidenceBadge score={s.confidence} />
            </div>
            <p className="text-sm text-[var(--eds-text-secondary)] mb-3">{s.predictedBehavior}</p>
            {s.riskFlags.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-[var(--eds-status-red)]">Risikoflaggen:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.riskFlags.map((f, j) => (
                    <span key={j} className="text-xs bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {s.compensatingStrengths.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[var(--eds-status-green)]">Kompensatorische Stärken:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.compensatingStrengths.map((f, j) => (
                    <span key={j} className="text-xs bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DevelopmentTab({ blueprint }: { blueprint: DevelopmentBlueprint | undefined }) {
  const [section, setSection] = useState<"90d" | "6m" | "12m" | "coaching" | "interventions" | "risks">("90d");

  if (!blueprint) {
    return (
      <div className="text-center py-16 text-[var(--eds-text-disabled)]" data-testid="text-no-development">
        <p className="text-lg mb-2">Kein Entwicklungsplan vorhanden</p>
        <p className="text-sm">Wählen Sie ein Assessment und einen Kandidaten aus und klicken Sie auf "Analyse generieren".</p>
      </div>
    );
  }

  const subTabs = [
    { key: "90d", label: "90 Tage" },
    { key: "6m", label: "6 Monate" },
    { key: "12m", label: "12 Monate" },
    { key: "coaching", label: "Coaching" },
    { key: "interventions", label: "Interventionen" },
    { key: "risks", label: "Risikominderung" },
  ] as const;

  return (
    <div data-testid="section-development">
      <AILabel />
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--eds-text-primary)]">Entwicklungsplan</h2>
        <ConfidenceBadge score={blueprint.confidenceScore} />
      </div>

      {blueprint.summary && (
        <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-4 mb-4">
          <p className="text-sm text-[var(--eds-text-primary)]">{blueprint.summary}</p>
        </div>
      )}

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {subTabs.map(t => (
          <button
            key={t.key}
            data-testid={`subtab-${t.key}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              section === t.key ? "text-white" : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-border)]"
            }`}
            style={section === t.key ? { backgroundColor: ACCENT } : {}}
            onClick={() => setSection(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "90d" && (
        <div className="space-y-3">
          {(blueprint.focusAreas90d || []).map((f: FocusArea, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-focus-${i}`}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium text-[var(--eds-text-primary)]">{f.area}</h4>
                {f.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGES[f.priority]?.bg || "bg-[var(--eds-bg-sunken)]"} ${PRIORITY_BADGES[f.priority]?.text || "text-[var(--eds-text-secondary)]"}`}>
                    {f.priority}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[var(--eds-text-tertiary)] font-medium">Aktuell:</span>
                  <p className="text-[var(--eds-text-secondary)]">{f.currentState}</p>
                </div>
                <div>
                  <span className="text-xs text-[var(--eds-text-tertiary)] font-medium">Zielverhalten:</span>
                  <p className="text-[var(--eds-text-secondary)]">{f.targetBehavior}</p>
                </div>
              </div>
              {f.actions && f.actions.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-[var(--eds-text-tertiary)] font-medium">Maßnahmen:</span>
                  <ul className="list-disc list-inside text-sm text-[var(--eds-text-secondary)] mt-1">
                    {f.actions.map((a: string, j: number) => <li key={j}>{a}</li>)}
                  </ul>
                </div>
              )}
              {f.ifUnaddressedRisk && (
                <div className="mt-2 text-xs text-[var(--eds-status-red)] bg-[var(--eds-status-red-bg)] px-2 py-1 rounded">
                  Risiko bei Nichtbearbeitung: {f.ifUnaddressedRisk}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section === "6m" && (
        <div className="space-y-3">
          {(blueprint.growthTargets6m || []).map((g: GrowthTarget, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-growth-${i}`}>
              <h4 className="text-sm font-medium text-[var(--eds-text-primary)] mb-2">{g.target}</h4>
              <div className="text-sm text-[var(--eds-text-secondary)] mb-2">
                <span className="text-xs text-[var(--eds-text-tertiary)] font-medium">Messbarer Indikator: </span>
                {g.measurableShift}
              </div>
              {g.milestones && g.milestones.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-[var(--eds-text-tertiary)] font-medium">Meilensteine:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.milestones.map((m: string, j: number) => (
                      <span key={j} className="text-xs bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)] px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-[var(--eds-text-tertiary)]">
                <span className="font-medium">Unterstützung: </span>{g.supportNeeded}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "12m" && (
        <div className="space-y-3">
          {(blueprint.positioningGoals12m || []).map((p: PositioningGoal, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-positioning-${i}`}>
              <h4 className="text-sm font-medium text-[var(--eds-text-primary)] mb-2">{p.goal}</h4>
              <p className="text-sm text-[var(--eds-text-secondary)] mb-2">{p.strategicRationale}</p>
              {p.successIndicators && p.successIndicators.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.successIndicators.map((s: string, j: number) => (
                    <span key={j} className="text-xs bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section === "coaching" && (
        <div className="space-y-3">
          {(blueprint.coachingQuestions || []).map((q: CoachingQuestion, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-coaching-${i}`}>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)]">{q.theme}</span>
              <p className="text-sm font-medium text-[var(--eds-text-primary)] mt-1 mb-1">"{q.question}"</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">{q.purpose}</p>
            </div>
          ))}
        </div>
      )}

      {section === "interventions" && (
        <div className="space-y-3">
          {(blueprint.suggestedInterventions || []).map((iv: Intervention, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-intervention-${i}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{INTERVENTION_ICONS[iv.type] || "📌"}</span>
                <h4 className="text-sm font-medium text-[var(--eds-text-primary)]">{iv.title}</h4>
                {iv.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGES[iv.priority]?.bg || "bg-[var(--eds-bg-sunken)]"} ${PRIORITY_BADGES[iv.priority]?.text || "text-[var(--eds-text-secondary)]"}`}>
                    {iv.priority}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--eds-text-secondary)] mb-1">{iv.description}</p>
              <span className="text-xs text-[var(--eds-text-disabled)]">Dauer: {iv.duration}</span>
            </div>
          ))}
        </div>
      )}

      {section === "risks" && (
        <div className="space-y-3">
          {(blueprint.riskMitigationSteps || []).map((r: RiskMitigation, i: number) => (
            <div key={i} className="border border-[var(--eds-border)] rounded-lg p-4" data-testid={`card-risk-mitigation-${i}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] px-2 py-0.5 rounded font-medium">{r.risk}</span>
              </div>
              <p className="text-sm text-[var(--eds-text-secondary)] mb-1">{r.mitigationAction}</p>
              <div className="flex gap-4 text-xs text-[var(--eds-text-disabled)]">
                <span>Zeitplan: {r.timeline}</span>
                <span>Verantwortlich: {r.owner}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HypothesesTab({ hypotheses, summary }: { hypotheses: DiagnosticHypothesis[]; summary: string }) {
  if (hypotheses.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--eds-text-disabled)]" data-testid="text-no-hypotheses">
        <p className="text-lg mb-2">Keine Hypothesen vorhanden</p>
        <p className="text-sm">Wählen Sie ein Assessment und einen Kandidaten aus und klicken Sie auf "Analyse generieren".</p>
      </div>
    );
  }

  const strengthColor = (s: string) => s === "stark" ? "text-[var(--eds-status-green)]" : s === "mittel" ? "text-[var(--eds-status-amber)]" : "text-[var(--eds-text-tertiary)]";
  const weightColor = (w: string) => w === "erheblich" ? "text-[var(--eds-status-red)]" : w === "moderat" ? "text-[var(--eds-status-amber)]" : "text-[var(--eds-text-tertiary)]";

  return (
    <div data-testid="section-hypotheses">
      <AILabel />
      <h2 className="text-lg font-semibold text-[var(--eds-text-primary)] mb-4">Diagnostische Hypothesen</h2>

      {summary && (
        <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--eds-text-primary)]">{summary}</p>
        </div>
      )}

      <div className="space-y-4">
        {hypotheses.map((h, i) => (
          <div key={h.id} className="border border-[var(--eds-border)] rounded-lg overflow-hidden" data-testid={`card-hypothesis-${i}`}>
            <div className="p-4 border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--eds-text-tertiary)]">Hypothese {i + 1}</span>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge score={h.confidenceScore} />
                  <span className="text-xs text-[var(--eds-text-disabled)]">Evidenz: {Math.round(h.evidenceCoverage * 100)}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">{h.hypothesisText}</p>
              {h.alternativeText && (
                <div className="mt-2 text-sm text-[var(--eds-text-secondary)] italic bg-[var(--eds-status-amber-bg)]/50 px-3 py-1.5 rounded border border-[var(--eds-border)]">
                  Alternative: {h.alternativeText}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-3">
                <h5 className="text-xs font-medium text-[var(--eds-status-green)] mb-2">Unterstützende Evidenz</h5>
                {(h.supportingEvidence || []).map((e: EvidenceRef, j: number) => (
                  <div key={j} className="mb-1.5 text-xs">
                    <span className={`font-medium ${strengthColor(e.strength || "")}`}>[{e.strength || e.type}]</span>
                    <span className="text-[var(--eds-text-secondary)] ml-1">{e.reference}</span>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <h5 className="text-xs font-medium text-[var(--eds-status-red)] mb-2">Gegenläufige Evidenz</h5>
                {(h.counterEvidence || []).map((e: EvidenceRef, j: number) => (
                  <div key={j} className="mb-1.5 text-xs">
                    <span className={`font-medium ${weightColor(e.weight || "")}`}>[{e.weight || e.type}]</span>
                    <span className="text-[var(--eds-text-secondary)] ml-1">{e.reference}</span>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <h5 className="text-xs font-medium text-[var(--eds-status-blue)] mb-2">Validierungsbedarf</h5>
                {(h.requiredValidation || []).map((v: ValidationStep, j: number) => (
                  <div key={j} className="mb-1.5 text-xs">
                    <span className="font-medium text-[var(--eds-status-blue)]">[{v.method}]</span>
                    <p className="text-[var(--eds-text-secondary)]">{v.question}</p>
                    <p className="text-[var(--eds-text-disabled)] text-[10px]">{v.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
