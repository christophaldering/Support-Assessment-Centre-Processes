"use client";

import { Folder } from "lucide-react";

export interface DataRoomCategoryItem {
  id: string;
  slug: string;
  label: string;
  labelEn: string | null;
  color: string | null;
  icon: string | null;
  sortOrder?: number;
}

interface DataRoomSidebarProps {
  categories: DataRoomCategoryItem[];
  categoryCounts: Record<string, number>;
  activeCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
  totalCount: number;
}

export default function DataRoomSidebar({ categories, categoryCounts, activeCategory, onCategorySelect, totalCount }: DataRoomSidebarProps) {
  return (
    <nav className="space-y-0.5" data-testid="nav-data-room-categories">
      <button
        onClick={() => onCategorySelect(null)}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 flex items-center justify-between ${
          activeCategory === null
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-50"
        }`}
        data-testid="button-category-all"
      >
        <span>Alle Dokumente</span>
        <span className={`text-[11px] tabular-nums ${activeCategory === null ? "text-gray-400" : "text-gray-400"}`}>
          {totalCount}
        </span>
      </button>
      {categories.map((cat) => {
        const count = categoryCounts[cat.slug] ?? 0;
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.slug)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 flex items-center justify-between gap-2 ${
              isActive
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-testid={`button-category-${cat.slug}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {cat.color && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.5)" : cat.color }}
                />
              )}
              <span className="truncate">{cat.label}</span>
            </div>
            <span className={`text-[11px] tabular-nums flex-shrink-0 ${isActive ? "text-gray-400" : "text-gray-400"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
