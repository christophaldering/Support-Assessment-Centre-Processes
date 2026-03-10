"use client";

import Link from "next/link";
import {
  FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen,
  Clock, CheckCircle2, Star, Sparkles, Download, File, ShieldAlert,
  ChevronRight
} from "lucide-react";

const typeIcons: Record<string, typeof FileText> = {
  memo: ClipboardList,
  note: FileText,
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

const typeLabels: Record<string, string> = {
  memo: "Memo",
  note: "Dokument",
  report: "Bericht",
  email: "E-Mail",
  analysis: "Analyse",
  survey: "Umfrage",
  briefing: "Briefing",
  minutes: "Protokoll",
  article: "Artikel",
  pdf: "PDF",
  presentation: "Präsentation",
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
  confidentialityLabel?: string | null;
  sourceLabel?: string | null;
}

interface DataRoomDocumentCardProps {
  document: DataRoomDocumentData;
}

export default function DataRoomDocumentCard({ document }: DataRoomDocumentCardProps) {
  const docType = document.documentType || "report";
  const Icon = typeIcons[docType] || FileText;
  const catColor = document.categoryColor || "#6b7280";
  const isConfidential = !!document.confidentialityLabel;
  const typeLabel = typeLabels[docType] || docType.charAt(0).toUpperCase() + docType.slice(1);

  return (
    <Link
      href={`/candidate/data-room/${document.slug}`}
      className="group relative block bg-white rounded-2xl border border-gray-100/80 overflow-hidden hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-500 ease-out"
      data-testid={`card-document-${document.slug}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 group-hover:w-1.5"
        style={{ backgroundColor: catColor }}
      />

      {isConfidential && (
        <div className="absolute top-0 right-0" data-testid={`badge-confidential-${document.slug}`}>
          <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
            <ShieldAlert className="w-3 h-3" />
            {document.confidentialityLabel}
          </div>
        </div>
      )}

      <div className="pl-5 pr-5 py-5">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundColor: `${catColor}12`, color: catColor }}
          >
            <Icon className="w-5 h-5" strokeWidth={1.8} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1.5">
              <h3 className="text-[15px] font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors line-clamp-2">
                {document.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {document.isImportant && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60 shadow-sm"
                  data-testid={`badge-important-${document.slug}`}
                >
                  <Star className="w-3 h-3" fill="currentColor" />
                  Wichtig
                </span>
              )}
              {document.isNew && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 shadow-sm"
                  data-testid={`badge-new-${document.slug}`}
                >
                  <Sparkles className="w-3 h-3" />
                  Neu
                </span>
              )}
              {document.viewed && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"
                  data-testid={`badge-viewed-${document.slug}`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Gelesen
                </span>
              )}
            </div>

            {document.shortDescription && (
              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {document.shortDescription}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: `${catColor}08`, color: catColor, border: `1px solid ${catColor}20` }}
                >
                  <Icon className="w-3 h-3" strokeWidth={2} />
                  {typeLabel}
                </span>

                {document.readingTime && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <Clock className="w-3 h-3" />
                    {document.readingTime} Min.
                  </span>
                )}

                {document.hasFile && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <Download className="w-3 h-3" />
                    PDF
                  </span>
                )}
              </div>

              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
