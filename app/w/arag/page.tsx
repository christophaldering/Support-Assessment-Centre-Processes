"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

type Person = { code: string; realName: string; role: string };
type PeopleData = { observers: Person[]; experts: Person[]; participants: Person[]; admins: Person[] };

export default function AragLobbyPage() {
  const router = useRouter();
  const [gateOk, setGateOk] = useState(false);
  const [gateLoading, setGateLoading] = useState(true);
  const [gateEmail, setGateEmail] = useState("");
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateSubmitting, setGateSubmitting] = useState(false);

  const [lobbyEnv, setLobbyEnv] = useState<"live" | "demo" | null>(null);
  const [envLockedNote, setEnvLockedNote] = useState(false);

  const [people, setPeople] = useState<PeopleData | null>(null);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [personPassword, setPersonPassword] = useState("");
  const [personError, setPersonError] = useState("");
  const [personLoading, setPersonLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    fetch("/api/arag-bdp/gate/me", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setGateOk(d.ok === true))
      .catch(() => setGateOk(false))
      .finally(() => setGateLoading(false));
  }, []);

  useEffect(() => {
    if (!lobbyEnv) return;
    setPeopleLoading(true);
    setSelectedCode("");
    setPersonPassword("");
    setPersonError("");
    fetch(`/api/arag-bdp/gate/people?environment=${lobbyEnv}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setPeople(null); return; }
        setPeople(d);
      })
      .catch(() => setPeople(null))
      .finally(() => setPeopleLoading(false));
  }, [lobbyEnv]);

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setGateSubmitting(true);
    try {
      const res = await fetch("/api/arag-bdp/gate/general-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gateEmail, password: gatePassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setGateOk(true);
      } else {
        setGateError(data.error || "Zugangsdaten nicht korrekt.");
      }
    } catch {
      setGateError("Verbindungsfehler.");
    } finally {
      setGateSubmitting(false);
    }
  };

  const handleEnvSelect = (env: "live" | "demo") => {
    setEnvLockedNote(false);
    setLobbyEnv(env);
  };

  const handlePersonLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonError("");
    if (!selectedCode || !personPassword || !lobbyEnv) return;
    setPersonLoading(true);
    try {
      const res = await fetch("/api/arag-bdp/gate/person-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: lobbyEnv, code: selectedCode, password: personPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(data.redirectTo || "/arag-bdp");
      } else {
        setPersonError(data.error || "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setPersonError("Verbindungsfehler.");
    } finally {
      setPersonLoading(false);
    }
  };

  const allPeople = useMemo(() => {
    if (!people) return [];
    const groups: { label: string; items: Person[] }[] = [
      { label: "Admin", items: people.admins },
      { label: "Beobachter", items: people.observers },
      { label: "Experte", items: people.experts },
      { label: "Teilnehmer", items: people.participants },
    ];
    return groups;
  }, [people]);

  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return allPeople;
    const q = searchFilter.toLowerCase();
    return allPeople.map(g => ({
      ...g,
      items: g.items.filter(p =>
        p.realName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      ),
    })).filter(g => g.items.length > 0);
  }, [allPeople, searchFilter]);

  const selectedPerson = useMemo(() => {
    if (!people || !selectedCode) return null;
    const all = [...people.admins, ...people.observers, ...people.experts, ...people.participants];
    return all.find(p => p.code === selectedCode) || null;
  }, [people, selectedCode]);

  useEffect(() => {
    if (lobbyEnv === "demo" && selectedCode) {
      setPersonPassword("Demo");
    }
  }, [selectedCode, lobbyEnv]);

  if (gateLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col">
      <header className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">ARAG Executive BDP</h1>
          </div>
          {gateOk && lobbyEnv && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              lobbyEnv === "demo" ? "bg-[#FFD700] text-black" : "bg-green-500 text-white"
            }`}>
              {lobbyEnv === "demo" ? "DEMO" : "LIVE"}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">

          {!gateOk && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#FFD700] font-bold text-2xl">A</span>
                </div>
                <h2 className="text-xl font-bold text-black">Projektzugang</h2>
                <p className="text-gray-500 text-sm mt-1">Bitte authentifizieren Sie sich.</p>
              </div>
              <form onSubmit={handleGateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <input
                    data-testid="arag-gate-email"
                    type="email"
                    value={gateEmail}
                    onChange={e => setGateEmail(e.target.value)}
                    placeholder="ihre@email.de"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                  <input
                    data-testid="arag-gate-password"
                    type="password"
                    value={gatePassword}
                    onChange={e => setGatePassword(e.target.value)}
                    placeholder="Passwort"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-sm"
                  />
                </div>
                {gateError && <p className="text-red-500 text-sm" data-testid="text-gate-error">{gateError}</p>}
                <button
                  data-testid="arag-gate-submit"
                  type="submit"
                  disabled={gateSubmitting}
                  className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
                >
                  {gateSubmitting ? "Prüfen..." : "Zugang prüfen"}
                </button>
              </form>
            </div>
          )}

          {gateOk && !lobbyEnv && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-black">Umgebung wählen</h2>
                <p className="text-gray-500 text-sm mt-1">Wählen Sie LIVE oder DEMO.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  data-testid="arag-lobby-live"
                  onClick={() => handleEnvSelect("live")}
                  className="p-6 rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-center group"
                >
                  <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <span className="w-3 h-3 rounded-full bg-green-500 group-hover:bg-white" />
                  </span>
                  <span className="font-bold text-black block">LIVE</span>
                  <span className="text-xs text-gray-400 mt-1 block">Produktivsystem</span>
                </button>
                <button
                  data-testid="arag-lobby-demo"
                  onClick={() => handleEnvSelect("demo")}
                  className="p-6 rounded-2xl border-2 border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/15 transition-all text-center group"
                >
                  <span className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FFD700] transition-colors">
                    <span className="w-3 h-3 rounded-full bg-[#FFD700] group-hover:bg-black" />
                  </span>
                  <span className="font-bold text-black block">DEMO</span>
                  <span className="text-xs text-gray-400 mt-1 block">Testumgebung</span>
                </button>
              </div>
              {envLockedNote && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl mt-4 text-center" data-testid="arag-env-locked-note">
                  Sie befinden sich in der DEMO-Umgebung.
                </p>
              )}
            </div>
          )}

          {gateOk && lobbyEnv && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-black">Anmeldung</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {lobbyEnv === "demo" ? "Demo-Umgebung" : "Live-System"}
                  </p>
                </div>
                <button
                  data-testid="arag-back-env"
                  onClick={() => { setLobbyEnv(null); setPeople(null); setSelectedCode(""); }}
                  className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                  Umgebung wechseln
                </button>
              </div>

              {peopleLoading ? (
                <div className="text-center py-6 text-gray-400">Personen werden geladen...</div>
              ) : (
                <form onSubmit={handlePersonLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Person auswählen</label>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Suchen..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-sm mb-2"
                      data-testid="arag-person-search"
                    />
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50" data-testid="arag-person-select">
                      {filteredGroups.map(group => (
                        <div key={group.label}>
                          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 sticky top-0">
                            {group.label}
                          </div>
                          {group.items.map(p => (
                            <button
                              key={p.code}
                              type="button"
                              data-testid={`arag-person-option-${p.code}`}
                              onClick={() => {
                                setSelectedCode(p.code);
                                setSearchFilter("");
                                setPersonError("");
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[#FFD700]/10 transition-colors flex items-center justify-between ${
                                selectedCode === p.code ? "bg-[#FFD700]/15 font-medium" : ""
                              }`}
                            >
                              <span>{p.realName} <span className="text-gray-400">({p.code})</span></span>
                              {selectedCode === p.code && <span className="text-[#FFD700] font-bold text-xs">&#10003;</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                      {filteredGroups.length === 0 && (
                        <div className="px-3 py-4 text-sm text-gray-400 text-center">Keine Treffer</div>
                      )}
                    </div>
                  </div>

                  {selectedPerson && (
                    <div className="bg-[#FFFBF0] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center font-bold text-sm">
                        {selectedPerson.realName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedPerson.realName}</p>
                        <p className="text-xs text-gray-400">{selectedPerson.code} &middot; {selectedPerson.role}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                    <input
                      data-testid="arag-person-password"
                      type="password"
                      value={personPassword}
                      onChange={e => setPersonPassword(e.target.value)}
                      placeholder={lobbyEnv === "demo" ? "Vorbefüllt" : "Passwort eingeben"}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-gray-50 text-sm"
                    />
                  </div>

                  {personError && <p className="text-red-500 text-sm" data-testid="text-person-error">{personError}</p>}

                  <button
                    data-testid="arag-person-login"
                    type="submit"
                    disabled={personLoading || !selectedCode || !personPassword}
                    className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50"
                  >
                    {personLoading ? "Anmeldung..." : "Anmelden"}
                  </button>
                </form>
              )}
            </div>
          )}

          {gateOk && (
            <div className="bg-white/60 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-sm text-black">Kurzinfo</h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                  Bewertung: pro Kriterium 100 Punkte (Summe muss 100 sein)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                  Sponsorflag = Transparenz
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                  Ergebnisse erst nach Abschluss sichtbar
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFD700] mt-0.5">&#9679;</span>
                  DEMO: Änderungen wirken sofort auf Auswertung
                </li>
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 pb-4">
            Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </p>
        </div>
      </main>
    </div>
  );
}
