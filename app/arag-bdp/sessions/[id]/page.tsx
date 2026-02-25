"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BdpSessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions")
      .then(r => r.json())
      .then((sessions: any[]) => {
        const s = sessions.find((s: any) => s.id === params.id);
        if (s) {
          setSession(s);
          setTeams(s.sessionTeams?.map((st: any) => st.team) || []);
        }
      })
      .catch(() => {});
  }, [params.id]);

  const stateLabel: Record<string, string> = { DRAFT: "Entwurf", OPEN: "Offen", CLOSED: "Geschlossen", RELEASED: "Abgeschlossen" };
  const stateColor: Record<string, string> = { DRAFT: "bg-gray-200 text-gray-700", OPEN: "bg-green-100 text-green-800", CLOSED: "bg-orange-100 text-orange-800", RELEASED: "bg-blue-100 text-blue-800" };

  if (!session) return <div className="text-center py-8 text-gray-400">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/arag-bdp/sessions" className="text-gray-400 hover:text-black">← Zurück</Link>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" data-testid="text-session-name">{session.name}</h1>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${stateColor[session.state] || "bg-gray-100"}`}>
            {stateLabel[session.state] || session.state}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-3">Teams</h2>
        {teams.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine Teams zugeordnet</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t: any) => (
              <div key={t.id} data-testid={`text-team-${t.code}`} className="p-3 bg-[#FFFBF0] rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center font-bold text-sm">{t.code.replace("Team", "T")}</div>
                <span className="font-medium">{t.displayName ? `${t.displayName} (${t.code})` : t.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-3">Beobachter</h2>
        <div className="space-y-2">
          {session.observerAssignments?.map((oa: any) => (
            <div key={oa.id} className="p-3 bg-[#FFFBF0] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-[#FFD700] font-bold text-sm">{oa.user.code}</div>
                <div>
                  <span className="font-medium">{oa.user.displayName || oa.user.code}</span>
                  <span className="text-xs text-gray-400 ml-2">{oa.user.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {session.state === "OPEN" && (
        <Link href={`/arag-bdp/bewertung/${session.id}`} data-testid="link-start-bewertung" className="block bg-[#FFD700] text-black font-bold py-4 rounded-2xl text-center hover:bg-[#E6C200] transition-colors">
          Bewertung starten →
        </Link>
      )}
    </div>
  );
}
