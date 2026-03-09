"use client";

import Link from "next/link";
import {
  FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen,
  Clock, CheckCircle2, Star, Sparkles, Download, File
} from "lucide-react";

const typeIcons: Record<string, typeof FileText> = {
  memo: ClipboardList,
  report: FileText,
  email: Mail,
  analysis: BarChart3,
  survey: ClipboardList,
  briefing: BookOpen,
  minutes: ClipboardList,
  article: Newspaper,
  pdf: File,
  presentation: FileText,
};

export interface DataRoomDocumentData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  documentType: string | null;
  category: string | null;
  categoryLabel: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  tags: string[];
  isImportant: boolean;
  isNew: boolean;
  readingTime: number | null;
  viewed: boolean;
  hasFile?: boolean;
  hasTextSummary?: boolean;
  sortOrder?: number;
  viewedAt?: string | null;
  lastOpenedAt?: string | null;
}

interface DataRoomDocumentCardProps {
  document: DataRoomDocumentData;
}

export default function DataRoomDocumentCard({ document }: DataRoomDocumentCardProps) {
  const docType = document.documentType || "report";
  const Icon = typeIcons[docType] || FileText;
  const catColor = document.categoryColor || "#6b7280";

  return (
    <Link
      href={`/candidate/data-room/${document.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 hover:-translate-y-[1px] transition-all duration-300"
      data-testid={`card-document-${document.slug}`}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${catColor}10`, color: catColor }}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors truncate">
              {document.title}
            </h3>
            {document.isImportant && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 flex-shrink-0 border border-amber-100" data-testid={`badge-important-${document.slug}`}>
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                Wichtig
              </span>
            )}
            {document.isNew && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 flex-shrink-0 border border-blue-100" data-testid={`badge-new-${document.slug}`}>
                <Sparkles className="w-2.5 h-2.5" />
                Neu
              </span>
            )}
          </div>
          {document.shortDescription && (
            <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {document.shortDescription}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {document.categoryLabel && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${catColor}10`, color: catColor }}
              >
                {document.categoryLabel}
              </span>
            )}
            {docType && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                {docType.charAt(0).toUpperCase() + docType.slice(1)}
              </span>
            )}
            {document.readingTime && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="w-3 h-3" />
                {document.readingTime} Min.
              </span>
            )}
            {document.hasFile && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                <Download className="w-3 h-3" />
              </span>
            )}
            {document.viewed && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium" data-testid={`badge-viewed-${document.slug}`}>
                <CheckCircle2 className="w-3 h-3" />
                Gelesen
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
