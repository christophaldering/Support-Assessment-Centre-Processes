"use client";

import { useState, useEffect, useMemo } from "react";
import DataRoomHeader from "@/components/candidate/DataRoomHeader";
import type { DataRoomCategoryItem } from "@/components/candidate/DataRoomSidebar";
import DataRoomDocumentCard, { type DataRoomDocumentData } from "@/components/candidate/DataRoomDocumentCard";
import {
  Building2, TrendingUp, ShoppingCart, Rocket, Shield, Users, Newspaper,
  FileText, ChevronRight, Folder
} from "lucide-react";

const iconMap: Record<string, typeof Building2> = {
  Building2,
  TrendingUp,
  ShoppingCart,
  Rocket,
  Shield,
  Users,
  Newspaper,
  FileText,
  Folder,
};

function getIconComponent(iconName: string | null) {
  if (!iconName) return Folder;
  return iconMap[iconName] || Folder;
}

function FolderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 mb-4" />
      <div className="h-4 bg-gray-100 rounded-lg w-2/3 mb-2" />
      <div className="h-3 bg-gray-50 rounded-lg w-1/3" />
    </div>
  );
}

function CategoryFolderCard({
  category,
  documentCount,
  onClick,
  index,
}: {
  category: DataRoomCategoryItem;
  documentCount: number;
  onClick: () => void;
  index: number;
}) {
  const IconComponent = getIconComponent(category.icon);
  const color = category.color || "#6B7280";

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 p-6 text-left transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
      style={{
        animationDelay: `${index * 60}ms`,
        animation: "fadeInUp 0.5s ease-out both",
      }}
      data-testid={`button-folder-${category.slug}`}
    >
      <div
        className="absolute top-0 left-0 w-full h-1 rounded-t-2xl opacity-80"
        style={{ backgroundColor: color }}
      />

      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}14` }}
      >
        <IconComponent
          className="w-6 h-6 transition-colors duration-300"
          style={{ color }}
        />
      </div>

      <h3 className="text-[15px] font-semibold text-gray-900 mb-1 tracking-tight">
        {category.label}
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-[13px] text-gray-400 tabular-nums">
          {documentCount} {documentCount === 1 ? "Dokument" : "Dokumente"}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300 transition-all duration-300 group-hover:text-gray-500 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

export default function DataRoomPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DataRoomDocumentData[]>([]);
  const [categories, setCategories] = useState<DataRoomCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidate-portal/data-room/documents").then((r) => (r.ok ? r.json() : { documents: [] })),
      fetch("/api/candidate-portal/data-room/categories").then((r) => (r.ok ? r.json() : { categories: [] })),
    ])
      .then(([docsData, catsData]) => {
        setDocuments(docsData.documents || []);
        setCategories(catsData.categories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.slug] = 0;
    }
    for (const doc of documents) {
      const catSlug = categories.find(
        (c) => c.label === doc.categoryLabel || c.slug === doc.category
      )?.slug;
      if (catSlug) counts[catSlug] = (counts[catSlug] || 0) + 1;
    }
    return counts;
  }, [documents, categories]);

  const filteredDocs = useMemo(() => {
    let docs = [...documents];

    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) {
        docs = docs.filter(
          (d) => d.category === cat.slug || d.categoryLabel === cat.label
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.shortDescription || "").toLowerCase().includes(q) ||
          (d.categoryLabel || "").toLowerCase().includes(q) ||
          (d.documentType || "").toLowerCase().includes(q) ||
          (d.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return docs;
  }, [selectedCategory, searchQuery, documents, categories]);

  const isSearching = searchQuery.trim().length > 0;
  const showFolderGrid = !isSearching && !selectedCategory;

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <DataRoomHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-folders-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <FolderSkeleton key={i} />
          ))}
        </div>
      ) : isSearching ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-[14px] text-gray-500">
              {filteredDocs.length} {filteredDocs.length === 1 ? "Ergebnis" : "Ergebnisse"} für &ldquo;{searchQuery}&rdquo;
            </span>
          </div>
          {filteredDocs.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-gray-400 mb-1" data-testid="text-no-results">
                Keine Dokumente gefunden
              </p>
              <p className="text-[13px] text-gray-300">
                Versuchen Sie einen anderen Suchbegriff.
              </p>
            </div>
          ) : (
            <div className="grid gap-3" data-testid="grid-search-results">
              {filteredDocs.map((doc) => (
                <DataRoomDocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      ) : showFolderGrid ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-category-folders">
            {categories.map((cat, index) => (
              <CategoryFolderCard
                key={cat.id}
                category={cat}
                documentCount={categoryCounts[cat.slug] || 0}
                onClick={() => setSelectedCategory(cat.slug)}
                index={index}
              />
            ))}
          </div>
        </div>
      ) : selectedCategoryData ? (
        <div style={{ animation: "fadeInUp 0.3s ease-out both" }}>
          <div className="flex items-center gap-2 mb-6 text-[14px]" data-testid="nav-breadcrumb">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              data-testid="button-breadcrumb-dataroom"
            >
              Data Room
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-700 font-medium">{selectedCategoryData.label}</span>
          </div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            {(() => {
              const IconComp = getIconComponent(selectedCategoryData.icon);
              const color = selectedCategoryData.color || "#6B7280";
              return (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}14` }}
                  >
                    <IconComp className="w-7 h-7" style={{ color }} />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight" data-testid="text-category-title">
                      {selectedCategoryData.label}
                    </h2>
                    <p className="text-[13px] text-gray-400 tabular-nums">
                      {categoryCounts[selectedCategoryData.slug] || 0} Dokumente in dieser Kategorie
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-gray-400" data-testid="text-no-results">
                Keine Dokumente in dieser Kategorie
              </p>
            </div>
          ) : (
            <div className="grid gap-3" data-testid="grid-documents">
              {filteredDocs.map((doc) => (
                <DataRoomDocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <footer className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-[12px] text-gray-300">
          © Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!
        </p>
      </footer>
    </div>
  );
}
