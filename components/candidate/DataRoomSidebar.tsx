"use client";

import type { DocumentCategory } from "@/lib/candidate-portal/data-room-content";

interface DataRoomSidebarProps {
  categories: DocumentCategory[];
  categoryCounts: Record<DocumentCategory, number>;
  activeCategory: DocumentCategory | null;
  onCategorySelect: (category: DocumentCategory | null) => void;
}

export default function DataRoomSidebar({ categories, categoryCounts, activeCategory, onCategorySelect }: DataRoomSidebarProps) {
  return (
    <nav className="space-y-1" data-testid="nav-data-room-categories">
      <button
        onClick={() => onCategorySelect(null)}
        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
          activeCategory === null
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        data-testid="button-category-all"
      >
        All Documents
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategorySelect(cat)}
          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between ${
            activeCategory === cat
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          data-testid={`button-category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <span className="truncate">{cat}</span>
          <span
            className={`text-[11px] ml-2 ${
              activeCategory === cat ? "text-gray-300" : "text-gray-400"
            }`}
          >
            {categoryCounts[cat]}
          </span>
        </button>
      ))}
    </nav>
  );
}
