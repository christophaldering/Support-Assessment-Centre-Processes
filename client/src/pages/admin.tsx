import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, AlertCircle, Download, Trash2, Plus, LogOut, Clock, FileText, Radar as RadarIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer } from "recharts";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { competencyFramework } from "@/lib/data";
import type { AssessmentResponse, AssessmentSession, AccessCode, UploadedExercise, ObserverRating, SelfAssessment, TimedRelease } from "@shared/schema";

const CUSTOMERS = [
  { id: "rewe", label: "REWE Group" },
  { id: "ruv", label: "R+V Versicherung" },
  { id: "materna", label: "Materna SE" },
];

function truncate(str: string, max = 60) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("de-DE");
}

function exportCsv(responses: AssessmentResponse[]) {
  const header = "sessionId;caseId;phase;question;answer;updatedAt";
  const rows = responses.map((r) =>
    [r.sessionId, r.caseId, r.phase, `"${r.question.replace(/"/g, '""')}"`, `"${r.answer.replace(/"/g, '""')}"`, formatDate(r.updatedAt)].join(";")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aestimamus-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/admin", { password });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("aestimamus_admin_auth", "true");
        onLogin();
      }
    } catch {
      setError("Ungültiges Passwort. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="border-t-2 border-t-copper pt-8">
          <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">Admin-Zugang</h2>
          <p className="text-sm text-[#777] mb-6">Nur für autorisierte Administratoren</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#333] mb-2">
                Admin-Passwort
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full border-gray-300 focus:border-copper focus:ring-copper"
                data-testid="input-admin-password"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span data-testid="text-admin-error">{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
              data-testid="button-admin-login"
            >
              {loading ? "Wird überprüft..." : "Anmelden"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ResponsesTab() {
  const { data: responses = [], isLoading } = useQuery<AssessmentResponse[]>({
    queryKey: ["/api/admin/responses"],
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Antworten ({responses.length})</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-copper text-copper hover:bg-copper/5"
          onClick={() => exportCsv(responses)}
          disabled={responses.length === 0}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4" />
          CSV Export
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session-ID</TableHead>
              <TableHead>Case-ID</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Frage</TableHead>
              <TableHead>Antwort</TableHead>
              <TableHead>Aktualisiert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((r) => (
              <TableRow key={r.id} data-testid={`row-response-${r.id}`}>
                <TableCell className="font-mono text-xs">{r.sessionId}</TableCell>
                <TableCell>{r.caseId}</TableCell>
                <TableCell>{r.phase}</TableCell>
                <TableCell className="max-w-[200px]" title={r.question}>{truncate(r.question)}</TableCell>
                <TableCell className="max-w-[200px]" title={r.answer}>{truncate(r.answer)}</TableCell>
                <TableCell className="text-xs">{formatDate(r.updatedAt)}</TableCell>
              </TableRow>
            ))}
            {responses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#777]">Keine Antworten vorhanden</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function SessionsTab() {
  const { data: sessions = [], isLoading } = useQuery<AssessmentSession[]>({
    queryKey: ["/api/admin/sessions"],
  });

  return (
    <Card className="p-4">
      <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-4">Sitzungen ({sessions.length})</h3>
      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session-ID</TableHead>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Case-ID</TableHead>
              <TableHead>Gestartet</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} data-testid={`row-session-${s.id}`}>
                <TableCell className="font-mono text-xs">{s.sessionId}</TableCell>
                <TableCell>{s.participantName || "—"}</TableCell>
                <TableCell>{s.caseId}</TableCell>
                <TableCell className="text-xs">{formatDate(s.startedAt)}</TableCell>
                <TableCell>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {s.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[#777]">Keine Sitzungen vorhanden</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function AccessCodesTab() {
  const queryClient = useQueryClient();
  const { data: codes = [], isLoading } = useQuery<AccessCode[]>({
    queryKey: ["/api/admin/access-codes"],
  });

  const [form, setForm] = useState({
    scope: "customer",
    customerId: "rewe",
    code: "",
    label: "",
    participantName: "",
    participantEmail: "",
  });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/access-codes", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access-codes"] });
      setForm({ scope: "customer", customerId: "rewe", code: "", label: "", participantName: "", participantEmail: "" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/access-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access-codes"] });
    },
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Zugangscodes ({codes.length})</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-copper text-copper hover:bg-copper/5"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-toggle-code-form"
        >
          <Plus className="h-4 w-4" />
          Neuer Code
        </Button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded p-4 mb-4 space-y-3" data-testid="form-create-code">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="select-code-scope"
              >
                <option value="global">Global</option>
                <option value="customer">Kunde</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Kunde</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="select-code-customer"
              >
                {CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Code</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Zugangscode"
                data-testid="input-code-value"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Label</label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Bezeichnung"
                data-testid="input-code-label"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Teilnehmer-Name</label>
              <Input
                value={form.participantName}
                onChange={(e) => setForm({ ...form, participantName: e.target.value })}
                placeholder="Name"
                data-testid="input-code-participant-name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Teilnehmer-E-Mail</label>
              <Input
                value={form.participantEmail}
                onChange={(e) => setForm({ ...form, participantEmail: e.target.value })}
                placeholder="E-Mail"
                data-testid="input-code-participant-email"
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.code.trim() || createMutation.isPending}
            className="bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
            data-testid="button-create-code"
          >
            {createMutation.isPending ? "Wird erstellt…" : "Code erstellen"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((c) => (
              <TableRow key={c.id} data-testid={`row-code-${c.id}`}>
                <TableCell>{c.scope}</TableCell>
                <TableCell>{c.customerId || "—"}</TableCell>
                <TableCell>{c.label || "—"}</TableCell>
                <TableCell>{c.participantName || "—"}</TableCell>
                <TableCell>{c.participantEmail || "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-code-${c.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#777]">Keine Zugangscodes vorhanden</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function ExercisesTab() {
  const queryClient = useQueryClient();
  const { data: exercises = [], isLoading } = useQuery<UploadedExercise[]>({
    queryKey: ["/api/admin/exercises"],
  });

  const [form, setForm] = useState({
    customerId: "rewe",
    title: "",
    description: "",
    type: "document",
  });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/exercises", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      setForm({ customerId: "rewe", title: "", description: "", type: "document" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
    },
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Übungen ({exercises.length})</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-copper text-copper hover:bg-copper/5"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-toggle-exercise-form"
        >
          <Plus className="h-4 w-4" />
          Neue Übung
        </Button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded p-4 mb-4 space-y-3" data-testid="form-create-exercise">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Kunde</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="select-exercise-customer"
              >
                {CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Typ</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="select-exercise-type"
              >
                <option value="document">Dokument</option>
                <option value="presentation">Präsentation</option>
                <option value="case-study">Fallstudie</option>
                <option value="exercise">Übung</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Titel</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titel der Übung"
              data-testid="input-exercise-title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Beschreibung</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Kurze Beschreibung"
              data-testid="input-exercise-description"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || createMutation.isPending}
            className="bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
            data-testid="button-create-exercise"
          >
            {createMutation.isPending ? "Wird erstellt…" : "Übung erstellen"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kunde</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((ex) => (
              <TableRow key={ex.id} data-testid={`row-exercise-${ex.id}`}>
                <TableCell>{ex.customerId}</TableCell>
                <TableCell className="font-medium">{ex.title}</TableCell>
                <TableCell className="max-w-[200px]">{truncate(ex.description || "", 50)}</TableCell>
                <TableCell>{ex.type}</TableCell>
                <TableCell className="text-xs">{formatDate(ex.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(ex.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-exercise-${ex.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {exercises.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#777]">Keine Übungen vorhanden</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

const RADAR_COLORS = ["#B87333", "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];

function CompetencyComparisonTab() {
  const { data: ratings = [], isLoading: loadingRatings } = useQuery<ObserverRating[]>({
    queryKey: ["/api/admin/observer-ratings/varexia"],
  });
  const { data: selfAssessments = [], isLoading: loadingSelf } = useQuery<SelfAssessment[]>({
    queryKey: ["/api/admin/self-assessments"],
  });
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<AssessmentSession[]>({
    queryKey: ["/api/admin/sessions"],
  });

  const isLoading = loadingRatings || loadingSelf || loadingSessions;

  const sessionMap = new Map(sessions.map((s) => [s.sessionId, s]));

  const ratingsBySession = ratings.reduce<Record<string, Record<string, { sum: number; count: number; notes: string[] }>>>((acc, r) => {
    if (!acc[r.sessionId]) acc[r.sessionId] = {};
    if (!acc[r.sessionId][r.competencyKey]) acc[r.sessionId][r.competencyKey] = { sum: 0, count: 0, notes: [] };
    acc[r.sessionId][r.competencyKey].sum += r.rating;
    acc[r.sessionId][r.competencyKey].count += 1;
    if (r.notes) acc[r.sessionId][r.competencyKey].notes.push(r.notes);
    return acc;
  }, {});

  const selfBySession = selfAssessments.reduce<Record<string, Record<string, number>>>((acc, sa) => {
    if (!acc[sa.sessionId]) acc[sa.sessionId] = {};
    acc[sa.sessionId][sa.competencyKey] = sa.rating;
    return acc;
  }, {});

  const candidateIds = Object.keys(ratingsBySession).slice(0, 6);

  const candidateLabelMap = new Map<string, string>();
  candidateIds.forEach((sid, i) => {
    const session = sessionMap.get(sid);
    let baseName = session?.participantName || sid.slice(0, 8);
    const existingValues = Array.from(candidateLabelMap.values());
    if (existingValues.includes(baseName)) {
      baseName = `${baseName} (${i + 1})`;
    }
    candidateLabelMap.set(sid, baseName);
  });

  const radarData = competencyFramework.dimensions.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim.labelDe };
    candidateIds.forEach((sid) => {
      const entry = ratingsBySession[sid]?.[dim.key];
      point[sid] = entry ? Math.round((entry.sum / entry.count) * 10) / 10 : 0;
    });
    return point;
  });

  return (
    <Card className="p-4">
      <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-4" data-testid="text-competency-title">
        <RadarIcon className="inline h-5 w-5 mr-2 text-copper" />
        Kompetenzvergleich
      </h3>
      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : candidateIds.length === 0 ? (
        <p className="text-sm text-[#777]" data-testid="text-no-competency-data">Keine Bewertungsdaten vorhanden</p>
      ) : (
        <>
          <div className="mb-8" data-testid="chart-radar-competency">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
                {candidateIds.map((sid, i) => (
                  <Radar
                    key={sid}
                    name={candidateLabelMap.get(sid) || sid.slice(0, 8)}
                    dataKey={sid}
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fillOpacity={0.1}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <h4 className="font-serif text-base font-bold text-[#1a1a1a] mb-3">Detailbewertungen</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                {competencyFramework.dimensions.map((dim) => (
                  <TableHead key={dim.key}>{dim.labelDe}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidateIds.map((sid) => {
                const label = candidateLabelMap.get(sid) || sid.slice(0, 8);
                return (
                  <TableRow key={sid} data-testid={`row-competency-${sid}`}>
                    <TableCell className="font-medium">{label}</TableCell>
                    {competencyFramework.dimensions.map((dim) => {
                      const entry = ratingsBySession[sid]?.[dim.key];
                      const avg = entry ? Math.round((entry.sum / entry.count) * 10) / 10 : "—";
                      const selfRating = selfBySession[sid]?.[dim.key];
                      return (
                        <TableCell key={dim.key}>
                          <span className="font-mono text-sm">{avg}</span>
                          {selfRating !== undefined && (
                            <span className="text-xs text-[#999] ml-1">(Selbst: {selfRating})</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}

const MATERIAL_OPTIONS = [
  { value: "emails_batch2", label: "E-Mails Batch 2" },
  { value: "dataroom_appendix", label: "Datenraum Anhang" },
  { value: "stress_scenario", label: "Stress-Szenario" },
  { value: "board_minutes", label: "Vorstandsprotokolle" },
];

function TimedReleasesTab() {
  const queryClient = useQueryClient();
  const { data: releases = [], isLoading } = useQuery<TimedRelease[]>({
    queryKey: ["/api/admin/timed-releases/varexia"],
  });

  const [form, setForm] = useState({
    title: "",
    materialKey: "emails_batch2",
    releaseAt: "",
    manualRelease: false,
  });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/timed-releases", {
        caseId: "varexia",
        title: form.title,
        materialKey: form.materialKey,
        releaseAt: form.releaseAt ? parseInt(form.releaseAt, 10) : null,
        manualRelease: form.manualRelease,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timed-releases/varexia"] });
      setForm({ title: "", materialKey: "emails_batch2", releaseAt: "", manualRelease: false });
      setShowForm(false);
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/admin/timed-releases/${id}`, { released: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timed-releases/varexia"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/timed-releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timed-releases/varexia"] });
    },
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-[#1a1a1a]" data-testid="text-timed-releases-title">
          <Clock className="inline h-5 w-5 mr-2 text-copper" />
          Zeitgesteuerte Freigabe ({releases.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-copper text-copper hover:bg-copper/5"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-toggle-release-form"
        >
          <Plus className="h-4 w-4" />
          Neue Freigabe
        </Button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded p-4 mb-4 space-y-3" data-testid="form-create-release">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Titel</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titel der Freigabe"
                data-testid="input-release-title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Material</label>
              <select
                value={form.materialKey}
                onChange={(e) => setForm({ ...form, materialKey: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="select-release-material"
              >
                {MATERIAL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Freigabe nach (Minuten)</label>
              <Input
                type="number"
                value={form.releaseAt}
                onChange={(e) => setForm({ ...form, releaseAt: e.target.value })}
                placeholder="z.B. 30"
                data-testid="input-release-minutes"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.manualRelease}
                  onChange={(e) => setForm({ ...form, manualRelease: e.target.checked })}
                  className="accent-copper"
                  data-testid="checkbox-manual-release"
                />
                Manuelle Freigabe
              </label>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || createMutation.isPending}
            className="bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
            data-testid="button-create-release"
          >
            {createMutation.isPending ? "Wird erstellt…" : "Freigabe erstellen"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[#777]">Laden…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Freigabe (Min.)</TableHead>
              <TableHead>Manuell</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map((r) => (
              <TableRow key={r.id} data-testid={`row-release-${r.id}`}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.materialKey}</TableCell>
                <TableCell>{r.releaseAt != null ? `${r.releaseAt} min` : "—"}</TableCell>
                <TableCell>{r.manualRelease ? "Ja" : "Nein"}</TableCell>
                <TableCell>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.released ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {r.released ? "Freigegeben" : "Ausstehend"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!r.released && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-copper hover:text-copper/80 hover:bg-copper/5"
                        onClick={() => releaseMutation.mutate(r.id)}
                        disabled={releaseMutation.isPending}
                        data-testid={`button-toggle-release-${r.id}`}
                        title="Freigeben"
                      >
                        <ToggleRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-release-${r.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {releases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#777]">Keine Freigaben vorhanden</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function ratingCircles(rating: number, max = 5) {
  return Array.from({ length: max }, (_, i) => (i < rating ? "●" : "○")).join("");
}

function ReportsTab() {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<AssessmentSession[]>({
    queryKey: ["/api/admin/sessions"],
  });
  const { data: responses = [] } = useQuery<AssessmentResponse[]>({
    queryKey: ["/api/admin/responses"],
  });
  const { data: ratings = [] } = useQuery<ObserverRating[]>({
    queryKey: ["/api/admin/observer-ratings/varexia"],
  });
  const { data: selfAssessments = [] } = useQuery<SelfAssessment[]>({
    queryKey: ["/api/admin/self-assessments"],
  });

  const generateReport = (sessionId: string) => {
    setSelectedSession(sessionId);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const session = sessions.find((s) => s.sessionId === selectedSession);
  const sessionResponses = responses.filter((r) => r.sessionId === selectedSession);
  const sessionRatings = ratings.filter((r) => r.sessionId === selectedSession);
  const sessionSelf = selfAssessments.filter((sa) => sa.sessionId === selectedSession);

  const ratingsByCompetency = sessionRatings.reduce<Record<string, { ratings: number[]; notes: string[] }>>((acc, r) => {
    if (!acc[r.competencyKey]) acc[r.competencyKey] = { ratings: [], notes: [] };
    acc[r.competencyKey].ratings.push(r.rating);
    if (r.notes) acc[r.competencyKey].notes.push(r.notes);
    return acc;
  }, {});

  const selfByKey = sessionSelf.reduce<Record<string, number>>((acc, sa) => {
    acc[sa.competencyKey] = sa.rating;
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.6; }
          #print-report h1 { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 8px; }
          #print-report h2 { font-family: 'Playfair Display', serif; font-size: 18px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
          #print-report h3 { font-size: 14px; font-weight: 600; margin-top: 16px; margin-bottom: 4px; }
          #print-report .rating-row { margin-bottom: 12px; }
          #print-report .circles { font-size: 16px; letter-spacing: 2px; }
        }
      `}</style>

      <Card className="p-4">
        <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-4" data-testid="text-reports-title">
          <FileText className="inline h-5 w-5 mr-2 text-copper" />
          Berichte
        </h3>
        {loadingSessions ? (
          <p className="text-sm text-[#777]">Laden…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[#777]" data-testid="text-no-reports-data">Keine Sitzungen vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session-ID</TableHead>
                <TableHead>Teilnehmer</TableHead>
                <TableHead>Case-ID</TableHead>
                <TableHead>Gestartet</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id} data-testid={`row-report-${s.id}`}>
                  <TableCell className="font-mono text-xs">{s.sessionId}</TableCell>
                  <TableCell>{s.participantName || "—"}</TableCell>
                  <TableCell>{s.caseId}</TableCell>
                  <TableCell className="text-xs">{formatDate(s.startedAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-copper text-copper hover:bg-copper/5"
                      onClick={() => generateReport(s.sessionId)}
                      data-testid={`button-generate-report-${s.id}`}
                    >
                      <FileText className="h-4 w-4" />
                      Bericht erstellen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div id="print-report" ref={printRef} className="hidden print:block">
        {selectedSession && session && (
          <div>
            <h1>Executive Diagnostics — Bericht</h1>
            <p><strong>Kandidat:</strong> {session.participantName || "—"}</p>
            <p><strong>Session:</strong> {session.sessionId}</p>
            <p><strong>Case:</strong> {session.caseId}</p>
            <p><strong>Datum:</strong> {formatDate(session.startedAt)}</p>

            <h2>Assessment-Antworten</h2>
            {sessionResponses.length === 0 ? (
              <p>Keine Antworten vorhanden.</p>
            ) : (
              sessionResponses.map((r) => (
                <div key={r.id} style={{ marginBottom: 12 }}>
                  <h3>{r.phase} — {r.question}</h3>
                  <p>{r.answer || "—"}</p>
                </div>
              ))
            )}

            <h2>Kompetenzbewertungen (Beobachter)</h2>
            {competencyFramework.dimensions.map((dim) => {
              const entry = ratingsByCompetency[dim.key];
              const avg = entry ? Math.round((entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length) * 10) / 10 : null;
              const selfRating = selfByKey[dim.key];
              return (
                <div key={dim.key} className="rating-row" style={{ marginBottom: 12 }}>
                  <h3>{dim.labelDe}</h3>
                  {avg !== null ? (
                    <>
                      <p className="circles" style={{ fontSize: 16, letterSpacing: 2 }}>
                        {ratingCircles(Math.round(avg))} ({avg}/5)
                      </p>
                      {entry!.notes.filter(Boolean).map((note, i) => (
                        <p key={i} style={{ color: "#555", marginLeft: 8 }}>— {note}</p>
                      ))}
                    </>
                  ) : (
                    <p style={{ color: "#999" }}>Keine Bewertung</p>
                  )}
                  {selfRating !== undefined && (
                    <p style={{ color: "#777", marginTop: 4 }}>
                      Selbsteinschätzung: {ratingCircles(selfRating)} ({selfRating}/5)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex-1">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1a1a1a]" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#777] mt-1">Verwaltung der Executive Diagnostics Suite</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[#777] hover:text-[#1a1a1a]"
            onClick={onLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>

        <Tabs defaultValue="responses">
          <TabsList className="mb-6 flex-wrap" data-testid="tabs-admin">
            <TabsTrigger value="responses" data-testid="tab-responses">Antworten</TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sitzungen</TabsTrigger>
            <TabsTrigger value="access-codes" data-testid="tab-access-codes">Zugangscodes</TabsTrigger>
            <TabsTrigger value="exercises" data-testid="tab-exercises">Übungen</TabsTrigger>
            <TabsTrigger value="competencies" data-testid="tab-competencies">Kompetenzvergleich</TabsTrigger>
            <TabsTrigger value="timed-releases" data-testid="tab-timed-releases">Zeitgesteuerte Freigabe</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Berichte</TabsTrigger>
          </TabsList>

          <TabsContent value="responses">
            <ResponsesTab />
          </TabsContent>
          <TabsContent value="sessions">
            <SessionsTab />
          </TabsContent>
          <TabsContent value="access-codes">
            <AccessCodesTab />
          </TabsContent>
          <TabsContent value="exercises">
            <ExercisesTab />
          </TabsContent>
          <TabsContent value="competencies">
            <CompetencyComparisonTab />
          </TabsContent>
          <TabsContent value="timed-releases">
            <TimedReleasesTab />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("aestimamus_admin_auth") === "true"
  );

  const handleLogout = () => {
    sessionStorage.removeItem("aestimamus_admin_auth");
    setAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-admin-logo" />
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-xs font-medium text-[#999] uppercase tracking-[0.2em]">Admin</span>
          </div>
        </div>
      </header>

      {authenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={() => setAuthenticated(true)} />
      )}

      <footer className="bg-copper text-white/70 py-8">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={aestimamusLogo} alt="aestimamus" className="h-5 object-contain opacity-50 invert" />
            <span className="text-sm">© {new Date().getFullYear()} aestimamus GmbH</span>
          </div>
          <div className="text-xs tracking-wider uppercase">
            Excellence in Executive Diagnostics
          </div>
        </div>
      </footer>
    </div>
  );
}
