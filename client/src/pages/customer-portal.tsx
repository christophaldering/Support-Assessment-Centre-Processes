import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation, Link } from "wouter";
import { Lock, ArrowRight, ArrowLeft, AlertCircle, Clock, CheckCircle2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import type { UploadedExercise } from "@shared/schema";

const customerData: Record<string, {
  name: string;
  exercises: Array<{
    id: string;
    title_de: string;
    title_en: string;
    subtitle_de: string;
    subtitle_en: string;
    type: string;
    status: "active" | "coming_soon" | "locked";
    description_de: string;
    description_en: string;
    duration: string;
    link?: string;
  }>;
}> = {
  rewe: {
    name: "REWE Group",
    exercises: [
      {
        id: "varexia",
        title_de: "Fallstudie: Varexia SE",
        title_en: "Case Study: Varexia SE",
        subtitle_de: "Strategische Analyse & Handlungsempfehlung",
        subtitle_en: "Strategic Analysis & Recommendations",
        type: "Case Study",
        status: "active",
        description_de: "Umfassende Fallstudie eines europäischen Mischkonzerns unter strategischem Druck. Analysieren Sie Geschäftseinheiten, Finanzdaten, interne Kommunikation und entwickeln Sie eine fundierte Handlungsempfehlung.",
        description_en: "Comprehensive case study of a European conglomerate under strategic pressure. Analyze business units, financial data, internal communications and develop well-founded recommendations.",
        duration: "90 Min.",
        link: "/case/varexia",
      },
      {
        id: "behavioral-sim",
        title_de: "Verhaltensbausteine",
        title_en: "Behavioral Simulations",
        subtitle_de: "Führungssimulationen",
        subtitle_en: "Leadership Simulations",
        type: "Behavioural Simulation",
        status: "coming_soon",
        description_de: "Interaktive Verhaltensbausteine zur Simulation typischer Führungssituationen auf Executive-Ebene. Rollenspiele und Gesprächssimulationen.",
        description_en: "Interactive behavioral modules simulating typical leadership situations at executive level. Role plays and conversation simulations.",
        duration: "60 Min.",
      },
    ],
  },
  ruv: {
    name: "R+V Versicherung",
    exercises: [
      {
        id: "placeholder-ruv",
        title_de: "Assessment-Übungen",
        title_en: "Assessment Exercises",
        subtitle_de: "In Vorbereitung",
        subtitle_en: "In Preparation",
        type: "Diverse",
        status: "coming_soon",
        description_de: "Die Übungen für das Executive Assessment der R+V Versicherung werden in Kürze freigeschaltet.",
        description_en: "The exercises for the R+V Versicherung Executive Assessment will be available shortly.",
        duration: "TBD",
      },
    ],
  },
  materna: {
    name: "Materna SE",
    exercises: [
      {
        id: "placeholder-materna",
        title_de: "Assessment-Übungen",
        title_en: "Assessment Exercises",
        subtitle_de: "In Vorbereitung",
        subtitle_en: "In Preparation",
        type: "Diverse",
        status: "coming_soon",
        description_de: "Die Übungen für das Executive Assessment von Materna SE werden in Kürze freigeschaltet.",
        description_en: "The exercises for the Materna SE Executive Assessment will be available shortly.",
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
  const { t, toggle, lang } = useLang();

  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: uploadedExercises } = useQuery<UploadedExercise[]>({
    queryKey: [`/api/exercises/${customerId}`],
    enabled: authenticated && !!customerId,
  });

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
          <h1 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-4">{t("customer.not_found")}</h1>
          <Link href="/portal">
            <Button variant="outline" className="gap-2 rounded-none border-gray-300 text-[#555]">
              <ArrowLeft className="h-4 w-4" />
              {t("customer.back")}
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
        if (data.participantName) {
          sessionStorage.setItem(`aestimamus_participant_name`, data.participantName);
        }
        setAuthenticated(true);
      }
    } catch {
      setError(t("customer.error"));
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
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 text-xs font-medium text-[#999] hover:text-[#333] transition-colors px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400"
              data-testid="button-lang-toggle"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "de" ? "EN" : "DE"}
            </button>
            <Link href="/portal" className="flex items-center gap-2 text-sm text-[#999] hover:text-[#333] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("customer.overview")}</span>
            </Link>
          </div>
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
                <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">{t("customer.access_title")}</h2>
                <p className="text-sm text-[#777] mb-6">
                  {t("customer.access_subtitle_prefix")} {customer.name} {t("customer.access_subtitle_suffix")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="customer-code" className="block text-sm font-medium text-[#333] mb-2">
                      {t("customer.code_label")}
                    </label>
                    <Input
                      id="customer-code"
                      type="password"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={t("customer.code_placeholder")}
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
                    {loading ? t("customer.checking") : t("customer.submit")}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <p className="text-xs text-[#999] mt-6 leading-relaxed">
                  {t("customer.help")}
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
                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-2">{t("customer.exercises_title")}</h2>
                <p className="text-[#777] text-sm">
                  {t("customer.exercises_subtitle")}
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
                              {t("customer.available")}
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">{t("customer.coming_soon")}</span>
                          )}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">
                          {lang === "de" ? exercise.title_de : exercise.title_en}
                        </h3>
                        <p className="text-sm text-copper font-medium mb-3">{lang === "de" ? exercise.subtitle_de : exercise.subtitle_en}</p>
                        <p className="text-sm text-[#555] leading-relaxed max-w-xl mb-3">
                          {lang === "de" ? exercise.description_de : exercise.description_en}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#999]">
                          <Clock className="h-3 w-3" />
                          {t("customer.duration")}: {exercise.duration}
                        </div>
                      </div>

                      <div className="md:pt-6">
                        {exercise.status === "active" && exercise.link ? (
                          <Link href={exercise.link}>
                            <Button className="gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium px-8" data-testid={`button-launch-${exercise.id}`}>
                              {t("customer.launch")} <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button disabled variant="outline" className="gap-2 rounded-none border-gray-300 text-[#999] px-8" data-testid={`button-locked-${exercise.id}`}>
                            <Lock className="h-4 w-4" /> {t("customer.locked")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {uploadedExercises && uploadedExercises.length > 0 && uploadedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (customer.exercises.length + index) * 0.08 }}
                    className="border-b border-gray-200 py-8"
                    data-testid={`card-uploaded-exercise-${exercise.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-copper uppercase tracking-wider">{exercise.type}</span>
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("customer.available")}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">
                          {exercise.title}
                        </h3>
                        {exercise.description && (
                          <p className="text-sm text-[#555] leading-relaxed max-w-xl mb-3">
                            {exercise.description}
                          </p>
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
            <span className="text-sm">&copy; {new Date().getFullYear()} aestimamus GmbH</span>
          </div>
          <div className="text-xs tracking-wider uppercase">
            {t("footer.tagline")}
          </div>
        </div>
      </footer>
    </div>
  );
}
