import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Clock, Building2, Briefcase } from "lucide-react";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { cases } from "@/lib/data";

export default function SuiteDashboard() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
            <div className="h-8 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Executive Diagnostics Suite</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-foreground">Dr. Alexander V.</p>
               <p className="text-xs text-muted-foreground">Lead Assessor</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif">
               AV
             </div>
          </div>
        </div>
      </header>

      <div className="bg-primary text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl font-serif font-bold mb-4" data-testid="text-hero-title">Welcome to the Assessment Center</h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Select a case study module to begin your evaluation. Ensure you have reviewed all briefing materials before entering the assessment environment.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-10 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full border-t-4 transition-all hover:shadow-xl ${
                caseItem.status === 'active' 
                  ? 'border-t-accent shadow-md cursor-pointer group' 
                  : 'border-t-muted bg-muted/30 opacity-80'
              }`} data-testid={`card-case-${caseItem.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={caseItem.status === 'active' ? 'default' : 'secondary'} className={caseItem.status === 'active' ? 'bg-primary' : ''}>
                      {caseItem.status === 'active' ? 'Available' : 'Locked'}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border">
                      {caseItem.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="font-serif text-2xl text-foreground group-hover:text-accent transition-colors">
                    {caseItem.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium uppercase tracking-wider text-accent">
                    {caseItem.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 min-h-[60px]">
                    {caseItem.description}
                  </p>
                  
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                      Type: {caseItem.type}
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground/60" />
                      Est. Duration: 90 mins
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border">
                  {caseItem.status === 'active' ? (
                    <Link href={`/case/${caseItem.id}`}>
                      <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all" data-testid={`button-launch-${caseItem.id}`}>
                        Launch Module <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="outline" className="w-full gap-2 bg-muted" data-testid={`button-locked-${caseItem.id}`}>
                      <Lock className="h-4 w-4" /> Assessment Locked
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}

          <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-8 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30 transition-colors cursor-not-allowed">
            <Building2 className="h-10 w-10 mb-4 opacity-50" />
            <h3 className="font-medium text-lg">Upcoming Module</h3>
            <p className="text-sm text-center mt-2">New case studies will be released in Q3 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
