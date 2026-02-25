"use client";

import { useState, useEffect } from "react";
import { useBdp } from "./bdp-context";
import Link from "next/link";

export default function BdpHomePage() {
  const { user } = useBdp();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});
  }, []);

  const stateLabel: Record<string, string> = { DRAFT: "Entwurf", OPEN: "Offen", CLOSED: "Geschlossen", RELEASED: "Freigegeben" };
  const stateColor: Record<string, string> = { DRAFT: "bg-gray-200 text-gray-700", OPEN: "bg-green-100 text-green-800", CLOSED: "bg-orange-100 text-orange-800", RELEASED: "bg-blue-100 text-blue-800" };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold" data-testid="text-welcome">Willkommen, {user.code}!</h1>
        <p className="text-gray-500 mt-1">ARAG Business Development Pitch Evaluation</p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">Rolle: {user.role}</span>
          {user.isAdmin && <span className="text-xs px-2 py-1 bg-[#FFD700] rounded-full font-bold">Admin</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine Sessions vorhanden. Bitte Seed-Daten laden.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <Link key={s.id} href={`/arag-bdp/sessions/${s.id}`} data-testid={`card-session-${s.id}`} className="block p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${stateColor[s.state] || "bg-gray-100"}`}>{stateLabel[s.state] || s.state}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {s.sessionTeams?.length || 0} Teams · {s.observerAssignments?.length || 0} Beobachter
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/arag-bdp/bewertung" data-testid="link-quick-bewertung" className="p-4 bg-[#FFFBF0] rounded-xl text-center hover:bg-[#FFD700]/10 transition-colors">
            <span className="text-2xl">⭐</span>
            <p className="text-sm font-medium mt-1">Bewertung</p>
          </Link>
          <Link href="/arag-bdp/auswertung" data-testid="link-quick-auswertung" className="p-4 bg-[#FFFBF0] rounded-xl text-center hover:bg-[#FFD700]/10 transition-colors">
            <span className="text-2xl">📊</span>
            <p className="text-sm font-medium mt-1">Auswertung</p>
          </Link>
          {user.isAdmin && (
            <Link href="/arag-bdp/admin" data-testid="link-quick-admin" className="p-4 bg-[#FFFBF0] rounded-xl text-center hover:bg-[#FFD700]/10 transition-colors col-span-2">
              <span className="text-2xl">⚙️</span>
              <p className="text-sm font-medium mt-1">Admin-Konsole</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
