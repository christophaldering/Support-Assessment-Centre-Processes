"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../bdp-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AdminTab = "sessions" | "teams" | "participants" | "observers" | "session-teams" | "team-participants" | "observer-assignments" | "criteria" | "names" | "settings" | "export" | "tiebreak";

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
  const [sessionTeams, setSessionTeams] = useState<any[]>([]);
  const [teamParticipants, setTeamParticipants] = useState<any[]>([]);
  const [observerAssignments, setObserverAssignments] = useState<any[]>([]);
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
  const [stSessionId, setStSessionId] = useState("");
  const [stTeamId, setStTeamId] = useState("");
  const [tpTeamId, setTpTeamId] = useState("");
  const [tpParticipantId, setTpParticipantId] = useState("");
  const [oaSessionId, setOaSessionId] = useState("");
  const [oaUserId, setOaUserId] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) { router.push("/arag-bdp"); return; }
    refresh();
  }, [user]);

  const refresh = () => {
    fetch("/api/arag-bdp/sessions").then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
    fetch("/api/arag-bdp/teams").then(r => r.json()).then(d => { if (Array.isArray(d)) setTeams(d); }).catch(() => {});
    fetch("/api/arag-bdp/participants").then(r => r.json()).then(d => { if (Array.isArray(d)) setParticipants(d); }).catch(() => {});
    fetch("/api/arag-bdp/observers").then(r => r.json()).then(d => { if (Array.isArray(d)) setObservers(d); }).catch(() => {});
    fetch("/api/arag-bdp/criteria").then(r => r.json()).then(d => { if (Array.isArray(d)) setCriteria(d); }).catch(() => {});
    fetch("/api/arag-bdp/name-mappings").then(r => r.json()).then(d => { if (Array.isArray(d)) setNameMappings(d); }).catch(() => {});
    fetch("/api/arag-bdp/config").then(r => r.json()).then(setConfig).catch(() => {});
    fetch("/api/arag-bdp/session-teams").then(r => r.json()).then(d => { if (Array.isArray(d)) setSessionTeams(d); }).catch(() => {});
    fetch("/api/arag-bdp/team-participants").then(r => r.json()).then(d => { if (Array.isArray(d)) setTeamParticipants(d); }).catch(() => {});
    fetch("/api/arag-bdp/observer-assignments").then(r => r.json()).then(d => { if (Array.isArray(d)) setObserverAssignments(d); }).catch(() => {});
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

  const addTeam = async () => {
    if (!newCode) return;
    const res = await fetch("/api/arag-bdp/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    setNewCode("");
    flash("Team erstellt");
    refresh();
  };

  const deleteTeam = async (id: string) => {
    await fetch(`/api/arag-bdp/teams?id=${id}`, { method: "DELETE" });
    flash("Team gelöscht");
    refresh();
  };

  const addParticipant = async () => {
    if (!newCode) return;
    const res = await fetch("/api/arag-bdp/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    setNewCode("");
    flash("Teilnehmer erstellt");
    refresh();
  };

  const deleteParticipant = async (id: string) => {
    await fetch(`/api/arag-bdp/participants?id=${id}`, { method: "DELETE" });
    flash("Teilnehmer gelöscht");
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
    const res = await fetch("/api/arag-bdp/observers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode, role: newRole }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    setNewCode("");
    flash("Beobachter erstellt");
    refresh();
  };

  const assignSessionTeam = async () => {
    if (!stSessionId || !stTeamId) return;
    const res = await fetch("/api/arag-bdp/session-teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: stSessionId, teamId: stTeamId }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    flash("Team der Session zugeordnet");
    refresh();
  };

  const unassignSessionTeam = async (id: string) => {
    await fetch(`/api/arag-bdp/session-teams?id=${id}`, { method: "DELETE" });
    flash("Zuordnung entfernt");
    refresh();
  };

  const assignTeamParticipant = async () => {
    if (!tpTeamId || !tpParticipantId) return;
    const res = await fetch("/api/arag-bdp/team-participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: tpTeamId, participantId: tpParticipantId }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    flash("Teilnehmer dem Team zugeordnet");
    refresh();
  };

  const unassignTeamParticipant = async (id: string) => {
    await fetch(`/api/arag-bdp/team-participants?id=${id}`, { method: "DELETE" });
    flash("Zuordnung entfernt");
    refresh();
  };

  const assignObserver = async () => {
    if (!oaSessionId || !oaUserId) return;
    const res = await fetch("/api/arag-bdp/observer-assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: oaSessionId, userId: oaUserId, canScoreTeamIds: [] }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || "Fehler"); return; }
    flash("Beobachter der Session zugeordnet");
    refresh();
  };

  const unassignObserver = async (id: string) => {
    await fetch(`/api/arag-bdp/observer-assignments?id=${id}`, { method: "DELETE" });
    flash("Zuordnung entfernt");
    refresh();
  };

  const saveNameMapping = async () => {
    if (!mappingId || !mappingRealName) return;
    await fetch("/api/arag-bdp/name-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: mappingType, entityId: mappingId, realName: mappingRealName }) });
    setMappingRealName("");
    flash("Zuordnung gespeichert");
    refresh();
  };

  const deleteNameMapping = async (id: string) => {
    await fetch(`/api/arag-bdp/name-mappings?id=${id}`, { method: "DELETE" });
    flash("Zuordnung gelöscht");
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

  if (!user?.isAdmin) return null;

  const stateLabel: Record<string, string> = { DRAFT: "Entwurf", OPEN: "Offen", CLOSED: "Geschlossen", RELEASED: "Freigegeben" };
  const nextState: Record<string, string[]> = { DRAFT: ["OPEN"], OPEN: ["CLOSED"], CLOSED: ["RELEASED", "OPEN"], RELEASED: [] };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "sessions", label: "Sessions" },
    { key: "teams", label: "Teams" },
    { key: "participants", label: "Teilnehmer" },
    { key: "observers", label: "Beobachter" },
    { key: "session-teams", label: "Session↔Teams" },
    { key: "team-participants", label: "Team↔TN" },
    { key: "observer-assignments", label: "Observer↔Sess." },
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
        <div className="flex gap-2">
          <Link href="/arag-bdp/admin/qa-lite" data-testid="link-qa-lite" className="text-xs bg-green-100 px-3 py-1 rounded-full hover:bg-green-200">QA-Lite</Link>
          <Link href="/arag-bdp/admin/qa" data-testid="link-qa" className="text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">QA</Link>
        </div>
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
            <button data-testid="bdp-admin-save" onClick={addSession} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+ Session</button>
          </div>
          {sessions.map(s => (
            <div key={s.id} data-testid={`admin-session-row-${s.id}`} className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{s.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{stateLabel[s.state]}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Teams: {s.sessionTeams?.map((st: any) => st.team.code).join(", ") || "–"} · Beobachter: {s.observerAssignments?.map((oa: any) => oa.user.code).join(", ") || "–"}
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
                  {s.transparencyMode === "aggregates_only" ? "Aggregate" : "Detail"}
                </button>
                {s.state === "DRAFT" && (
                  <button data-testid="bdp-admin-delete" onClick={() => deleteSession(s.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full hover:bg-red-100">Löschen</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-team-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Team-Code (z.B. T4)..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addTeam} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+ Team</button>
          </div>
          {teams.map(t => (
            <div key={t.id} data-testid={`admin-team-row-${t.id}`} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold">{t.code}</span>
                <span className="text-xs text-gray-400 ml-2">{t.displayName || ""}</span>
                <span className="text-xs text-gray-400 ml-2">({t.teamParticipants?.length || 0} TN)</span>
              </div>
              <button data-testid="bdp-admin-delete" onClick={() => deleteTeam(t.id)} className="text-xs text-red-400 hover:text-red-600">Löschen</button>
            </div>
          ))}
        </div>
      )}

      {tab === "participants" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-participant-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="TN-Code (z.B. TN7)..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addParticipant} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+ Teilnehmer</button>
          </div>
          {participants.map(p => (
            <div key={p.id} data-testid={`admin-participant-row-${p.id}`} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold">{p.code}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {p.teamParticipants?.map((tp: any) => tp.team.code).join(", ") || "Nicht zugeordnet"}
                </span>
              </div>
              <button data-testid="bdp-admin-delete" onClick={() => deleteParticipant(p.id)} className="text-xs text-red-400 hover:text-red-600">Löschen</button>
            </div>
          ))}
        </div>
      )}

      {tab === "observers" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-observer-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code (z.B. V7)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select data-testid="select-new-observer-role" value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="BOARD">Board (V)</option>
              <option value="MANAGEMENT_DIAGNOSTICS">MD</option>
              <option value="EXPERT">Expert (E)</option>
            </select>
            <button data-testid="bdp-admin-save" onClick={addObserver} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {observers.map(o => (
            <div key={o.id} data-testid={`admin-observer-row-${o.id}`} className="p-3 border border-gray-100 rounded-xl">
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

      {tab === "session-teams" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">Session ↔ Teams</h2>
          <p className="text-sm text-gray-500">Ordnen Sie Teams zu Sessions zu.</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-st-session" value={stSessionId} onChange={e => setStSessionId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Session wählen...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select data-testid="select-st-team" value={stTeamId} onChange={e => setStTeamId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Team wählen...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignSessionTeam} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">Zuordnen</button>
          </div>
          <div className="space-y-2">
            {sessionTeams.map(st => (
              <div key={st.id} data-testid={`admin-session-team-row-${st.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm"><strong>{st.session?.name}</strong> ← {st.team?.code}</span>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignSessionTeam(st.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
              </div>
            ))}
            {sessionTeams.length === 0 && <p className="text-sm text-gray-400">Keine Zuordnungen vorhanden.</p>}
          </div>
        </div>
      )}

      {tab === "team-participants" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">Team ↔ Teilnehmer</h2>
          <p className="text-sm text-gray-500">Ordnen Sie Teilnehmer zu Teams zu.</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-tp-team" value={tpTeamId} onChange={e => setTpTeamId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Team wählen...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
            <select data-testid="select-tp-participant" value={tpParticipantId} onChange={e => setTpParticipantId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Teilnehmer wählen...</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignTeamParticipant} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">Zuordnen</button>
          </div>
          <div className="space-y-2">
            {teamParticipants.map(tp => (
              <div key={tp.id} data-testid={`admin-team-participant-row-${tp.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm"><strong>{tp.team?.code}</strong> ← {tp.participant?.code}</span>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignTeamParticipant(tp.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
              </div>
            ))}
            {teamParticipants.length === 0 && <p className="text-sm text-gray-400">Keine Zuordnungen vorhanden.</p>}
          </div>
        </div>
      )}

      {tab === "observer-assignments" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">Beobachter ↔ Sessions</h2>
          <p className="text-sm text-gray-500">Ordnen Sie Beobachter zu Sessions zu. Scope = alle SessionTeams (Standard).</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-oa-session" value={oaSessionId} onChange={e => setOaSessionId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Session wählen...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select data-testid="select-oa-observer" value={oaUserId} onChange={e => setOaUserId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Beobachter wählen...</option>
              {observers.map(o => <option key={o.id} value={o.id}>{o.code} ({o.role})</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignObserver} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">Zuordnen</button>
          </div>
          <div className="space-y-2">
            {observerAssignments.map(oa => (
              <div key={oa.id} data-testid={`admin-observer-assignment-row-${oa.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm"><strong>{oa.session?.name}</strong> ← {oa.user?.code} ({oa.user?.role})</span>
                  <span className="text-xs text-gray-400 ml-2">
                    Scope: {oa.canScoreTeamIds?.length > 0 ? oa.canScoreTeamIds.join(", ") : "alle Teams"}
                  </span>
                </div>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignObserver(oa.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
              </div>
            ))}
            {observerAssignments.length === 0 && <p className="text-sm text-gray-400">Keine Zuordnungen vorhanden.</p>}
          </div>
        </div>
      )}

      {tab === "criteria" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-criterion" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Neues Kriterium..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addCriterion} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {criteria.map((c, idx) => (
            <div key={c.id} data-testid={`admin-criterion-row-${c.id}`} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">{idx + 1}. {c.name}</span>
              </div>
              <button data-testid="bdp-admin-delete" onClick={() => deleteCriterion(c.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
            </div>
          ))}
        </div>
      )}

      {tab === "names" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">Klarnamen-Zuordnung (Code → Realname). Nur für Admin-Exporte sichtbar.</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-mapping-type" value={mappingType} onChange={e => setMappingType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="observer">Beobachter</option>
              <option value="participant">Teilnehmer</option>
              <option value="team">Team</option>
            </select>
            <select data-testid="select-mapping-entity" value={mappingId} onChange={e => setMappingId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Auswählen...</option>
              {mappingType === "observer" && observers.map(o => <option key={o.id} value={o.id}>{o.code}</option>)}
              {mappingType === "participant" && participants.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              {mappingType === "team" && teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
            <input data-testid="input-real-name" value={mappingRealName} onChange={e => setMappingRealName(e.target.value)} placeholder="Realname..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={saveNameMapping} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">Speichern</button>
          </div>
          <div className="space-y-2">
            {nameMappings.map(m => (
              <div key={m.id} data-testid={`admin-name-mapping-row-${m.id}`} className="p-3 bg-gray-50 rounded-xl text-sm flex justify-between">
                <span>{m.entityType}: {m.entityId}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.realName}</span>
                  <button data-testid="bdp-admin-delete" onClick={() => deleteNameMapping(m.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
                </div>
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
          <button data-testid="bdp-admin-save" onClick={saveTieBreak} className="w-full bg-[#FFD700] py-3 rounded-xl font-bold">Tie-Break speichern</button>
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.weightedAnalytics || false} onChange={e => updateConfig({ weightedAnalytics: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-weighted" />
            <span className="text-sm">Gewichtete Analytik aktivieren</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.lockNotesOnClose ?? true} onChange={e => updateConfig({ lockNotesOnClose: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-lock-notes" />
            <span className="text-sm">Notizen bei Session-Schließung sperren</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.enforceGatePassword || false} onChange={e => updateConfig({ enforceGatePassword: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-gate-pw" />
            <span className="text-sm">Gate-Passwort erzwingen</span>
          </label>
          <hr />
          <button data-testid="button-reset-demo" onClick={() => flash("Demo-Reset ist nur über Seed-Script möglich")} className="w-full bg-red-50 text-red-700 py-3 rounded-xl font-bold hover:bg-red-100">Demo-Daten zurücksetzen</button>
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
