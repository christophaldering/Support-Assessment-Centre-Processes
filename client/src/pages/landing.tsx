import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, AlertCircle, Globe, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

export default function Landing() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify", {
        scope: "global",
        code,
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("aestimamus_global_auth", "true");
        setLocation("/portal");
      }
    } catch {
      setError(t("landing.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
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
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a1a] mb-6 leading-[1.15]" data-testid="text-hero-title">
              {t("landing.title")}
            </h1>
            <p className="text-[#555] text-base leading-relaxed mb-12 max-w-xl">
              {t("landing.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-md"
          >
            <div className="border-t-2 border-t-copper pt-8">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">{t("landing.access_title")}</h2>
              <p className="text-sm text-[#777] mb-6">{t("landing.access_subtitle")}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="access-code" className="block text-sm font-medium text-[#333] mb-2">
                    {t("landing.code_label")}
                  </label>
                  <Input
                    id="access-code"
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("landing.code_placeholder")}
                    className="w-full border-gray-300 focus:border-copper focus:ring-copper"
                    data-testid="input-access-code"
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
                    <span data-testid="text-error">{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full gap-2 bg-copper text-white hover:bg-copper/90 rounded-none font-medium"
                  data-testid="button-submit-code"
                >
                  {loading ? t("landing.checking") : t("landing.submit")}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="text-xs text-[#999] mt-6 leading-relaxed">
                {t("landing.help")}
              </p>

              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#999] mb-4" data-testid="text-quicklinks-title">
                  {t("landing.quicklinks_title")}
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setLocation("/observer")}
                    className="w-full flex items-center gap-3 text-left p-3 rounded border border-gray-200 hover:border-copper/50 hover:bg-copper/5 transition-all group"
                    data-testid="link-observer"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-copper/10 flex items-center justify-center group-hover:bg-copper/20 transition-colors">
                      <Eye className="h-4 w-4 text-copper" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1a1a1a]">{t("landing.link_observer")}</div>
                      <div className="text-xs text-[#999]">{t("landing.link_observer_desc")}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#ccc] group-hover:text-copper ml-auto shrink-0 transition-colors" />
                  </button>
                  <button
                    onClick={() => setLocation("/admin")}
                    className="w-full flex items-center gap-3 text-left p-3 rounded border border-gray-200 hover:border-copper/50 hover:bg-copper/5 transition-all group"
                    data-testid="link-admin"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-copper/10 flex items-center justify-center group-hover:bg-copper/20 transition-colors">
                      <Settings className="h-4 w-4 text-copper" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1a1a1a]">{t("landing.link_admin")}</div>
                      <div className="text-xs text-[#999]">{t("landing.link_admin_desc")}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#ccc] group-hover:text-copper ml-auto shrink-0 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-gray-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-4">{t("landing.focus_title")}</h2>
            <p className="text-[#555] text-sm leading-relaxed max-w-3xl mb-12">
              {t("landing.focus_text")} <strong className="text-[#1a1a1a]">An diesem Anspruch lassen wir uns messen!</strong>
            </p>
          </div>
        </div>

        <div className="bg-copper text-white py-14">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">{t("landing.pillar1_title")}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{t("landing.pillar1_text")}</p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">{t("landing.pillar2_title")}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{t("landing.pillar2_text")}</p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">{t("landing.pillar3_title")}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{t("landing.pillar3_text")}</p>
              </div>
            </div>
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
