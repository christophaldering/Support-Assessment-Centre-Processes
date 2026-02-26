"use client";

import { useState, useEffect } from "react";
import { useBdp } from "../bdp-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/app/providers/LanguageProvider";

type AdminTab = "sessions" | "teams" | "participants" | "observers" | "session-teams" | "team-participants" | "observer-assignments" | "criteria" | "names" | "settings" | "export" | "tiebreak";

export default function BdpAdminPage() {
  const { user } = useBdp();
  const router = useRouter();
  const { t } = useLanguage();
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
    fetch("/api/abcd-bdp/sessions").then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
    fetch("/api/abcd-bdp/teams").then(r => r.json()).then(d => { if (Array.isArray(d)) setTeams(d); }).catch(() => {});
    fetch("/api/abcd-bdp/participants").then(r => r.json()).then(d => { if (Array.isArray(d)) setParticipants(d); }).catch(() => {});
    fetch("/api/abcd-bdp/observers").then(r => r.json()).then(d => { if (Array.isArray(d)) setObservers(d); }).catch(() => {});
    fetch("/api/abcd-bdp/criteria").then(r => r.json()).then(d => { if (Array.isArray(d)) setCriteria(d); }).catch(() => {});
    fetch("/api/abcd-bdp/name-mappings").then(r => r.json()).then(d => { if (Array.isArray(d)) setNameMappings(d); }).catch(() => {});
    fetch("/api/abcd-bdp/config").then(r => r.json()).then(setConfig).catch(() => {});
    fetch("/api/abcd-bdp/session-teams").then(r => r.json()).then(d => { if (Array.isArray(d)) setSessionTeams(d); }).catch(() => {});
    fetch("/api/abcd-bdp/team-participants").then(r => r.json()).then(d => { if (Array.isArray(d)) setTeamParticipants(d); }).catch(() => {});
    fetch("/api/abcd-bdp/observer-assignments").then(r => r.json()).then(d => { if (Array.isArray(d)) setObserverAssignments(d); }).catch(() => {});
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const stateLabel: Record<string, string> = { DRAFT: t("stateDraft"), OPEN: t("stateOpen"), CLOSED: t("stateClosed"), RELEASED: t("stateReleased") };
  const nextState: Record<string, string[]> = { DRAFT: ["OPEN"], OPEN: ["CLOSED"], CLOSED: ["RELEASED", "OPEN"], RELEASED: [] };

  const stateTransition = async (id: string, newState: string) => {
    const res = await fetch("/api/abcd-bdp/sessions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, state: newState }) });
    const data = await res.json();
    if (!res.ok) { flash(data.error); return; }
    flash(`Session → ${newState}`);
    refresh();
  };

  const addSession = async () => {
    if (!newName) return;
    await fetch("/api/abcd-bdp/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    setNewName("");
    flash(t("sessionCreated"));
    refresh();
  };

  const deleteSession = async (id: string) => {
    await fetch(`/api/abcd-bdp/sessions?id=${id}`, { method: "DELETE" });
    flash(t("sessionDeleted"));
    refresh();
  };

  const addTeam = async () => {
    if (!newCode) return;
    const res = await fetch("/api/abcd-bdp/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    setNewCode("");
    flash(t("teamCreated"));
    refresh();
  };

  const deleteTeam = async (id: string) => {
    await fetch(`/api/abcd-bdp/teams?id=${id}`, { method: "DELETE" });
    flash(t("teamDeleted"));
    refresh();
  };

  const addParticipant = async () => {
    if (!newCode) return;
    const res = await fetch("/api/abcd-bdp/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    setNewCode("");
    flash(t("participantCreated"));
    refresh();
  };

  const deleteParticipant = async (id: string) => {
    await fetch(`/api/abcd-bdp/participants?id=${id}`, { method: "DELETE" });
    flash(t("participantDeleted"));
    refresh();
  };

  const addCriterion = async () => {
    if (!newName) return;
    await fetch("/api/abcd-bdp/criteria", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    setNewName("");
    flash(t("criterionCreated"));
    refresh();
  };

  const deleteCriterion = async (id: string) => {
    await fetch(`/api/abcd-bdp/criteria?id=${id}`, { method: "DELETE" });
    flash(t("criterionDeactivated"));
    refresh();
  };

  const addObserver = async () => {
    if (!newCode) return;
    const res = await fetch("/api/abcd-bdp/observers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode, role: newRole }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    setNewCode("");
    flash(t("observerCreated"));
    refresh();
  };

  const assignSessionTeam = async () => {
    if (!stSessionId || !stTeamId) return;
    const res = await fetch("/api/abcd-bdp/session-teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: stSessionId, teamId: stTeamId }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    flash(t("teamAssignedToSession"));
    refresh();
  };

  const unassignSessionTeam = async (id: string) => {
    await fetch(`/api/abcd-bdp/session-teams?id=${id}`, { method: "DELETE" });
    flash(t("assignmentRemoved"));
    refresh();
  };

  const assignTeamParticipant = async () => {
    if (!tpTeamId || !tpParticipantId) return;
    const res = await fetch("/api/abcd-bdp/team-participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: tpTeamId, participantId: tpParticipantId }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    flash(t("participantAssignedToTeam"));
    refresh();
  };

  const unassignTeamParticipant = async (id: string) => {
    await fetch(`/api/abcd-bdp/team-participants?id=${id}`, { method: "DELETE" });
    flash(t("assignmentRemoved"));
    refresh();
  };

  const assignObserver = async () => {
    if (!oaSessionId || !oaUserId) return;
    const res = await fetch("/api/abcd-bdp/observer-assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: oaSessionId, userId: oaUserId, canScoreTeamIds: [] }) });
    if (!res.ok) { const d = await res.json(); flash(d.error || t("error")); return; }
    flash(t("observerAssignedToSession"));
    refresh();
  };

  const unassignObserver = async (id: string) => {
    await fetch(`/api/abcd-bdp/observer-assignments?id=${id}`, { method: "DELETE" });
    flash(t("assignmentRemoved"));
    refresh();
  };

  const saveNameMapping = async () => {
    if (!mappingId || !mappingRealName) return;
    await fetch("/api/abcd-bdp/name-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: mappingType, entityId: mappingId, realName: mappingRealName }) });
    setMappingRealName("");
    flash(t("mappingSaved"));
    refresh();
  };

  const deleteNameMapping = async (id: string) => {
    await fetch(`/api/abcd-bdp/name-mappings?id=${id}`, { method: "DELETE" });
    flash(t("mappingDeleted"));
    refresh();
  };

  const updateConfig = async (updates: any) => {
    await fetch("/api/abcd-bdp/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    flash(t("settingsSaved"));
    refresh();
  };

  const saveTieBreak = async () => {
    if (!tieSessionId || !tieWinnerTeamId || !tieDecidedById) return;
    await fetch("/api/abcd-bdp/tie-break", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: tieSessionId, winnerTeamId: tieWinnerTeamId, decidedById: tieDecidedById, rationale: tieRationale }) });
    flash(t("tieBreakSaved"));
  };

  const handleExport = (format: string, includeDemo: boolean, named: boolean) => {
    window.open(`/api/abcd-bdp/export?format=${format}&include_demo=${includeDemo}&named=${named}`, "_blank");
  };

  if (!user?.isAdmin) return null;

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "sessions", label: t("tabSessions") },
    { key: "teams", label: t("tabTeams") },
    { key: "participants", label: t("tabParticipants") },
    { key: "observers", label: t("tabObservers") },
    { key: "session-teams", label: t("tabSessionTeams") },
    { key: "team-participants", label: t("tabTeamTN") },
    { key: "observer-assignments", label: t("tabObserverSess") },
    { key: "criteria", label: t("tabCriteria") },
    { key: "names", label: t("tabNames") },
    { key: "tiebreak", label: t("tabTieBreak") },
    { key: "settings", label: t("tabSettings") },
    { key: "export", label: t("tabExport") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-admin-title">{t("adminTitle")}</h1>
        <div className="flex gap-2">
          <Link href="/abcd-bdp/admin/qa-demo" data-testid="link-qa-demo" className="text-xs bg-yellow-100 px-3 py-1 rounded-full hover:bg-yellow-200 font-medium">QA Demo</Link>
          <Link href="/abcd-bdp/admin/qa-lite" data-testid="link-qa-lite" className="text-xs bg-green-100 px-3 py-1 rounded-full hover:bg-green-200">QA-Lite</Link>
          <Link href="/abcd-bdp/admin/qa" data-testid="link-qa" className="text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">QA</Link>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm" data-testid="text-admin-msg">{msg}</div>}

      <div className="overflow-x-auto">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm min-w-max">
          {tabs.map(tb => (
            <button key={tb.key} data-testid={`admin-tab-${tb.key}`} onClick={() => setTab(tb.key)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === tb.key ? "bg-[#FFD700] text-black" : "text-gray-500 hover:bg-gray-50"}`}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "sessions" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-session" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("newSession")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addSession} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("addSession")}</button>
          </div>
          {sessions.map(s => (
            <div key={s.id} data-testid={`admin-session-row-${s.id}`} className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{s.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{stateLabel[s.state]}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {t("teams")}: {s.sessionTeams?.map((st: any) => st.team.code).join(", ") || "–"} · {t("observers")}: {s.observerAssignments?.map((oa: any) => oa.user.code).join(", ") || "–"}
              </div>
              <div className="flex gap-2 flex-wrap">
                {nextState[s.state]?.map(ns => (
                  <button key={ns} data-testid={`button-state-${s.id}-${ns}`} onClick={() => stateTransition(s.id, ns)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100">
                    → {stateLabel[ns]}
                  </button>
                ))}
                <button data-testid={`button-transparency-${s.id}`} onClick={() => {
                  const newMode = s.transparencyMode === "aggregates_only" ? "show_per_observer_breakdown" : "aggregates_only";
                  fetch("/api/abcd-bdp/sessions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, transparencyMode: newMode }) }).then(() => refresh());
                }} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100">
                  {s.transparencyMode === "aggregates_only" ? t("aggregate") : t("detail")}
                </button>
                {s.state === "DRAFT" && (
                  <button data-testid="bdp-admin-delete" onClick={() => deleteSession(s.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full hover:bg-red-100">{t("delete")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-team-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder={t("teamCode")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addTeam} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("addTeam")}</button>
          </div>
          {teams.map(tm => (
            <div key={tm.id} data-testid={`admin-team-row-${tm.id}`} className="p-3 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold">{tm.code}</span>
                  <span className="text-xs text-gray-400 ml-2">{tm.displayName || ""}</span>
                  <span className="text-xs text-gray-400 ml-2">({tm.teamParticipants?.length || 0} {t("participantsTN")})</span>
                  {tm.businessCaseType && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">{tm.businessCaseType === "pdf" ? "PDF" : t("demoLabel")} Case</span>}
                </div>
                <button data-testid="bdp-admin-delete" onClick={() => deleteTeam(tm.id)} className="text-xs text-red-400 hover:text-red-600">{t("delete")}</button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  data-testid={`bdp-team-upload-case-${tm.id}`}
                  type="file"
                  accept="application/pdf"
                  className="text-xs flex-1"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("teamId", tm.id);
                    const res = await fetch("/api/abcd-bdp/business-case/upload", { method: "POST", body: fd });
                    if (res.ok) { flash(t("businessCaseUploaded")); refresh(); }
                    else { const d = await res.json(); flash(d.error || t("error")); }
                  }}
                />
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{t("uploadPdf")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "participants" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-participant-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder={t("participantCode")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addParticipant} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("addParticipant")}</button>
          </div>
          {participants.map(p => (
            <div key={p.id} data-testid={`admin-participant-row-${p.id}`} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold">{p.code}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {p.teamParticipants?.map((tp: any) => tp.team.code).join(", ") || t("notAssigned")}
                </span>
              </div>
              <button data-testid="bdp-admin-delete" onClick={() => deleteParticipant(p.id)} className="text-xs text-red-400 hover:text-red-600">{t("delete")}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "observers" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-observer-code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder={t("observerCode")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
                {t("sessions")}: {o.observerAssignments?.map((oa: any) => oa.session.name).join(", ") || "–"}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "session-teams" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">{t("sessionTeams")}</h2>
          <p className="text-sm text-gray-500">{t("assignTeamsToSessions")}</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-st-session" value={stSessionId} onChange={e => setStSessionId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectSessionPlaceholder")}</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select data-testid="select-st-team" value={stTeamId} onChange={e => setStTeamId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectTeamPlaceholder")}</option>
              {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.code}</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignSessionTeam} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("assign")}</button>
          </div>
          <div className="space-y-2">
            {sessionTeams.map(st => (
              <div key={st.id} data-testid={`admin-session-team-row-${st.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm"><strong>{st.session?.name}</strong> ← {st.team?.code}</span>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignSessionTeam(st.id)} className="text-xs text-red-400 hover:text-red-600">{t("remove")}</button>
              </div>
            ))}
            {sessionTeams.length === 0 && <p className="text-sm text-gray-400">{t("noAssignments")}</p>}
          </div>
        </div>
      )}

      {tab === "team-participants" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">{t("teamParticipants")}</h2>
          <p className="text-sm text-gray-500">{t("assignParticipantsToTeams")}</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-tp-team" value={tpTeamId} onChange={e => setTpTeamId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectTeamPlaceholder")}</option>
              {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.code}</option>)}
            </select>
            <select data-testid="select-tp-participant" value={tpParticipantId} onChange={e => setTpParticipantId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectParticipantPlaceholder")}</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignTeamParticipant} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("assign")}</button>
          </div>
          <div className="space-y-2">
            {teamParticipants.map(tp => (
              <div key={tp.id} data-testid={`admin-team-participant-row-${tp.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm"><strong>{tp.team?.code}</strong> ← {tp.participant?.code}</span>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignTeamParticipant(tp.id)} className="text-xs text-red-400 hover:text-red-600">{t("remove")}</button>
              </div>
            ))}
            {teamParticipants.length === 0 && <p className="text-sm text-gray-400">{t("noAssignments")}</p>}
          </div>
        </div>
      )}

      {tab === "observer-assignments" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">{t("observerSessions")}</h2>
          <p className="text-sm text-gray-500">{t("assignObserversToSessions")}</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-oa-session" value={oaSessionId} onChange={e => setOaSessionId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectSessionPlaceholder")}</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select data-testid="select-oa-observer" value={oaUserId} onChange={e => setOaUserId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectObserverPlaceholder")}</option>
              {observers.map(o => <option key={o.id} value={o.id}>{o.code} ({o.role})</option>)}
            </select>
            <button data-testid="bdp-admin-assign" onClick={assignObserver} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("assign")}</button>
          </div>
          <div className="space-y-2">
            {observerAssignments.map(oa => (
              <div key={oa.id} data-testid={`admin-observer-assignment-row-${oa.id}`} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm"><strong>{oa.session?.name}</strong> ← {oa.user?.code} ({oa.user?.role})</span>
                  <span className="text-xs text-gray-400 ml-2">
                    Scope: {oa.canScoreTeamIds?.length > 0 ? oa.canScoreTeamIds.join(", ") : t("scopeAllTeams")}
                  </span>
                </div>
                <button data-testid="bdp-admin-unassign" onClick={() => unassignObserver(oa.id)} className="text-xs text-red-400 hover:text-red-600">{t("remove")}</button>
              </div>
            ))}
            {observerAssignments.length === 0 && <p className="text-sm text-gray-400">{t("noAssignments")}</p>}
          </div>
        </div>
      )}

      {tab === "criteria" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input data-testid="input-new-criterion" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("newCriterion")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={addCriterion} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">+</button>
          </div>
          {criteria.map((c, idx) => (
            <div key={c.id} data-testid={`admin-criterion-row-${c.id}`} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">{idx + 1}. {c.name}</span>
              </div>
              <button data-testid="bdp-admin-delete" onClick={() => deleteCriterion(c.id)} className="text-xs text-red-400 hover:text-red-600">{t("remove")}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "names" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">{t("nameMappingHint")}</p>
          <div className="flex gap-2 flex-wrap">
            <select data-testid="select-mapping-type" value={mappingType} onChange={e => setMappingType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="observer">{t("observers")}</option>
              <option value="participant">{t("participants")}</option>
              <option value="team">Team</option>
            </select>
            <select data-testid="select-mapping-entity" value={mappingId} onChange={e => setMappingId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">{t("selectPlaceholder")}</option>
              {mappingType === "observer" && observers.map(o => <option key={o.id} value={o.id}>{o.code}</option>)}
              {mappingType === "participant" && participants.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              {mappingType === "team" && teams.map(tm => <option key={tm.id} value={tm.id}>{tm.code}</option>)}
            </select>
            <input data-testid="input-real-name" value={mappingRealName} onChange={e => setMappingRealName(e.target.value)} placeholder={t("realName")} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button data-testid="bdp-admin-save" onClick={saveNameMapping} className="bg-[#FFD700] px-4 py-2 rounded-lg text-sm font-bold">{t("save")}</button>
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
          <h2 className="font-bold">{t("tieBreakTitle")}</h2>
          <p className="text-sm text-gray-500">{t("tieBreakHint")}</p>
          <select data-testid="select-tie-session" value={tieSessionId} onChange={e => setTieSessionId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">{t("selectSessionPlaceholder")}</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select data-testid="select-tie-winner" value={tieWinnerTeamId} onChange={e => setTieWinnerTeamId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">{t("selectWinnerTeam")}</option>
            {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.code}</option>)}
          </select>
          <select data-testid="select-tie-decided-by" value={tieDecidedById} onChange={e => setTieDecidedById(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">{t("decidedBy")}</option>
            {observers.filter(o => o.role === "BOARD").map(o => <option key={o.id} value={o.id}>{o.code}</option>)}
          </select>
          <textarea data-testid="input-tie-rationale" value={tieRationale} onChange={e => setTieRationale(e.target.value)} placeholder={t("rationale")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
          <button data-testid="bdp-admin-save" onClick={saveTieBreak} className="w-full bg-[#FFD700] py-3 rounded-xl font-bold">{t("saveTieBreak")}</button>
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.weightedAnalytics || false} onChange={e => updateConfig({ weightedAnalytics: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-weighted" />
            <span className="text-sm">{t("weightedAnalytics")}</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.lockNotesOnClose ?? true} onChange={e => updateConfig({ lockNotesOnClose: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-lock-notes" />
            <span className="text-sm">{t("lockNotesOnClose")}</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config?.enforceGatePassword || false} onChange={e => updateConfig({ enforceGatePassword: e.target.checked })} className="w-5 h-5 accent-[#FFD700]" data-testid="checkbox-gate-pw" />
            <span className="text-sm">{t("enforceGatePassword")}</span>
          </label>
          <hr />
          <button data-testid="button-reset-demo" onClick={() => flash(t("resetDemoHint"))} className="w-full bg-red-50 text-red-700 py-3 rounded-xl font-bold hover:bg-red-100">{t("resetDemoData")}</button>
        </div>
      )}

      {tab === "export" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold">{t("exportTitle")}</h2>
          <p className="text-xs text-gray-500">{t("exportHint")}</p>
          {sessions.filter(s => s.state === "RELEASED").length === 0 && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-sm" data-testid="text-export-no-released">
              {t("noReleasedSessions")}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-2">{t("liveDataNoDemo")}</h3>
              <div className="flex gap-2">
                <button data-testid="button-export-csv" onClick={() => handleExport("csv", false, false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">{t("csvAnonymous")}</button>
                <button data-testid="button-export-json" onClick={() => handleExport("json", false, false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">{t("jsonAnonymous")}</button>
                <button data-testid="button-export-print" onClick={() => window.open("/abcd-bdp/export/print", "_blank")} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200">{t("printView")}</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">{t("withRealNames")}</h3>
              <div className="flex gap-2">
                <button data-testid="button-export-csv-named" onClick={() => handleExport("csv", false, true)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100">{t("csvNamedShort")}</button>
                <button data-testid="button-export-json-named" onClick={() => handleExport("json", false, true)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100">{t("jsonNamedShort")}</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">{t("includeDemo")}</h3>
              <div className="flex gap-2">
                <button data-testid="button-export-demo-csv" onClick={() => handleExport("csv", true, false)} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg text-sm hover:bg-orange-100">{t("csvWithDemo")}</button>
                <button data-testid="button-export-demo-json" onClick={() => handleExport("json", true, false)} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg text-sm hover:bg-orange-100">{t("jsonWithDemo")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
