"use client";

import Link from "next/link";
import { FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen, Clock, CheckCircle2, Star } from "lucide-react";
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

interface DataRoomDocumentCardProps {
  document: DataRoomDocument;
  isViewed: boolean;
}

export default function DataRoomDocumentCard({ document, isViewed }: DataRoomDocumentCardProps) {
  const Icon = typeIcons[document.type] || FileText;
  const colorClass = typeColors[document.type] || "bg-gray-50 text-gray-600";

  return (
    <Link
      href={`/candidate/data-room/${document.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
      data-testid={`card-document-${document.slug}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors truncate">
              {document.title}
            </h3>
            {document.isImportant && (
              <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {document.shortDescription}
          </p>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
              {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {document.readingTime} min
            </span>
            {isViewed && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium" data-testid={`badge-viewed-${document.slug}`}>
                <CheckCircle2 className="w-3 h-3" />
                Viewed
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
