export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <span className="font-serif text-lg font-bold tracking-tight">
            Executive Diagnostics Platform
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <h1 className="text-4xl font-bold text-brand-navy">Phase 0 — Scaffold Ready</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Next.js App Router + Prisma + PostgreSQL. All modules stubbed, design system baseline
            applied.
          </p>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
