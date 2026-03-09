"use client";

import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Clock, Star, Sparkles,
  FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen,
  Download, File, ExternalLink
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

export interface DataRoomDocumentDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  textSummary: string | null;
  documentType: string | null;
  category: string | null;
  categoryLabel: string | null;
  categoryLabelEn: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  tags: string[];
  isImportant: boolean;
  isNew: boolean;
  readingTime: number | null;
  pageCount: number | null;
  sourceLabel: string | null;
  confidentialityLabel: string | null;
  hasFile: boolean;
  downloadAllowed: boolean;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  viewed: boolean;
  viewedAt: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
}

interface NavDoc {
  slug: string;
  title: string;
}

interface DataRoomDocumentViewProps {
  document: DataRoomDocumentDetail;
  prevDoc: NavDoc | null;
  nextDoc: NavDoc | null;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataRoomDocumentView({ document, prevDoc, nextDoc }: DataRoomDocumentViewProps) {
  const docType = document.documentType || "report";
  const Icon = typeIcons[docType] || FileText;
  const catColor = document.categoryColor || "#6b7280";

  const handleDownload = () => {
    window.open(`/api/candidate-portal/data-room/documents/${document.slug}/file`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/candidate/data-room"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors mb-8 group"
        data-testid="link-back-to-data-room"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Zurück zum Data Room
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${catColor}15`, color: catColor }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {document.categoryLabel && (
                <span
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${catColor}10`, color: catColor }}
                >
                  {document.categoryLabel}
                </span>
              )}
              {docType && (
                <span className="text-[11px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-50">
                  {docType.charAt(0).toUpperCase() + docType.slice(1)}
                </span>
              )}
              {document.confidentialityLabel && (
                <span className="text-[10px] font-medium text-red-500 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
                  {document.confidentialityLabel}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight leading-tight mb-2" data-testid="text-document-title">
            {document.title}
          </h1>

          {document.shortDescription && (
            <p className="text-[14px] text-gray-500 leading-relaxed mb-3">
              {document.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {document.readingTime && (
              <span className="inline-flex items-center gap-1 text-[12px] text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {document.readingTime} Min. Lesezeit
              </span>
            )}
            {document.pageCount && (
              <span className="text-[12px] text-gray-400">
                {document.pageCount} Seiten
              </span>
            )}
            {document.sourceLabel && (
              <span className="text-[12px] text-gray-400">
                Quelle: {document.sourceLabel}
              </span>
            )}
            {document.isImportant && (
              <span className="inline-flex items-center gap-1 text-[12px] text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5" fill="currentColor" />
                Wichtiges Dokument
              </span>
            )}
            {document.isNew && (
              <span className="inline-flex items-center gap-1 text-[12px] text-blue-500 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Neu
              </span>
            )}
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {document.tags.map((tag, i) => (
                <span key={i} className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {document.hasFile && document.downloadAllowed && (
          <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <File className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700">
                  {document.fileName || "Datei herunterladen"}
                </p>
                {document.fileSize && (
                  <p className="text-[11px] text-gray-400">
                    {formatFileSize(document.fileSize)}
                    {document.mimeType && ` · ${document.mimeType.split("/").pop()?.toUpperCase()}`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:shadow-sm transition-all duration-200"
              data-testid="button-download-file"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        )}

        <div className="px-8 py-8">
          {document.textSummary ? (
            <div className="prose prose-sm prose-gray max-w-none" data-testid="text-document-body">
              {document.textSummary.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-[14px] text-gray-700 leading-relaxed mb-4 last:mb-0 whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : document.description ? (
            <div className="prose prose-sm prose-gray max-w-none" data-testid="text-document-body">
              {document.description.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-[14px] text-gray-700 leading-relaxed mb-4 last:mb-0 whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-document-body">
              <File className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] text-gray-400">
                Dieses Dokument enthält keinen Textinhalt.
              </p>
              {document.hasFile && (
                <p className="text-[13px] text-gray-400 mt-1">
                  Bitte laden Sie die Datei herunter, um den Inhalt einzusehen.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 gap-4">
        {prevDoc ? (
          <Link
            href={`/candidate/data-room/${prevDoc.slug}`}
            className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-700 transition-colors group"
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
            className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-700 transition-colors group text-right"
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
