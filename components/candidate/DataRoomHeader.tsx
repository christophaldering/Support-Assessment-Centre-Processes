"use client";

import { useState, useEffect } from "react";
import { Search, FolderOpen, Loader2 } from "lucide-react";

interface DataRoomHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function DataRoomHeader({ searchQuery, onSearchChange }: DataRoomHeaderProps) {
  const [stats, setStats] = useState<{ total: number; viewed: number; remaining: number } | null>(null);

  useEffect(() => {
    fetch("/api/candidate-portal/data-room/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight" data-testid="text-data-room-title">
            Data Room
          </h1>
        </div>
      </div>
      <p className="text-[15px] text-gray-400 leading-relaxed max-w-2xl mt-2 mb-6" data-testid="text-data-room-subtitle">
        Alle Fallmaterialien für Ihr Executive Assessment.
        Sichten Sie die Dokumente nach Kategorien, um Ihre strategische Analyse vorzubereiten.
      </p>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Dokumente durchsuchen…"
            className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all placeholder:text-gray-300"
            data-testid="input-search-documents"
          />
        </div>
        <div
          className="text-[13px] text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2.5 tabular-nums"
          data-testid="text-viewed-count"
        >
          {stats ? (
            <>
              <span className="font-medium text-gray-700">{stats.viewed}</span> / {stats.total} Dokumente gelesen
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Wird geladen…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
