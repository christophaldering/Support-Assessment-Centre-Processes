"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PROMPT_SLOT_KEYS, type PromptSlotKey } from "@/lib/prompt-library";

interface SlotData {
  key: PromptSlotKey;
  label: string;
  description: string;
  defaultPrompt: string;
  customBody: string | null;
  isCustomized: boolean;
  updatedAt: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function PromptCard({ slot, workspaceSlug, onSaved, onReset }: {
  slot: SlotData;
  workspaceSlug: string;
  onSaved: (key: PromptSlotKey, body: string) => void;
  onReset: (key: PromptSlotKey) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slot.customBody ?? slot.defaultPrompt);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  useEffect(() => {
    setValue(slot.customBody ?? slot.defaultPrompt);
  }, [slot.customBody, slot.defaultPrompt]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/prompt-templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotKey: slot.key, body: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Speichern");
      setMsg({ text: "Gespeichert ✓", type: "ok" });
      setEditing(false);
      onSaved(slot.key, value);
    } catch (e: any) {
      setMsg({ text: e.message, type: "err" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Eigenen Prompt löschen und auf Standard zurücksetzen?")) return;
    setResetting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/prompt-templates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotKey: slot.key }),
      });
      if (!res.ok) throw new Error("Fehler beim Zurücksetzen");
      setMsg({ text: "Auf Standard zurückgesetzt ✓", type: "ok" });
      setValue(slot.defaultPrompt);
      setEditing(false);
      onReset(slot.key);
    } catch (e: any) {
      setMsg({ text: e.message, type: "err" });
    } finally {
      setResetting(false);
    }
  }

  function handleEdit() {
    setValue(slot.customBody ?? slot.defaultPrompt);
    setEditing(true);
    setExpanded(true);
  }

  function handleCancel() {
    setValue(slot.customBody ?? slot.defaultPrompt);
    setEditing(false);
    setMsg(null);
  }

  const displayText = slot.customBody ?? slot.defaultPrompt;
  const isCustomized = slot.isCustomized;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      data-testid={`card-prompt-${slot.key}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-base font-semibold text-slate-800">{slot.label}</h2>
            {isCustomized ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                ✦ Angepasst
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Standard
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{slot.description}</p>
          {isCustomized && slot.updatedAt && (
            <p className="text-xs text-slate-400 mt-1">Geändert: {formatDate(slot.updatedAt)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={handleEdit}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#A6473B] hover:text-[#A6473B] transition-colors"
              data-testid={`button-edit-${slot.key}`}
            >
              Bearbeiten
            </button>
          )}
          {isCustomized && !editing && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              data-testid={`button-reset-${slot.key}`}
            >
              {resetting ? "…" : "Zurücksetzen"}
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded"
            data-testid={`button-toggle-${slot.key}`}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          {editing ? (
            <>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-[#297587] resize-y leading-relaxed"
                data-testid={`textarea-prompt-${slot.key}`}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || value.trim().length < 10}
                  className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#A6473B" }}
                  data-testid={`button-save-${slot.key}`}
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  data-testid={`button-cancel-${slot.key}`}
                >
                  Abbrechen
                </button>
                {msg && (
                  <span className={`text-xs ml-2 ${msg.type === "ok" ? "text-teal-700" : "text-red-600"}`}>
                    {msg.text}
                  </span>
                )}
              </div>
            </>
          ) : (
            <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">
              {displayText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function PromptLibraryPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!workspaceSlug) return;
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/prompt-templates`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      setSlots(json.slots || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  function handleSaved(key: PromptSlotKey, body: string) {
    setSlots((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, customBody: body, isCustomized: true, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }

  function handleReset(key: PromptSlotKey) {
    setSlots((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, customBody: null, isCustomized: false, updatedAt: null }
          : s
      )
    );
  }

  const customizedCount = slots.filter((s) => s.isCustomized).length;

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#A6473B" }} data-testid="heading-prompt-library">
              KI-Prompt-Bibliothek
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl" data-testid="text-subtitle">
              Passen Sie die System-Prompts für KI-Funktionen in diesem Workspace an. Nicht bearbeitete Slots
              nutzen automatisch die Plattform-Standards — eigene Prompts überschreiben diese workspace-weit.
            </p>
          </div>
          {customizedCount > 0 && (
            <div
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700"
              data-testid="badge-customized-count"
            >
              {customizedCount} von {slots.length} Slots angepasst
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <strong>Hinweis:</strong> Änderungen wirken sofort bei der nächsten KI-Anfrage.
          Die Standard-Prompts bleiben gespeichert und können jederzeit wiederhergestellt werden.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" data-testid="text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {PROMPT_SLOT_KEYS.map((key) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => (
            <PromptCard
              key={slot.key}
              slot={slot}
              workspaceSlug={workspaceSlug}
              onSaved={handleSaved}
              onReset={handleReset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
