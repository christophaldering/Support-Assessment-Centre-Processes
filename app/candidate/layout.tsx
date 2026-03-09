"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CandidateSession {
  userId: string;
  email: string;
  name: string;
  workspaceSlug: string;
  assessmentId: string | null;
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<CandidateSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/candidate-portal/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.replace("/candidate-access");
        } else {
          setSession(data.user);
        }
      })
      .catch(() => router.replace("/candidate-access"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/candidate-portal/auth/logout", { method: "POST" });
    router.replace("/candidate-access");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/candidate/home" className="flex items-center gap-2" data-testid="link-candidate-home">
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Varexia SE</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[13px] text-gray-500">Candidate Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-gray-500" data-testid="text-candidate-email">{session.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-logout"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
