"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Clock, Star, Sparkles,
  FileText, Mail, BarChart3, ClipboardList, Newspaper, BookOpen,
  Download, File, Shield, ChevronRight, Eye, FileType, Maximize2, Minimize2
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

type ParsedBlock =
  | { type: "heading"; text: string; level: 1 | 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "metadata"; pairs: { key: string; value: string }[] }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

function parseTextContent(raw: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "===") {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    const metaPairs: { key: string; value: string }[] = [];
    let j = i;
    while (j < lines.length) {
      const ml = lines[j]?.trim();
      if (!ml) break;
      const metaMatch = ml.match(/^(Von|An|Datum|Date|From|To|Betreff|Subject|CC|BCC|Cc|Bcc|Abteilung|Department|Verfasser|Author|Ort|Location|Zeit|Time|Protokollant|Teilnehmer|Participants|Anwesend|Present)\s*:\s*(.+)$/i);
      if (metaMatch) {
        metaPairs.push({ key: metaMatch[1]!, value: metaMatch[2]! });
        j++;
      } else {
        break;
      }
    }
    if (metaPairs.length >= 2) {
      blocks.push({ type: "metadata", pairs: metaPairs });
      i = j;
      continue;
    }

    const bulletItems: string[] = [];
    j = i;
    while (j < lines.length) {
      const bl = lines[j]?.trim();
      if (!bl) break;
      if (/^[•\-–—]\s+/.test(bl)) {
        bulletItems.push(bl.replace(/^[•\-–—]\s+/, ""));
        j++;
      } else if (bulletItems.length > 0 && /^\s{2,}/.test(lines[j]!) && bl) {
        bulletItems[bulletItems.length - 1] += " " + bl;
        j++;
      } else {
        break;
      }
    }
    if (bulletItems.length >= 1) {
      blocks.push({ type: "bullet-list", items: bulletItems });
      i = j;
      continue;
    }

    const tableRows: string[][] = [];
    j = i;
    while (j < lines.length) {
      const tl = lines[j]?.trim();
      if (!tl) break;
      if (tl.includes("|") || tl.includes("\t")) {
        const sep = tl.includes("|") ? "|" : "\t";
        const cells = tl.split(sep).map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
        if (cells.length >= 2) {
          tableRows.push(cells);
          j++;
          continue;
        }
      }
      if (/^[\-:| ]+$/.test(tl)) {
        j++;
        continue;
      }
      break;
    }
    if (tableRows.length >= 2) {
      blocks.push({ type: "table", rows: tableRows });
      i = j;
      continue;
    }

    const kvRows: string[][] = [];
    j = i;
    while (j < lines.length) {
      const kl = lines[j]?.trim();
      if (!kl) break;
      const kvMatch = kl.match(/^(.+?):\s+(.+)$/);
      if (kvMatch && kvMatch[1]!.length < 40 && !kvMatch[1]!.includes(".")) {
        kvRows.push([kvMatch[1]!, kvMatch[2]!]);
        j++;
      } else {
        break;
      }
    }
    if (kvRows.length >= 3) {
      blocks.push({ type: "table", rows: kvRows });
      i = j;
      continue;
    }

    if (
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 3 &&
      trimmed.length < 80 &&
      !/[.!?;,]$/.test(trimmed) &&
      /[A-ZÄÖÜß]/.test(trimmed)
    ) {
      blocks.push({ type: "heading", text: trimmed, level: 1 });
      i++;
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
    if (
      numberedMatch &&
      trimmed.length < 100 &&
      !/[.!?]$/.test(numberedMatch[2]!)
    ) {
      blocks.push({ type: "heading", text: trimmed, level: 2 });
      i++;
      continue;
    }

    if (
      trimmed.length < 80 &&
      !/[.!?;,]$/.test(trimmed) &&
      !trimmed.includes(":") &&
      (i === 0 || !lines[i - 1]?.trim()) &&
      (i + 1 >= lines.length || !lines[i + 1]?.trim() || /^[•\-–—\d]/.test(lines[i + 1]?.trim() || ""))
    ) {
      blocks.push({ type: "heading", text: trimmed, level: 2 });
      i++;
      continue;
    }

    let paraLines: string[] = [trimmed];
    j = i + 1;
    while (j < lines.length) {
      const pl = lines[j]!;
      const pt = pl.trim();
      if (!pt) break;
      if (/^[•\-–—]\s+/.test(pt)) break;
      if (pt === pt.toUpperCase() && pt.length > 3 && pt.length < 80 && /[A-ZÄÖÜß]/.test(pt)) break;
      if (/^\d+\.\s+/.test(pt) && pt.length < 100) break;
      if (pt.includes("|") || pt.includes("\t")) break;
      paraLines.push(pt);
      j++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    i = j;
  }

  return blocks;
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

function RenderBlock({ block, catColor }: { block: ParsedBlock; catColor: string }) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) {
        return (
          <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mt-10 mb-4 pb-2 border-b border-gray-100">
            {block.text}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3 className="text-[17px] font-semibold text-gray-800 tracking-tight mt-8 mb-3">
            {block.text}
          </h3>
        );
      }
      return (
        <h4 className="text-[15px] font-semibold text-gray-700 mt-6 mb-2">
          {block.text}
        </h4>
      );

    case "paragraph":
      return (
        <p className="text-[15.5px] text-gray-700 leading-[1.85] mb-5 font-[Georgia,_'Times_New_Roman',_serif]">
          <FormattedText text={block.text} />
        </p>
      );

    case "bullet-list":
      return (
        <ul className="mb-6 space-y-2.5 pl-1">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-[15px] text-gray-700 leading-[1.75] font-[Georgia,_'Times_New_Roman',_serif]">
              <span
                className="mt-[10px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: catColor }}
              />
              <span><FormattedText text={item} /></span>
            </li>
          ))}
        </ul>
      );

    case "metadata":
      return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 mb-6 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {block.pairs.map((pair, idx) => (
              <div key={idx} className="flex px-5 py-2.5">
                <span className="text-[13px] font-medium text-gray-500 w-28 flex-shrink-0">{pair.key}</span>
                <span className="text-[13.5px] text-gray-800 font-medium">{pair.value}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "table":
      return (
        <div className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor: `${catColor}08` }}>
                {block.rows[0]!.map((cell, ci) => (
                  <th key={ci} className="px-4 py-3 text-left font-semibold text-gray-700 text-[12.5px] uppercase tracking-wide">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {block.rows.slice(1).map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2.5 text-gray-700 ${ci === 0 ? "font-medium" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "divider":
      return <hr className="border-gray-100 my-8" />;

    default:
      return null;
  }
}

export default function DataRoomDocumentView({ document, prevDoc, nextDoc }: DataRoomDocumentViewProps) {
  const docType = document.documentType || "report";
  const Icon = typeIcons[docType] || FileText;
  const catColor = document.categoryColor || "#6b7280";

  const hasPdf = document.hasFile && document.mimeType === "application/pdf";
  const hasText = !!(document.textSummary || document.description);

  const [viewMode, setViewMode] = useState<"pdf" | "text">(hasPdf ? "pdf" : "text");
  const [expanded, setExpanded] = useState(false);
  const [pdfDirectUrl, setPdfDirectUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(hasPdf);

  const fileApiUrl = `/api/candidate-portal/data-room/documents/${document.slug}/file`;

  useEffect(() => {
    if (!hasPdf) return;
    setPdfLoading(true);
    setPdfDirectUrl(null);
    fetch(`${fileApiUrl}?url=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.url) setPdfDirectUrl(data.url);
      })
      .catch(() => {})
      .finally(() => setPdfLoading(false));
  }, [hasPdf, fileApiUrl]);

  const parsedBlocks = useMemo(() => {
    const raw = document.textSummary || document.description || "";
    if (!raw) return [];
    return parseTextContent(raw);
  }, [document.textSummary, document.description]);

  const handleDownload = () => {
    window.open(fileApiUrl, "_blank");
  };

  return (
    <div style={{ animation: "fadeInUp 0.4s ease-out both" }}>
      <div
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-100"
        data-testid="breadcrumb-navigation"
      >
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2 text-[13px]">
          <Link
            href="/candidate/data-room"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            data-testid="link-back-to-data-room"
          >
            Data Room
          </Link>
          {document.categoryLabel && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-400">{document.categoryLabel}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-gray-700 font-medium truncate max-w-[300px]">{document.title}</span>
        </div>
      </div>

      {document.confidentialityLabel && (
        <div
          className="bg-red-50 border-b border-red-100"
          data-testid="banner-confidential"
        >
          <div className="max-w-4xl mx-auto px-6 py-2.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-[12.5px] font-semibold text-red-600 uppercase tracking-wider">
              {document.confidentialityLabel}
            </span>
            <span className="text-[12px] text-red-400 ml-1">
              — Dieses Dokument ist vertraulich und nur für autorisierte Personen bestimmt.
            </span>
          </div>
        </div>
      )}

      <div className={expanded ? "px-4 pt-4 pb-16" : "max-w-4xl mx-auto px-6 pt-10 pb-16"}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/80">
          <div className="relative">
            <div
              className="absolute top-0 left-0 w-1.5 h-full rounded-l-2xl"
              style={{ backgroundColor: catColor }}
            />

            <div className="px-10 pt-10 pb-7 border-b border-gray-50">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${catColor}15`, color: catColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {document.categoryLabel && (
                    <span
                      className="text-[11.5px] font-medium px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${catColor}12`, color: catColor }}
                      data-testid="badge-category"
                    >
                      {document.categoryLabel}
                    </span>
                  )}
                  {docType && (
                    <span className="text-[11px] text-gray-400 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                      {docType.charAt(0).toUpperCase() + docType.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              <h1
                className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight mb-3"
                data-testid="text-document-title"
              >
                {document.title}
              </h1>

              {document.shortDescription && (
                <p className="text-[15px] text-gray-500 leading-relaxed mb-4 font-[Georgia,_'Times_New_Roman',_serif]">
                  {document.shortDescription}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {document.readingTime && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
                    data-testid="pill-reading-time"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {document.readingTime} Min. Lesezeit
                  </span>
                )}
                {document.pageCount && (
                  <span className="text-[12px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    {document.pageCount} Seiten
                  </span>
                )}
                {document.sourceLabel && (
                  <span className="text-[12px] text-gray-400">
                    Quelle: {document.sourceLabel}
                  </span>
                )}
                {document.isImportant && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100"
                    data-testid="badge-important"
                  >
                    <Star className="w-3.5 h-3.5" fill="currentColor" />
                    Wichtig
                  </span>
                )}
                {document.isNew && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100"
                    data-testid="badge-new"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Neu
                  </span>
                )}
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                  {document.tags.map((tag, i) => (
                    <span key={i} className="text-[10.5px] text-gray-400 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(hasPdf && hasText) && (
            <div className="px-10 py-3 bg-gray-50/40 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("pdf")}
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "pdf"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid="button-view-pdf"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Dokument
                </button>
                <button
                  onClick={() => setViewMode("text")}
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "text"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid="button-view-text"
                >
                  <FileType className="w-3.5 h-3.5" />
                  Textansicht
                </button>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === "pdf" && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-all"
                    data-testid="button-toggle-expand"
                  >
                    {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {expanded ? "Verkleinern" : "Vergrößern"}
                  </button>
                )}
                {document.downloadAllowed && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md"
                    data-testid="button-download-file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
              </div>
            </div>
          )}

          {(!hasPdf || !hasText) && document.hasFile && document.downloadAllowed && (
            <div className="px-10 py-4 bg-gray-50/40 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
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
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md"
                data-testid="button-download-file"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          )}

          {hasPdf && viewMode === "pdf" ? (
            <div className="relative" data-testid="pdf-viewer-container">
              {pdfLoading ? (
                <div className={`w-full flex items-center justify-center ${expanded ? "h-[calc(100vh-200px)]" : "h-[700px]"}`}>
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[13px] text-gray-400">PDF wird geladen…</p>
                  </div>
                </div>
              ) : pdfDirectUrl ? (
                <iframe
                  src={`${pdfDirectUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  className={`w-full border-0 ${expanded ? "h-[calc(100vh-200px)]" : "h-[700px]"}`}
                  title={document.title}
                  data-testid="pdf-viewer-iframe"
                />
              ) : (
                <div className={`w-full flex items-center justify-center ${expanded ? "h-[calc(100vh-200px)]" : "h-[700px]"}`}>
                  <div className="text-center">
                    <File className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-[13px] text-gray-400 mb-2">PDF konnte nicht geladen werden</p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Stattdessen herunterladen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-10 py-10">
              {parsedBlocks.length > 0 ? (
                <div data-testid="text-document-body">
                  {parsedBlocks.map((block, i) => (
                    <RenderBlock key={i} block={block} catColor={catColor} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="text-document-body">
                  <File className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-[15px] text-gray-400">
                    Dieses Dokument enthält keinen Textinhalt.
                  </p>
                  {document.hasFile && (
                    <p className="text-[13px] text-gray-400 mt-2">
                      Bitte laden Sie die Datei herunter, um den Inhalt einzusehen.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-10 gap-4">
          {prevDoc ? (
            <Link
              href={`/candidate/data-room/${prevDoc.slug}`}
              className="flex items-center gap-3 text-[13px] text-gray-400 hover:text-gray-700 transition-all duration-200 group bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-md hover:border-gray-200"
              data-testid="link-prev-document"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <div className="text-left">
                <span className="text-[11px] text-gray-300 block">Vorheriges</span>
                <span className="truncate max-w-[200px] block text-gray-600 font-medium">{prevDoc.title}</span>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextDoc ? (
            <Link
              href={`/candidate/data-room/${nextDoc.slug}`}
              className="flex items-center gap-3 text-[13px] text-gray-400 hover:text-gray-700 transition-all duration-200 group bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-md hover:border-gray-200 text-right"
              data-testid="link-next-document"
            >
              <div className="text-right">
                <span className="text-[11px] text-gray-300 block">Nächstes</span>
                <span className="truncate max-w-[200px] block text-gray-600 font-medium">{nextDoc.title}</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
