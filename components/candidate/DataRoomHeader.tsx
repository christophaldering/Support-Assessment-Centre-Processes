"use client";

import { Search, FolderOpen } from "lucide-react";

interface DataRoomHeaderProps {
  totalDocs: number;
  viewedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function DataRoomHeader({ totalDocs, viewedCount, searchQuery, onSearchChange }: DataRoomHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight" data-testid="text-data-room-title">
            Data Room
          </h1>
        </div>
      </div>
      <p className="text-[15px] text-gray-500 leading-relaxed max-w-2xl mt-2 mb-6" data-testid="text-data-room-subtitle">
        All case materials for your executive assessment at Varexia SE.
        Review documents across categories to build your strategic analysis.
      </p>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            data-testid="input-search-documents"
          />
        </div>
        <div
          className="text-[13px] text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2.5"
          data-testid="text-viewed-count"
        >
          {viewedCount} / {totalDocs} documents viewed
        </div>
      </div>
    </div>
  );
}
