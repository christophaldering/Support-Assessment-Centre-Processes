import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { assessmentQuestions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, CheckCircle, AlertCircle, Loader2, CloudOff, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("analysis");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const sessionId = useRef(getSessionId()).current;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: savedResponses, isLoading } = useQuery<AssessmentResponse[]>({
    queryKey: [`/api/assessments/${CASE_ID}/${sessionId}`],
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
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${CASE_ID}/${sessionId}`] });
    },
  });

  const buildPayload = useCallback(() => {
    const payload: Array<{ caseId: string; sessionId: string; phase: string; questionIndex: number; question: string; answer: string }> = [];
    assessmentQuestions.analysis.forEach((q, i) => {
      if (answers[q] !== undefined) {
        payload.push({ caseId: CASE_ID, sessionId, phase: "analysis", questionIndex: i, question: q, answer: answers[q] });
      }
    });
    assessmentQuestions.conclusions.forEach((q, i) => {
      if (answers[q] !== undefined) {
        payload.push({ caseId: CASE_ID, sessionId, phase: "conclusions", questionIndex: i, question: q, answer: answers[q] });
      }
    });
    return payload;
  }, [answers, sessionId]);

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
          toast({ title: "Draft Saved", description: "Your assessment progress has been saved to the server." });
        },
        onError: () => {
          toast({ title: "Save Failed", description: "Could not save. Please try again.", variant: "destructive" });
        },
      });
    } else {
      toast({ title: "Nothing to Save", description: "Start writing to save your progress." });
    }
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (payload.length > 0) {
      saveMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Assessment Finalized", description: "Your report is ready for Executive Board review.", duration: 5000 });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500">Loading your assessment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2" data-testid="text-assessment-title">Executive Assessment</h1>
          <p className="text-slate-500">Formulate your judgment on the Group's situation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs mr-2" data-testid="status-save-indicator">
            {saveMutation.isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin text-blue-500" /><span className="text-blue-500">Saving...</span></>
            ) : hasUnsaved ? (
              <><CloudOff className="h-3 w-3 text-amber-500" /><span className="text-amber-500">Unsaved changes</span></>
            ) : (
              <><Cloud className="h-3 w-3 text-green-500" /><span className="text-green-500">All saved</span></>
            )}
          </div>
          <Button variant="outline" onClick={handleSave} className="gap-2 border-slate-300" data-testid="button-save-draft" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white" data-testid="button-finalize">
            <CheckCircle className="h-4 w-4" /> Finalize Report
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3 items-start text-amber-900">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Guidance:</strong> Focus on clarity of reasoning and explicit handling of trade-offs. The objective is not to propose a "comprehensive action plan" but to provide a clear, senior-level assessment under uncertainty.
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 mb-6">
          <TabsTrigger 
            value="analysis" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-serif text-lg text-slate-500 data-[state=active]:text-slate-900"
            data-testid="tab-analysis"
          >
            1. Analysis Phase
          </TabsTrigger>
          <TabsTrigger 
            value="conclusions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-serif text-lg text-slate-500 data-[state=active]:text-slate-900"
            data-testid="tab-conclusions"
          >
            2. Strategic Conclusions
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
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-medium text-slate-800 font-sans leading-relaxed">
                    {q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea 
                    placeholder="Enter your assessment here..." 
                    className="min-h-[150px] resize-none border-0 focus-visible:ring-0 px-0 text-slate-700 text-lg leading-relaxed font-serif bg-transparent placeholder:text-slate-300"
                    value={answers[q] || ""}
                    onChange={(e) => handleInputChange(q, e.target.value)}
                    data-testid={`input-analysis-${i}`}
                  />
                </CardContent>
                <CardFooter className="border-t border-slate-50 py-2 bg-slate-50/30 flex justify-end">
                  <span className="text-xs text-slate-400" data-testid={`text-charcount-analysis-${i}`}>
                    {answers[q]?.length || 0} characters
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveTab("conclusions")} className="gap-2" data-testid="button-next-conclusions">
              Next: Conclusions <CheckCircle className="h-4 w-4" />
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
              <Card className="border-l-4 border-l-yellow-500 border-y border-r border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-medium text-slate-800 font-sans leading-relaxed">
                    {q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea 
                    placeholder="Enter your conclusion here..." 
                    className="min-h-[150px] resize-none border-0 focus-visible:ring-0 px-0 text-slate-700 text-lg leading-relaxed font-serif bg-transparent placeholder:text-slate-300"
                    value={answers[q] || ""}
                    onChange={(e) => handleInputChange(q, e.target.value)}
                    data-testid={`input-conclusions-${i}`}
                  />
                </CardContent>
                <CardFooter className="border-t border-slate-50 py-2 bg-slate-50/30 flex justify-end">
                  <span className="text-xs text-slate-400" data-testid={`text-charcount-conclusions-${i}`}>
                    {answers[q]?.length || 0} characters
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
