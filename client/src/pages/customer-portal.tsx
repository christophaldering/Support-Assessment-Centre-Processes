import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation, Link } from "wouter";
import { Lock, ArrowRight, ArrowLeft, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";

const customerData: Record<string, {
  name: string;
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-4">Kundenbereich nicht gefunden</h1>
          <Link href="/portal">
            <Button variant="outline" className="gap-2 rounded-none border-gray-300 text-[#555]">
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
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-xs font-medium text-[#999] uppercase tracking-[0.2em]">Executive Diagnostics Suite</span>
          </div>
          <Link href="/portal" className="flex items-center gap-2 text-sm text-[#999] hover:text-[#333] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kundenübersicht</span>
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <p className="text-xs font-medium text-copper uppercase tracking-[0.2em] mb-3">Executive Assessment Center</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a1a] leading-[1.15]" data-testid="text-customer-name">
              {customer.name}
            </h1>
          </motion.div>

          {!authenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-md"
            >
              <div className="border-t-2 border-t-copper pt-8">
                <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">Kundenzugang</h2>
                <p className="text-sm text-[#777] mb-6">
                  Geben Sie den Zugangscode für {customer.name} ein.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="customer-code" className="block text-sm font-medium text-[#333] mb-2">
                      Zugangscode
                    </label>
                    <Input
                      id="customer-code"
                      type="password"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Kundenspezifischen Code eingeben"
                      className="w-full border-gray-300 focus:border-copper focus:ring-copper"
                      data-testid="input-customer-code"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-red-600"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span data-testid="text-customer-error">{error}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="w-full gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
                    data-testid="button-submit-customer-code"
                  >
                    {loading ? "Wird überprüft..." : "Zugang erhalten"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <p className="text-xs text-[#999] mt-6 leading-relaxed">
                  Der kundenspezifische Zugangscode wurde Ihnen separat mitgeteilt.
                </p>
              </div>
            </motion.div>
          ) : (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-2">Übungen & Materialien</h2>
                <p className="text-[#777] text-sm">
                  Nachfolgend finden Sie die für Sie vorbereiteten Assessment-Übungen.
                </p>
              </motion.div>

              <div className="border-t border-gray-200">
                {customer.exercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="border-b border-gray-200 py-8"
                    data-testid={`card-exercise-${exercise.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-copper uppercase tracking-wider">{exercise.type}</span>
                          {exercise.status === "active" ? (
                            <span className="flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Verfügbar
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">In Vorbereitung</span>
                          )}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">
                          {exercise.title}
                        </h3>
                        <p className="text-sm text-copper font-medium mb-3">{exercise.subtitle}</p>
                        <p className="text-sm text-[#555] leading-relaxed max-w-xl mb-3">
                          {exercise.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#999]">
                          <Clock className="h-3 w-3" />
                          Geschätzte Dauer: {exercise.duration}
                        </div>
                      </div>

                      <div className="md:pt-6">
                        {exercise.status === "active" && exercise.link ? (
                          <Link href={exercise.link}>
                            <Button className="gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium px-8" data-testid={`button-launch-${exercise.id}`}>
                              Übung starten <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button disabled variant="outline" className="gap-2 rounded-none border-gray-300 text-[#999] px-8" data-testid={`button-locked-${exercise.id}`}>
                            <Lock className="h-4 w-4" /> Noch nicht verfügbar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-copper text-white/70 py-8 mt-auto">
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
