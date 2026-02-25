"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../../bdp-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QACheck {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
}

export default function QADemoPage() {
  const { user } = useBdp();
  const router = useRouter();
  const [checks, setChecks] = useState<QACheck[]>([]);
  const [running, setRunning] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  useEffect(() => {
    if (!user?.isAdmin) router.push("/arag-bdp");
  }, [user]);

  const runChecks = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/arag-bdp/admin/qa-demo");
      const data = await res.json();
      setChecks(data.checks || []);
      setPassCount(data.passCount || 0);
      setFailCount(data.failCount || 0);
    } catch {
      setChecks([{ name: "API-Fehler", status: "FAIL", detail: "Verbindungsfehler" }]);
      setFailCount(1);
    }
    setRunning(false);
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-qa-demo-title">QA Demo-Vollständigkeit</h1>
        <Link href="/arag-bdp/admin" data-testid="link-back-admin" className="text-sm text-gray-400 hover:text-gray-600">← Admin</Link>
      </div>

      <p className="text-sm text-gray-500">
        Prüft ob alle DEMO-Daten vollständig und korrekt befüllt sind: Namen, Emails, Teams, Teilnehmer, Scores, Tie-Break.
      </p>

      <button
        data-testid="bdp-qa-demo-completeness"
        onClick={runChecks}
        disabled={running}
        className="w-full bg-[#FFD700] py-3 rounded-xl font-bold disabled:opacity-50"
      >
        {running ? "Prüfung läuft..." : "Demo-Vollständigkeit prüfen"}
      </button>

      {checks.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex gap-4 text-sm font-medium">
            <span className="text-green-600" data-testid="text-qa-pass-count">{passCount} PASS</span>
            <span className="text-red-600" data-testid="text-qa-fail-count">{failCount} FAIL</span>
            <span className="text-gray-400">/ {checks.length} total</span>
          </div>

          {failCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <span className="text-green-700 font-bold text-lg">Alle Checks bestanden</span>
              <p className="text-green-600 text-sm mt-1">Demo-Datensatz D1.1 ist vollständig.</p>
            </div>
          )}

          {checks.map((c, i) => (
            <div
              key={i}
              data-testid={`qa-demo-result-${i}`}
              className={`p-3 rounded-xl text-sm ${c.status === "PASS" ? "bg-green-50" : "bg-red-50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${c.status === "PASS" ? "text-green-700" : "text-red-700"}`}>
                    {c.status === "PASS" ? "✓" : "✗"}
                  </span>
                  <span className="font-medium">{c.name}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">{c.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
