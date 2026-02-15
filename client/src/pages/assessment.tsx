import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { assessmentQuestions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, CheckCircle, AlertCircle, Loader2, CloudOff, Cloud, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { useLang } from "@/lib/i18n";
import type { AssessmentResponse } from "@shared/schema";

const CASE_ID = "varexia";

function getSessionId(): string {
  let sessionId = localStorage.getItem("aestimamus_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("aestimamus_session_id", sessionId);
  }
  return sessionId;
}

export default function Assessment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [, params] = useRoute("/case/:id/assessment");
  const [, setLocation] = useLocation();
  const caseId = params?.id || CASE_ID;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("analysis");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const sessionId = useRef(getSessionId()).current;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const briefingConfirmed = sessionStorage.getItem(`aestimamus_briefing_${caseId}`) === "true";

  const { data: savedResponses, isLoading } = useQuery<AssessmentResponse[]>({
    queryKey: [`/api/assessments/${caseId}/${sessionId}`],
    enabled: briefingConfirmed,
  });

  useEffect(() => {
    if (savedResponses && savedResponses.length > 0) {
      const loaded: Record<string, string> = {};
      savedResponses.forEach((r) => {
        loaded[r.question] = r.answer;
      });
      setAnswers(loaded);
    }
  }, [savedResponses]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Array<{ caseId: string; sessionId: string; phase: string; questionIndex: number; question: string; answer: string }>) => {
      const res = await apiRequest("POST", "/api/assessments/save-all", payload);
      return res.json();
    },
    onSuccess: () => {
      setHasUnsaved(false);
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${caseId}/${sessionId}`] });
    },
  });

  const buildPayload = useCallback(() => {
    const payload: Array<{ caseId: string; sessionId: string; phase: string; questionIndex: number; question: string; answer: string }> = [];
    assessmentQuestions.analysis.forEach((q, i) => {
      if (answers[q] !== undefined) {
        payload.push({ caseId, sessionId, phase: "analysis", questionIndex: i, question: q, answer: answers[q] });
      }
    });
    assessmentQuestions.conclusions.forEach((q, i) => {
      if (answers[q] !== undefined) {
        payload.push({ caseId, sessionId, phase: "conclusions", questionIndex: i, question: q, answer: answers[q] });
      }
    });
    return payload;
  }, [answers, sessionId, caseId]);

  const handleInputChange = (question: string, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
    setHasUnsaved(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const payload = buildPayload();
      if (payload.length > 0) {
        saveMutation.mutate(payload);
      }
    }, 2000);
  };

  const handleSave = () => {
    const payload = buildPayload();
    if (payload.length > 0) {
      saveMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: t("assessment.save_draft"), description: "Draft saved successfully." });
        },
        onError: () => {
          toast({ title: "Save Failed", description: "Could not save. Please try again.", variant: "destructive" });
        },
      });
    }
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (payload.length > 0) {
      saveMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: t("assessment.finalize"), description: "Your report is ready for Executive Board review.", duration: 5000 });
        },
      });
    }
  };

  if (!briefingConfirmed) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
          <Lock className="h-10 w-10 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-foreground mb-3">{t("assessment.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("assessment.locked")}</p>
          <Button
            onClick={() => setLocation(`/case/${caseId}/briefing`)}
            className="gap-2 bg-copper text-white hover:bg-copper/90"
            data-testid="button-go-briefing"
          >
            {t("assessment.go_briefing")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
        <span className="ml-3 text-muted-foreground">Loading your assessment...</span>
      </div>
    );
  }

  const totalQuestions = assessmentQuestions.analysis.length + assessmentQuestions.conclusions.length;
  const answeredCount = Object.values(answers).filter(a => a && a.trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2" data-testid="text-assessment-title">{t("assessment.title")}</h1>
          <p className="text-muted-foreground">{t("assessment.subtitle")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{answeredCount}/{totalQuestions} questions answered</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs mr-2" data-testid="status-save-indicator">
            {saveMutation.isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin text-blue-500" /><span className="text-blue-500">{t("assessment.saving")}</span></>
            ) : hasUnsaved ? (
              <><CloudOff className="h-3 w-3 text-amber-500" /><span className="text-amber-500">{t("assessment.unsaved")}</span></>
            ) : (
              <><Cloud className="h-3 w-3 text-green-500" /><span className="text-green-500">{t("assessment.saved")}</span></>
            )}
          </div>
          <Button variant="outline" onClick={handleSave} className="gap-2 border-border" data-testid="button-save-draft" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" /> {t("assessment.save_draft")}
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-primary hover:bg-primary text-primary-foreground" data-testid="button-finalize">
            <CheckCircle className="h-4 w-4" /> {t("assessment.finalize")}
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3 items-start text-amber-900">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>{t("assessment.guidance")}</strong> {t("assessment.guidance_text")}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-6">
          <TabsTrigger
            value="analysis"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-serif text-lg text-muted-foreground data-[state=active]:text-foreground"
            data-testid="tab-analysis"
          >
            {t("assessment.analysis")}
          </TabsTrigger>
          <TabsTrigger
            value="conclusions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-serif text-lg text-muted-foreground data-[state=active]:text-foreground"
            data-testid="tab-conclusions"
          >
            {t("assessment.conclusions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {assessmentQuestions.analysis.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border border-border shadow-sm">
                <CardHeader className="bg-muted/50 border-b border-border pb-4">
                  <CardTitle className="text-base font-medium text-foreground font-sans leading-relaxed">
                    {q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea
                    placeholder={t("assessment.placeholder_analysis")}
                    className="min-h-[150px] resize-none border-0 focus-visible:ring-0 px-0 text-foreground/80 text-lg leading-relaxed font-serif bg-transparent placeholder:text-muted-foreground/40"
                    value={answers[q] || ""}
                    onChange={(e) => handleInputChange(q, e.target.value)}
                    data-testid={`input-analysis-${i}`}
                  />
                </CardContent>
                <CardFooter className="border-t border-border py-2 bg-muted/30 flex justify-end">
                  <span className="text-xs text-muted-foreground/60" data-testid={`text-charcount-analysis-${i}`}>
                    {answers[q]?.length || 0} {t("assessment.chars")}
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveTab("conclusions")} className="gap-2" data-testid="button-next-conclusions">
              {t("assessment.next_conclusions")} <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="conclusions" className="space-y-6">
          {assessmentQuestions.conclusions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-l-4 border-l-yellow-500 border-y border-r border-border shadow-sm">
                <CardHeader className="bg-muted/50 border-b border-border pb-4">
                  <CardTitle className="text-base font-medium text-foreground font-sans leading-relaxed">
                    {q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea
                    placeholder={t("assessment.placeholder_conclusion")}
                    className="min-h-[150px] resize-none border-0 focus-visible:ring-0 px-0 text-foreground/80 text-lg leading-relaxed font-serif bg-transparent placeholder:text-muted-foreground/40"
                    value={answers[q] || ""}
                    onChange={(e) => handleInputChange(q, e.target.value)}
                    data-testid={`input-conclusions-${i}`}
                  />
                </CardContent>
                <CardFooter className="border-t border-border py-2 bg-muted/30 flex justify-end">
                  <span className="text-xs text-muted-foreground/60" data-testid={`text-charcount-conclusions-${i}`}>
                    {answers[q]?.length || 0} {t("assessment.chars")}
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
