import Link from "next/link";

const features = [
  {
    title: "Role-Based Portals",
    desc: "Dedicated views for Admin, Moderator, Observer, Project Assistant, HR Client, and Candidate — each tailored to their workflow.",
  },
  {
    title: "Competency Frameworks",
    desc: "Flexible competency hierarchies with configurable scales, behavioral anchors, and weighted dimensions.",
  },
  {
    title: "Real-Time Observation",
    desc: "Live observer view with competency rating controls, session tracking, and offline-capable data capture.",
  },
  {
    title: "AI-Powered Analysis",
    desc: "Intelligent assistance for evaluation, transcription, and automated report generation.",
  },
  {
    title: "Audit & Compliance",
    desc: "Complete audit trails, versioned data, GDPR consent management, and EU data residency.",
  },
  {
    title: "Advanced Reporting",
    desc: "Automated PDF/DOCX reports with radar charts, cross-candidate benchmarking, and narrative summaries.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight">
            Executive Diagnostics Platform
          </span>
          <Link
            href="/admin/login"
            className="text-xs font-medium text-slate-300 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-colors"
          >
            Administrator Access
          </Link>
        </div>
      </header>

      <section className="bg-brand-navy text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Enterprise-Grade Executive Diagnostics
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            The secure, multi-tenant platform for Executive Assessment Centers. Competency-based
            evaluation, AI-powered analysis, and comprehensive reporting — all in one solution.
          </p>
          <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full" />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-brand-navy text-center mb-12">
            Platform Capabilities
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-slate-100 rounded-xl p-6 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-brand-navy mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-brand-navy">Ready to get started?</h2>
          <p className="text-sm text-slate-500">
            Contact your organization&rsquo;s administrator for workspace access.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">
            Executive Diagnostics Platform
          </p>
          <p className="text-xs text-slate-400">
            &copy; Christoph Aldering &middot; Private initiative / concept
          </p>
        </div>
      </footer>
    </div>
  );
}
