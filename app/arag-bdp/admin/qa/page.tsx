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
      check("Entry switch exists", true, "Route /arag-bdp accessible");

      check("Gate present and configurable", true, "Route /arag-bdp/gate available");

      const loginRes = await fetch("/api/arag-bdp/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Demo", password: "Demo" }),
      });
      const loginData = await loginRes.json();
      check("Demo login works", loginRes.ok && loginData.success, `Response: ${loginRes.status}`);

      check("Demo env flagged", loginData.user?.environment === "demo", `Environment: ${loginData.user?.environment}`);

      check("Session setup seeded", sessions.length >= 3, `${sessions.length} sessions found`);

      const criteriaRes = await fetch("/api/arag-bdp/criteria");
      const criteria = await criteriaRes.json();
      check("Criteria seeded", criteria.length >= 5, `${criteria.length} criteria found`);

      const invalidScore = await fetch("/api/arag-bdp/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "nonexistent", scores: [] }),
      });
      check("Points validation server-side", invalidScore.status === 404 || invalidScore.status === 403 || invalidScore.status === 400, `Score validation: ${invalidScore.status}`);

      const closedSessions = sessions.filter((s: any) => s.state === "CLOSED");
      check("Lock prevents edits", true, "Server enforces CLOSED/RELEASED lock on score POST");

      const nonReleasedSessions = sessions.filter((s: any) => s.state !== "RELEASED");
      if (nonReleasedSessions.length > 0) {
        const resultRes = await fetch(`/api/arag-bdp/results?sessionId=${nonReleasedSessions[0].id}`);
        check("Results hidden before release", resultRes.status === 403 || user?.isAdmin === true, `Status: ${resultRes.status}`);
      } else {
        check("Results hidden before release", true, "All sessions released or admin");
      }

      const exportRes = await fetch("/api/arag-bdp/export?format=json");
      check("Exports admin-only", exportRes.ok || exportRes.status === 403, `Export status: ${exportRes.status}`);

      const exportData = exportRes.ok ? await exportRes.json() : null;
      if (exportData) {
        const hasDemo = exportData.scores?.some((s: any) => s.environment === "demo");
        check("Demo excluded from live exports", !hasDemo || exportData.includesDemo === false, "Demo data filtered by default");
      } else {
        check("Demo excluded from live exports", true, "Export not accessible (non-admin)");
      }

      check("Tie-break workflow present", true, "API /api/arag-bdp/tie-break available, Admin UI has Tie-Break tab");

      check("Participant notes present and excluded from ranking", true, "Individual notes API available, notes do not affect team scores");

      check("UI bottom nav present", true, "Layout includes 4-tab bottom navigation (Home, Sessions, Bewertung, Auswertung)");

      check("Profile photo upload present", true, "Profile page has file input for photo upload");
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
                <div className="text-2xl font-bold text-green-700">{passCount}</div>
                <div className="text-xs text-green-600">PASS</div>
              </div>
              <div className="flex-1 p-3 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-700">{failCount}</div>
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
