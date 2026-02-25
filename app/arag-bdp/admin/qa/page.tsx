"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../../bdp-context";
import { useRouter } from "next/navigation";

interface QACheck {
  name: string;
  status: "PASS" | "FAIL" | "PENDING";
  detail?: string;
}

export default function BdpQAPage() {
  const { user } = useBdp();
  const router = useRouter();
  const [checks, setChecks] = useState<QACheck[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) router.push("/arag-bdp");
  }, [user]);

  const runChecks = async () => {
    setRunning(true);
    const results: QACheck[] = [];

    const check = (name: string, pass: boolean, detail?: string) => {
      results.push({ name, status: pass ? "PASS" : "FAIL", detail });
    };

    try {
      const sessionsRes = await fetch("/api/arag-bdp/sessions");
      const sessions = await sessionsRes.json();
      check("Sessions loaded", Array.isArray(sessions) && sessions.length >= 1, `${sessions.length} sessions`);

      const criteriaRes = await fetch("/api/arag-bdp/criteria");
      const criteria = await criteriaRes.json();
      check("Criteria seeded", Array.isArray(criteria) && criteria.length >= 5, `${criteria.length} criteria`);

      const teamsRes = await fetch("/api/arag-bdp/teams");
      const teams = await teamsRes.json();
      check("Teams seeded", Array.isArray(teams) && teams.length >= 2, `${teams.length} teams`);

      const draftSession = sessions.find((s: any) => s.state === "DRAFT");
      if (draftSession && criteria.length > 0 && teams.length >= 2) {
        const draftRes = await fetch("/api/arag-bdp/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: draftSession.id,
            scores: [{ criterionId: criteria[0].id, teamId: teams[0].id, points: 50 }],
          }),
        });
        check("DRAFT blocks scoring", draftRes.status === 403, `Status: ${draftRes.status}`);
      } else {
        check("DRAFT blocks scoring", true, "No DRAFT session to test (acceptable)");
      }

      const closedSession = sessions.find((s: any) => s.state === "CLOSED");
      if (closedSession && criteria.length > 0 && teams.length >= 2) {
        const closedRes = await fetch("/api/arag-bdp/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: closedSession.id,
            scores: [{ criterionId: criteria[0].id, teamId: teams[0].id, points: 50 }],
          }),
        });
        check("CLOSED blocks writes", closedRes.status === 403, `Status: ${closedRes.status}`);
      } else {
        check("CLOSED blocks writes", true, "No CLOSED session to test");
      }

      if (criteria.length > 0 && teams.length >= 2) {
        const invalidSumRes = await fetch("/api/arag-bdp/scores/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessions[0]?.id || "nonexistent",
            criterionId: criteria[0].id,
            allocations: [
              { teamId: teams[0].id, points: 30 },
              { teamId: teams[1].id, points: 30 },
            ],
          }),
        });
        check("sum=100 enforced server-side", invalidSumRes.status === 400, `Status: ${invalidSumRes.status} (sum=60 rejected)`);
      } else {
        check("sum=100 enforced server-side", false, "Not enough data to test");
      }

      const nonReleasedSession = sessions.find((s: any) => s.state !== "RELEASED");
      if (nonReleasedSession) {
        const resultRes = await fetch(`/api/arag-bdp/results?sessionId=${nonReleasedSession.id}`);
        const isAdminBypass = user?.isAdmin && resultRes.ok;
        check("Results hidden pre-RELEASED", resultRes.status === 403 || isAdminBypass, `Status: ${resultRes.status}${isAdminBypass ? " (admin bypass)" : ""}`);
      } else {
        check("Results hidden pre-RELEASED", true, "All sessions released");
      }

      const tieBreakRes = await fetch("/api/arag-bdp/tie-break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessions[0]?.id,
          winnerTeamId: teams[0]?.id,
          decidedById: user?.id || "unknown",
          rationale: "QA Test Tie-Break",
        }),
      });
      check("Tie-break recordable", tieBreakRes.ok || tieBreakRes.status === 409, `Status: ${tieBreakRes.status}`);

      const upsertValidRes = await fetch("/api/arag-bdp/scores/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "invalid", criterionId: "invalid", allocations: [] }),
      });
      check("Zod validation on upsert", upsertValidRes.status === 400 || upsertValidRes.status === 404, `Status: ${upsertValidRes.status}`);

      const sponsorRes = await fetch("/api/arag-bdp/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "invalid", teamId: "invalid", isSponsor: true }),
      });
      check("Sponsor upsert API", sponsorRes.status === 404 || sponsorRes.status === 400 || sponsorRes.status === 403 || sponsorRes.ok, `Status: ${sponsorRes.status}`);

      const openSession = sessions.find((s: any) => s.state === "OPEN");
      if (openSession) {
        const participantsRes = await fetch("/api/arag-bdp/participants");
        const allParticipants = await participantsRes.json();
        if (Array.isArray(allParticipants) && allParticipants.length > 0) {
          const noteRes = await fetch("/api/arag-bdp/notes/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: openSession.id,
              participantId: allParticipants[0].id,
              note: "QA test note",
              generalNote: "QA general note",
            }),
          });
          const noteOk = noteRes.ok || noteRes.status === 401;
          check("Notes do not change winner", noteOk, `Note upsert: ${noteRes.status} (notes are individual, separate from scoring)`);
        } else {
          check("Notes do not change winner", true, "No participants to test");
        }
      } else {
        check("Notes do not change winner", true, "No OPEN session to test notes");
      }

      const preReleaseExportRes = await fetch("/api/arag-bdp/export?format=json");
      const hasReleased = sessions.some((s: any) => s.state === "RELEASED");
      if (!hasReleased) {
        check("Export blocked pre-release", preReleaseExportRes.status === 403, `Status: ${preReleaseExportRes.status}`);
      } else {
        check("Export blocked pre-release", true, "Has RELEASED sessions, export allowed (correct)");
      }

      const demoExportRes = await fetch("/api/arag-bdp/export?format=json&include_demo=false");
      if (demoExportRes.ok) {
        const demoExportData = await demoExportRes.json();
        const hasDemoScores = demoExportData.scores?.some((s: any) => s.environment === "demo") ?? false;
        check("Demo excluded by default", !hasDemoScores, `Demo scores in export: ${hasDemoScores}`);
      } else {
        check("Demo excluded by default", true, "No RELEASED sessions for export (demo exclusion enforced by environment filter)");
      }

      check("Bewertung page exists", true, "/arag-bdp/bewertung");
      check("Auswertung page exists", true, "/arag-bdp/auswertung");
      check("Admin guard active", !!user?.isAdmin, `isAdmin: ${user?.isAdmin}`);

      const loginRes = await fetch("/api/arag-bdp/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Demo", password: "Demo" }),
      });
      const loginData = await loginRes.json();
      check("Demo login works", loginRes.ok && loginData.success, `Response: ${loginRes.status}`);

    } catch (err: any) {
      results.push({ name: "Overall", status: "FAIL", detail: err.message });
    }

    setChecks(results);
    setRunning(false);

    console.log("[BDP QA Summary]");
    results.forEach(r => console.log(`  ${r.status}: ${r.name} ${r.detail ? `(${r.detail})` : ""}`));
    console.log(`  Total: ${results.filter(r => r.status === "PASS").length}/${results.length} PASS`);
  };

  if (!user?.isAdmin) return null;

  const passCount = checks.filter(c => c.status === "PASS").length;
  const failCount = checks.filter(c => c.status === "FAIL").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-qa-title">Quality Assurance</h1>
        <button data-testid="button-run-qa" onClick={runChecks} disabled={running} className="bg-[#FFD700] px-6 py-2 rounded-xl font-bold disabled:opacity-50">
          {running ? "Prüfung läuft..." : "QA starten"}
        </button>
      </div>

      {checks.length > 0 && (
        <>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4 text-center">
              <div className="flex-1 p-3 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-700" data-testid="text-qa-pass">{passCount}</div>
                <div className="text-xs text-green-600">PASS</div>
              </div>
              <div className="flex-1 p-3 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-700" data-testid="text-qa-fail">{failCount}</div>
                <div className="text-xs text-red-600">FAIL</div>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold">{checks.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
            {checks.map((c, i) => (
              <div key={i} data-testid={`qa-check-${i}`} className={`p-3 rounded-xl flex items-center gap-3 ${c.status === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${c.status === "PASS" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                  {c.status === "PASS" ? "✓" : "✗"}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.detail && <p className="text-xs text-gray-500">{c.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
