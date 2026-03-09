"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DataRoomDocumentView, { type DataRoomDocumentDetail } from "@/components/candidate/DataRoomDocumentView";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

interface NavDoc {
  slug: string;
  title: string;
}

function DocumentViewSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-40 mb-8" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-gray-50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="h-6 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
        </div>
        <div className="px-8 py-8 space-y-3">
          <div className="h-3 bg-gray-50 rounded w-full" />
          <div className="h-3 bg-gray-50 rounded w-full" />
          <div className="h-3 bg-gray-50 rounded w-5/6" />
          <div className="h-3 bg-gray-50 rounded w-full" />
          <div className="h-3 bg-gray-50 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export default function DataRoomDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.docSlug as string;

  const [document, setDocument] = useState<DataRoomDocumentDetail | null>(null);
  const [allDocs, setAllDocs] = useState<NavDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    Promise.all([
      fetch(`/api/candidate-portal/data-room/documents/${slug}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
      fetch("/api/candidate-portal/data-room/documents").then((r) =>
        r.ok ? r.json() : { documents: [] }
      ),
    ])
      .then(([docData, docsData]) => {
        setDocument(docData.document);
        setAllDocs(
          (docsData.documents || []).map((d: any) => ({
            slug: d.slug,
            title: d.title,
          }))
        );
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (document) {
      fetch(`/api/candidate-portal/data-room/documents/${slug}/view`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [document, slug]);

  if (loading) {
    return <DocumentViewSkeleton />;
  }

  if (error || !document) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h1 className="text-[20px] font-semibold text-gray-900 mb-2">Dokument nicht gefunden</h1>
        <p className="text-[14px] text-gray-400 mb-6">Das angeforderte Dokument konnte nicht gefunden werden.</p>
        <Link
          href="/candidate/data-room"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
          data-testid="button-back-to-data-room"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zum Data Room
        </Link>
      </div>
    );
  }

  const currentIndex = allDocs.findIndex((d) => d.slug === slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <>
      <DataRoomDocumentView document={document} prevDoc={prevDoc} nextDoc={nextDoc} />
      <footer className="max-w-3xl mx-auto px-6 pb-8 text-center">
        <p className="text-[12px] text-gray-300">
          © Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!
        </p>
      </footer>
    </>
  );
}
