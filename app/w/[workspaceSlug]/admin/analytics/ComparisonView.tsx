"use client";

import { useState, useMemo } from "react";

const ACCENT = "#A6473B";
const TEAL = "#297587";

const CANDIDATE_COLORS = [
  "#A6473B", "#297587", "#7C3AED", "#D97706", "#059669", "#2563EB", "#DB2777",
];

interface CandidateCompetency {
  name: string;
  normalized: number;
  outlier: boolean;
  overridden: boolean;
}
interface CandidateScore {
  candidateId: string;
  candidateName: string;
  competencies: CandidateCompetency[];
}

function scoreToColor(value: number): { bg: string; fg: string } {
  const t = Math.max(0, Math.min(100, value)) / 100;
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(0xef * (1 - s) + 0x29 * s);
    const g = Math.round(0xf4 * (1 - s) + 0x75 * s);
    const b = Math.round(0xf5 * (1 - s) + 0x87 * s);
    return { bg: `rgb(${r},${g},${b})`, fg: s > 0.55 ? "#fff" : "#1e293b" };
  }
  const s = (t - 0.5) * 2;
  const r = Math.round(0x29 * (1 - s) + 0xa6 * s);
  const g = Math.round(0x75 * (1 - s) + 0x47 * s);
  const b = Math.round(0x87 * (1 - s) + 0x3b * s);
  return { bg: `rgb(${r},${g},${b})`, fg: "#fff" };
}

