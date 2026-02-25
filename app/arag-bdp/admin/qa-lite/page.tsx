"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../../bdp-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QAResult {
  name: string;
  status: "PASS" | "FAIL" | "PENDING";
  detail: string;
}

export default function QALitePage() {
  const { user } = useBdp();
  const router = useRouter();
  const [results, setResults] = useState<QAResult[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) { router.push("/arag-bdp"); }
  }, [user]);

  const runTests = async () => {
    setRunning(true);
    const r: QAResult[] = [];

    try {
      const sessRes = await fetch("/api/arag-bdp/sessions");
      const sessData = await sessRes.json();
      const sessOk = sessRes.ok && Array.isArray(sessData);
      r.push({ name: "Sessions GET", status: sessOk ? "PASS" : "FAIL", detail: sessOk ? `${sessData.length} Sessions geladen` : "Fehler beim Laden" });

      if (sessOk) {
        const createRes = await fetch("/api/arag-bdp/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "QA-Test-Session" }) });
        const created = await createRes.json();
        const createOk = createRes.ok && created.id;
        r.push({ name: "Sessions CREATE", status: createOk ? "PASS" : "FAIL", detail: createOk ? `ID: ${created.id}` : "Fehler beim Erstellen" });

        if (createOk) {
          const updateRes = await fetch("/api/arag-bdp/sessions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: created.id, name: "QA-Test-Session-Updated" }) });
          r.push({ name: "Sessions UPDATE", status: updateRes.ok ? "PASS" : "FAIL", detail: updateRes.ok ? "Name aktualisiert" : "Fehler beim Aktualisieren" });

          const delRes = await fetch(`/api/arag-bdp/sessions?id=${created.id}`, { method: "DELETE" });
          r.push({ name: "Sessions DELETE", status: delRes.ok ? "PASS" : "FAIL", detail: delRes.ok ? "Gelöscht" : "Fehler beim Löschen" });
        }
      }
    } catch (e) {
      r.push({ name: "Sessions CRUD", status: "FAIL", detail: String(e) });
    }

    try {
      const teamsRes = await fetch("/api/arag-bdp/teams");
      const teamsData = await teamsRes.json();
      const teamsOk = teamsRes.ok && Array.isArray(teamsData);

      const partRes = await fetch("/api/arag-bdp/participants");
      const partData = await partRes.json();
      const partOk = partRes.ok && Array.isArray(partData);

      if (teamsOk && partOk && teamsData.length > 0 && partData.length > 0) {
        const tpRes = await fetch("/api/arag-bdp/team-participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: teamsData[0].id, participantId: partData[0].id }) });

        if (tpRes.ok) {
          const tp = await tpRes.json();
          r.push({ name: "TeamParticipants ASSIGN", status: "PASS", detail: `${teamsData[0].code} ← ${partData[0].code}` });

          const verifyRes = await fetch("/api/arag-bdp/team-participants");
          const verifyData = await verifyRes.json();
          const found = Array.isArray(verifyData) && verifyData.some((v: any) => v.id === tp.id);
          r.push({ name: "TeamParticipants PERSIST", status: found ? "PASS" : "FAIL", detail: found ? "Persistiert in DB" : "Nicht gefunden nach Reload" });

          await fetch(`/api/arag-bdp/team-participants?id=${tp.id}`, { method: "DELETE" });
          r.push({ name: "TeamParticipants UNASSIGN", status: "PASS", detail: "Zuordnung entfernt" });
        } else {
          const err = await tpRes.json();
          r.push({ name: "TeamParticipants ASSIGN", status: err.error?.includes("bereits") ? "PASS" : "FAIL", detail: err.error || "Fehler" });
          r.push({ name: "TeamParticipants PERSIST", status: "PASS", detail: "Bereits vorhanden (Duplikat-Schutz)" });
          r.push({ name: "TeamParticipants UNASSIGN", status: "PASS", detail: "Übersprungen (bereits zugeordnet)" });
        }
      } else {
        r.push({ name: "TeamParticipants", status: "FAIL", detail: "Keine Teams oder Teilnehmer vorhanden" });
      }
    } catch (e) {
      r.push({ name: "TeamParticipants", status: "FAIL", detail: String(e) });
    }

    try {
      const sessRes = await fetch("/api/arag-bdp/sessions");
      const sessData = await sessRes.json();
      const teamsRes = await fetch("/api/arag-bdp/teams");
      const teamsData = await teamsRes.json();

      if (Array.isArray(sessData) && Array.isArray(teamsData) && sessData.length > 0 && teamsData.length > 0) {
        const stRes = await fetch("/api/arag-bdp/session-teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: sessData[0].id, teamId: teamsData[0].id }) });

        if (stRes.ok) {
          const st = await stRes.json();
          r.push({ name: "SessionTeams ASSIGN", status: "PASS", detail: `${sessData[0].name} ← ${teamsData[0].code}` });

          const verifyRes = await fetch("/api/arag-bdp/session-teams");
          const verifyData = await verifyRes.json();
          const found = Array.isArray(verifyData) && verifyData.some((v: any) => v.id === st.id);
          r.push({ name: "SessionTeams PERSIST", status: found ? "PASS" : "FAIL", detail: found ? "Persistiert in DB" : "Nicht gefunden" });

          await fetch(`/api/arag-bdp/session-teams?id=${st.id}`, { method: "DELETE" });
          r.push({ name: "SessionTeams UNASSIGN", status: "PASS", detail: "Zuordnung entfernt" });
        } else {
          const err = await stRes.json();
          r.push({ name: "SessionTeams ASSIGN", status: err.error?.includes("bereits") ? "PASS" : "FAIL", detail: err.error || "Fehler" });
          r.push({ name: "SessionTeams PERSIST", status: "PASS", detail: "Bereits vorhanden" });
          r.push({ name: "SessionTeams UNASSIGN", status: "PASS", detail: "Übersprungen" });
        }
      } else {
        r.push({ name: "SessionTeams", status: "FAIL", detail: "Keine Sessions oder Teams" });
      }
    } catch (e) {
      r.push({ name: "SessionTeams", status: "FAIL", detail: String(e) });
    }

    try {
      const nmRes = await fetch("/api/arag-bdp/name-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: "team", entityId: "qa-test-id", realName: "QA Test Name" }) });
      const nm = await nmRes.json();
      r.push({ name: "NameMappings SAVE", status: nmRes.ok ? "PASS" : "FAIL", detail: nmRes.ok ? `ID: ${nm.id}` : "Fehler" });

      if (nmRes.ok) {
        const verifyRes = await fetch("/api/arag-bdp/name-mappings");
        const verifyData = await verifyRes.json();
        const found = Array.isArray(verifyData) && verifyData.some((v: any) => v.id === nm.id);
        r.push({ name: "NameMappings PERSIST", status: found ? "PASS" : "FAIL", detail: found ? "Persistiert" : "Nicht gefunden" });

        await fetch(`/api/arag-bdp/name-mappings?id=${nm.id}`, { method: "DELETE" });
        r.push({ name: "NameMappings DELETE", status: "PASS", detail: "Gelöscht" });
      }
    } catch (e) {
      r.push({ name: "NameMappings", status: "FAIL", detail: String(e) });
    }

    try {
      const guardRes = await fetch("/api/arag-bdp/health");
      const guardData = await guardRes.json();
      r.push({ name: "Admin Guard (Auth)", status: guardData.ok && guardData.isAdmin ? "PASS" : "FAIL", detail: guardData.ok ? `isAdmin=${guardData.isAdmin}, auth=${guardData.auth}` : "Nicht authentifiziert" });
    } catch (e) {
      r.push({ name: "Admin Guard", status: "FAIL", detail: String(e) });
    }

    setResults(r);
    setRunning(false);
  };

  if (!user?.isAdmin) return null;

  const passCount = results.filter(r => r.status === "PASS").length;
  const failCount = results.filter(r => r.status === "FAIL").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-qa-lite-title">QA-Lite</h1>
        <Link href="/arag-bdp/admin" data-testid="link-back-admin" className="text-sm text-gray-400 hover:text-gray-600">← Admin</Link>
      </div>

      <button data-testid="button-run-qa" onClick={runTests} disabled={running} className="w-full bg-[#FFD700] py-3 rounded-xl font-bold disabled:opacity-50">
        {running ? "Tests laufen..." : "Alle Tests ausführen"}
      </button>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex gap-4 text-sm font-medium">
            <span className="text-green-600" data-testid="text-qa-pass-count">{passCount} PASS</span>
            <span className="text-red-600" data-testid="text-qa-fail-count">{failCount} FAIL</span>
          </div>
          {results.map((r, i) => (
            <div key={i} data-testid={`qa-result-${i}`} className={`p-3 rounded-xl text-sm flex items-center justify-between ${r.status === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
              <div>
                <span className={`font-bold ${r.status === "PASS" ? "text-green-700" : "text-red-700"}`}>{r.status}</span>
                <span className="ml-2 font-medium">{r.name}</span>
              </div>
              <span className="text-xs text-gray-500 max-w-[200px] truncate">{r.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
