import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center">
          <img src={aestimamusLogo} alt="aestimamus" className="h-10 object-contain" data-testid="img-logo" />
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="bg-primary text-primary-foreground py-24">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight" data-testid="text-hero-title">
                Executive Diagnostics Suite
              </h1>
              <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-2xl">
                Willkommen in der digitalen Assessment-Umgebung von aestimamus. 
                Dieser geschützte Bereich bietet Ihnen Zugang zu den Materialien und Übungen 
                Ihres Executive Assessment Centers.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-10 pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Geschützter Zugang</h2>
                  <p className="text-sm text-muted-foreground">Nur für autorisierte Teilnehmende</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="access-code" className="block text-sm font-medium text-foreground mb-2">
                    Zugangscode
                  </label>
                  <Input
                    id="access-code"
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Zugangscode eingeben"
                    className="w-full"
                    data-testid="input-access-code"
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
                    <span data-testid="text-error">{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  data-testid="button-submit-code"
                >
                  {loading ? "Wird überprüft..." : "Zugang erhalten"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
                Sie haben Ihren Zugangscode per E-Mail erhalten. Bei Fragen wenden Sie sich bitte 
                an Ihre Ansprechperson bei aestimamus.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="bg-muted/50 border-t border-border py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-3">Exklusivität durch Fokussierung</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unsere Spezialisierung auf Executive Diagnostics sichert unabhängige, fundierte 
                  Entscheidungen auf Top-Management-Ebene.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-3">Partnerschaften auf Augenhöhe</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir arbeiten nach dem Prinzip One Face to the Customer mit persönlicher Kontinuität 
                  und maximaler Flexibilität.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-3">Verantwortung mit nachhaltiger Wirkung</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir verbinden kurzfristige Lieferfähigkeit mit innovativen Ansätzen und einem 
                  Fokus auf langfristige Wertschöpfung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
  );
}
