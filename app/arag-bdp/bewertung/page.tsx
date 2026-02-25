"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBdp } from "../bdp-context";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpBewertungPage() {
  const { user } = useBdp();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(setSessions).catch(() => {});
  }, []);

  const openSessions = sessions.filter(s => s.state === "OPEN");
  const closedSessions = sessions.filter(s => s.state === "CLOSED" || s.state === "RELEASED");
  const assignedSessions = sessions.filter(s =>
    s.observerAssignments?.some((oa: any) => oa.user.id === user?.id || oa.user.code === user?.code)
  );

  const stateLabel: Record<string, string> = { OPEN: t("stateOpen"), CLOSED: t("stateClosed"), RELEASED: t("stateReleased") };
  const stateColor: Record<string, string> = { OPEN: "bg-green-100 text-green-800", CLOSED: "bg-orange-100 text-orange-800", RELEASED: "bg-blue-100 text-blue-800" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-bewertung-title">{t("ratingTitle")}</h1>

      {openSessions.length === 0 && closedSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">⏳</span>
          <p className="text-gray-500">{t("noSessionsForRating")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("noSessionsForRatingHint")}</p>
        </div>
      ) : (
        <>
          {openSessions.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 text-green-700">{t("openSessions")}</h2>
              <div className="space-y-3">
                {openSessions.map(s => (
                  <Link key={s.id} href={`/arag-bdp/bewertung/${s.id}`} data-testid={`card-score-session-${s.id}`} className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-green-400">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{s.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{s.sessionTeams?.length || 0} {t("teams")}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${stateColor[s.state]}`}>{stateLabel[s.state]}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {closedSessions.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 text-gray-500">
                {user?.environment === "demo" ? t("closedSessionsDemo") : t("closedSessionsReadonly")}
              </h2>
              <div className="space-y-3">
                {closedSessions.map(s => (
                  <Link key={s.id} href={`/arag-bdp/bewertung/${s.id}`} data-testid={`card-readonly-session-${s.id}`} className={`block bg-white rounded-2xl p-5 shadow-sm ${user?.environment === "demo" ? "hover:shadow-md transition-all border-l-4 border-[#FFD700]" : "opacity-75"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{s.name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${stateColor[s.state]}`}>{stateLabel[s.state]}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
