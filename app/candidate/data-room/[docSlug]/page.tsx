"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DataRoomDocumentView from "@/components/candidate/DataRoomDocumentView";
import { getDocumentBySlug, getAllDocuments } from "@/lib/candidate-portal/data-room-content";
import { markDocumentViewed } from "@/lib/candidate-portal/viewed-state";

export default function DataRoomDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.docSlug as string;

  const document = getDocumentBySlug(slug);
  const allDocs = getAllDocuments();

  useEffect(() => {
    if (document) {
      markDocumentViewed(document.slug);
    }
  }, [document]);

  if (!document) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-[20px] font-semibold text-gray-900 mb-2">Document not found</h1>
        <p className="text-[14px] text-gray-500 mb-6">The requested document could not be located.</p>
        <button
          onClick={() => router.push("/candidate/data-room")}
          className="text-[13px] text-gray-600 hover:text-gray-900 underline transition-colors"
          data-testid="button-back-to-data-room"
        >
          Return to Data Room
        </button>
      </div>
    );
  }

  const currentIndex = allDocs.findIndex((d) => d.slug === slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <DataRoomDocumentView
      document={document}
      prevDoc={prevDoc}
      nextDoc={nextDoc}
    />
  );
}
