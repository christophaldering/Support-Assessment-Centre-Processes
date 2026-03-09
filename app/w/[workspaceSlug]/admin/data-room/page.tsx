"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  label: string;
  labelEn?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  _count?: { documents: number };
}

interface PortalDoc {
  id: string;
  assessmentId: string;
  slug?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  textSummary?: string;
  documentType: string;
  categoryId?: string;
  category: string;
  tags: string[];
  isImportant: boolean;
  isNew: boolean;
  readingTime?: number;
  pageCount?: number;
  sourceLabel?: string;
  confidentialityLabel?: string;
  releaseStatus: string;
  alwaysAvailable: boolean;
  releaseStart?: string;
  releaseEnd?: string;
  visibleFrom?: string;
  visibleUntil?: string;
  downloadAllowed: boolean;
  objectPath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  dataRoomCategory?: { id: string; slug: string; label: string; labelEn?: string; color?: string };
  _count?: { views: number };
}

interface Assessment {
  id: string;
  name: string;
}

const ACCENT = "hsl(14, 48%, 44%)";

const DOC_TYPES = [
  { key: "pdf", label: "PDF" },
  { key: "docx", label: "Word" },
  { key: "pptx", label: "PowerPoint" },
  { key: "xlsx", label: "Excel" },
  { key: "image", label: "Bild" },
  { key: "note", label: "Notiz / Text" },
  { key: "link", label: "Link" },
];

const RELEASE_OPTIONS = [
  { key: "released", label: "Veröffentlicht", color: "bg-emerald-100 text-emerald-700" },
  { key: "scheduled", label: "Geplant", color: "bg-amber-100 text-amber-700" },
  { key: "locked", label: "Gesperrt", color: "bg-slate-100 text-slate-500" },
  { key: "draft", label: "Entwurf", color: "bg-slate-100 text-slate-400" },
];

function getReleaseColor(status: string) {
  return RELEASE_OPTIONS.find((r) => r.key === status)?.color || "bg-slate-100 text-slate-500";
}

function getReleaseLabel(status: string) {
  return RELEASE_OPTIONS.find((r) => r.key === status)?.label || status;
}

