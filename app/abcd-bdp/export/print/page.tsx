"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpPrintPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const bdpRes = await fetch("/api/abcd-bdp/auth/session");
        const bdpData = await bdpRes.json();
        if (!bdpData.authenticated || !bdpData.user?.isAdmin) {
          const meRes = await fetch("/api/auth/me");
          if (!meRes.ok) { router.push("/w/abcd"); return; }
          const meData = await meRes.json();
          if (!meData.roles?.includes("ADMIN") && !meData.roles?.includes("WORKSPACE_ADMIN")) {
            router.push("/abcd-bdp"); return;
          }
        }
        setIsAdmin(true);

        const sessRes = await fetch("/api/abcd-bdp/sessions");
        const allSessions = await sessRes.json();
        const released = allSessions.filter((s: any) => s.state === "RELEASED");
        setSessions(released);

        const results: Record<string, any> = {};
        for (const s of released) {
          try {
            const res = await fetch(`/api/abcd-bdp/results?sessionId=${s.id}`);
            results[s.id] = await res.json();
          } catch {}
        }
        setAllResults(results);

        try {
          const exportRes = await fetch("/api/abcd-bdp/export?format=json&include_demo=false");
          if (exportRes.ok) {
            const exportData = await exportRes.json();
            setNotes(exportData.notes || []);
          }
        } catch {}
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8 text-center">{t("loading")}</div>;
  if (!isAdmin) return null;

  const dateLocale = lang === "de" ? "de-DE" : "en-US";

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-4" data-testid="print-view">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="text-center mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-black">{t("printTitle")}</h1>
        <p className="text-gray-500 mt-1">{t("resultReport")}</p>
        <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <button onClick={() => window.print()} className="no-print mb-6 bg-[#0071e3] text-black px-6 py-2 rounded-lg font-bold" data-testid="button-print">
        {t("print")}
      </button>

      {sessions.length === 0 ? (
        <p className="text-gray-400 text-center py-8">{t("noClosedSessions")}</p>
      ) : (
        sessions.map(s => {
          const result = allResults[s.id];
          if (!result || result.error) return null;

          const sessionNotes = notes.filter((n: any) => n.session === s.id);

          return (
            <div key={s.id} className="mb-12 break-inside-avoid">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">{s.name}</h2>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">{t("rank")}</th>
                    <th className="text-left p-2">{t("teams")}</th>
                    <th className="text-right p-2">{t("total")}</th>
                    {result.criteria?.map((c: any) => (
                      <th key={c.id} className="text-right p-2 text-xs">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.ranked?.map((r: any, idx: number) => (
                    <tr key={r.teamId} className={idx === 0 ? "bg-yellow-50 font-bold" : ""}>
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{r.teamCode}</td>
                      <td className="p-2 text-right">{r.total}</td>
                      {result.criteria?.map((c: any) => (
                        <td key={c.id} className="p-2 text-right">{r.byCriterion[c.id] || 0}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.isTie && result.tieBreak && (
                <div className="p-3 bg-blue-50 rounded text-sm mb-4">
                  <strong>{t("tieBreak")}:</strong> {t("winner")} {result.ranked.find((r: any) => r.teamId === result.tieBreak.winnerTeamId)?.teamCode || "–"}
                  {result.tieBreak.rationale && ` — ${result.tieBreak.rationale}`}
                </div>
              )}

              {sessionNotes.length > 0 && (
                <div className="mt-4 page-break">
                  <h3 className="font-bold text-sm mb-2">{t("individualNotes")}</h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-1.5">{t("participants")}</th>
                        <th className="text-left p-1.5">{t("observerLabel")}</th>
                        <th className="text-left p-1.5">{t("criteria")}</th>
                        <th className="text-left p-1.5">{t("note")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionNotes.map((n: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="p-1.5">{n.participant}</td>
                          <td className="p-1.5">{n.observer}</td>
                          <td className="p-1.5">{n.criterion}</td>
                          <td className="p-1.5">{n.note || n.generalNote || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 print:fixed print:bottom-0 print:left-0 print:right-0 print:py-2 print:bg-white">
        <div className="flex items-center justify-center gap-2">
          <svg width="80" height="16" viewBox="0 0 80 16" className="inline-block">
            <text x="0" y="12" fontSize="11" fontWeight="bold" fill="#A6473B" fontFamily="sans-serif">Executive Diagnostics Suite</text>
          </svg>
        </div>
        <p className="mt-1">{t("poweredBy")} Executive Diagnostics Suite</p>
      </footer>
    </div>
  );
}
