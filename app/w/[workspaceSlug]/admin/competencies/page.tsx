"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CompetencyModel {
  id: string;
  name: string;
  description: string | null;
  status: string;
  version: number;
  nodes: CompetencyNode[];
}

interface CompetencyNode {
  id: string;
  name: string;
  nodeType: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  competencyModelId: string;
}

interface ScaleDefinition {
  id: string;
  name: string;
  type: string;
  minValue: number | null;
  maxValue: number | null;
  points: ScalePoint[];
  status: string;
}

interface ScalePoint {
  value: number;
  label: string;
  anchor?: string;
}

interface WeightingProfile {
  id: string;
  name: string;
  targetRole: string | null;
  weights: WeightEntry[];
  version: number;
  status: string;
}

interface WeightEntry {
  nodeId: string;
  weight: number;
}

interface AssessmentRecord {
  id: string;
  name: string;
  status: string;
}

interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
}

interface MappingRecord {
  id: string;
  exerciseId: string;
  competencyNodeId: string;
  weight: number;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", label: "Entwurf" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Aktiv" },
  completed: { bg: "bg-blue-50", text: "text-blue-600", label: "Abgeschlossen" },
  archived: { bg: "bg-red-50", text: "text-red-500", label: "Archiviert" },
};

const NODE_TYPE_LABELS: Record<string, string> = {
  domain: "Domäne",
  competency: "Kompetenz",
  sub: "Subkompetenz",
  anchor: "Verhaltensanker",
  custom: "Benutzerdefiniert",
};

const SCALE_TYPE_LABELS: Record<string, string> = {
  numeric: "Numerisch",
  likert: "Likert-Skala",
  custom: "Benutzerdefiniert",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_ASSISTANT: "Projektassistent",
  HR_CLIENT: "HR-Auftraggeber",
  CANDIDATE: "Kandidat",
};

const ALL_ROLES = ["ADMIN", "MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"];
const NODE_TYPES = ["domain", "competency", "sub", "anchor", "custom"];

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue";
const btnPrimary = "rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors";
const btnDanger = "text-xs text-red-500 hover:text-red-700 font-medium";

type TabKey = "models" | "scales" | "weights" | "mapping";

export default function CompetencyManagementPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const [activeTab, setActiveTab] = useState<TabKey>("models");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "models", label: "Kompetenzmodelle" },
    { key: "scales", label: "Skalen" },
    { key: "weights", label: "Gewichtungsprofile" },
    { key: "mapping", label: "Übungs-Zuordnung" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Kompetenzmodelle</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back"
          >
            Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy">Kompetenzmodelle</h1>
          <p className="text-sm text-slate-500">Kompetenzrahmen, Dimensionen, Skalen und Zuordnungen verwalten</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "models" && <ModelsTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "scales" && <ScalesTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "weights" && <WeightsTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "mapping" && <MappingTab workspaceSlug={workspaceSlug} router={router} />}
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function ModelsTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Kompetenzverwaltung."); return; }
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch { setError("Fehler beim Laden der Kompetenzmodelle."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription || null }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      fetchModels();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${id}`, { method: "DELETE" });
      if (expandedModelId === id) setExpandedModelId(null);
      fetchModels();
    } catch {}
  };

  const handleAiGenerate = async () => {
    setAiMessage("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_model" }),
      });
      const data = await res.json();
      setAiMessage(data.message || data.error || "Unbekannte Antwort.");
    } catch { setAiMessage("Fehler bei der KI-Anfrage."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="text-model-count">{models.length} Modelle</p>
        <div className="flex gap-2">
          <button onClick={handleAiGenerate} data-testid="button-ai-generate-model" className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 transition-colors">
            KI-Assistent: Modell generieren
          </button>
          <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-model" className={btnPrimary}>
            {showCreate ? "Abbrechen" : "Neues Modell"}
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800" data-testid="text-ai-message">
          {aiMessage}
        </div>
      )}

      {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Kompetenzmodell erstellen</h2>
          <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-model">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-model-name" className={inputClass} placeholder="z.B. Management-Kompetenzen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} data-testid="input-model-description" className={inputClass} placeholder="Optionale Beschreibung" />
            </div>
            {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}
            <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-model" className={`${btnPrimary} px-6 disabled:opacity-50`}>
              {creating ? "Wird erstellt…" : "Modell erstellen"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      <div className="space-y-4">
        {models.map((model) => {
          const badge = STATUS_BADGES[model.status] || STATUS_BADGES.draft;
          const isExpanded = expandedModelId === model.id;
          return (
            <div key={model.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`card-model-${model.id}`}>
              <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setExpandedModelId(isExpanded ? null : model.id)}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-brand-navy">{model.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`} data-testid={`badge-status-${model.id}`}>{badge.label}</span>
                  </div>
                  {model.description && <p className="text-sm text-slate-500">{model.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span>Version {model.version}</span>
                    <span>{model.nodes?.length ?? 0} Knoten</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }} data-testid={`button-delete-model-${model.id}`} className={btnDanger}>Löschen</button>
                  <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-200 p-6">
                  <ModelDetail workspaceSlug={workspaceSlug} model={model} onRefresh={fetchModels} />
                </div>
              )}
            </div>
          );
        })}
        {models.length === 0 && !loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Kompetenzmodelle vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}

