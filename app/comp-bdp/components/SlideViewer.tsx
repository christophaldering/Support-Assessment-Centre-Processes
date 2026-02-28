"use client";

import { useState } from "react";

interface Slide {
  title: string;
  body: string;
  kpis?: string[];
}

interface SlideViewerProps {
  slides: Slide[];
  teamName: string;
}

export default function SlideViewer({ slides, teamName }: SlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-black/10 bg-black text-white">
        <span className="text-sm font-bold">{teamName}</span>
        <span className="text-xs text-white/60">{current + 1} / {slides.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 bg-[#FFFBF0]" data-testid="bdp-case-slide">
        <h2 className="text-2xl font-bold mb-6 text-black">{slide.title}</h2>
        <p className="text-sm text-black/80 leading-relaxed mb-6 whitespace-pre-line">{slide.body}</p>
        {slide.kpis && slide.kpis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slide.kpis.map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl px-4 py-3 border border-[#FFD700]/30 shadow-sm">
                <span className="text-sm font-medium text-black">{kpi}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-black/10 bg-white">
        <button
          data-testid="bdp-case-prev"
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-black/5 hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Zurück
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-[#FFD700]" : "bg-black/15 hover:bg-black/25"}`}
            />
          ))}
        </div>

        <button
          data-testid="bdp-case-next"
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FFD700] text-black hover:bg-[#E6C200] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Weiter →
        </button>
      </div>
    </div>
  );
}
