import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Building2, Shield } from "lucide-react";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";

const customers = [
  {
    id: "rewe",
    name: "REWE Group",
    description: "Executive Assessment Center – Fallstudien und Verhaltensbausteine für die REWE Group.",
    color: "bg-red-600",
    initials: "RW",
  },
  {
    id: "ruv",
    name: "R+V Versicherung",
    description: "Executive Diagnostics – Assessment-Materialien für die R+V Versicherung.",
    color: "bg-blue-700",
    initials: "R+V",
  },
  {
    id: "materna",
    name: "Materna SE",
    description: "Executive Assessment – Übungen und Fallstudien für Materna SE.",
    color: "bg-emerald-700",
    initials: "MT",
  },
];

export default function Portal() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const auth = sessionStorage.getItem("aestimamus_global_auth");
    if (auth !== "true") {
      setLocation("/");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
            <div className="h-8 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Executive Diagnostics Suite</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Geschützter Bereich</span>
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
            <h1 className="text-4xl font-serif font-bold mb-4" data-testid="text-portal-title">
              Kundenbereich
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Wählen Sie den Kundenbereich, für den Sie freigeschaltet wurden. 
              Für den Zugang zu den einzelnen Bereichen ist ein separater Zugangscode erforderlich.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-10 pb-20 w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/portal/${customer.id}`}>
                <Card className="h-full border-t-4 border-t-accent shadow-md cursor-pointer group hover:shadow-xl transition-all" data-testid={`card-customer-${customer.id}`}>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`h-12 w-12 ${customer.color} text-white rounded-lg flex items-center justify-center font-bold text-sm`}>
                        {customer.initials}
                      </div>
                      <div>
                        <CardTitle className="font-serif text-xl text-foreground group-hover:text-accent transition-colors">
                          {customer.name}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                      {customer.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-accent font-medium text-sm group-hover:gap-3 transition-all">
                      <span>Zum Kundenbereich</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <footer className="bg-primary text-primary-foreground/60 py-8">
          <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={aestimamusLogo} alt="aestimamus" className="h-6 object-contain opacity-60 invert" />
              <span className="text-sm">© {new Date().getFullYear()} aestimamus GmbH</span>
            </div>
            <div className="text-xs">
              Excellence in Executive Diagnostics
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
