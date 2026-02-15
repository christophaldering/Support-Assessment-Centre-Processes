import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowRight,
  AlertCircle,
  Globe,
  Eye,
  Settings,
  Shield,
  BarChart3,
  Users,
  Brain,
  Volume2,
  VolumeX,
  Lock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

const COPPER = "hsl(14, 48%, 44%)";
const COPPER_RGB = "163, 88, 62";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const nodeCount = Math.min(60, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 15000));
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    nodesRef.current = nodes;

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;

        const dx = mx - node.x;
        const dy = my - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          node.vx += dx * 0.00008;
          node.vy += dy * 0.00008;
        }

        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 1) {
          node.vx *= 0.99;
          node.vy *= 0.99;
        }
      }

      const connectionDist = 140;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${COPPER_RGB}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        const pulseSize = Math.sin(node.pulse) * 0.5 + 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COPPER_RGB}, ${node.opacity * (0.6 + Math.sin(node.pulse) * 0.4)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COPPER_RGB}, ${node.opacity * 0.08})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", handleMouse);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "auto" }}
    />
  );
}

function InteractiveRadar({ soundEnabled }: { soundEnabled: boolean }) {
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setAnimated(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const dimensions = useMemo(() => [
    { key: "strategic", label: "Strategisches Denken", labelEn: "Strategic Thinking", value: 0.85, icon: Brain },
    { key: "financial", label: "Finanzielle Kompetenz", labelEn: "Financial Acumen", value: 0.72, icon: BarChart3 },
    { key: "stakeholder", label: "Stakeholder Management", labelEn: "Stakeholder Mgmt", value: 0.90, icon: Users },
    { key: "decision", label: "Entscheidungsqualität", labelEn: "Decision Quality", value: 0.78, icon: Shield },
    { key: "communication", label: "Kommunikation", labelEn: "Communication", value: 0.88, icon: Globe },
    { key: "leadership", label: "Leadership Impact", labelEn: "Leadership Impact", value: 0.82, icon: Users },
  ], []);

  const playTone = useCallback((freq: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [soundEnabled]);

  const cx = 160, cy = 160, maxR = 120;
  const n = dimensions.length;

  return (
    <div ref={ref} className="relative" data-testid="interactive-radar">
      <svg viewBox="0 0 320 320" className="w-full max-w-[320px] mx-auto">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
          <polygon
            key={scale}
            points={dimensions.map((_, i) => {
              const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
              return `${cx + Math.cos(angle) * maxR * scale},${cy + Math.sin(angle) * maxR * scale}`;
            }).join(" ")}
            fill="none"
            stroke={`rgba(${COPPER_RGB}, ${scale * 0.15 + 0.05})`}
            strokeWidth="0.5"
          />
        ))}

        {dimensions.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * maxR}
              y2={cy + Math.sin(angle) * maxR}
              stroke={`rgba(${COPPER_RGB}, 0.12)`}
              strokeWidth="0.5"
            />
          );
        })}

        <motion.polygon
          initial={{ opacity: 0 }}
          animate={animated ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          points={dimensions.map((d, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const r = animated ? d.value * maxR : 0;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          }).join(" ")}
          fill={`rgba(${COPPER_RGB}, 0.12)`}
          stroke={COPPER}
          strokeWidth="1.5"
        />

        {dimensions.map((d, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = animated ? d.value * maxR : 0;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          const isHovered = hoveredDim === i;
          return (
            <motion.circle
              key={d.key}
              initial={{ r: 0 }}
              animate={animated ? { r: isHovered ? 6 : 3.5 } : { r: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
              cx={px}
              cy={py}
              fill={isHovered ? COPPER : "white"}
              stroke={COPPER}
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => {
                setHoveredDim(i);
                playTone(300 + i * 80);
              }}
              onMouseLeave={() => setHoveredDim(null)}
            />
          );
        })}

        {dimensions.map((d, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const labelR = maxR + 18;
          const lx = cx + Math.cos(angle) * labelR;
          const ly = cy + Math.sin(angle) * labelR;
          const isHovered = hoveredDim === i;
          return (
            <text
              key={`label-${d.key}`}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] font-medium select-none transition-all"
              fill={isHovered ? COPPER : "#777"}
              fontWeight={isHovered ? 700 : 400}
            >
              {d.label.length > 16 ? d.label.slice(0, 14) + "…" : d.label}
            </text>
          );
        })}
      </svg>

      <AnimatePresence>
        {hoveredDim !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-0 left-0 right-0 text-center"
          >
            <span className="inline-block bg-[#1a1a1a] text-white text-xs px-3 py-1.5 rounded-full font-medium">
              {dimensions[hoveredDim].label} — {Math.round(dimensions[hoveredDim].value * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#aaa] font-medium">Scroll</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <ChevronDown className="h-4 w-4 text-copper/60" />
      </motion.div>
    </motion.div>
  );
}

function useAmbientSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);

  useEffect(() => {
    if (!enabled) {
      nodesRef.current.forEach(n => {
        try { n.gain.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime || 0) + 0.5); } catch {}
      });
      return;
    }

    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;

      const freqs = [110, 164.81, 220, 329.63];
      const created: { osc: OscillatorNode; gain: GainNode }[] = [];

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 2);
        osc.start(ctx.currentTime);
        created.push({ osc, gain });
      });

      nodesRef.current = created;

      return () => {
        created.forEach(n => {
          try {
            n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
            setTimeout(() => { try { n.osc.stop(); } catch {} }, 600);
          } catch {}
        });
      };
    } catch {}
  }, [enabled]);
}

function SectionReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  useAmbientSound(soundEnabled);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    playClick();
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

  const stats = [
    { value: 500, suffix: "+", label: lang === "de" ? "Executive Assessments" : "Executive Assessments" },
    { value: 98, suffix: "%", label: lang === "de" ? "Kundenzufriedenheit" : "Client Satisfaction" },
    { value: 15, suffix: "+", label: lang === "de" ? "Jahre Erfahrung" : "Years Experience" },
    { value: 6, suffix: "", label: lang === "de" ? "Kompetenz-Dimensionen" : "Competency Dimensions" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white font-sans flex flex-col relative">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <img src={aestimamusLogo} alt="aestimamus" className="h-8 object-contain" data-testid="img-logo" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSoundEnabled(!soundEnabled); playClick(); }}
              className="flex items-center justify-center w-8 h-8 text-[#999] hover:text-copper transition-colors rounded-full hover:bg-copper/5"
              data-testid="button-sound-toggle"
              title={soundEnabled ? "Sound off" : "Sound on"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 text-xs font-medium text-[#999] hover:text-[#333] transition-colors px-3 py-1.5 rounded-full border border-gray-200 hover:border-copper/40"
              data-testid="button-lang-toggle"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "de" ? "EN" : "DE"}
            </button>
          </div>
        </div>
      </header>

      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
      >
        <ConstellationCanvas />

        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-px w-8 bg-copper" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-copper font-semibold">aestimamus</span>
                </div>
                <h1
                  className="text-4xl md:text-[3.2rem] font-serif font-bold text-[#1a1a1a] mb-6 leading-[1.1] tracking-tight"
                  data-testid="text-hero-title"
                >
                  {t("landing.title")}
                </h1>
                <p className="text-[#666] text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                  {t("landing.subtitle")}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-copper" />
                    <h2 className="font-serif text-lg font-bold text-[#1a1a1a]">{t("landing.access_title")}</h2>
                  </div>
                  <p className="text-xs text-[#888] mb-5">{t("landing.access_subtitle")}</p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="access-code" className="block text-xs font-medium text-[#555] mb-1.5">
                        {t("landing.code_label")}
                      </label>
                      <Input
                        id="access-code"
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={t("landing.code_placeholder")}
                        className="w-full border-gray-200 focus:border-copper focus:ring-copper/30 rounded-lg bg-gray-50/50 h-11"
                        data-testid="input-access-code"
                        autoFocus
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-sm text-red-600 overflow-hidden"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span data-testid="text-error">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={loading || !code.trim()}
                      className="w-full gap-2 bg-copper text-white hover:bg-copper/90 rounded-lg font-medium h-11 text-sm shadow-md shadow-copper/20 hover:shadow-lg hover:shadow-copper/25 transition-all"
                      data-testid="button-submit-code"
                    >
                      {loading ? t("landing.checking") : t("landing.submit")}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </form>

                  <p className="text-[10px] text-[#aaa] mt-4 leading-relaxed">
                    {t("landing.help")}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block"
            >
              <InteractiveRadar soundEnabled={soundEnabled} />
            </motion.div>
          </div>
        </div>

        <ScrollIndicator />
      </motion.section>

      <section className="py-20 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className="text-3xl md:text-4xl font-serif font-bold text-copper mb-2" data-testid={`stat-${i}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-[#888] uppercase tracking-wider font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="py-24 bg-[#fafafa] relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionReveal>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-copper/40" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-copper font-semibold">
                  {lang === "de" ? "Unsere Stärken" : "Our Strengths"}
                </span>
                <div className="h-px w-8 bg-copper/40" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">{t("landing.focus_title")}</h2>
              <p className="text-[#666] text-sm leading-relaxed max-w-2xl mx-auto">
                {t("landing.focus_text")}
              </p>
            </div>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: t("landing.pillar1_title"), text: t("landing.pillar1_text"), icon: Shield, delay: 0.1 },
              { title: t("landing.pillar2_title"), text: t("landing.pillar2_text"), icon: Users, delay: 0.2 },
              { title: t("landing.pillar3_title"), text: t("landing.pillar3_text"), icon: BarChart3, delay: 0.3 },
            ].map((pillar) => (
              <SectionReveal key={pillar.title} delay={pillar.delay}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(163,88,62,0.08)" }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-xl border border-gray-200/80 p-7 h-full cursor-default shadow-sm"
                  onMouseEnter={playClick}
                >
                  <div className="w-10 h-10 rounded-lg bg-copper/8 flex items-center justify-center mb-5">
                    <pillar.icon className="h-5 w-5 text-copper" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-3">{pillar.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{pillar.text}</p>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionReveal>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-copper/40" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-copper font-semibold">
                  {t("landing.quicklinks_title")}
                </span>
                <div className="h-px w-8 bg-copper/40" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#1a1a1a] mb-3">
                {lang === "de" ? "Direkt einsteigen" : "Jump Right In"}
              </h2>
              <p className="text-sm text-[#888] max-w-md mx-auto">
                {lang === "de"
                  ? "Schnellzugriff auf Observer-Ansicht und Administration"
                  : "Quick access to Observer View and Administration"}
              </p>
            </div>
          </SectionReveal>

          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <SectionReveal delay={0.1}>
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(163,88,62,0.1)" }}
                onClick={() => { playClick(); setLocation("/observer"); }}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-6 shadow-sm group transition-colors hover:border-copper/40"
                data-testid="link-observer"
              >
                <div className="w-12 h-12 rounded-xl bg-copper/8 flex items-center justify-center mb-4 group-hover:bg-copper/15 transition-colors">
                  <Eye className="h-6 w-6 text-copper" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a] mb-1">{t("landing.link_observer")}</h3>
                <p className="text-xs text-[#888] leading-relaxed mb-4">{t("landing.link_observer_desc")}</p>
                <div className="flex items-center gap-1 text-copper text-xs font-semibold">
                  <span>{lang === "de" ? "Öffnen" : "Open"}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </SectionReveal>

            <SectionReveal delay={0.2}>
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(163,88,62,0.1)" }}
                onClick={() => { playClick(); setLocation("/admin"); }}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-6 shadow-sm group transition-colors hover:border-copper/40"
                data-testid="link-admin"
              >
                <div className="w-12 h-12 rounded-xl bg-copper/8 flex items-center justify-center mb-4 group-hover:bg-copper/15 transition-colors">
                  <Settings className="h-6 w-6 text-copper" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a] mb-1">{t("landing.link_admin")}</h3>
                <p className="text-xs text-[#888] leading-relaxed mb-4">{t("landing.link_admin_desc")}</p>
                <div className="flex items-center gap-1 text-copper text-xs font-semibold">
                  <span>{lang === "de" ? "Öffnen" : "Open"}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </SectionReveal>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2222]  text-white py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <SectionReveal>
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {lang === "de"
                    ? "An diesem Anspruch lassen wir uns messen."
                    : "We measure ourselves by this standard."}
                </h2>
                <div className="w-16 h-0.5 bg-copper mx-auto mb-6" />
                <p className="text-white/60 text-sm leading-relaxed">
                  {lang === "de"
                    ? "Executive Diagnostics auf höchstem Niveau — wissenschaftlich fundiert, praxiserprobt, individuell zugeschnitten."
                    : "Executive Diagnostics at the highest level — scientifically grounded, practice-proven, individually tailored."}
                </p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      <footer className="bg-[#1a1a1a] text-white/50 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={aestimamusLogo} alt="aestimamus" className="h-5 object-contain opacity-40 invert" />
            <span className="text-xs">&copy; {new Date().getFullYear()} aestimamus GmbH</span>
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/30">
            {t("footer.tagline")}
          </div>
        </div>
      </footer>
    </div>
  );
}
