import Link from "next/link";

const features = [
  {
    title: "Competency-Based Evaluation",
    desc: "Flexible competency hierarchies with configurable scales, behavioral anchors, weighted dimensions, and structured exercise mapping.",
  },
  {
    title: "Structured Observation",
    desc: "Offline-capable observer portal with exercise × competency rating matrix, evidence capture, and real-time sync.",
  },
  {
    title: "AI-Augmented Analysis",
    desc: "Intelligent assistance for competency model generation, transcription, structured summaries, and data-driven recommendations.",
  },
  {
    title: "Enterprise-Grade Reporting",
    desc: "Automated PDF, DOCX & PPTX reports with competency profiles, cross-candidate benchmarking, and AI-labeled insights.",
  },
  {
    title: "Audit & Compliance",
    desc: "Complete audit trails, versioned data, GDPR consent management, and full transparency on AI-generated content.",
  },
  {
    title: "Role-Based Portals",
    desc: "Dedicated views for Admin, Moderator, Observer, Project Assistant, HR Client, and Candidate — each tailored to their workflow.",
  },
];

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
            className="text-xs font-medium text-slate-300 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-colors"
          >
            Administrator Access
          </Link>
        </div>
      </header>

      <section className="bg-brand-navy text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Executive Diagnostics Suite{" "}
            <span className="text-blue-300">– Intelligent by Design</span>
          </h1>
          <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            The secure, multi-tenant platform for Top-Executive Assessment Centers / an integrated platform for high-stakes executive assessment.
          </p>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
            Competency-based evaluation, structured observation, AI-augmented analysis, and enterprise-grade reporting — seamlessly connected in one secure ecosystem.
          </p>
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
