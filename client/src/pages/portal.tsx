import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowRight, Globe } from "lucide-react";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { useLang } from "@/lib/i18n";

const customers = [
  {
    id: "rewe",
    name: "REWE Group",
    description_de: "Executive Assessment Center – Fallstudien und Verhaltensbausteine für die REWE Group.",
    description_en: "Executive Assessment Center – Case studies and behavioral simulations for REWE Group.",
  },
  {
    id: "ruv",
    name: "R+V Versicherung",
    description_de: "Executive Diagnostics – Assessment-Materialien für die R+V Versicherung.",
    description_en: "Executive Diagnostics – Assessment materials for R+V Versicherung.",
  },
  {
    id: "materna",
    name: "Materna SE",
    description_de: "Executive Assessment – Übungen und Fallstudien für Materna SE.",
    description_en: "Executive Assessment – Exercises and case studies for Materna SE.",
  },
];

export default function Portal() {
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();

  useEffect(() => {
    const auth = sessionStorage.getItem("aestimamus_global_auth");
    if (auth !== "true") {
      setLocation("/");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-xs font-medium text-[#999] uppercase tracking-[0.2em]">Executive Diagnostics Suite</span>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-xs font-medium text-[#999] hover:text-[#333] transition-colors px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400"
            data-testid="button-lang-toggle"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "de" ? "EN" : "DE"}
          </button>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a1a] mb-5 leading-[1.15]" data-testid="text-portal-title">
              {t("portal.title")}
            </h1>
            <p className="text-[#555] text-base leading-relaxed max-w-2xl">
              {t("portal.subtitle")}
            </p>
          </motion.div>

          <div className="border-t border-gray-200">
            {customers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Link href={`/portal/${customer.id}`}>
                  <div className="border-b border-gray-200 py-8 flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 transition-colors -mx-4 px-4" data-testid={`card-customer-${customer.id}`}>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-[#1a1a1a] group-hover:text-copper transition-colors mb-1">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-[#777] leading-relaxed">
                        {lang === "de" ? customer.description_de : customer.description_en}
                      </p>
                    </div>
                    <div className="ml-8 flex items-center gap-2 text-copper text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="hidden sm:inline">{lang === "de" ? "Öffnen" : "Open"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-copper text-white/70 py-8">
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
