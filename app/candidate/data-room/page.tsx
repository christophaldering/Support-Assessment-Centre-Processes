"use client";

import { useState, useEffect, useMemo } from "react";
import DataRoomHeader from "@/components/candidate/DataRoomHeader";
import DataRoomSidebar, { type DataRoomCategoryItem } from "@/components/candidate/DataRoomSidebar";
import DataRoomDocumentCard, { type DataRoomDocumentData } from "@/components/candidate/DataRoomDocumentCard";
import { Star, Sparkles, Clock, FileText, Loader2 } from "lucide-react";

function DocumentSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
          <div className="h-3 bg-gray-50 rounded-lg w-full" />
          <div className="h-3 bg-gray-50 rounded-lg w-1/2" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-3 mt-8 first:mt-0">
      {icon}
      <h2 className="text-[15px] font-semibold text-gray-800">{title}</h2>
      <span className="text-[11px] text-gray-400 tabular-nums">({count})</span>
    </div>
  );
}

export default function DataRoomPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DataRoomDocumentData[]>([]);
  const [categories, setCategories] = useState<DataRoomCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
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
  }, [activeCategory, searchQuery, documents, categories]);

  const importantDocs = useMemo(() => filteredDocs.filter((d) => d.isImportant), [filteredDocs]);
  const newDocs = useMemo(() => filteredDocs.filter((d) => d.isNew && !d.isImportant), [filteredDocs]);
  const recentlyViewed = useMemo(
    () =>
      filteredDocs
        .filter((d) => d.viewed && d.lastOpenedAt)
        .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
        .slice(0, 5),
    [filteredDocs]
  );
  const remainingDocs = useMemo(
    () =>
      filteredDocs.filter(
        (d) =>
          !d.isImportant &&
          !(d.isNew && !d.isImportant)
      ),
    [filteredDocs]
  );

  const showSections = !searchQuery.trim() && !activeCategory;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <DataRoomHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <DataRoomSidebar
              categories={categories}
              categoryCounts={categoryCounts}
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
              totalCount={documents.length}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <select
              value={activeCategory || ""}
              onChange={(e) => setActiveCategory(e.target.value || null)}
              className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none"
              data-testid="select-category-mobile"
            >
              <option value="">Alle Dokumente ({documents.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.label} ({categoryCounts[cat.slug] ?? 0})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid gap-3" data-testid="grid-documents-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <DocumentSkeleton key={i} />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-gray-400 mb-1" data-testid="text-no-results">
                Keine Dokumente gefunden
              </p>
              <p className="text-[13px] text-gray-300">
                Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
              </p>
            </div>
          ) : showSections ? (
            <div>
              {importantDocs.length > 0 && (
                <>
                  <SectionTitle
                    icon={<Star className="w-4 h-4 text-amber-400" fill="currentColor" />}
                    title="Empfohlener Einstieg"
                    count={importantDocs.length}
                  />
                  <div className="grid gap-3" data-testid="grid-important-documents">
                    {importantDocs.map((doc) => (
                      <DataRoomDocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                </>
              )}

              {newDocs.length > 0 && (
                <>
                  <SectionTitle
                    icon={<Sparkles className="w-4 h-4 text-blue-500" />}
                    title="Neu für Sie"
                    count={newDocs.length}
                  />
                  <div className="grid gap-3" data-testid="grid-new-documents">
                    {newDocs.map((doc) => (
                      <DataRoomDocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                </>
              )}

              {recentlyViewed.length > 0 && (
                <>
                  <SectionTitle
                    icon={<Clock className="w-4 h-4 text-gray-400" />}
                    title="Zuletzt geöffnet"
                    count={recentlyViewed.length}
                  />
                  <div className="grid gap-3" data-testid="grid-recent-documents">
                    {recentlyViewed.map((doc) => (
                      <DataRoomDocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                </>
              )}

              {remainingDocs.length > 0 && (
                <>
                  <SectionTitle
                    icon={<FileText className="w-4 h-4 text-gray-400" />}
                    title="Alle weiteren Dokumente"
                    count={remainingDocs.length}
                  />
                  <div className="grid gap-3" data-testid="grid-remaining-documents">
                    {remainingDocs.map((doc) => (
                      <DataRoomDocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-3" data-testid="grid-documents">
              {filteredDocs.map((doc) => (
                <DataRoomDocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-[12px] text-gray-300">
          © Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!
        </p>
      </footer>
    </div>
  );
}
