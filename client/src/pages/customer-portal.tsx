import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation, Link } from "wouter";
import { Lock, ArrowRight, ArrowLeft, AlertCircle, FileText, Users, Clock, CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";

const customerData: Record<string, {
  name: string;
  color: string;
  initials: string;
  exercises: Array<{
    id: string;
    title: string;
    subtitle: string;
    type: string;
    status: "active" | "coming_soon" | "locked";
    description: string;
    duration: string;
    link?: string;
  }>;
}> = {
  rewe: {
    name: "REWE Group",
    color: "bg-red-600",
    initials: "RW",
    exercises: [
      {
        id: "varexia",
        title: "Fallstudie: Varexia SE",
        subtitle: "Strategische Analyse & Handlungsempfehlung",
        type: "Case Study",
        status: "active",
        description: "Umfassende Fallstudie eines europäischen Mischkonzerns unter strategischem Druck. Analysieren Sie Geschäftseinheiten, Finanzdaten, interne Kommunikation und entwickeln Sie eine fundierte Handlungsempfehlung.",
        duration: "90 Min.",
        link: "/case/varexia",
      },
      {
        id: "behavioral-sim",
        title: "Verhaltensbausteine",
        subtitle: "Führungssimulationen",
        type: "Behavioural Simulation",
        status: "coming_soon",
        description: "Interaktive Verhaltensbausteine zur Simulation typischer Führungssituationen auf Executive-Ebene. Rollenspiele und Gesprächssimulationen.",
        duration: "60 Min.",
      },
    ],
  },
  ruv: {
    name: "R+V Versicherung",
    color: "bg-blue-700",
    initials: "R+V",
    exercises: [
      {
        id: "placeholder-ruv",
        title: "Assessment-Übungen",
        subtitle: "In Vorbereitung",
        type: "Diverse",
        status: "coming_soon",
        description: "Die Übungen für das Executive Assessment der R+V Versicherung werden in Kürze freigeschaltet.",
        duration: "TBD",
      },
    ],
  },
  materna: {
    name: "Materna SE",
    color: "bg-emerald-700",
    initials: "MT",
    exercises: [
      {
        id: "placeholder-materna",
        title: "Assessment-Übungen",
        subtitle: "In Vorbereitung",
        type: "Diverse",
        status: "coming_soon",
        description: "Die Übungen für das Executive Assessment von Materna SE werden in Kürze freigeschaltet.",
        duration: "TBD",
      },
    ],
  },
};

export default function CustomerPortal() {
  const [, params] = useRoute("/portal/:customerId");
  const [, setLocation] = useLocation();
  const customerId = params?.customerId || "";
  const customer = customerData[customerId];

  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const globalAuth = sessionStorage.getItem("aestimamus_global_auth");
    if (globalAuth !== "true") {
      setLocation("/");
      return;
    }
    const customerAuth = sessionStorage.getItem(`aestimamus_customer_auth_${customerId}`);
    if (customerAuth === "true") {
      setAuthenticated(true);
    }
  }, [customerId, setLocation]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Kundenbereich nicht gefunden</h1>
          <Link href="/portal">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify", {
        scope: "customer",
        customerId,
        code,
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(`aestimamus_customer_auth_${customerId}`, "true");
        setAuthenticated(true);
      }
    } catch {
      setError("Ungültiger Zugangscode für diesen Kundenbereich.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
            <div className="h-8 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Executive Diagnostics Suite</span>
          </div>
          <Link href="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kundenübersicht
          </Link>
        </div>
      </header>

      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className={`h-16 w-16 ${customer.color} text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg`}>
              {customer.initials}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold" data-testid="text-customer-name">
                {customer.name}
              </h1>
              <p className="text-primary-foreground/70 mt-1">
                Executive Assessment Center
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 w-full flex-1">
        {!authenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Kundenzugang</h2>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie den Zugangscode für {customer.name} ein.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="customer-code" className="block text-sm font-medium text-foreground mb-2">
                    Zugangscode {customer.name}
                  </label>
                  <Input
                    id="customer-code"
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Kundenspezifischen Code eingeben"
                    className="w-full"
                    data-testid="input-customer-code"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span data-testid="text-customer-error">{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  data-testid="button-submit-customer-code"
                >
                  {loading ? "Wird überprüft..." : "Zugang erhalten"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
                Der kundenspezifische Zugangscode wurde Ihnen separat mitgeteilt.
              </p>
            </div>
          </motion.div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Übungen & Materialien</h2>
              <p className="text-muted-foreground">
                Nachfolgend finden Sie die für Sie vorbereiteten Assessment-Übungen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {customer.exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full border-t-4 transition-all ${
                    exercise.status === "active"
                      ? "border-t-accent shadow-md hover:shadow-xl group cursor-pointer"
                      : "border-t-muted bg-muted/20 opacity-80"
                  }`} data-testid={`card-exercise-${exercise.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant={exercise.status === "active" ? "default" : "secondary"}
                          className={exercise.status === "active" ? "bg-primary" : ""}
                        >
                          {exercise.status === "active" ? "Verfügbar" : "In Vorbereitung"}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border">
                          {exercise.type}
                        </Badge>
                      </div>
                      <CardTitle className="font-serif text-xl text-foreground group-hover:text-accent transition-colors">
                        {exercise.title}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium uppercase tracking-wider text-accent">
                        {exercise.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        {exercise.description}
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground/60" />
                          Geschätzte Dauer: {exercise.duration}
                        </div>
                        <div className="flex items-center gap-3">
                          {exercise.status === "active" ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-green-700">Bereit zum Start</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4 text-muted-foreground/60" />
                              <span>Wird in Kürze freigeschaltet</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border">
                      {exercise.status === "active" && exercise.link ? (
                        <Link href={exercise.link}>
                          <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" data-testid={`button-launch-${exercise.id}`}>
                            Übung starten <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled variant="outline" className="w-full gap-2 bg-muted" data-testid={`button-locked-${exercise.id}`}>
                          <Lock className="h-4 w-4" /> Noch nicht verfügbar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-primary text-primary-foreground/60 py-8 mt-auto">
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
  );
}
