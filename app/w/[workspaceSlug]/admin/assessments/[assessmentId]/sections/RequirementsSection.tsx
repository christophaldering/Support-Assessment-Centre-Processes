"use client";

import Link from "next/link";
import { AssessmentRecord, LinkedAnalysis, ProposalCompetency, ProposalModule, ProposalExercise, ProposalPerson, ProposalCandidate, ProposalTimelineItem } from "./types";

interface RequirementsSectionProps {
  workspaceSlug: string;
  assessment: AssessmentRecord | null;
  linkedAnalysis: LinkedAnalysis | null;
  linkedAnalysisLoading: boolean;
}

export default function RequirementsSection({
  workspaceSlug,
  assessment,
  linkedAnalysis,
  linkedAnalysisLoading,
}: RequirementsSectionProps) {
  return (
    <>
      <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-requirements">Anforderungsanalyse</h2>
            <p className="text-sm text-[var(--eds-text-secondary)] leading-relaxed">
              {linkedAnalysis ? "Ergebnisse der durchgeführten Anforderungsanalyse." : "Definieren Sie Kompetenzen und Anforderungen für dieses Assessment."}
            </p>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin/requirements?assessmentId=${assessment?.id || ""}${assessment?.sourceAnalysisId ? `&analysisId=${assessment.sourceAnalysisId}` : ""}`}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-xs font-medium px-3 py-1.5 hover:bg-brand-blue hover:text-white transition-colors"
            data-testid="link-requirements-analysis"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            {linkedAnalysis ? "Analyse bearbeiten" : "Analyse öffnen"}
          </Link>
        </div>
      </div>

      {linkedAnalysisLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
        </div>
      )}

      {!linkedAnalysisLoading && !linkedAnalysis && (
        <Link
          href={`/w/${workspaceSlug}/admin/requirements?assessmentId=${assessment?.id || ""}`}
          className="block bg-white border-2 border-dashed border-brand-blue/30 hover:border-brand-blue/60 rounded-xl p-8 transition-colors group text-center"
          data-testid="link-start-analysis"
        >
          <div className="w-14 h-14 rounded-xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-blue transition-colors">Anforderungsanalyse starten</h3>
          <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">Erstellen Sie eine Analyse und übernehmen Sie die Ergebnisse für dieses Assessment</p>
        </Link>
      )}

      {!linkedAnalysisLoading && linkedAnalysis && linkedAnalysis.proposal && (() => {
        const p = linkedAnalysis.proposal!;
        const competencies = Array.isArray(p.competencies) ? p.competencies.filter((c: ProposalCompetency) => c && c.selected !== false) : [];
        const exercises = Array.isArray(p.exercises) ? p.exercises : [];
        const observers = Array.isArray(p.observers) ? p.observers : [];
        const timeline = Array.isArray(p.timeline) ? p.timeline : [];
        const participants = Array.isArray(p.participants) ? p.participants : [];
        const additionalObservers = Array.isArray(p.additionalObservers) ? p.additionalObservers : [];
        const candidates = Array.isArray(p.candidates) ? p.candidates : [];
        const specificQuestions = Array.isArray(p.specificQuestions) ? p.specificQuestions.filter(Boolean) : [];
        const successCriteria = Array.isArray(p.successCriteria) ? p.successCriteria.filter(Boolean) : [];
        const assessmentModules = Array.isArray(p.assessmentModules) ? p.assessmentModules.filter((m: ProposalModule) => m && m.selected !== false) : [];
        const formatPerson = (person: ProposalPerson | undefined | null) => person ? [person.firstName, person.lastName].filter(Boolean).join(" ") || null : null;
        const formatPersonDetail = (person: ProposalPerson | undefined | null) => {
          if (!person) return null;
          const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
          const parts = [name, person.role].filter(Boolean);
          return parts.length > 0 ? parts : null;
        };
        return (
          <div className="space-y-4" data-testid="section-linked-analysis-results">
            <div className="grid md:grid-cols-3 gap-4">
              {p.company && (
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4" data-testid="text-analysis-company">
                  <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-1">Unternehmen</p>
                  <p className="text-sm font-semibold text-brand-navy">{p.company}</p>
                </div>
              )}
              {p.targetRole && (
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4" data-testid="text-analysis-role">
                  <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-1">Zielposition</p>
                  <p className="text-sm font-semibold text-brand-navy">{p.targetRole}</p>
                </div>
              )}
              {p.assessmentDate && (
                <div className="bg-white border border-[var(--eds-border)] rounded-xl p-4" data-testid="text-analysis-date">
                  <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-1">Assessment-Datum</p>
                  <p className="text-sm font-semibold text-brand-navy">{p.assessmentDate}</p>
                </div>
              )}
            </div>

            {(p.analysisDate || p.analysisForm || p.assessmentType || p.assessmentDuration || p.startDate) && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-metadata">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Analyse-Details</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.analysisDate && (
                    <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3" data-testid="text-analysis-date-meta">
                      <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase mb-0.5">Analysedatum</p>
                      <p className="text-sm text-brand-navy font-medium">{p.analysisDate}</p>
                    </div>
                  )}
                  {p.analysisForm && (
                    <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3" data-testid="text-analysis-form">
                      <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase mb-0.5">Analyseformat</p>
                      <p className="text-sm text-brand-navy font-medium">{p.analysisForm}</p>
                    </div>
                  )}
                  {p.assessmentType && (
                    <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3" data-testid="text-assessment-type">
                      <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase mb-0.5">Assessment-Typ</p>
                      <p className="text-sm text-brand-navy font-medium">{p.assessmentType}</p>
                    </div>
                  )}
                  {p.assessmentDuration && (
                    <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3" data-testid="text-assessment-duration">
                      <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase mb-0.5">Dauer</p>
                      <p className="text-sm text-brand-navy font-medium">{p.assessmentDuration}</p>
                    </div>
                  )}
                  {p.startDate && (
                    <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3" data-testid="text-start-date">
                      <p className="text-[10px] font-medium text-[var(--eds-text-disabled)] uppercase mb-0.5">Startdatum</p>
                      <p className="text-sm text-brand-navy font-medium">{p.startDate}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {participants.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-participants">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Teilnehmer der Analyse ({participants.length})</p>
                <div className="flex flex-wrap gap-2">
                  {participants.map((part: ProposalPerson | string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--eds-text-primary)] bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-full px-3 py-1.5" data-testid={`text-participant-${i}`}>
                      <svg className="w-3.5 h-3.5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      {typeof part === "string" ? part : (part.name || JSON.stringify(part))}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(p.leadConsultant || p.secondConsultant || additionalObservers.length > 0) && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-consultants">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Berater &amp; Beobachter</p>
                <div className="space-y-2">
                  {p.leadConsultant && formatPerson(p.leadConsultant) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid="card-lead-consultant">
                      <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-navy">{formatPerson(p.leadConsultant)}</p>
                        <p className="text-xs text-[var(--eds-text-tertiary)]">{p.leadConsultant.role || "Lead-Berater"}</p>
                      </div>
                      <span className="text-[10px] font-medium text-brand-blue bg-brand-blue/10 rounded-full px-2 py-0.5">Lead</span>
                    </div>
                  )}
                  {p.secondConsultant && formatPerson(p.secondConsultant) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid="card-second-consultant">
                      <div className="w-8 h-8 rounded-full bg-[var(--eds-border)] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[var(--eds-text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-navy">{formatPerson(p.secondConsultant)}</p>
                        <p className="text-xs text-[var(--eds-text-tertiary)]">{p.secondConsultant.role || "Zweitberater"}</p>
                      </div>
                    </div>
                  )}
                  {additionalObservers.map((obs: ProposalPerson, i: number) => {
                    const detail = formatPersonDetail(obs);
                    if (!detail) return null;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid={`card-observer-${i}`}>
                        <div className="w-8 h-8 rounded-full bg-[var(--eds-bg-sunken)] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--eds-text-primary)]">{formatPerson(obs) || obs.role || "Beobachter"}</p>
                          {obs.role && formatPerson(obs) && <p className="text-xs text-[var(--eds-text-tertiary)]">{obs.role}</p>}
                        </div>
                        <span className="text-[10px] font-medium text-[var(--eds-text-tertiary)] bg-[var(--eds-bg-sunken)] rounded-full px-2 py-0.5">Beobachter</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {candidates.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-candidates">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Kandidaten ({candidates.length})</p>
                <div className="space-y-2">
                  {candidates.map((cand: ProposalCandidate, i: number) => {
                    const name = [cand.firstName, cand.lastName].filter(Boolean).join(" ");
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid={`card-candidate-${i}`}>
                        <div className="w-8 h-8 rounded-full bg-[var(--eds-status-green-bg)] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--eds-status-green)]">{(cand.firstName?.[0] || "").toUpperCase()}{(cand.lastName?.[0] || "").toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-navy">{name || "Kandidat"}</p>
                          {(cand.currentRole || cand.currentCompany) && (
                            <p className="text-xs text-[var(--eds-text-tertiary)]">{[cand.currentRole, cand.currentCompany].filter(Boolean).join(" · ")}</p>
                          )}
                        </div>
                        {cand.email && <span className="text-xs text-[var(--eds-text-disabled)]">{cand.email}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {p.context && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="text-analysis-context">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-2">Kontext &amp; Ausgangslage</p>
                <p className="text-sm text-[var(--eds-text-primary)] leading-relaxed whitespace-pre-line">{p.context}</p>
              </div>
            )}

            {competencies.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-competencies">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Kompetenzen ({competencies.length})</p>
                <div className="space-y-2.5">
                  {competencies.map((c: ProposalCompetency, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]">
                      <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand-blue">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-navy">{c.name}</p>
                        {c.description && <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5 leading-relaxed">{c.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {successCriteria.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-success-criteria">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Erfolgskriterien ({successCriteria.length})</p>
                <div className="space-y-1.5">
                  {successCriteria.map((criterion: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid={`text-criterion-${i}`}>
                      <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm text-[var(--eds-text-primary)]">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {specificQuestions.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-questions">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Spezifische Fragestellungen ({specificQuestions.length})</p>
                <div className="space-y-1.5">
                  {specificQuestions.map((q: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid={`text-question-${i}`}>
                      <svg className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                      <span className="text-sm text-[var(--eds-text-primary)]">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assessmentModules.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-modules">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Assessment-Module ({assessmentModules.length})</p>
                <div className="space-y-2">
                  {assessmentModules.map((mod: ProposalModule, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]" data-testid={`card-module-${i}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-navy">{mod.name}</p>
                          {mod.type && <span className="inline-block text-[10px] font-medium text-purple-600 bg-purple-50 rounded px-1.5 py-0.5 mt-1">{mod.type}</span>}
                          {mod.description && <p className="text-xs text-[var(--eds-text-tertiary)] mt-1 leading-relaxed">{mod.description}</p>}
                          {mod.adaptationNotes && (
                            <p className="text-xs text-[var(--eds-status-amber)] mt-1"><span className="font-medium">Anpassung:</span> {mod.adaptationNotes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exercises.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-exercises">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Empfohlene Übungen ({exercises.length})</p>
                <div className="space-y-2">
                  {exercises.map((ex: ProposalExercise, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)]">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--eds-text-primary)]">{ex.name || ex.title || ""}</p>
                        {ex.type && <span className="inline-block text-[10px] font-medium text-brand-blue bg-brand-blue/10 rounded px-1.5 py-0.5 mt-1">{ex.type}</span>}
                        {ex.description && <p className="text-xs text-[var(--eds-text-tertiary)] mt-1">{ex.description}</p>}
                      </div>
                      {ex.duration && <span className="text-xs text-[var(--eds-text-disabled)] shrink-0">{ex.duration} Min.</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {observers.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-observers">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Beobachter-Empfehlungen</p>
                <div className="space-y-1.5">
                  {observers.map((obs: ProposalPerson | string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--eds-text-primary)] p-2 rounded-lg bg-[var(--eds-bg-sunken)]">
                      <svg className="w-4 h-4 text-[var(--eds-text-disabled)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      <span>{typeof obs === "string" ? obs : (obs.role || obs.name || JSON.stringify(obs))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timeline.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-5" data-testid="section-analysis-timeline">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase mb-3">Zeitplan-Empfehlung</p>
                <div className="space-y-2">
                  {timeline.map((t: ProposalTimelineItem, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-[var(--eds-bg-sunken)]">
                      <span className="w-16 shrink-0 text-xs font-medium text-brand-navy">{t.time || t.start || ""}</span>
                      <span className="text-[var(--eds-text-primary)]">{t.activity || t.label || t.description || (typeof t === "string" ? t : "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.summary && (
              <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl p-5" data-testid="text-analysis-summary">
                <p className="text-[10px] font-bold tracking-widest text-[var(--eds-status-amber)] uppercase mb-2">Zusammenfassung &amp; Empfehlung</p>
                <p className="text-sm text-[var(--eds-status-amber)] leading-relaxed whitespace-pre-line">{p.summary}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-[var(--eds-text-disabled)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              <span>KI-generierte Analyse — &laquo;{linkedAnalysis.title}&raquo; · {new Date(linkedAnalysis.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>
        );
      })()}
    </>
  );
}
