import { useState } from "react";
import { motion } from "framer-motion";
import { assessmentQuestions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assessment() {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("analysis");

  const handleInputChange = (question: string, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Draft Saved",
      description: "Your assessment progress has been saved locally.",
    });
  };

  const handleSubmit = () => {
    toast({
      title: "Assessment Finalized",
      description: "Your report is ready for Executive Board review.",
      duration: 5000,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Executive Assessment</h1>
          <p className="text-slate-500">Formulate your judgment on the Group's situation</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} className="gap-2 border-slate-300">
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
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
          >
            1. Analysis Phase
          </TabsTrigger>
          <TabsTrigger 
            value="conclusions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-serif text-lg text-slate-500 data-[state=active]:text-slate-900"
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
                  />
                </CardContent>
                <CardFooter className="border-t border-slate-50 py-2 bg-slate-50/30 flex justify-end">
                  <span className="text-xs text-slate-400">
                    {answers[q]?.length || 0} characters
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveTab("conclusions")} className="gap-2">
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
                  />
                </CardContent>
                <CardFooter className="border-t border-slate-50 py-2 bg-slate-50/30 flex justify-end">
                  <span className="text-xs text-slate-400">
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
