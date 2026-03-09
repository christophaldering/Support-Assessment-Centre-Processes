"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Presentation, MessageSquare, FolderOpen, ArrowRight } from "lucide-react";

interface CandidateSession {
  email: string;
  name: string;
}

const modules = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Overview of the assessment process, exercise structure, and evaluation criteria.",
    href: "/candidate/welcome",
    icon: BookOpen,
    status: "Available",
  },
  {
    id: "presentation",
    title: "Presentation Task",
    description: "Prepare a strategic analysis and turnaround recommendation for the Supervisory Board.",
    href: "/candidate/presentation",
    icon: Presentation,
    status: "Available",
  },
  {
    id: "conversation",
    title: "Simulated Employee Conversation",
    description: "Conduct a structured leadership dialogue with a senior stakeholder.",
    href: "/candidate/conversation",
    icon: MessageSquare,
    status: "Available",
  },
  {
    id: "data-room",
    title: "Data Room",
    description: "Access all case materials including financials, internal communications, and analyst reports.",
    href: "/candidate/data-room",
    icon: FolderOpen,
    status: "Available",
  },
];

export default function CandidateHomePage() {
  const [session, setSession] = useState<CandidateSession | null>(null);

  useEffect(() => {
    fetch("/api/candidate-portal/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.user && setSession(data.user));
  }, []);

  const displayName = session?.name || session?.email?.split("@")[0] || "Candidate";

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-[32px] font-semibold text-gray-900 tracking-tight mb-3" data-testid="text-welcome-heading">
          Welcome, {displayName}
        </h1>
        <p className="text-[17px] text-gray-500 leading-relaxed max-w-2xl" data-testid="text-orientation">
          This portal contains all materials and exercises for your executive assessment at Varexia SE.
          Please review each module at your own pace.
        </p>
      </div>

      <div className="grid gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className="group flex items-center gap-5 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200"
              data-testid={`card-module-${mod.id}`}
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[15px] font-semibold text-gray-900">{mod.title}</h2>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" data-testid={`badge-status-${mod.id}`}>
                    {mod.status}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed">{mod.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