function getDocTypeLabel(type: string) {
  return DOC_TYPES.find((d) => d.key === type)?.label || type;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDataRoomPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const apiBase = `/api/w/${workspaceSlug}/admin/data-room`;

  const [documents, setDocuments] = useState<PortalDoc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PortalDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    assessmentId: "",
    categoryId: "",
    description: "",
    shortDescription: "",
    textSummary: "",
    documentType: "pdf",
    confidentialityLabel: "",
    tags: "",
    isImportant: false,
    isNew: false,
    readingTime: "",
    pageCount: "",
    sourceLabel: "",
    releaseStatus: "released",
    sortOrder: "",
    downloadAllowed: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, catsRes, assRes] = await Promise.all([
        fetch(`${apiBase}/documents`),
        fetch(`${apiBase}/categories`),
        fetch(`/api/w/${workspaceSlug}/assessments`),
      ]);
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (assRes.ok) {
        const data = await assRes.json();
        setAssessments(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, [apiBase, workspaceSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      title: "",
      assessmentId: assessments[0]?.id || "",
      categoryId: "",
      description: "",
      shortDescription: "",
      textSummary: "",
      documentType: "pdf",
      confidentialityLabel: "",
      tags: "",
      isImportant: false,
      isNew: false,
      readingTime: "",
      pageCount: "",
      sourceLabel: "",
      releaseStatus: "released",
      sortOrder: "",
      downloadAllowed: true,
    });
    setSelectedFile(null);
    setEditingDoc(null);
  };

  const openCreate = () => {
    resetForm();
    if (assessments.length > 0 && !form.assessmentId) {
      setForm((f) => ({ ...f, assessmentId: assessments[0].id }));
    }
    setShowForm(true);
  };

  const openEdit = (doc: PortalDoc) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      assessmentId: doc.assessmentId,
      categoryId: doc.categoryId || "",
      description: doc.description || "",
      shortDescription: doc.shortDescription || "",
      textSummary: doc.textSummary || "",
      documentType: doc.documentType,
      confidentialityLabel: doc.confidentialityLabel || "",
      tags: doc.tags.join(", "),
      isImportant: doc.isImportant,
      isNew: doc.isNew,
      readingTime: doc.readingTime?.toString() || "",
      pageCount: doc.pageCount?.toString() || "",
      sourceLabel: doc.sourceLabel || "",
      releaseStatus: doc.releaseStatus,
      sortOrder: doc.sortOrder.toString(),
      downloadAllowed: doc.downloadAllowed,
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.assessmentId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        readingTime: form.readingTime ? parseInt(form.readingTime) : null,
        pageCount: form.pageCount ? parseInt(form.pageCount) : null,
        sortOrder: form.sortOrder ? parseInt(form.sortOrder) : undefined,
        categoryId: form.categoryId || null,
      };

      if (editingDoc) {
        const res = await fetch(`${apiBase}/documents/${editingDoc.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");

        if (selectedFile) {
          const fd = new FormData();
          fd.append("file", selectedFile);
          await fetch(`${apiBase}/documents/${editingDoc.id}/upload`, { method: "POST", body: fd });
        }
      } else {
        if (selectedFile) {
          const fd = new FormData();
          fd.append("file", selectedFile);
          Object.entries(payload).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
              fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
            }
          });
          const res = await fetch(`${apiBase}/documents`, { method: "POST", body: fd });
          if (!res.ok) throw new Error("Create failed");
        } else {
          const res = await fetch(`${apiBase}/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Create failed");
        }
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Dokument wirklich löschen?")) return;
    await fetch(`${apiBase}/documents/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = documents.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.slug?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterCategory && d.categoryId !== filterCategory) return false;
    if (filterStatus && d.releaseStatus !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-data-room-title">
            Data Room
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dokumente für das Kandidatenportal verwalten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/w/${workspaceSlug}/admin/data-room/categories`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors no-underline"
            data-testid="link-manage-categories"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Kategorien
          </Link>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: ACCENT }}
            data-testid="button-create-document"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Neues Dokument
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Dokumente durchsuchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20 focus:border-[#A6473B]"
            data-testid="input-search-documents"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
          data-testid="select-filter-category"
        >
          <option value="">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
          data-testid="select-filter-status"
        >
          <option value="">Alle Status</option>
          {RELEASE_OPTIONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
        <span data-testid="text-document-count">{filtered.length} Dokument{filtered.length !== 1 ? "e" : ""}</span>
        {categories.length > 0 && (
          <span>{categories.length} Kategorie{categories.length !== 1 ? "n" : ""}</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-slate-500 font-medium">Keine Dokumente gefunden</p>
          <p className="text-slate-400 text-sm mt-1">Erstellen Sie Ihr erstes Data Room Dokument</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: ACCENT }}
            data-testid="button-create-first-document"
          >
            Dokument erstellen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-documents">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Titel</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 hidden md:table-cell">Kategorie</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">Typ</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">Flags</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 hidden xl:table-cell">Datei</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 hidden xl:table-cell">Views</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors" data-testid={`row-document-${doc.id}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-xs">{doc.title}</div>
                      {doc.shortDescription && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{doc.shortDescription}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {doc.dataRoomCategory ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: doc.dataRoomCategory.color ? `${doc.dataRoomCategory.color}15` : "#f1f5f9",
                            color: doc.dataRoomCategory.color || "#64748b",
                          }}
                        >
                          {doc.dataRoomCategory.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{getDocTypeLabel(doc.documentType)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${getReleaseColor(doc.releaseStatus)}`}>
                        {getReleaseLabel(doc.releaseStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        {doc.isImportant && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                            Wichtig
                          </span>
                        )}
                        {doc.isNew && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                            Neu
                          </span>
                        )}
                        {doc.confidentialityLabel && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600">
                            {doc.confidentialityLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      {doc.fileName ? (
                        <span className="text-xs text-slate-500">{doc.fileName} ({formatFileSize(doc.fileSize)})</span>
                      ) : (
                        <span className="text-xs text-slate-400">Kein Upload</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <span className="text-xs text-slate-500">{doc._count?.views || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(doc)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Bearbeiten"
                          data-testid={`button-edit-document-${doc.id}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Löschen"
                          data-testid={`button-delete-document-${doc.id}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-8 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 mb-8"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-document-form"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingDoc ? "Dokument bearbeiten" : "Neues Dokument"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                data-testid="button-close-form"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20 focus:border-[#A6473B]"
                    placeholder="Dokumenttitel"
                    data-testid="input-doc-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assessment *</label>
                  <select
                    value={form.assessmentId}
                    onChange={(e) => setForm((f) => ({ ...f, assessmentId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    data-testid="select-doc-assessment"
                  >
                    <option value="">Assessment wählen</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kategorie</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    data-testid="select-doc-category"
                  >
                    <option value="">Keine Kategorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dokumenttyp</label>
                  <select
                    value={form.documentType}
                    onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    data-testid="select-doc-type"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Release-Status</label>
                  <select
                    value={form.releaseStatus}
                    onChange={(e) => setForm((f) => ({ ...f, releaseStatus: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    data-testid="select-doc-release"
                  >
                    {RELEASE_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kurzbeschreibung</label>
                  <input
                    type="text"
                    value={form.shortDescription}
                    onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20"
                    placeholder="Kurze Zusammenfassung"
                    data-testid="input-doc-short-description"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Beschreibung</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20 resize-none"
                    placeholder="Ausführliche Beschreibung"
                    data-testid="input-doc-description"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Textinhalt / Zusammenfassung</label>
                  <textarea
                    value={form.textSummary}
                    onChange={(e) => setForm((f) => ({ ...f, textSummary: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20 resize-none"
                    placeholder="Textinhalt für Inline-Ansicht im Kandidatenportal"
                    data-testid="input-doc-text-summary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tags (kommagetrennt)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20"
                    placeholder="z.B. strategie, finanzen, governance"
                    data-testid="input-doc-tags"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lesezeit (Min.)</label>
                  <input
                    type="number"
                    value={form.readingTime}
                    onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="z.B. 5"
                    data-testid="input-doc-reading-time"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Seitenanzahl</label>
                  <input
                    type="number"
                    value={form.pageCount}
                    onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="z.B. 12"
                    data-testid="input-doc-page-count"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vertraulichkeit</label>
                  <input
                    type="text"
                    value={form.confidentialityLabel}
                    onChange={(e) => setForm((f) => ({ ...f, confidentialityLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    placeholder='z.B. "Streng vertraulich"'
                    data-testid="input-doc-confidentiality"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quelle</label>
                  <input
                    type="text"
                    value={form.sourceLabel}
                    onChange={(e) => setForm((f) => ({ ...f, sourceLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="z.B. Vorstand, IR-Team"
                    data-testid="input-doc-source"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sortierung</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="0"
                    data-testid="input-doc-sort-order"
                  />
                </div>

                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isImportant}
                      onChange={(e) => setForm((f) => ({ ...f, isImportant: e.target.checked }))}
                      className="rounded border-slate-300"
                      data-testid="checkbox-doc-important"
                    />
                    <span className="text-sm text-slate-700">Wichtig</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isNew}
                      onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
                      className="rounded border-slate-300"
                      data-testid="checkbox-doc-new"
                    />
                    <span className="text-sm text-slate-700">Neu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.downloadAllowed}
                      onChange={(e) => setForm((f) => ({ ...f, downloadAllowed: e.target.checked }))}
                      className="rounded border-slate-300"
                      data-testid="checkbox-doc-download"
                    />
                    <span className="text-sm text-slate-700">Download erlaubt</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Datei hochladen
                    {editingDoc?.fileName && (
                      <span className="ml-2 text-slate-400 font-normal">
                        (aktuell: {editingDoc.fileName})
                      </span>
                    )}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    data-testid="input-doc-file"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                data-testid="button-cancel-form"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.title || !form.assessmentId}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
                data-testid="button-save-document"
              >
                {saving ? "Speichern…" : editingDoc ? "Aktualisieren" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
