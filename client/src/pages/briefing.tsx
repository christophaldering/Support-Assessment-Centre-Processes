import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Briefing() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Strategic Briefing</h1>
        <p className="text-muted-foreground">Confidential Instructions for the Independent Assessor</p>
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
              You have been asked by the Executive Board of the <strong className="text-foreground">VAREXIA Group</strong> to provide an independent, senior-level assessment of the Group’s current situation. Varexia is a publicly listed European stock corporation (SE) with a dual management structure.
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

            <div className="mt-8 flex items-center justify-between text-sm font-sans text-muted-foreground bg-muted/50 px-4 py-2 rounded border border-border">
              <span><strong>Framework:</strong> Limited time. Incomplete information.</span>
              <span><strong>Analysis:</strong> 60 mins • <strong>Presentation:</strong> 15 mins</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
