"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BdpSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(setSessions).catch(() => {});
  }, []);

  const stateLabel: Record<string, string> = { DRAFT: "Entwurf", OPEN: "Offen", CLOSED: "Geschlossen", RELEASED: "Freigegeben" };
  const stateColor: Record<string, string> = { DRAFT: "bg-gray-200 text-gray-700", OPEN: "bg-green-100 text-green-800", CLOSED: "bg-orange-100 text-orange-800", RELEASED: "bg-blue-100 text-blue-800" };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-sessions-title">Sessions</h1>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
          Keine Sessions gefunden
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link key={s.id} href={`/arag-bdp/sessions/${s.id}`} data-testid={`card-session-${s.id}`} className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">{s.name}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${stateColor[s.state] || "bg-gray-100"}`}>
                  {stateLabel[s.state] || s.state}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Teams:</span>{" "}
                  {s.sessionTeams?.map((st: any) => st.team.code).join(", ") || "–"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Beobachter:</span>{" "}
                  {s.observerAssignments?.map((oa: any) => oa.user.code).join(", ") || "–"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
