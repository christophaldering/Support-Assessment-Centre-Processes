import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

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
      setError("Ungültiger Zugangscode. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center">
          <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
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
              Executive Diagnostics Suite
            </h1>
            <p className="text-[#555] text-base leading-relaxed mb-12 max-w-xl">
              Willkommen in der digitalen Assessment-Umgebung von aestimamus. 
              Dieser geschützte Bereich bietet Ihnen Zugang zu den Materialien und Übungen 
              Ihres Executive Assessment Centers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-md"
          >
            <div className="border-t-2 border-t-copper pt-8">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-1">Geschützter Zugang</h2>
              <p className="text-sm text-[#777] mb-6">Nur für autorisierte Teilnehmende</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="access-code" className="block text-sm font-medium text-[#333] mb-2">
                    Zugangscode
                  </label>
                  <Input
                    id="access-code"
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Zugangscode eingeben"
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
                  {loading ? "Wird überprüft..." : "Zugang erhalten"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="text-xs text-[#999] mt-6 leading-relaxed">
                Sie haben Ihren Zugangscode per E-Mail erhalten. Bei Fragen wenden Sie sich bitte 
                an Ihre Ansprechperson bei aestimamus.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-gray-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-4">Fokus auf Executive Diagnostics</h2>
            <p className="text-[#555] text-sm leading-relaxed max-w-3xl mb-12">
              Wir stehen für Executive Diagnostics auf höchstem Niveau. Als spezialisierte Boutique-Beratung 
              schaffen wir belastbare Entscheidungsgrundlagen zur Förderung der Führungs- und somit 
              Zukunftsfähigkeit Ihrer Organisation. <strong className="text-[#1a1a1a]">An diesem Anspruch lassen wir uns messen!</strong>
            </p>
          </div>
        </div>

        <div className="bg-copper text-white py-14">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">Exklusivität durch Fokussierung</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Unsere Spezialisierung auf Executive Diagnostics sichert unabhängige, fundierte 
                  Entscheidungen auf Top-Management-Ebene — mit fachlicher Tiefe und relevanter 
                  Benchmark-Erfahrung ohne Zielkonflikte.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">Partnerschaften auf Augenhöhe</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Wir arbeiten nach dem Prinzip <em>One Face to the Customer</em>. Unsere Kunden profitieren 
                  von persönlicher Kontinuität in der Betreuung, hoher Servicequalität und maximaler Flexibilität.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold mb-3">Verantwortung mit nachhaltiger Wirkung</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Wir verbinden kurzfristige Lieferfähigkeit mit innovativen Ansätzen und einem 
                  expliziten Fokus auf langfristige Wertschöpfung für unsere Kunden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#1a1a1a] text-white/50 py-8">
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
