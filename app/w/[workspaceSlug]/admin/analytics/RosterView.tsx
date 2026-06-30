"use client";

const STATUS_CONFIG = {
  ausgewertet:   { label: "Ausgewertet",    bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  in_bearbeitung:{ label: "In Bearbeitung", bg: "bg-[var(--eds-status-amber-bg)]",  text: "text-[var(--eds-status-amber)]",  border: "border-[var(--eds-status-amber-bg)]" },
  registriert:   { label: "Registriert",    bg: "bg-[var(--eds-status-blue-bg)]",   text: "text-[var(--eds-status-blue)]",   border: "border-[var(--eds-status-blue-bg)]" },
  angelegt:      { label: "Angelegt",       bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-tertiary)]",  border: "border-[var(--eds-border)]" },
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
      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-12 text-center text-[var(--eds-text-disabled)]">
        <p className="text-lg mb-1">Bitte ein Assessment auswählen</p>
        <p className="text-sm">Wählen Sie oben ein Projekt aus, um die Teilnehmerliste zu sehen.</p>
      </div>
    );
  }

  if (candidateStatus.length === 0) {
    return (
      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-12 text-center text-[var(--eds-text-disabled)]">
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
      <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="roster-table">
            <thead>
              <tr className="border-b border-[var(--eds-border)] bg-[var(--eds-bg-sunken)] text-xs text-[var(--eds-text-tertiary)]">
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
                    className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]"
                    data-testid={`row-roster-${c.candidateId}`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--eds-text-primary)]">{c.candidateName}</td>
                    <td className="px-4 py-3 text-[var(--eds-text-tertiary)] hidden sm:table-cell">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--eds-text-secondary)]">
                      {c.scoredCompetencies > 0 ? c.scoredCompetencies : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[var(--eds-text-disabled)]">
        Status wird aus vorhandenen Daten abgeleitet: Ausgewertet = konsolidierte Scores vorhanden ·
        In Bearbeitung = Observer-Ratings erfasst · Registriert = Passwort gesetzt · Angelegt = noch kein Login.
      </p>
    </div>
  );
}