function polar(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function ComparisonView({
  candidateScores,
  workspaceSlug,
}: {
  candidateScores: CandidateScore[];
  workspaceSlug: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(candidateScores.map((c) => c.candidateId))
  );
  const [sortCol, setSortCol] = useState<"rank" | "score" | "best" | "worst">("rank");
  const [sortAsc, setSortAsc] = useState(false);

  // Build stable competency list (order of first occurrence across all selected)
  const allCompetencies = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const cs of candidateScores) {
      for (const c of cs.competencies) {
        if (!seen.has(c.name)) { seen.add(c.name); order.push(c.name); }
      }
    }
    return order.sort(); // alphabetical for stability
  }, [candidateScores]);

  const selected = useMemo(
    () => candidateScores.filter((c) => selectedIds.has(c.candidateId)),
    [candidateScores, selectedIds]
  );

  // Matrix: competency → candidateId → value
  const matrix = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const comp of allCompetencies) m.set(comp, new Map());
    for (const cs of selected) {
      for (const c of cs.competencies) {
        m.get(c.name)?.set(cs.candidateId, c.normalized);
      }
    }
    return m;
  }, [allCompetencies, selected]);

  // Per-candidate aggregate stats
  const stats = useMemo(() =>
    candidateScores.map((cs) => {
      const vals = cs.competencies.map((c) => c.normalized);
      const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const best = cs.competencies.length > 0
        ? cs.competencies.reduce((a, b) => (b.normalized > a.normalized ? b : a))
        : undefined;
      const worst = cs.competencies.length > 0
        ? cs.competencies.reduce((a, b) => (b.normalized < a.normalized ? b : a))
        : undefined;
      return { ...cs, mean: Math.round(mean * 10) / 10, best: best?.name ?? "—", worst: worst?.name ?? "—" };
    }),
  [candidateScores]);

  function toggleCandidate(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  function handleSort(col: typeof sortCol) {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(col === "rank" ? true : false); }
  }

  const sortedStats = useMemo(() => {
    const base = [...stats].sort((a, b) => b.mean - a.mean).map((s, i) => ({ ...s, rank: i + 1 }));
    if (sortCol === "rank") return sortAsc ? base : [...base].reverse();
    if (sortCol === "score") return sortAsc ? [...base].sort((a, b) => a.mean - b.mean) : base;
    if (sortCol === "best") return [...base].sort((a, b) => sortAsc ? a.best.localeCompare(b.best) : b.best.localeCompare(a.best));
    return [...base].sort((a, b) => sortAsc ? a.worst.localeCompare(b.worst) : b.worst.localeCompare(a.worst));
  }, [stats, sortCol, sortAsc]);

  const colorOf = (id: string) =>
    CANDIDATE_COLORS[candidateScores.findIndex((c) => c.candidateId === id) % CANDIDATE_COLORS.length];

  // Radar SVG
  const CX = 160, CY = 160, R = 110, LABEL_R = 130;
  const N = allCompetencies.length;
  const radarPolygon = (cs: CandidateScore) => {
    if (N === 0) return "";
    return allCompetencies.map((comp, i) => {
      const val = cs.competencies.find((c) => c.name === comp)?.normalized ?? 0;
      const r = (val / 100) * R;
      const angle = (360 / N) * i;
      const { x, y } = polar(angle, r, CX, CY);
      return `${x},${y}`;
    }).join(" ");
  };

  if (candidateScores.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <p className="text-lg mb-1">Mindestens zwei bewertete Kandidaten nötig</p>
        <p className="text-sm">Wählen Sie ein Assessment mit konsolidierten Scores für mehrere Kandidaten.</p>
      </div>
    );
  }

  const SortBtn = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 font-medium hover:text-[#A6473B] transition-colors"
      data-testid={`sort-${col}`}
    >
      {label}
      <span className="text-xs opacity-60">
        {sortCol === col ? (sortAsc ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: white !important; }
          .print-footer { display: block !important; }
        }
        .print-footer { display: none; }
      `}</style>

      <div className="space-y-8">
        {/* Candidate selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 no-print">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Kandidatenauswahl</p>
          <div className="flex flex-wrap gap-2">
            {candidateScores.map((cs) => {
              const on = selectedIds.has(cs.candidateId);
              const color = colorOf(cs.candidateId);
              return (
                <button
                  key={cs.candidateId}
                  onClick={() => toggleCandidate(cs.candidateId)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all"
                  style={on ? { borderColor: color, backgroundColor: `${color}18`, color } : {}}
                  data-testid={`chip-candidate-${cs.candidateId}`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: on ? color : "#cbd5e1" }}
                  />
                  {cs.candidateName}
                </button>
              );
            })}
          </div>
          {selected.length > 5 && (
            <p className="text-xs text-amber-600 mt-2">
              Für optimale Radar-Lesbarkeit empfehlen wir max. 5 Kandidaten gleichzeitig.
            </p>
          )}
        </div>

        {/* 1. Heatmap */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: ACCENT }}>
              Heatmap-Matrix
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 no-print">
              <span className="w-16 h-3 rounded" style={{ background: "linear-gradient(to right, #EFF4F5, #297587, #A6473B)" }} />
              <span>0 → 100</span>
            </div>
          </div>
          <div className="overflow-x-auto p-4">
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `minmax(140px,1fr) ${selected.map(() => "minmax(72px,1fr)").join(" ")}` }}
              data-testid="heatmap-grid"
            >
              {/* Header row */}
              <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Kompetenz
              </div>
              {selected.map((cs) => (
                <div
                  key={cs.candidateId}
                  className="px-1 py-1 text-xs font-medium text-center truncate"
                  style={{ color: colorOf(cs.candidateId) }}
                  title={cs.candidateName}
                >
                  {cs.candidateName.split(" ")[0]}
                </div>
              ))}

              {/* Data rows */}
              {allCompetencies.map((comp) => (
                <>
                  <div
                    key={`lbl-${comp}`}
                    className="px-2 py-1.5 text-xs text-slate-700 truncate flex items-center"
                    title={comp}
                  >
                    {comp}
                  </div>
                  {selected.map((cs) => {
                    const val = matrix.get(comp)?.get(cs.candidateId);
                    const { bg, fg } = val !== undefined ? scoreToColor(val) : { bg: "#f8fafc", fg: "#94a3b8" };
                    return (
                      <div
                        key={`${comp}-${cs.candidateId}`}
                        className="flex items-center justify-center text-xs font-mono font-medium rounded h-8"
                        style={{ backgroundColor: bg, color: fg }}
                        data-testid={`cell-${comp}-${cs.candidateId}`}
                        title={`${comp}: ${val !== undefined ? Math.round(val) : "—"}`}
                      >
                        {val !== undefined ? Math.round(val) : "—"}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Radar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 print-break">
          <h2 className="text-base font-semibold mb-4" style={{ color: ACCENT }}>
            Netzdiagramm
          </h2>
          {N < 3 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Mindestens 3 Kompetenzen für das Netzdiagramm erforderlich.</p>
          ) : (
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <svg viewBox="0 0 320 320" className="w-full max-w-xs flex-shrink-0" data-testid="radar-svg">
                {/* Grid rings */}
                {[25, 50, 75, 100].map((pct) => (
                  <polygon
                    key={pct}
                    points={allCompetencies.map((_, i) => {
                      const { x, y } = polar((360 / N) * i, (pct / 100) * R, CX, CY);
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={pct === 100 ? 1.5 : 1}
                  />
                ))}
                {/* Axes */}
                {allCompetencies.map((comp, i) => {
                  const { x, y } = polar((360 / N) * i, R, CX, CY);
                  const lp = polar((360 / N) * i, LABEL_R, CX, CY);
                  return (
                    <g key={comp}>
                      <line x1={CX} y1={CY} x2={x} y2={y} stroke="#cbd5e1" strokeWidth={1} />
                      <text
                        x={lp.x}
                        y={lp.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={8}
                        fill="#64748b"
                        style={{ userSelect: "none" }}
                      >
                        {comp.length > 12 ? comp.slice(0, 11) + "…" : comp}
                      </text>
                    </g>
                  );
                })}
                {/* Candidate polygons */}
                {selected.map((cs) => {
                  const color = colorOf(cs.candidateId);
                  return (
                    <polygon
                      key={cs.candidateId}
                      points={radarPolygon(cs)}
                      fill={`${color}22`}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                    />
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Legende</p>
                {selected.map((cs) => (
                  <div key={cs.candidateId} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorOf(cs.candidateId) }} />
                    <span className="text-slate-700">{cs.candidateName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Ranking table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold" style={{ color: ACCENT }}>Ranking</h2>
            <div className="flex items-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#297587] hover:text-[#297587] transition-colors"
                data-testid="button-print"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Als PDF exportieren
              </button>
              <a
                href={`/w/${workspaceSlug}/admin/gutachten`}
                className="text-xs text-slate-400 hover:text-[#297587] transition-colors"
                data-testid="link-gutachten"
              >
                Formale Berichte → Gutachten-Generator
              </a>
            </div>
          </div>
          <div className="overflow-x-auto" data-testid="ranking-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-3"><SortBtn col="rank" label="Rang" /></th>
                  <th className="px-4 py-3">Kandidat</th>
                  <th className="px-4 py-3"><SortBtn col="score" label="Gesamt-Score" /></th>
                  <th className="px-4 py-3 hidden lg:table-cell"><SortBtn col="best" label="Stärkste Kompetenz" /></th>
                  <th className="px-4 py-3 hidden lg:table-cell"><SortBtn col="worst" label="Schwächste Kompetenz" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((s) => (
                  <tr
                    key={s.candidateId}
                    className="border-b border-slate-50 hover:bg-slate-50"
                    data-testid={`row-rank-${s.candidateId}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: s.rank <= 3 ? ACCENT : "#94a3b8" }}
                      >
                        {s.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorOf(s.candidateId) }} />
                        <span className="font-medium text-slate-800">{s.candidateName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${s.mean}%`, backgroundColor: TEAL }}
                          />
                        </div>
                        <span className="font-mono text-slate-700">{s.mean}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-teal-700 text-xs">{s.best}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">{s.worst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print footer */}
        <div className="print-footer text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
          © Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!
        </div>
      </div>
    </>
  );
}
