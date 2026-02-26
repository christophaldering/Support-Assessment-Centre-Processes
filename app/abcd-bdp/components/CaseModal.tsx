"use client";

import { useEffect } from "react";
import SlideViewer from "./SlideViewer";
import { useLanguage } from "@/app/providers/LanguageProvider";

interface CaseModalProps {
  onClose: () => void;
  type: "slides" | "pdf" | "none";
  teamName: string;
  slides?: { title: string; body: string; kpis?: string[] }[];
  pdfUrl?: string;
}

export default function CaseModal({ onClose, type, teamName, slides, pdfUrl }: CaseModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-3 bg-[#0071e3]">
          <h3 className="font-bold text-black text-sm">Business Case — {teamName}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {type === "slides" && slides && (
            <SlideViewer slides={slides} teamName={teamName} />
          )}
          {type === "pdf" && pdfUrl && (
            <iframe src={pdfUrl} className="w-full h-full min-h-[70vh]" title={`Business Case ${teamName}`} />
          )}
          {type === "none" && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              {t("noBusinessCase")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
