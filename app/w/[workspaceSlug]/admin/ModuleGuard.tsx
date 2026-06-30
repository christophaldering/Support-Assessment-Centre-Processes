"use client";

import Link from "next/link";

interface Props {
  released: boolean;
  isAdmin: boolean;
  moduleName: string;
  workspaceSlug: string;
  children: React.ReactNode;
}

export default function ModuleGuard({ released, isAdmin, moduleName, workspaceSlug, children }: Props) {
  if (released || isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--eds-bg-sunken)] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--eds-text-primary)] mb-2">{moduleName}</h1>
        <p className="text-sm text-[var(--eds-text-secondary)] mb-6">
          Dieses Modul wird gerade vorbereitet und ist noch nicht freigegeben.
          Sie werden benachrichtigt, sobald es verfügbar ist.
        </p>
        <Link
          href={`/w/${workspaceSlug}/admin`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-brand-navy hover:opacity-90 transition"
          data-testid="link-back-dashboard"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
