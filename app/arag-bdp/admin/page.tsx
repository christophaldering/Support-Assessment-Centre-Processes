"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../layout";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AdminTab = "sessions" | "teams" | "participants" | "observers" | "criteria" | "names" | "settings" | "export" | "tiebreak";

export default function BdpAdminPage() {
  const { user } = useBdp();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("sessions");
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [observers, setObservers] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [nameMappings, setNameMappings] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newRole, setNewRole] = useState("BOARD");
  const [mappingType, setMappingType] = useState("observer");
  const [mappingId, setMappingId] = useState("");
  const [mappingRealName, setMappingRealName] = useState("");
  const [tieSessionId, setTieSessionId] = useState("");
  const [tieWinnerTeamId, setTieWinnerTeamId] = useState("");
  const [tieDecidedById, setTieDecidedById] = useState("");
  const [tieRationale, setTieRationale] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) { router.push("/arag-bdp"); return; }
    refresh();
  }, [user]);

  const refresh = () => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(setSessions).catch(() => {});
    fetch("/api/arag-bdp/teams").then(r => r.json()).then(setTeams).catch(() => {});
    fetch("/api/arag-bdp/participants").then(r => r.json()).then(setParticipants).catch(() => {});
    fetch("/api/arag-bdp/observers").then(r => r.json()).then(setObservers).catch(() => {});
    fetch("/api/arag-bdp/criteria").then(r => r.json()).then(setCriteria).catch(() => {});
    fetch("/api/arag-bdp/name-mappings").then(r => r.json()).then(setNameMappings).catch(() => {});
    fetch("/api/arag-bdp/config").then(r => r.json()).then(setConfig).catch(() => {});
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const stateTransition = async (id: string, newState: string) => {
    const res = await fetch("/api/arag-bdp/sessions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, state: newState }) });
    const data = await res.json();
    if (!res.ok) { flash(data.error); return; }
    flash(`Session → ${newState}`);
    refresh();
  };

  const addSession = async () => {
    if (!newName) return;
    await fetch("/api/arag-bdp/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    setNewName("");
    flash("Session erstellt");
    refresh();
  };

  const deleteSession = async (id: string) => {
    await fetch(`/api/arag-bdp/sessions?id=${id}`, { method: "DELETE" });
    flash("Session gelöscht");
    refresh();
  };

  const addCriterion = async () => {
    if (!newName) return;
    await fetch("/api/arag-bdp/criteria", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    setNewName("");
    flash("Kriterium erstellt");
    refresh();
  };

  const deleteCriterion = async (id: string) => {
    await fetch(`/api/arag-bdp/criteria?id=${id}`, { method: "DELETE" });
    flash("Kriterium deaktiviert");
    refresh();
  };

  const addObserver = async () => {
    if (!newCode) return;
    await fetch("/api/arag-bdp/observers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode, role: newRole }) });
    setNewCode("");
    flash("Beobachter erstellt");
    refresh();
  };

  const saveNameMapping = async () => {
    if (!mappingId || !mappingRealName) return;
    await fetch("/api/arag-bdp/name-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: mappingType, entityId: mappingId, realName: mappingRealName }) });
    setMappingRealName("");
    flash("Zuordnung gespeichert");
    refresh();
  };

  const updateConfig = async (updates: any) => {
    await fetch("/api/arag-bdp/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    flash("Einstellungen gespeichert");
    refresh();
  };

  const saveTieBreak = async () => {
    if (!tieSessionId || !tieWinnerTeamId || !tieDecidedById) return;
    await fetch("/api/arag-bdp/tie-break", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: tieSessionId, winnerTeamId: tieWinnerTeamId, decidedById: tieDecidedById, rationale: tieRationale }) });
    flash("Tie-Break gespeichert");
  };

  const handleExport = (format: string, includeDemo: boolean, named: boolean) => {
    window.open(`/api/arag-bdp/export?format=${format}&include_demo=${includeDemo}&named=${named}`, "_blank");
  };

  const resetDemo = async () => {
    flash("Demo-Reset ist nur über Seed-Script möglich");
  };

  if (!user?.isAdmin) return null;

  const stateLabel: Record<string, string> = { DRAFT: "Entwurf", OPEN: "Offen", CLOSED: "Geschlossen", RELEASED: "Freigegeben" };
  const nextState: Record<string, string[]> = { DRAFT: ["OPEN"], OPEN: ["CLOSED"], CLOSED: ["RELEASED", "OPEN"], RELEASED: [] };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "sessions", label: "Sessions" },
    { key: "teams", label: "Teams" },
    { key: "participants", label: "Teilnehmer" },
    { key: "observers", label: "Beobachter" },
    { key: "criteria", label: "Kriterien" },
    { key: "names", label: "Namen" },
    { key: "tiebreak", label: "Tie-Break" },
    { key: "settings", label: "Einstellungen" },
    { key: "export", label: "Export" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin-Konsole</h1>
        <Link href="/arag-bdp/admin/qa" data-testid="link-qa" className="text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">QA</Link>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm" data-testid="text-admin-msg">{msg}</div>}

      <div className="overflow-x-auto">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm min-w-max">
          {tabs.map(t => (
            <button key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#FFD700] text-black" : "text-gray-500 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "sessions" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-session" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Neue Session..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="button-add-session" onClick={addSession} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {sessions.map(s => (
            <div key={s.id} className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{s.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{stateLabel[s.state]}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {nextState[s.state]?.map(ns => (
                  <button key={ns} data-testid={`button-state-${s.id}-${ns}`} onClick={() => stateTransition(s.id, ns)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100">
                    → {stateLabel[ns]}
                  </button>
                ))}
                <button data-testid={`button-transparency-${s.id}`} onClick={() => {
                  const newMode = s.transparencyMode === "aggregates_only" ? "show_per_observer_breakdown" : "aggregates_only";
                  fetch("/api/arag-bdp/sessions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, transparencyMode: newMode }) }).then(() => refresh());
                }} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100">
                  👁 {s.transparencyMode === "aggregates_only" ? "Aggregate" : "Detail"}
                </button>
                {s.state === "DRAFT" && (
                  <button data-testid={`button-delete-session-${s.id}`} onClick={() => deleteSession(s.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full hover:bg-red-100">Löschen</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          {teams.map(t => (
            <div key={t.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold">{t.code}</span>
                <span className="text-xs text-gray-400 ml-2">{t.teamParticipants?.length || 0} Teilnehmer</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "participants" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          {participants.map(p => (
            <div key={p.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold">{p.code}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {p.teamParticipants?.map((tp: any) => tp.team.code).join(", ") || "Nicht zugeordnet"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "observers" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-observer-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code (z.B. V7)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="BOARD">Board (V)</option>
              <option value="MANAGEMENT_DIAGNOSTICS">MD</option>
              <option value="EXPERT">Expert (E)</option>
            </select>
            <button data-testid="button-add-observer" onClick={addObserver} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {observers.map(o => (
            <div key={o.id} className="p-3 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">{o.code}</span>
                  <span className="text-xs text-gray-400 ml-2">{o.role}</span>
                  {o.isAdmin && <span className="text-xs bg-[#FFD700] px-2 py-0.5 rounded-full ml-2">Admin</span>}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Sessions: {o.observerAssignments?.map((oa: any) => oa.session.name).join(", ") || "–"}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "criteria" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-criterion" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Neues Kriterium..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="button-add-criterion" onClick={addCriterion} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {criteria.map((c, idx) => (
            <div key={c.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">{idx + 1}. {c.name}</span>
              </div>
              <button onClick={() => deleteCriterion(c.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
            </div>
          ))}
        </div>
      )}

      {tab === "names" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">Klarnamen-Zuordnung (Code → Realname). Nur für Admin-Exporte sichtbar.</p>
          <div className="flex gap-2 flex-wrap">
            <select value={mappingType} onChange={e => setMappingType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="observer">Beobachter</option>
              <option value="participant">Teilnehmer</option>
              <option value="team">Team</option>
            </select>
            <select value={mappingId} onChange={e => setMappingId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Auswählen...</option>
              {mappingType === "observer" && observers.map(o => <option key={o.id} value={o.id}>{o.code}</option>)}
              {mappingType === "participant" && participants.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              {mappingType === "team" && teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
            <input data-testid="input-real-name" value={mappingRealName} onChange={e => setMappingRealName(e.target.value)} placeholder="Realname..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="button-save-mapping" onClick={saveNameMapping} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">Speichern</button>
          </div>
          <div className="space-y-2">
            {nameMappings.map(m => (
              <div key={m.id} className="p-3 bg-gray-50 rounded-xl text-sm flex justify-between">
                <span>{m.entityType}: {m.entityId}</span>
                <span className="font-medium">{m.realName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "tiebreak" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold">Tie-Break Entscheidung</h2>
          <p className="text-sm text-gray-500">Wenn zwei Teams punktgleich sind, kann hier die Board-Entscheidung festgehalten werden.</p>
          <select data-testid="select-tie-session" value={tieSessionId} onChange={e => setTieSessionId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Session wählen...</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select data-testid="select-tie-winner" value={tieWinnerTeamId} onChange={e => setTieWinnerTeamId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Sieger-Team wählen...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>
          <select data-testid="select-tie-decided-by" value={tieDecidedById} onChange={e => setTieDecidedById(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Entschieden durch (V-Code)...</option>
            {observers.filter(o => o.role === "BOARD").map(o => <option key={o.id} value={o.id}>{o.code}</option>)}
          </select>
          <textarea data-testid="input-tie-rationale" value={tieRationale} onChange={e => setTieRationale(e.target.value)} placeholder="Begründung (optional)..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
          <button data-testid="button-save-tiebreak" onClick={saveTieBreak} className="w-full bg-[#FFD700] py-3 rounded-xl font-bold">Tie-Break speichern</button>
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.weightedAnalytics || false} onChange={e => updateConfig({ weightedAnalytics: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" />
            <span className="text-sm">Gewichtete Analytik aktivieren</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.lockNotesOnClose ?? true} onChange={e => updateConfig({ lockNotesOnClose: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" />
            <span className="text-sm">Notizen bei Session-Schließung sperren</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.enforceGatePassword || false} onChange={e => updateConfig({ enforceGatePassword: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" />
            <span className="text-sm">Gate-Passwort erzwingen</span>
          </label>
          <hr />
          <button data-testid="button-reset-demo" onClick={resetDemo} className="w-full bg-red-50 text-red-700 py-3 rounded-xl font-bold hover:bg-red-100">Demo-Daten zurücksetzen</button>
        </div>
      )}

      {tab === "export" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold">Export (nur Admin)</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-2">Live-Daten (ohne Demo)</h3>
              <div className="flex gap-2">
                <button data-testid="button-export-csv" onClick={() => handleExport("csv", false, false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">CSV (anonym)</button>
                <button data-testid="button-export-json" onClick={() => handleExport("json", false, false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">JSON (anonym)</button>
                <button data-testid="button-export-print" onClick={() => window.open("/arag-bdp/export/print", "_blank")} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">Druckansicht</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">Mit Klarnamen (Admin)</h3>
              <div className="flex gap-2">
                <button onClick={() => handleExport("csv", false, true)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100">CSV (benannt)</button>
                <button onClick={() => handleExport("json", false, true)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100">JSON (benannt)</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">Demo-Daten separat</h3>
              <div className="flex gap-2">
                <button data-testid="button-export-demo-csv" onClick={() => handleExport("csv", true, false)} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg text-sm hover:bg-orange-100">CSV (mit Demo)</button>
                <button data-testid="button-export-demo-json" onClick={() => handleExport("json", true, false)} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg text-sm hover:bg-orange-100">JSON (mit Demo)</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
