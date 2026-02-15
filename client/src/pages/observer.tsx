import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { competencyFramework } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Loader2,
  Eye,
  User,
  Clock,
  CheckCircle,
  FileText,
  Star,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { ObserverRating, AssessmentResponse, AssessmentSession } from "@shared/schema";

const CASE_ID = "varexia";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("de-DE");
}

function ObserverLogin({ onLogin }: { onLogin: (observerName: string, sessionId: string) => void }) {
  const [observerName, setObserverName] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/observer/sessions", {
        observerName,
        targetSessionId,
        caseId: CASE_ID,
      });
      await res.json();
      onLogin(observerName, targetSessionId);
    } catch (err: any) {
      setError(err?.message || "Failed to create observer session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="border-t-2 border-t-copper pt-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-5 w-5 text-copper" />
            <h2 className="font-serif text-xl font-bold text-[#1a1a1a]" data-testid="text-observer-title">
              Observer Live View
            </h2>
          </div>
          <p className="text-sm text-[#777] mb-6">
            Enter your name and the candidate's session ID to begin observation.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="observer-name" className="block text-sm font-medium text-[#333] mb-2">
                Observer Name
              </label>
              <Input
                id="observer-name"
                type="text"
                value={observerName}
                onChange={(e) => setObserverName(e.target.value)}
                placeholder="Your name"
                className="w-full border-gray-300 focus:border-copper focus:ring-copper"
                data-testid="input-observer-name"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="target-session" className="block text-sm font-medium text-[#333] mb-2">
                Candidate Session ID
              </label>
              <Input
                id="target-session"
                type="text"
                value={targetSessionId}
                onChange={(e) => setTargetSessionId(e.target.value)}
                placeholder="Paste session ID here"
                className="w-full border-gray-300 focus:border-copper focus:ring-copper"
                data-testid="input-target-session"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600" data-testid="text-observer-error">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !observerName.trim() || !targetSessionId.trim()}
              className="w-full gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
              data-testid="button-observer-login"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                </>
              ) : (
                <>
                  Start Observation <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CompetencyCard({
  dimension,
  lang,
  rating,
  notes,
  onRate,
  onNotesChange,
  saving,
}: {
  dimension: (typeof competencyFramework.dimensions)[number];
  lang: "de" | "en";
  rating: number;
  notes: string;
  onRate: (level: number) => void;
  onNotesChange: (notes: string) => void;
  saving: boolean;
}) {
  const label = lang === "de" ? dimension.labelDe : dimension.label;
  const scaleLabels =
    lang === "de" ? competencyFramework.ratingScaleDe.labels : competencyFramework.ratingScale.labels;

  return (
    <Card className="border border-border shadow-sm" data-testid={`card-competency-${dimension.key}`}>
      <CardHeader className="bg-muted/50 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif font-bold text-foreground">{label}</CardTitle>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-copper" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{dimension.description}</p>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">
        <div className="space-y-2">
          {dimension.anchors.map((anchor) => (
            <div
              key={anchor.level}
              className={`flex items-start gap-3 p-2.5 rounded-md transition-colors ${
                rating === anchor.level
                  ? "bg-copper/10 border border-copper/30"
                  : "hover:bg-muted/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onRate(anchor.level)}
                className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${
                  rating === anchor.level
                    ? "bg-copper text-white shadow-md"
                    : rating > 0 && rating >= anchor.level
                      ? "bg-copper/20 text-copper border border-copper/40"
                      : "bg-muted text-muted-foreground border border-border hover:border-copper/50"
                }`}
                data-testid={`button-rate-${dimension.key}-${anchor.level}`}
              >
                {anchor.level}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {scaleLabels[anchor.level - 1]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{anchor.text}</p>
              </div>
            </div>
          ))}
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <Star className="h-4 w-4 text-copper fill-copper" />
            <span className="text-sm font-medium text-foreground">
              Selected: {rating}/5 — {scaleLabels[rating - 1]}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1.5">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add observation notes for this competency…"
            className="min-h-[80px] resize-none text-sm"
            data-testid={`input-notes-${dimension.key}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ObserverDashboard({
  observerName,
  targetSessionId,
}: {
  observerName: string;
  targetSessionId: string;
}) {
  const { lang } = useLang();
  const queryClient = useQueryClient();

  const [ratings, setRatings] = useState<Record<string, { rating: number; notes: string }>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: sessionData, isLoading: sessionLoading, isError: sessionError } = useQuery<{
    session: AssessmentSession | null;
    responses: AssessmentResponse[];
  }>({
    queryKey: [`/api/observer/session/${targetSessionId}/${CASE_ID}`],
    refetchInterval: 5000,
    retry: 2,
  });

  const { data: savedRatings } = useQuery<ObserverRating[]>({
    queryKey: [`/api/observer/ratings/${targetSessionId}/${CASE_ID}`],
  });

  useEffect(() => {
    if (savedRatings && savedRatings.length > 0) {
      const loaded: Record<string, { rating: number; notes: string }> = {};
      savedRatings.forEach((r) => {
        loaded[r.competencyKey] = { rating: r.rating, notes: r.notes || "" };
      });
      setRatings((prev) => {
        const merged = { ...loaded };
        Object.keys(prev).forEach((k) => {
          if (prev[k].rating > 0) merged[k] = prev[k];
        });
        return merged;
      });
    }
  }, [savedRatings]);

  const ratingMutation = useMutation({
    mutationFn: async (payload: {
      sessionId: string;
      caseId: string;
      observerName: string;
      competencyKey: string;
      rating: number;
      notes: string;
    }) => {
      const res = await apiRequest("POST", "/api/observer/ratings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/observer/ratings/${targetSessionId}/${CASE_ID}`],
      });
    },
  });

  const saveRating = useCallback(
    (competencyKey: string, rating: number, notes: string) => {
      if (rating <= 0) return;
      setSavingKeys((prev) => new Set(prev).add(competencyKey));
      ratingMutation.mutate(
        {
          sessionId: targetSessionId,
          caseId: CASE_ID,
          observerName,
          competencyKey,
          rating,
          notes,
        },
        {
          onSettled: () => {
            setSavingKeys((prev) => {
              const next = new Set(prev);
              next.delete(competencyKey);
              return next;
            });
          },
        }
      );
    },
    [targetSessionId, observerName, ratingMutation]
  );

  const debouncedSave = useCallback(
    (competencyKey: string, rating: number, notes: string) => {
      if (debounceTimers.current[competencyKey]) {
        clearTimeout(debounceTimers.current[competencyKey]);
      }
      debounceTimers.current[competencyKey] = setTimeout(() => {
        saveRating(competencyKey, rating, notes);
      }, 1500);
    },
    [saveRating]
  );

  const handleRate = (competencyKey: string, level: number) => {
    const current = ratings[competencyKey] || { rating: 0, notes: "" };
    const updated = { ...current, rating: level };
    setRatings((prev) => ({ ...prev, [competencyKey]: updated }));
    saveRating(competencyKey, level, updated.notes);
  };

  const handleNotesChange = (competencyKey: string, notes: string) => {
    const current = ratings[competencyKey] || { rating: 0, notes: "" };
    const updated = { ...current, notes };
    setRatings((prev) => ({ ...prev, [competencyKey]: updated }));
    if (updated.rating > 0) {
      debouncedSave(competencyKey, updated.rating, notes);
    }
  };

  const session = sessionData?.session;
  const responses = sessionData?.responses || [];

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
        <span className="ml-3 text-muted-foreground">Loading candidate session…</span>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="text-lg font-serif font-bold text-foreground mb-1">Session Not Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Could not connect to session <span className="font-mono">{targetSessionId.slice(0, 8)}…</span>. 
          The candidate may not have started their assessment yet, or the session ID may be incorrect.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 py-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-6 w-6 text-copper" />
          <h1 className="text-3xl font-serif font-bold text-foreground" data-testid="text-observer-dashboard-title">
            Observer Live View
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Observing as <span className="font-medium text-foreground">{observerName}</span> · Session{" "}
          <span className="font-mono text-xs">{targetSessionId.slice(0, 8)}…</span>
        </p>
      </div>

      <Card className="border border-border shadow-sm" data-testid="card-candidate-info">
        <CardHeader className="bg-muted/50 border-b border-border pb-3">
          <CardTitle className="text-base font-serif font-bold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Candidate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {session ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Name</span>
                <span className="text-sm font-medium text-foreground" data-testid="text-candidate-name">
                  {session.participantName || "Anonymous"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <Badge
                  variant={session.status === "active" ? "default" : "secondary"}
                  className={session.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  data-testid="text-candidate-status"
                >
                  {session.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Briefing Confirmed</span>
                <span className="text-sm" data-testid="text-briefing-confirmed">
                  {session.briefingConfirmed ? (
                    <span className="flex items-center gap-1 text-green-700">
                      <CheckCircle className="h-3.5 w-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Started At</span>
                <span className="text-sm flex items-center gap-1" data-testid="text-started-at">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(session.startedAt)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="text-no-session">
              No session found for this ID. The candidate may not have started yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm" data-testid="card-responses">
        <CardHeader className="bg-muted/50 border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Candidate Responses
              <Badge variant="secondary" className="ml-2 text-xs">
                {responses.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Auto-refreshing
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-responses">
              No responses yet. Waiting for candidate to begin writing…
            </p>
          ) : (
            <div className="space-y-4">
              {responses.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="border border-border rounded-md p-4"
                  data-testid={`card-response-${r.id || idx}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {r.phase}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Q{r.questionIndex + 1}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">{r.question}</p>
                  <div className="bg-muted/30 rounded p-3">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {r.answer || <span className="text-muted-foreground italic">No answer yet</span>}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {formatDate(r.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-1" data-testid="text-competency-title">
          Competency Ratings
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Rate the candidate on each dimension. Ratings auto-save when selected.
        </p>
        <div className="space-y-6">
          {competencyFramework.dimensions.map((dim) => {
            const current = ratings[dim.key] || { rating: 0, notes: "" };
            return (
              <CompetencyCard
                key={dim.key}
                dimension={dim}
                lang={lang}
                rating={current.rating}
                notes={current.notes}
                onRate={(level) => handleRate(dim.key, level)}
                onNotesChange={(notes) => handleNotesChange(dim.key, notes)}
                saving={savingKeys.has(dim.key)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Observer() {
  const [connected, setConnected] = useState(false);
  const [observerName, setObserverName] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");

  const handleLogin = (name: string, sessionId: string) => {
    setObserverName(name);
    setTargetSessionId(sessionId);
    setConnected(true);
  };

  if (!connected) {
    return <ObserverLogin onLogin={handleLogin} />;
  }

  return <ObserverDashboard observerName={observerName} targetSessionId={targetSessionId} />;
}
