"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpSessionsPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/abcd-bdp/sessions")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  const stateLabel: Record<string, string> = { DRAFT: t("stateDraft"), OPEN: t("stateOpen"), CLOSED: t("stateClosed"), RELEASED: t("stateReleased") };
  const stateColor: Record<string, string> = { DRAFT: "bg-gray-200 text-gray-700", OPEN: "bg-green-100 text-green-800", CLOSED: "bg-orange-100 text-orange-800", RELEASED: "bg-blue-100 text-blue-800" };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-sessions-title">{t("sessionsTitle")}</h1>

      {error ? (
        <div className="bg-white rounded-2xl p-8 text-center" data-testid="bdp-auth-error">
          <p className="text-red-500 font-medium">{t("sessionsLoadError")}</p>
          <p className="text-gray-400 text-sm mt-2">{t("sessionsLoadErrorHint")}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center" data-testid="bdp-sessions-empty">
          <p className="text-gray-500 font-medium">{t("sessionsEmpty")}</p>
          <p className="text-gray-400 text-sm mt-2">{t("sessionsEmptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link key={s.id} href={`/abcd-bdp/sessions/${s.id}`} data-testid={`bdp-session-row-${s.id}`} className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">{s.name}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${stateColor[s.state] || "bg-gray-100"}`}>
                  {stateLabel[s.state] || s.state}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t("teams")}:</span>{" "}
                  {s.sessionTeams?.map((st: any) => st.team.displayName ? `${st.team.displayName} (${st.team.code})` : st.team.code).join(", ") || "–"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t("observers")}:</span>{" "}
                  {s.observerAssignments?.map((oa: any) => oa.user.displayName || oa.user.code).join(", ") || "–"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
