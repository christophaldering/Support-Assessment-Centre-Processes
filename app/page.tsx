import Link from "next/link";
import WorkspaceEntry from "./components/WorkspaceEntry";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight">
            Executive Diagnostics Suite
          </span>
          <Link
            href="/admin/login"
            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
            data-testid="link-admin-access"
          >
            Plattform-Administration
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-brand-navy text-white py-28">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight" data-testid="text-hero-title">
            Executive Diagnostics Suite{" "}
            <span className="text-blue-300">– Intelligent by Design</span>
          </h1>
          <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subheadline">
            Redefining how strategic leadership decisions are designed, evaluated, and governed.
          </p>

          <div className="max-w-xl mx-auto space-y-3 text-left">
            <p className="text-slate-400 text-sm flex items-start gap-3">
              <span className="text-brand-blue mt-0.5 shrink-0">•</span>
              From static assessments to adaptive diagnostic architectures
            </p>
            <p className="text-slate-400 text-sm flex items-start gap-3">
              <span className="text-brand-blue mt-0.5 shrink-0">•</span>
              From fragmented tools to an integrated intelligence system
            </p>
            <p className="text-slate-400 text-sm flex items-start gap-3">
              <span className="text-brand-blue mt-0.5 shrink-0">•</span>
              From documentation to defensible executive judgment
            </p>
          </div>

          <div className="pt-4 space-y-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Workspace-Zugang
            </p>
            <WorkspaceEntry />
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center" data-testid="text-vision-headline">
            A New Standard for Executive Diagnostics
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <p>
              Leadership decisions shape enterprise trajectory.<br />
              Yet the systems behind executive assessment have remained largely static.
            </p>
            <p>
              The Executive Diagnostics Suite introduces a dynamic diagnostic architecture —
              where requirement analysis, competency modeling, assessment design, observation, and reporting are structurally interconnected.
            </p>
            <p>
              AI does not replace judgment.<br />
              It enhances clarity, structural coherence, and analytical depth.
            </p>
            <p className="font-medium text-brand-navy">
              This is not digitization of existing practice.<br />
              It is architectural transformation.
            </p>
          </div>
        </div>
      </section>

      {/* ── INNOVATION ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center mb-16" data-testid="text-innovation-headline">
            Innovation at the Core
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-5">
              <div className="h-1 w-10 bg-brand-blue rounded-full" />
              <h3 className="text-lg font-semibold text-brand-navy" data-testid="text-feature-assessment">
                Dynamic Assessment Architecture
              </h3>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Requirement analysis is no longer a separate document.
                  Its results directly configure the assessment architecture.
                </p>
                <p>
                  Validated modules are selected and assembled in alignment with DIN 33430 principles.
                  Competencies, weighting, scales, and behavioral anchors are systemically linked.
                </p>
                <p className="font-medium text-brand-navy">
                  Assessment design becomes adaptive — not static.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="h-1 w-10 bg-brand-blue rounded-full" />
              <h3 className="text-lg font-semibold text-brand-navy" data-testid="text-feature-context">
                Context-Aware Exercise Adaptation
              </h3>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Exercises adjust to industry context, strategic complexity, leadership level, and candidate experience.
                </p>
                <p>
                  Scenario framing, challenge intensity, and evaluation criteria can be recalibrated —
                  while maintaining methodological integrity.
                </p>
                <p className="font-medium text-brand-navy">
                  This enables diagnostics that reflect real organizational reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center" data-testid="text-ai-headline">
            Intelligence Embedded — At Your Discretion
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-600 leading-relaxed text-center">
            AI support spans the full diagnostic lifecycle:
          </p>
          <div className="max-w-lg mx-auto space-y-2.5">
            {[
              "Structuring requirement input",
              "Competency clustering",
              "Assessment configuration proposals",
              "Transcript structuring",
              "Pattern detection",
              "Narrative synthesis",
            ].map((item) => (
              <p key={item} className="text-slate-600 text-sm flex items-start gap-3">
                <span className="text-brand-blue mt-0.5 shrink-0">•</span>
                {item}
              </p>
            ))}
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed text-center pt-4">
            <p>AI remains configurable per project and fully reviewable.</p>
            <p>All outputs remain under expert supervision.</p>
            <p className="font-medium text-brand-navy">
              Judgment is strengthened — not automated.
            </p>
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center" data-testid="text-governance-headline">
            Governance Built In — Not Added Later
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-600 leading-relaxed text-center">
            Strategic innovation requires regulatory integrity.
          </p>
          <p className="text-slate-600 leading-relaxed text-center">
            The Executive Diagnostics Suite is designed in alignment with:
          </p>
          <div className="max-w-md mx-auto space-y-2.5">
            {[
              "GDPR",
              "European AI Act governance principles",
              "EU data residency standards",
              "Full auditability and traceability",
            ].map((item) => (
              <p key={item} className="text-slate-600 text-sm flex items-start gap-3">
                <span className="text-brand-blue mt-0.5 shrink-0">•</span>
                {item}
              </p>
            ))}
          </div>
          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-brand-navy mb-4">
              Hosting (final production environment)
            </h3>
            <p className="text-sm font-medium text-brand-navy mb-3">Germany-based infrastructure:</p>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-8 text-sm">
              <span className="text-slate-500">Provider</span>
              <span className="text-slate-400 italic">[To be confirmed]</span>
              <span className="text-slate-500">Region</span>
              <span className="text-slate-400 italic">[German Region]</span>
              <span className="text-slate-500">Certification</span>
              <span className="text-slate-400 italic">[ISO 27001 / BSI C5]</span>
              <span className="text-slate-500">Environment</span>
              <span className="text-slate-400 italic">[Azure / AWS / Hybrid]</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOCUMENTATION / GOVERNANCE PACK ── */}
      <section id="governance-pack" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center" data-testid="text-docs-headline">
            Security, Privacy &amp; AI Governance Pack
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-600 leading-relaxed text-center">
            A consolidated documentation set for IT, Security, and Data Protection Officers.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <p className="text-sm font-medium text-brand-navy mb-4">Includes:</p>
            <div className="space-y-2.5">
              {[
                "System architecture overview",
                "Data flow mapping",
                "Encryption standards",
                "Access governance model",
                "Audit logging logic",
                "Retention & deletion policies",
                "AI governance framework (incl. EU AI Act risk classification approach)",
              ].map((item) => (
                <p key={item} className="text-slate-600 text-sm flex items-start gap-3">
                  <span className="text-brand-blue mt-0.5 shrink-0">•</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div className="text-center space-y-3">
            <button
              className="rounded-lg bg-brand-navy text-white font-medium px-6 py-3 text-sm hover:bg-brand-navy/90 transition-colors opacity-60 cursor-not-allowed"
              disabled
              data-testid="button-view-documentation"
            >
              View Documentation
            </button>
            <p className="text-xs text-slate-400 italic">
              Access may require workspace administrator approval or NDA confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="py-24 bg-brand-navy text-white border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-closing-headline">
            Diagnostics Designed for Strategic Consequence
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <div className="space-y-4 text-slate-300 leading-relaxed max-w-xl mx-auto">
            <p>
              When executive decisions shape enterprise direction,<br />
              the underlying diagnostic architecture must be equally robust.
            </p>
            <p className="text-white font-medium">
              The Executive Diagnostics Suite is built for that responsibility.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">
            Executive Diagnostics Suite
          </p>
          <p className="text-xs text-slate-400">
            &copy; Christoph Aldering &middot; Private initiative / concept
          </p>
        </div>
      </footer>
    </div>
  );
}
