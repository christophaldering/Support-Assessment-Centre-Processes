"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  session_opened: "🟢",
  session_closed: "🔒",
  session_released: "📊",
  observer_assigned: "👤",
  observer_removed: "❌",
  score_submitted: "📝",
  tie_break_set: "⚖️",
  demo_reset: "🔄",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

export default function NotificationBell({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/arag-bdp/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/arag-bdp/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/arag-bdp/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const isDesktop = variant === "desktop";

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid="bdp-notification-bell"
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className={`relative flex items-center justify-center transition-colors ${
          isDesktop
            ? "w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-black/50"
            : "w-8 h-8 text-white"
        }`}
      >
        <Bell size={isDesktop ? 14 : 18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span
            data-testid="bdp-notification-badge"
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="bdp-notification-panel"
          className={`absolute z-[100] bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden ${
            isDesktop
              ? "right-0 top-10 w-[380px]"
              : "right-0 top-10 w-[320px]"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <span className="text-sm font-bold text-black">Benachrichtigungen</span>
            {unreadCount > 0 && (
              <button
                data-testid="bdp-notification-mark-all"
                onClick={markAllRead}
                className="text-[11px] text-[#FFD700] hover:text-[#e6c200] font-semibold flex items-center gap-1"
              >
                <CheckCheck size={12} />
                Alle gelesen
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-black/40">
                Keine Benachrichtigungen
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  data-testid={`bdp-notification-item-${n.id}`}
                  className={`px-4 py-3 border-b border-black/5 last:border-0 transition-colors ${
                    n.read ? "bg-white" : "bg-[#FFFBF0]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5 shrink-0">{typeIcons[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black truncate">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#FFD700] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-black/60 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-black/30">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => { markRead(n.id); setOpen(false); }}
                            className="text-[10px] text-[#FFD700] hover:text-[#e6c200] font-semibold flex items-center gap-0.5"
                          >
                            Anzeigen <ExternalLink size={9} />
                          </Link>
                        )}
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-[10px] text-black/30 hover:text-black/60 flex items-center gap-0.5"
                          >
                            <Check size={9} /> Gelesen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