function ModelDetail({ workspaceSlug, model, onRefresh }: { workspaceSlug: string; model: CompetencyModel; onRefresh: () => void }) {
  const nodes = model.nodes || [];
  const [showAddNode, setShowAddNode] = useState(false);
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState("competency");
  const [nodeParentId, setNodeParentId] = useState("");
  const [nodeDescription, setNodeDescription] = useState("");
  const [nodeCreating, setNodeCreating] = useState(false);
  const [nodeError, setNodeError] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeName, setEditNodeName] = useState("");
  const [aiNodeMessage, setAiNodeMessage] = useState("");

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setNodeError("");
    setNodeCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nodeName, nodeType, parentId: nodeParentId || null, description: nodeDescription || null, sortOrder: nodes.length }),
      });
      if (!res.ok) { const d = await res.json(); setNodeError(d.error || "Fehler beim Erstellen."); return; }
      setShowAddNode(false);
      setNodeName("");
      setNodeType("competency");
      setNodeParentId("");
      setNodeDescription("");
      onRefresh();
    } catch { setNodeError("Etwas ist schiefgelaufen."); }
    finally { setNodeCreating(false); }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/${nodeId}`, { method: "DELETE" });
      onRefresh();
    } catch {}
  };

  const handleReorder = async (nodeId: string, direction: "up" | "down") => {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= nodes.length) return;
    const reordered = nodes.map((n, i) => {
      if (i === idx) return { id: n.id, sortOrder: swapIdx };
      if (i === swapIdx) return { id: n.id, sortOrder: idx };
      return { id: n.id, sortOrder: i };
    });
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: reordered }),
      });
      onRefresh();
    } catch {}
  };

  const handleEditNode = async (nodeId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNodeName }),
      });
      setEditingNodeId(null);
      onRefresh();
    } catch {}
  };

  const handleAiAnchors = async (nodeId: string) => {
    setAiNodeMessage("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write_anchors", context: { nodeId, modelId: model.id } }),
      });
      const data = await res.json();
      setAiNodeMessage(data.message || data.error || "Unbekannte Antwort.");
    } catch { setAiNodeMessage("Fehler bei der KI-Anfrage."); }
  };

  const getDepth = (node: CompetencyNode): number => {
    if (!node.parentId) return 0;
    const parent = nodes.find((n) => n.id === node.parentId);
    return parent ? getDepth(parent) + 1 : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-brand-navy">Kompetenzknoten ({nodes.length})</h4>
        <button onClick={() => setShowAddNode(!showAddNode)} data-testid="button-add-node" className={`${btnPrimary} text-xs px-3 py-1.5`}>
          {showAddNode ? "Abbrechen" : "Knoten hinzufügen"}
        </button>
      </div>

      {aiNodeMessage && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800" data-testid="text-ai-node-message">
          {aiNodeMessage}
        </div>
      )}

      {showAddNode && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <form onSubmit={handleAddNode} className="space-y-3" data-testid="form-add-node">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} required data-testid="input-node-name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} data-testid="select-node-type" className={inputClass}>
                  {NODE_TYPES.map((t) => <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Übergeordneter Knoten</label>
                <select value={nodeParentId} onChange={(e) => setNodeParentId(e.target.value)} data-testid="select-node-parent" className={inputClass}>
                  <option value="">Kein übergeordneter Knoten</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({NODE_TYPE_LABELS[n.nodeType] || n.nodeType})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <input type="text" value={nodeDescription} onChange={(e) => setNodeDescription(e.target.value)} data-testid="input-node-description" className={inputClass} />
              </div>
            </div>
            {nodeError && <p className="text-sm text-red-500" data-testid="text-node-error">{nodeError}</p>}
            <button type="submit" disabled={nodeCreating || !nodeName.trim()} data-testid="button-submit-node" className={`${btnPrimary} text-xs px-4 py-1.5 disabled:opacity-50`}>
              {nodeCreating ? "Wird erstellt…" : "Knoten erstellen"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-1">
        {nodes.map((node, idx) => {
          const depth = getDepth(node);
          const typeLabel = NODE_TYPE_LABELS[node.nodeType] || node.nodeType;
          return (
            <div key={node.id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 group" style={{ paddingLeft: `${12 + depth * 24}px` }} data-testid={`row-node-${node.id}`}>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">{typeLabel}</span>
              {editingNodeId === node.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="text" value={editNodeName} onChange={(e) => setEditNodeName(e.target.value)} data-testid={`input-edit-node-${node.id}`} className={`${inputClass} text-xs py-1`} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleEditNode(node.id); if (e.key === "Escape") setEditingNodeId(null); }} />
                  <button onClick={() => handleEditNode(node.id)} data-testid={`button-save-node-${node.id}`} className="text-xs text-brand-blue font-medium">Speichern</button>
                  <button onClick={() => setEditingNodeId(null)} className="text-xs text-slate-400">Abbrechen</button>
                </div>
              ) : (
                <span className="text-sm text-slate-900 cursor-pointer hover:text-brand-blue flex-1" onClick={() => { setEditingNodeId(node.id); setEditNodeName(node.name); }} data-testid={`text-node-name-${node.id}`}>
                  {node.name}
                </span>
              )}
              {node.description && <span className="text-xs text-slate-400 hidden md:inline truncate max-w-[200px]">{node.description}</span>}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleAiAnchors(node.id)} data-testid={`button-ai-anchors-${node.id}`} className="text-xs text-purple-600 hover:text-purple-800 font-medium px-1">KI</button>
                <button onClick={() => handleReorder(node.id, "up")} disabled={idx === 0} data-testid={`button-move-up-${node.id}`} className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 px-1">▲</button>
                <button onClick={() => handleReorder(node.id, "down")} disabled={idx === nodes.length - 1} data-testid={`button-move-down-${node.id}`} className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 px-1">▼</button>
                <button onClick={() => handleDeleteNode(node.id)} data-testid={`button-delete-node-${node.id}`} className={`${btnDanger} px-1`}>✕</button>
              </div>
            </div>
          );
        })}
        {nodes.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Keine Knoten vorhanden.</p>}
      </div>
    </div>
  );
}

function ScalesTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [scales, setScales] = useState<ScaleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("likert");
  const [newMin, setNewMin] = useState("");
  const [newMax, setNewMax] = useState("");
  const [newPoints, setNewPoints] = useState<ScalePoint[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editPoints, setEditPoints] = useState<ScalePoint[]>([]);

  const fetchScales = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung."); return; }
      if (!res.ok) throw new Error();
      setScales(await res.json());
    } catch { setError("Fehler beim Laden der Skalen."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router]);

  useEffect(() => { fetchScales(); }, [fetchScales]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          minValue: newMin ? parseInt(newMin) : null,
          maxValue: newMax ? parseInt(newMax) : null,
          points: newPoints,
        }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewType("likert");
      setNewMin("");
      setNewMax("");
      setNewPoints([]);
      fetchScales();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/scales/${id}`, { method: "DELETE" });
      if (editingScaleId === id) setEditingScaleId(null);
      fetchScales();
    } catch {}
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          type: editType,
          minValue: editMin ? parseInt(editMin) : null,
          maxValue: editMax ? parseInt(editMax) : null,
          points: editPoints,
        }),
      });
      if (res.ok) { setEditingScaleId(null); fetchScales(); }
    } catch {}
  };

  const startEdit = (s: ScaleDefinition) => {
    setEditingScaleId(s.id);
    setEditName(s.name);
    setEditType(s.type);
    setEditMin(s.minValue?.toString() ?? "");
    setEditMax(s.maxValue?.toString() ?? "");
    setEditPoints(Array.isArray(s.points) ? (s.points as ScalePoint[]) : []);
  };

  const addPoint = (isEdit: boolean) => {
    const point: ScalePoint = { value: 0, label: "", anchor: "" };
    if (isEdit) setEditPoints([...editPoints, point]);
    else setNewPoints([...newPoints, point]);
  };

  const updatePoint = (index: number, field: keyof ScalePoint, value: string | number, isEdit: boolean) => {
    const points = isEdit ? [...editPoints] : [...newPoints];
    (points[index] as Record<string, string | number>)[field] = value;
    if (isEdit) setEditPoints(points);
    else setNewPoints(points);
  };

  const removePoint = (index: number, isEdit: boolean) => {
    if (isEdit) setEditPoints(editPoints.filter((_, i) => i !== index));
    else setNewPoints(newPoints.filter((_, i) => i !== index));
  };

  const renderPointsEditor = (points: ScalePoint[], isEdit: boolean) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Skalenpunkte</label>
      {points.map((p, i) => (
        <div key={i} className="flex gap-2 items-center" data-testid={`${isEdit ? "edit-" : ""}point-${i}`}>
          <input type="number" value={p.value} onChange={(e) => updatePoint(i, "value", parseInt(e.target.value) || 0, isEdit)} placeholder="Wert" className={`${inputClass} w-20`} data-testid={`${isEdit ? "edit-" : ""}input-point-value-${i}`} />
          <input type="text" value={p.label} onChange={(e) => updatePoint(i, "label", e.target.value, isEdit)} placeholder="Bezeichnung" className={`${inputClass} flex-1`} data-testid={`${isEdit ? "edit-" : ""}input-point-label-${i}`} />
          <input type="text" value={p.anchor || ""} onChange={(e) => updatePoint(i, "anchor", e.target.value, isEdit)} placeholder="Ankertext (optional)" className={`${inputClass} flex-1`} data-testid={`${isEdit ? "edit-" : ""}input-point-anchor-${i}`} />
          <button onClick={() => removePoint(i, isEdit)} data-testid={`${isEdit ? "edit-" : ""}button-remove-point-${i}`} className={btnDanger}>✕</button>
        </div>
      ))}
      <button onClick={() => addPoint(isEdit)} data-testid={`${isEdit ? "edit-" : ""}button-add-point`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">
        + Punkt hinzufügen
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="text-scale-count">{scales.length} Skalen</p>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-scale" className={btnPrimary}>
          {showCreate ? "Abbrechen" : "Neue Skala"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Neue Skala erstellen</h2>
          <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-scale">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-scale-name" className={inputClass} placeholder="z.B. 5-Punkte-Skala" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} data-testid="select-scale-type" className={inputClass}>
                  <option value="numeric">Numerisch</option>
                  <option value="likert">Likert-Skala</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minimalwert</label>
                <input type="number" value={newMin} onChange={(e) => setNewMin(e.target.value)} data-testid="input-scale-min" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maximalwert</label>
                <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} data-testid="input-scale-max" className={inputClass} />
              </div>
            </div>
            {renderPointsEditor(newPoints, false)}
            {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}
            <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-scale" className={`${btnPrimary} px-6 disabled:opacity-50`}>
              {creating ? "Wird erstellt…" : "Skala erstellen"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm" data-testid="table-scales">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Typ</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Punkte</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {scales.map((s) => {
              const badge = STATUS_BADGES[s.status] || STATUS_BADGES.draft;
              const pts = Array.isArray(s.points) ? s.points : [];
              if (editingScaleId === s.id) {
                return (
                  <tr key={s.id} className="border-b border-slate-100" data-testid={`row-scale-edit-${s.id}`}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-scale-name-${s.id}`} className={inputClass} />
                          <select value={editType} onChange={(e) => setEditType(e.target.value)} data-testid={`select-edit-scale-type-${s.id}`} className={inputClass}>
                            <option value="numeric">Numerisch</option>
                            <option value="likert">Likert-Skala</option>
                            <option value="custom">Benutzerdefiniert</option>
                          </select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} placeholder="Min" data-testid={`input-edit-scale-min-${s.id}`} className={inputClass} />
                          <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="Max" data-testid={`input-edit-scale-max-${s.id}`} className={inputClass} />
                        </div>
                        {renderPointsEditor(editPoints, true)}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(s.id)} data-testid={`button-save-scale-${s.id}`} className={`${btnPrimary} text-xs px-3 py-1.5`}>Speichern</button>
                          <button onClick={() => setEditingScaleId(null)} className="text-xs text-slate-500 hover:text-slate-700">Abbrechen</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50" data-testid={`row-scale-${s.id}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{SCALE_TYPE_LABELS[s.type] || s.type}</td>
                  <td className="px-4 py-3 text-slate-500">{pts.length}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(s)} data-testid={`button-edit-scale-${s.id}`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Bearbeiten</button>
                      <button onClick={() => handleDelete(s.id)} data-testid={`button-delete-scale-${s.id}`} className={btnDanger}>Löschen</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {scales.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Keine Skalen vorhanden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeightsTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [profiles, setProfiles] = useState<WeightingProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newWeights, setNewWeights] = useState<WeightEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editWeights, setEditWeights] = useState<WeightEntry[]>([]);
  const [aiMessage, setAiMessage] = useState("");

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch {}
  }, [workspaceSlug, router]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const modelNodes = selectedModel?.nodes || [];

  const fetchProfiles = useCallback(async () => {
    if (!selectedModelId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles`);
      if (!res.ok) throw new Error();
      setProfiles(await res.json());
    } catch { setError("Fehler beim Laden der Gewichtungsprofile."); }
    finally { setLoading(false); }
  }, [workspaceSlug, selectedModelId]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  useEffect(() => {
    if (selectedModelId && modelNodes.length > 0) {
      setNewWeights(modelNodes.map((n) => ({ nodeId: n.id, weight: 1 })));
    }
  }, [selectedModelId, modelNodes.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, targetRole: newRole || null, weights: newWeights }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewRole("");
      fetchProfiles();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles/${id}`, { method: "DELETE" });
      if (editingProfileId === id) setEditingProfileId(null);
      fetchProfiles();
    } catch {}
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, targetRole: editRole || null, weights: editWeights }),
      });
      if (res.ok) { setEditingProfileId(null); fetchProfiles(); }
    } catch {}
  };

  const startEdit = (p: WeightingProfile) => {
    setEditingProfileId(p.id);
    setEditName(p.name);
    setEditRole(p.targetRole || "");
    const existingWeights = Array.isArray(p.weights) ? (p.weights as WeightEntry[]) : [];
    const merged = modelNodes.map((n) => {
      const existing = existingWeights.find((w) => w.nodeId === n.id);
      return { nodeId: n.id, weight: existing?.weight ?? 1 };
    });
    setEditWeights(merged);
  };

  const handleAiSuggest = async () => {
    setAiMessage("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_weights", context: { modelId: selectedModelId } }),
      });
      const data = await res.json();
      setAiMessage(data.message || data.error || "Unbekannte Antwort.");
    } catch { setAiMessage("Fehler bei der KI-Anfrage."); }
  };

  const renderWeightsTable = (weights: WeightEntry[], onChange: (idx: number, weight: number) => void, prefix: string) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Gewichtungen</label>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-medium text-slate-600">Kompetenz</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Gewicht</th>
          </tr></thead>
          <tbody>
            {weights.map((w, i) => {
              const node = modelNodes.find((n) => n.id === w.nodeId);
              return (
                <tr key={w.nodeId} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{node?.name || w.nodeId}</td>
                  <td className="px-3 py-2">
                    <input type="number" value={w.weight} onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)} step="0.1" min="0" className={`${inputClass} w-20 text-xs py-1`} data-testid={`${prefix}input-weight-${i}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Kompetenzmodell auswählen</label>
        <select value={selectedModelId} onChange={(e) => { setSelectedModelId(e.target.value); setEditingProfileId(null); }} data-testid="select-weight-model" className={inputClass}>
          <option value="">– Bitte wählen –</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {selectedModelId && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500" data-testid="text-profile-count">{profiles.length} Profile</p>
            <div className="flex gap-2">
              <button onClick={handleAiSuggest} data-testid="button-ai-suggest-weights" className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 transition-colors">
                KI-Assistent: Gewichtung vorschlagen
              </button>
              <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-profile" className={btnPrimary}>
                {showCreate ? "Abbrechen" : "Neues Profil"}
              </button>
            </div>
          </div>

          {aiMessage && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800" data-testid="text-ai-weight-message">
              {aiMessage}
            </div>
          )}

          {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

          {showCreate && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Gewichtungsprofil</h2>
              <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-profile">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-profile-name" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zielrolle</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)} data-testid="select-profile-role" className={inputClass}>
                      <option value="">– Keine –</option>
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                </div>
                {renderWeightsTable(newWeights, (i, w) => { const u = [...newWeights]; u[i] = { ...u[i], weight: w }; setNewWeights(u); }, "")}
                {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}
                <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-profile" className={`${btnPrimary} px-6 disabled:opacity-50`}>
                  {creating ? "Wird erstellt…" : "Profil erstellen"}
                </button>
              </form>
            </div>
          )}

          {loading && <p className="text-sm text-slate-400">Laden…</p>}

          <div className="space-y-4">
            {profiles.map((p) => {
              const badge = STATUS_BADGES[p.status] || STATUS_BADGES.draft;
              if (editingProfileId === p.id) {
                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6" data-testid={`card-profile-edit-${p.id}`}>
                    <h3 className="text-sm font-semibold text-brand-navy mb-3">Profil bearbeiten (Version {p.version} → {p.version + 1})</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-profile-name-${p.id}`} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Zielrolle</label>
                          <select value={editRole} onChange={(e) => setEditRole(e.target.value)} data-testid={`select-edit-profile-role-${p.id}`} className={inputClass}>
                            <option value="">– Keine –</option>
                            {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        </div>
                      </div>
                      {renderWeightsTable(editWeights, (i, w) => { const u = [...editWeights]; u[i] = { ...u[i], weight: w }; setEditWeights(u); }, "edit-")}
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(p.id)} data-testid={`button-save-profile-${p.id}`} className={`${btnPrimary} text-xs px-4 py-1.5`}>Speichern</button>
                        <button onClick={() => setEditingProfileId(null)} className="text-xs text-slate-500 hover:text-slate-700">Abbrechen</button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between" data-testid={`card-profile-${p.id}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-brand-navy">{p.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      {p.targetRole && <span>{ROLE_LABELS[p.targetRole] || p.targetRole}</span>}
                      <span>Version {p.version}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} data-testid={`button-edit-profile-${p.id}`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Bearbeiten</button>
                    <button onClick={() => handleDelete(p.id)} data-testid={`button-delete-profile-${p.id}`} className={btnDanger}>Löschen</button>
                  </div>
                </div>
              );
            })}
            {profiles.length === 0 && !loading && selectedModelId && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                Keine Gewichtungsprofile vorhanden.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MappingTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [mappings, setMappings] = useState<Record<string, Record<string, { mapped: boolean; weight: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  const fetchInit = useCallback(async () => {
    try {
      const [aRes, mRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments`),
        fetch(`/api/w/${workspaceSlug}/competency-models`),
      ]);
      if (aRes.status === 401 || mRes.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (aRes.ok) setAssessments(await aRes.json());
      if (mRes.ok) setModels(await mRes.json());
    } catch {}
  }, [workspaceSlug, router]);

  useEffect(() => { fetchInit(); }, [fetchInit]);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const leafNodes = (selectedModel?.nodes || []).filter((n) => {
    const hasChildren = (selectedModel?.nodes || []).some((c) => c.parentId === n.id);
    return !hasChildren;
  });

  const fetchMappingData = useCallback(async () => {
    if (!selectedAssessmentId || !selectedModelId) return;
    setLoading(true);
    setError("");
    try {
      const [detailRes, mapRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}`),
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercise-competency-mappings`),
      ]);
      if (!detailRes.ok) throw new Error();
      const detail = await detailRes.json();
      const exList: ExerciseRecord[] = detail.exercises || [];
      setExercises(exList);

      const existingMappings: MappingRecord[] = mapRes.ok ? await mapRes.json() : [];
      const grid: Record<string, Record<string, { mapped: boolean; weight: number }>> = {};
      for (const ex of exList) {
        grid[ex.id] = {};
        for (const node of leafNodes) {
          const existing = existingMappings.find((m) => m.exerciseId === ex.id && m.competencyNodeId === node.id);
          grid[ex.id][node.id] = { mapped: !!existing, weight: existing?.weight ?? 1 };
        }
      }
      setMappings(grid);
    } catch { setError("Fehler beim Laden der Zuordnungsdaten."); }
    finally { setLoading(false); }
  }, [workspaceSlug, selectedAssessmentId, selectedModelId, leafNodes.length]);

  useEffect(() => { fetchMappingData(); }, [selectedAssessmentId, selectedModelId]);

  const toggleMapping = (exerciseId: string, nodeId: string) => {
    setMappings((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [nodeId]: { ...prev[exerciseId][nodeId], mapped: !prev[exerciseId][nodeId].mapped },
      },
    }));
  };

  const updateWeight = (exerciseId: string, nodeId: string, weight: number) => {
    setMappings((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [nodeId]: { ...prev[exerciseId][nodeId], weight },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const flatMappings: { exerciseId: string; competencyNodeId: string; weight: number }[] = [];
      for (const exId of Object.keys(mappings)) {
        for (const nodeId of Object.keys(mappings[exId])) {
          const cell = mappings[exId][nodeId];
          if (cell.mapped) {
            flatMappings.push({ exerciseId: exId, competencyNodeId: nodeId, weight: cell.weight });
          }
        }
      }
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercise-competency-mappings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: flatMappings }),
      });
      if (res.ok) {
        setSaveMsg("Zuordnungen gespeichert.");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const d = await res.json();
        setSaveMsg(d.error || "Fehler beim Speichern.");
      }
    } catch { setSaveMsg("Etwas ist schiefgelaufen."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assessment auswählen</label>
            <select value={selectedAssessmentId} onChange={(e) => setSelectedAssessmentId(e.target.value)} data-testid="select-mapping-assessment" className={inputClass}>
              <option value="">– Bitte wählen –</option>
              {assessments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kompetenzmodell auswählen</label>
            <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} data-testid="select-mapping-model" className={inputClass}>
              <option value="">– Bitte wählen –</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      {selectedAssessmentId && selectedModelId && !loading && exercises.length > 0 && leafNodes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-navy">Zuordnungsmatrix</h2>
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-sm text-slate-500" data-testid="text-save-msg">{saveMsg}</span>}
              <button onClick={handleSave} disabled={saving} data-testid="button-save-mappings" className={`${btnPrimary} px-6 disabled:opacity-50`}>
                {saving ? "Wird gespeichert…" : "Zuordnungen speichern"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" data-testid="table-mapping-matrix">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 border-b border-slate-200 sticky left-0 bg-white min-w-[150px]">Übung</th>
                  {leafNodes.map((node) => (
                    <th key={node.id} className="text-center px-2 py-2 font-medium text-slate-600 border-b border-slate-200 min-w-[120px]">
                      <div className="text-xs leading-tight">{node.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => (
                  <tr key={ex.id} className="border-b border-slate-100" data-testid={`row-mapping-${ex.id}`}>
                    <td className="px-3 py-2 font-medium text-slate-900 sticky left-0 bg-white">{ex.name}</td>
                    {leafNodes.map((node) => {
                      const cell = mappings[ex.id]?.[node.id];
                      if (!cell) return <td key={node.id} className="px-2 py-2 text-center" />;
                      return (
                        <td key={node.id} className="px-2 py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              checked={cell.mapped}
                              onChange={() => toggleMapping(ex.id, node.id)}
                              data-testid={`checkbox-mapping-${ex.id}-${node.id}`}
                              className="rounded border-slate-300"
                            />
                            {cell.mapped && (
                              <input
                                type="number"
                                value={cell.weight}
                                onChange={(e) => updateWeight(ex.id, node.id, parseFloat(e.target.value) || 0)}
                                step="0.1"
                                min="0"
                                className="w-16 text-xs text-center rounded border border-slate-200 py-0.5"
                                data-testid={`input-mapping-weight-${ex.id}-${node.id}`}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAssessmentId && selectedModelId && !loading && exercises.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          Keine Übungen im ausgewählten Assessment vorhanden.
        </div>
      )}

      {selectedAssessmentId && selectedModelId && !loading && leafNodes.length === 0 && exercises.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          Keine Blatt-Kompetenzen im ausgewählten Modell vorhanden.
        </div>
      )}
    </div>
  );
}
