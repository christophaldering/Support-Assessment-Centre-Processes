import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useLang } from "@/lib/i18n";

export default function Briefing() {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/case/:id/briefing");
  const caseId = params?.id || "varexia";

  const [confirmed, setConfirmed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`aestimamus_briefing_${caseId}`);
    if (stored === "true") {
      setConfirmed(true);
      setChecked(true);
    }
  }, [caseId]);

  const handleConfirm = () => {
    sessionStorage.setItem(`aestimamus_briefing_${caseId}`, "true");
    setConfirmed(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{t("briefing.title")}</h1>
        <p className="text-muted-foreground">{t("briefing.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="prose prose-neutral max-w-none"
      >
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-10 font-serif leading-relaxed text-lg text-foreground">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">The Situation</h3>
            <p className="mb-6">
              You have been asked by the Executive Board of the <strong className="text-foreground">VAREXIA Group</strong> to provide an independent, senior-level assessment of the Group's current situation. Varexia is a publicly listed European stock corporation (SE) with a dual management structure.
            </p>
            <p className="mb-6">
              You have received a selection of internal and external documents shortly before the meeting. The material is <span className="bg-yellow-50 px-1 border-b-2 border-yellow-200">deliberately incomplete</span>. This reflects the reality of executive decision-making.
            </p>
            <p className="mb-8">
              You are expected to work with the information available, explicitly acknowledge blind spots, and distinguish clearly between what can be assessed with confidence and what cannot. You will present your assessment directly to the Executive Board.
            </p>

            <div className="pl-6 border-l-4 border-foreground italic text-muted-foreground mb-8">
              "You are speaking to the Board, not about it."
            </div>

            <Separator className="my-8" />

            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Your Task</h3>
            <p className="mb-4">You are asked to structure and articulate your judgment along two dimensions:</p>

            <div className="grid md:grid-cols-2 gap-8 mt-6">
              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h4 className="font-sans font-bold text-foreground mb-3">1. Analysis</h4>
                <ul className="list-disc list-outside ml-4 space-y-2 text-base text-foreground/80 font-sans">
                  <li>How do you assess the current situation of the Varexia Group?</li>
                  <li>Which patterns, tensions and interdependencies do you see?</li>
                  <li>Where do you see the most relevant challenges?</li>
                  <li>Where do you see uncertainty or blind spots?</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h4 className="font-sans font-bold text-foreground mb-3">2. Conclusions</h4>
                <ul className="list-disc list-outside ml-4 space-y-2 text-base text-foreground/80 font-sans">
                  <li>What conclusions do you draw from your analysis?</li>
                  <li>Which issues require explicit prioritization?</li>
                  <li>Where do you see a need for action – and where consciously not?</li>
                  <li>Which conflicting objectives do you consider structurally irresolvable?</li>
                </ul>
              </div>
            </div>

            <Separator className="my-8" />

            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Assessment Format</h3>
            <p>
              A short written assessment (structured, no slide deck). Be direct. Prioritize judgment over completeness.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-lg p-6 shadow-sm"
      >
        {confirmed ? (
          <div className="flex items-center gap-3 text-green-700" data-testid="status-briefing-confirmed">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{t("briefing.confirmed")}</span>
            <Button
              onClick={() => setLocation(`/case/${caseId}/assessment`)}
              className="ml-auto gap-2 bg-copper text-white hover:bg-copper/90"
              data-testid="button-go-assessment"
            >
              {t("briefing.proceed")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-briefing"
                checked={checked}
                onCheckedChange={(val) => setChecked(val === true)}
                className="mt-1"
                data-testid="checkbox-confirm-briefing"
              />
              <label htmlFor="confirm-briefing" className="text-sm text-foreground leading-relaxed cursor-pointer">
                {t("briefing.confirm")}
              </label>
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!checked}
              className="gap-2 bg-copper text-white hover:bg-copper/90 disabled:opacity-50"
              data-testid="button-confirm-briefing"
            >
              {t("briefing.proceed")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
