import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, AlertCircle, Download, Trash2, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import type { AssessmentResponse, AssessmentSession, AccessCode, UploadedExercise } from "@shared/schema";

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
          <TabsList className="mb-6" data-testid="tabs-admin">
            <TabsTrigger value="responses" data-testid="tab-responses">Antworten</TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sitzungen</TabsTrigger>
            <TabsTrigger value="access-codes" data-testid="tab-access-codes">Zugangscodes</TabsTrigger>
            <TabsTrigger value="exercises" data-testid="tab-exercises">Übungen</TabsTrigger>
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
