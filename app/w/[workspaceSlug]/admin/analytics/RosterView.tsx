"use client";

const STATUS_CONFIG = {
  ausgewertet:   { label: "Ausgewertet",    bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  in_bearbeitung:{ label: "In Bearbeitung", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  registriert:   { label: "Registriert",    bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  angelegt:      { label: "Angelegt",       bg: "bg-slate-100", text: "text-slate-500",  border: "border-slate-200" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

interface CandidateStatusEntry {
  candidateId: string;
  candidateName: string;
  email: string;
  status: StatusKey;
  scoredCompetencies: number;
}

export default function RosterView({
  candidateStatus,
  selectedAssessment,
}: {
  candidateStatus: CandidateStatusEntry[];
  selectedAssessment: string;
}) {
  if (!selectedAssessment) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <p className="text-lg mb-1">Bitte ein Assessment auswählen</p>
        <p className="text-sm">Wählen Sie oben ein Projekt aus, um die Teilnehmerliste zu sehen.</p>
      </div>
    );
  }

  if (candidateStatus.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <p>Keine Kandidaten in diesem Assessment.</p>
      </div>
    );
  }

  const summary = Object.keys(STATUS_CONFIG).map((key) => ({
    key: key as StatusKey,
    count: candidateStatus.filter((c) => c.status === key).length,
  }));

  return (
    <div className="space-y-5" data-testid="roster-view">
      {/* Status summary badges */}
      <div className="flex flex-wrap gap-3">
        {summary.filter((s) => s.count > 0).map((s) => {
          const cfg = STATUS_CONFIG[s.key];
          return (
            <div
              key={s.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
              data-testid={`badge-status-${s.key}`}
            >
              <span>{s.count}×</span>
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="roster-table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Bewertete Kompetenzen</th>
              </tr>
            </thead>
            <tbody>
              {candidateStatus.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <tr
                    key={c.candidateId}
                    className="border-b border-slate-50 hover:bg-slate-50"
                    data-testid={`row-roster-${c.candidateId}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{c.candidateName}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {c.scoredCompetencies > 0 ? c.scoredCompetencies : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Status wird aus vorhandenen Daten abgeleitet: Ausgewertet = konsolidierte Scores vorhanden ·
        In Bearbeitung = Observer-Ratings erfasst · Registriert = Passwort gesetzt · Angelegt = noch kein Login.
      </p>
    </div>
  );
}
