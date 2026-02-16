"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: string[];
  forcePasswordChange: boolean;
  workspaceSlug: string;
  workspaceName: string;
  assessmentId: string | null;
}

export default function CandidateAssessmentPortal() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.push(`/w/${workspaceSlug}/login`);
          return;
        }
        const data = await res.json();
        if (data.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
          return;
        }
        if (!data.roles.includes("CANDIDATE")) {
          router.push(`/w/${workspaceSlug}/admin`);
          return;
        }
        setUser(data);
      })
      .catch(() => router.push(`/w/${workspaceSlug}/login`))
      .finally(() => setLoading(false));
  }, [router, workspaceSlug]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/w/${workspaceSlug}/login`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400">Laden…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight">
            {user.workspaceName}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/70">{user.name}</span>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy mb-1">Willkommen, {user.name}</h1>
          <p className="text-sm text-slate-500">Ihr Assessment-Portal</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-brand-navy mb-2">Assessment-Bereich</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Hier werden Ihre zugewiesenen Assessments und Aufgaben angezeigt.
              Dieser Bereich wird in einer zukünftigen Phase ausgebaut.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/w/${workspaceSlug}/change-password`}
            className="text-sm text-slate-400 hover:text-brand-blue transition-colors"
          >
            Passwort ändern
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
