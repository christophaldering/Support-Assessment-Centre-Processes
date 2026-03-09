"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Presentation } from "lucide-react";
import { presentationContent } from "@/lib/candidate-portal/content";

export default function CandidatePresentationPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-10" data-testid="breadcrumb-presentation">
        <Link href="/candidate/home" className="hover:text-gray-600 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-600">Presentation Task</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          <Presentation className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight" data-testid="text-presentation-title">
            {presentationContent.title}
          </h1>
          <p className="text-[14px] text-gray-400">{presentationContent.subtitle}</p>
        </div>
      </div>

      <div className="space-y-8">
        {presentationContent.sections.map((section, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-8" data-testid={`section-presentation-${i}`}>
            <h2 className="text-[17px] font-semibold text-gray-900 mb-3">{section.heading}</h2>
            <div className="text-[15px] text-gray-600 leading-relaxed">
              {section.body.split("\n").map((line, j) => {
                if (!line.trim()) return <br key={j} />;
                if (line.startsWith("•")) {
                  return <p key={j} className="ml-4 mb-1">{renderBold(line)}</p>;
                }
                if (/^\d+\./.test(line)) {
                  return <p key={j} className="mb-2">{renderBold(line)}</p>;
                }
                return <p key={j} className="mb-2">{renderBold(line)}</p>;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/candidate/welcome"
          className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-700 transition-colors"
          data-testid="link-back-welcome"
        >
          <ArrowLeft className="w-4 h-4" />
          {presentationContent.backLabel}
        </Link>
        <Link
          href={presentationContent.ctaHref!}
          className="flex items-center gap-2 text-[14px] font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 px-5 py-2.5 rounded-xl transition-colors"
          data-testid="link-cta-data-room"
        >
          {presentationContent.ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/);
  if (parts.length === 1) return text;
  return parts.map((part, k) =>
    k % 2 === 1 ? <strong key={k} className="font-semibold text-gray-800">{part}</strong> : part
  );
}
