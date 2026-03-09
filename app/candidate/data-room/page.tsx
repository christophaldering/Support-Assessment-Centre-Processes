"use client";

import { useState, useEffect, useMemo } from "react";
import DataRoomHeader from "@/components/candidate/DataRoomHeader";
import DataRoomSidebar from "@/components/candidate/DataRoomSidebar";
import DataRoomDocumentCard from "@/components/candidate/DataRoomDocumentCard";
import {
  dataRoomDocuments,
  DATA_ROOM_CATEGORIES,
  getCategoryDocumentCounts,
  type DocumentCategory,
} from "@/lib/candidate-portal/data-room-content";
import { isDocumentViewed, getViewedCount } from "@/lib/candidate-portal/viewed-state";

export default function DataRoomPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(null);
  const [viewedCount, setViewedCount] = useState(0);
  const [viewedSlugs, setViewedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setViewedCount(getViewedCount());
    const slugs = new Set<string>();
    for (const doc of dataRoomDocuments) {
      if (isDocumentViewed(doc.slug)) slugs.add(doc.slug);
    }
    setViewedSlugs(slugs);
  }, []);

  const categoryCounts = useMemo(() => getCategoryDocumentCounts(), []);

  const filteredDocs = useMemo(() => {
    let docs = [...dataRoomDocuments].sort((a, b) => a.order - b.order);
    if (activeCategory) {
      docs = docs.filter((d) => d.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.shortDescription.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <DataRoomHeader
        totalDocs={dataRoomDocuments.length}
        viewedCount={viewedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <DataRoomSidebar
              categories={DATA_ROOM_CATEGORIES}
              categoryCounts={categoryCounts}
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <select
              value={activeCategory || ""}
              onChange={(e) =>
                setActiveCategory((e.target.value as DocumentCategory) || null)
              }
              className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              data-testid="select-category-mobile"
            >
              <option value="">All Documents</option>
              {DATA_ROOM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat]})
                </option>
              ))}
            </select>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-gray-400" data-testid="text-no-results">
                No documents found.
              </p>
            </div>
          ) : (
            <div className="grid gap-3" data-testid="grid-documents">
              {filteredDocs.map((doc) => (
                <DataRoomDocumentCard
                  key={doc.id}
                  document={doc}
                  isViewed={viewedSlugs.has(doc.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
