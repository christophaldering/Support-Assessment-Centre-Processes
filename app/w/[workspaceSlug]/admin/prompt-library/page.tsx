"use client";

import { PageHeader } from "@/components/shared/PageHeader";
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
      className="bg-white rounded-xl border border-[var(--eds-border)] shadow-sm overflow-hidden"
      data-testid={`card-prompt-${slot.key}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-base font-semibold text-[var(--eds-text-primary)]">{slot.label}</h2>
            {isCustomized ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                ✦ Angepasst
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]">
                Standard
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--eds-text-tertiary)]">{slot.description}</p>
          {isCustomized && slot.updatedAt && (
            <p className="text-xs text-[var(--eds-text-disabled)] mt-1">Geändert: {formatDate(slot.updatedAt)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={handleEdit}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--eds-border)] hover:border-[var(--eds-terracotta)] hover:text-[var(--eds-terracotta)] transition-colors"
              data-testid={`button-edit-${slot.key}`}
            >
              Bearbeiten
            </button>
          )}
          {isCustomized && !editing && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--eds-border)] text-[var(--eds-status-red)] hover:bg-[var(--eds-status-red-bg)] transition-colors disabled:opacity-50"
              data-testid={`button-reset-${slot.key}`}
            >
              {resetting ? "…" : "Zurücksetzen"}
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] px-2 py-1.5 rounded"
            data-testid={`button-toggle-${slot.key}`}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[var(--eds-border)] p-5 space-y-3">
          {editing ? (
            <>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs border border-[var(--eds-border)] rounded-lg p-3 focus:outline-none focus:border-[var(--eds-lagune)] resize-y leading-relaxed"
                data-testid={`textarea-prompt-${slot.key}`}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || value.trim().length < 10}
                  className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "var(--eds-terracotta)" }}
                  data-testid={`button-save-${slot.key}`}
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-sm px-4 py-2 rounded-lg border border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
                  data-testid={`button-cancel-${slot.key}`}
                >
                  Abbrechen
                </button>
                {msg && (
                  <span className={`text-xs ml-2 ${msg.type === "ok" ? "text-teal-700" : "text-[var(--eds-status-red)]"}`}>
                    {msg.text}
                  </span>
                )}
              </div>
            </>
          ) : (
            <pre className="text-xs text-[var(--eds-text-secondary)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--eds-bg-sunken)] rounded-lg p-3 max-h-64 overflow-y-auto">
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
      <PageHeader
        title="KI-Prompt-Bibliothek"
        description="System-Prompts für KI-Funktionen anpassen — workspace-weit. Nicht bearbeitete Slots nutzen automatisch die Plattform-Standards."
        // no-eds-token: teal badge uses Lagune-Türkis brand color, no EDS token equivalent
        actions={customizedCount > 0 ? (
          <div
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700"
            data-testid="badge-customized-count"
          >
            {customizedCount} von {slots.length} Slots angepasst
          </div>
        ) : undefined}
      />

      {/* Info banner */}
      <div className="p-3 bg-[var(--eds-status-blue-bg)] border border-[var(--eds-border)] rounded-lg text-xs text-[var(--eds-status-blue)]">
        <strong>Hinweis:</strong> Änderungen wirken sofort bei der nächsten KI-Anfrage.
        Die Standard-Prompts bleiben gespeichert und können jederzeit wiederhergestellt werden.
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-xl text-sm text-[var(--eds-status-red)]" data-testid="text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {PROMPT_SLOT_KEYS.map((key) => (
            <div key={key} className="bg-white rounded-xl border border-[var(--eds-border)] h-24 animate-pulse" />
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
