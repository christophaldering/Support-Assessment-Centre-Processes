"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Star, FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen } from "lucide-react";
import type { DataRoomDocument } from "@/lib/candidate-portal/data-room-content";

const typeIcons: Record<string, typeof FileText> = {
  memo: ClipboardList,
  report: FileText,
  email: Mail,
  analysis: BarChart3,
  survey: ClipboardList,
  briefing: BookOpen,
  minutes: ClipboardList,
  article: Newspaper,
};

const typeColors: Record<string, string> = {
  memo: "bg-blue-50 text-blue-600",
  report: "bg-purple-50 text-purple-600",
  email: "bg-amber-50 text-amber-600",
  analysis: "bg-emerald-50 text-emerald-600",
  survey: "bg-pink-50 text-pink-600",
  briefing: "bg-indigo-50 text-indigo-600",
  minutes: "bg-orange-50 text-orange-600",
  article: "bg-cyan-50 text-cyan-600",
};

interface DataRoomDocumentViewProps {
  document: DataRoomDocument;
  prevDoc: DataRoomDocument | null;
  nextDoc: DataRoomDocument | null;
}

export default function DataRoomDocumentView({ document, prevDoc, nextDoc }: DataRoomDocumentViewProps) {
  const Icon = typeIcons[document.type] || FileText;
  const colorClass = typeColors[document.type] || "bg-gray-50 text-gray-600";

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/candidate/data-room"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors mb-8"
        data-testid="link-back-to-data-room"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Data Room
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}>
                {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
              </span>
              <span className="text-[11px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-50">
                {document.category}
              </span>
            </div>
          </div>

          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight leading-tight mb-2" data-testid="text-document-title">
            {document.title}
          </h1>

          <div className="flex items-center gap-4 mt-3">
            <span className="inline-flex items-center gap-1 text-[12px] text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {document.readingTime} min read
            </span>
            {document.isImportant && (
              <span className="inline-flex items-center gap-1 text-[12px] text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5" fill="currentColor" />
                Key Document
              </span>
            )}
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="prose prose-sm prose-gray max-w-none" data-testid="text-document-body">
            {document.body.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-[14px] text-gray-700 leading-relaxed mb-4 last:mb-0 whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 gap-4">
        {prevDoc ? (
          <Link
            href={`/candidate/data-room/${prevDoc.slug}`}
            className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition-colors group"
            data-testid="link-prev-document"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="truncate max-w-[200px]">{prevDoc.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextDoc ? (
          <Link
            href={`/candidate/data-room/${nextDoc.slug}`}
            className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition-colors group text-right"
            data-testid="link-next-document"
          >
            <span className="truncate max-w-[200px]">{nextDoc.title}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
