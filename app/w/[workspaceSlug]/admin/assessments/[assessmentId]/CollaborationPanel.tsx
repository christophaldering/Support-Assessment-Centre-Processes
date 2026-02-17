"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface CollaborationPanelProps {
  workspaceSlug: string;
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PresenceUser {
  userId: string;
  userName: string;
  userRole: string;
  lastSeenAt: string;
}

interface CollabEvent {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  payload: any;
  createdAt: string;
}

interface CollabNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  HR_CLIENT: "HR-Auftraggeber",
};

const ACCENT = "hsl(14, 48%, 44%)";

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.floor(hours / 24)} Tg.`;
}

function eventDescription(event: CollabEvent): string {
  switch (event.eventType) {
    case "rating_submitted": {
      const p = event.payload || {};
      let desc = "hat eine Bewertung abgegeben";
      if (p.rating !== undefined) desc += ` (${p.rating})`;
      if (p.exerciseName) desc += ` – ${p.exerciseName}`;
      return desc;
    }
    case "rating_updated":
      return "hat eine Bewertung aktualisiert";
    case "note_added":
      return "hat eine Notiz hinzugefügt";
    case "comment":
      return event.payload?.text || "";
    case "typing":
      return "tippt...";
    case "viewing_exercise":
      return `betrachtet Übung ${event.payload?.exerciseName || ""}`;
    default:
      return event.eventType;
  }
}

function UserInitial({ name }: { name: string }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ backgroundColor: ACCENT }}
    >
      {initial}
    </div>
  );
}

export default function CollaborationPanel({ workspaceSlug, assessmentId, isOpen, onClose }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<"presence" | "events" | "notes">("presence");
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [events, setEvents] = useState<CollabEvent[]>([]);
  const [notes, setNotes] = useState<CollabNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  const lastEventTimestamp = useRef<string>("");
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const apiBase = `/api/w/${workspaceSlug}/assessments/${assessmentId}/collaboration`;

  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch(`${apiBase}/presence`, { method: "POST" });
    } catch {}
  }, [apiBase]);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/presence`);
      if (res.ok) {
        const data = await res.json();
        setPresence(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [apiBase]);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (lastEventTimestamp.current) params.set("after", lastEventTimestamp.current);
      const res = await fetch(`${apiBase}/events?${params}`);
      if (res.ok) {
        const data: CollabEvent[] = await res.json();
        if (data.length > 0) {
          lastEventTimestamp.current = data[data.length - 1].createdAt;
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEvents = data.filter((e) => !existingIds.has(e.id));
            if (newEvents.length === 0) return prev;

            const typingEvts = newEvents.filter((e) => e.eventType === "typing");
            if (typingEvts.length > 0) {
              setTypingUsers((prev) => {
                const next = { ...prev };
                typingEvts.forEach((e) => {
                  if (next[e.userId]) clearTimeout(next[e.userId]);
                  next[e.userId] = window.setTimeout(() => {
                    setTypingUsers((p) => {
                      const n = { ...p };
                      delete n[e.userId];
                      return n;
                    });
                  }, 5000);
                });
                return next;
              });
            }

            return [...prev, ...newEvents.filter((e) => e.eventType !== "typing")];
          });
        }
      }
    } catch {}
  }, [apiBase]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [apiBase]);

  useEffect(() => {
    if (!isOpen) return;
    sendHeartbeat();
    fetchPresence();
    fetchEvents();
    fetchNotes();

    const presenceInterval = setInterval(() => {
      sendHeartbeat();
      fetchPresence();
    }, 15000);

    const eventsInterval = setInterval(fetchEvents, 10000);

    return () => {
      clearInterval(presenceInterval);
      clearInterval(eventsInterval);
    };
  }, [isOpen, sendHeartbeat, fetchPresence, fetchEvents, fetchNotes]);

  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await fetch(`${apiBase}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote("");
      fetchNotes();
    } catch {}
  };

  const handleTogglePin = async (noteId: string, pinned: boolean) => {
    try {
      await fetch(`${apiBase}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
      fetchNotes();
    } catch {}
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`${apiBase}/notes/${noteId}`, { method: "DELETE" });
      fetchNotes();
    } catch {}
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tabs = [
    { key: "presence" as const, label: "Aktive Beobachter", badge: presence.length },
    { key: "events" as const, label: "Aktivitäts-Feed", badge: null },
    { key: "notes" as const, label: "Gemeinsame Notizen", badge: null },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
          data-testid="collaboration-overlay"
        />
      )}
      <div
        className="fixed top-0 right-0 h-full z-40 bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 380,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          fontFamily: "Inter, sans-serif",
        }}
        data-testid="collaboration-panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Zusammenarbeit</h2>
          <button
            onClick={onClose}
            data-testid="button-close-collaboration"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className="flex-1 py-2.5 text-xs font-medium text-center transition-colors relative"
              style={{
                color: activeTab === tab.key ? ACCENT : "#64748b",
                borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : "2px solid transparent",
              }}
            >
              {tab.label}
              {tab.badge !== null && tab.badge > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                  style={{ backgroundColor: ACCENT }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "presence" && (
            <div className="p-4 space-y-3" data-testid="presence-list">
              {presence.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Keine aktiven Beobachter.</p>
              )}
              {presence.map((u) => (
                <div key={u.userId} className="flex items-center gap-3 py-2" data-testid={`presence-user-${u.userId}`}>
                  <div className="relative">
                    <UserInitial name={u.userName} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.userName}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[u.userRole] || u.userRole}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "events" && (
            <div className="p-4 space-y-3" data-testid="events-list">
              {events.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Noch keine Aktivitäten.</p>
              )}
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 py-1" data-testid={`event-${ev.id}`}>
                  <UserInitial name={ev.userName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{ev.userName}</span>{" "}
                      <span className="text-slate-600">
                        {ev.eventType === "comment" ? (
                          <>: &ldquo;{eventDescription(ev)}&rdquo;</>
                        ) : (
                          eventDescription(ev)
                        )}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{relativeTime(ev.createdAt)}</p>
                  </div>
                </div>
              ))}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                  Jemand tippt...
                </div>
              )}
              <div ref={eventsEndRef} />
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex flex-col h-full" data-testid="notes-list">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedNotes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Keine Notizen vorhanden.</p>
                )}
                {sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 rounded-lg p-3"
                    data-testid={`note-${note.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">{note.authorName}</span>
                          {note.pinned && (
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-slate-400 mt-1">{relativeTime(note.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleTogglePin(note.id, note.pinned)}
                          data-testid={`button-pin-${note.id}`}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          title={note.pinned ? "Lösen" : "Anheften"}
                        >
                          <svg className="w-4 h-4" fill={note.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          data-testid={`button-delete-note-${note.id}`}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                          title="Löschen"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleAddNote}
                className="border-t border-slate-200 p-3 flex gap-2"
                data-testid="form-add-note"
              >
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Notiz hinzufügen..."
                  data-testid="input-new-note"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ focusRingColor: ACCENT } as any}
                />
                <button
                  type="submit"
                  data-testid="button-send-note"
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: ACCENT }}
                >
                  Senden
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}