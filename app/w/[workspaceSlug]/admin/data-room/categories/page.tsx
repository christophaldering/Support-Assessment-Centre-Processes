"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  label: string;
  labelEn?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  _count?: { documents: number };
}

const ACCENT = "hsl(14, 48%, 44%)";

const ICON_OPTIONS = [
  { key: "building", label: "Unternehmen" },
  { key: "chart-bar", label: "Finanzen" },
  { key: "shopping-bag", label: "Retail" },
  { key: "lightning", label: "Transformation" },
  { key: "shield", label: "Governance" },
  { key: "users", label: "People" },
  { key: "newspaper", label: "Presse" },
  { key: "folder", label: "Allgemein" },
];

const COLOR_PRESETS = [
  "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#ec4899", "#6366f1",
  "#64748b", "#a855f7",
];

export default function AdminCategoriesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const apiBase = `/api/w/${workspaceSlug}/admin/data-room/categories`;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    label: "",
    labelEn: "",
    icon: "",
    color: "#3b82f6",
    sortOrder: "",
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      if (res.ok) setCategories(await res.json());
    } catch {}
    setLoading(false);
  }, [apiBase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm({ slug: "", label: "", labelEn: "", icon: "", color: "#3b82f6", sortOrder: "" });
    setEditingCat(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setForm({
      slug: cat.slug,
      label: cat.label,
      labelEn: cat.labelEn || "",
      icon: cat.icon || "",
      color: cat.color || "#3b82f6",
      sortOrder: cat.sortOrder.toString(),
    });
    setShowForm(true);
  };

  const autoSlug = (label: string) =>
    label
      .toLowerCase()
      .replace(/[äö]/g, (m) => (m === "ä" ? "ae" : "oe"))
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSubmit = async () => {
    if (!form.label) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || autoSlug(form.label),
        sortOrder: form.sortOrder ? parseInt(form.sortOrder) : undefined,
        labelEn: form.labelEn || null,
        icon: form.icon || null,
        color: form.color || null,
      };

      if (editingCat) {
        await fetch(`${apiBase}/${editingCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      resetForm();
      fetchCategories();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kategorie wirklich löschen? Dokumente verlieren ihre Kategorie-Zuordnung.")) return;
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  const handleReorder = async (catId: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const current = categories[idx];
    const swap = categories[swapIdx];

    await Promise.all([
      fetch(`${apiBase}/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap.sortOrder }),
      }),
      fetch(`${apiBase}/${swap.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
    fetchCategories();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white rounded-lg border border-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/w/${workspaceSlug}/admin/data-room`}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors no-underline"
          data-testid="link-back-data-room"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-categories-title">
            Fallstudie-Kategorien
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kategorien für die Dokumentstruktur verwalten</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: ACCENT }}
          data-testid="button-create-category"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Neue Kategorie
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-slate-500 font-medium">Keine Kategorien vorhanden</p>
          <p className="text-slate-400 text-sm mt-1">Erstellen Sie Ihre erste Kategorie</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: ACCENT }}
            data-testid="button-create-first-category"
          >
            Kategorie erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-white rounded-lg border border-slate-200 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              data-testid={`row-category-${cat.id}`}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleReorder(cat.id, "up")}
                  disabled={idx === 0}
                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid={`button-move-up-${cat.id}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => handleReorder(cat.id, "down")}
                  disabled={idx === categories.length - 1}
                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid={`button-move-down-${cat.id}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: cat.color || "#64748b" }}
              >
                {cat.sortOrder + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{cat.label}</div>
                {cat.labelEn && (
                  <div className="text-xs text-slate-400 mt-0.5">{cat.labelEn}</div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="hidden sm:inline">{cat.slug}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                  {cat._count?.documents || 0} Dok.
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  data-testid={`button-edit-category-${cat.id}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  data-testid={`button-delete-category-${cat.id}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-category-form"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCat ? "Kategorie bearbeiten" : "Neue Kategorie"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                data-testid="button-close-category-form"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Label (DE) *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setForm((f) => ({
                      ...f,
                      label,
                      slug: editingCat ? f.slug : autoSlug(label),
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6473B]/20 focus:border-[#A6473B]"
                  placeholder="z.B. Unternehmen & Strategie"
                  data-testid="input-category-label"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Label (EN)</label>
                <input
                  type="text"
                  value={form.labelEn}
                  onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                  placeholder="z.B. Company & Strategy"
                  data-testid="input-category-label-en"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none font-mono"
                  placeholder="auto-generated"
                  data-testid="input-category-slug"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Icon</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                  data-testid="select-category-icon"
                >
                  <option value="">Kein Icon</option>
                  {ICON_OPTIONS.map((i) => (
                    <option key={i.key} value={i.key}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Farbe</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        form.color === c ? "border-slate-800 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      data-testid={`button-color-${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded cursor-pointer border-0"
                    data-testid="input-category-color"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sortierung</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                  placeholder="Automatisch"
                  data-testid="input-category-sort-order"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                data-testid="button-cancel-category-form"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.label}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
                data-testid="button-save-category"
              >
                {saving ? "Speichern…" : editingCat ? "Aktualisieren" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
