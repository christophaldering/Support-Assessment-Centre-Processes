"use client";

import { useState, useEffect, ReactNode, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  Calendar,
  Scale,
  Shield,
  FlaskConical,
  Download,
  LogOut,
  User,
  Mail,
  Play,
  Compass,
} from "lucide-react";
import { BdpContext, BdpUser } from "./bdp-context";
import NotificationBell from "./notification-bell";
import TourOverlay from "./components/TourOverlay";
import AvatarCircle from "./components/AvatarCircle";
import { getTourSteps } from "@/lib/arag-bdp-tour";

const PUBLIC_PATHS = ["/arag-bdp/gate", "/arag-bdp/login"];

function BdpLayoutInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BdpUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourAutoChecked, setTourAutoChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchUser = async () => {
    try {
      const bdpRes = await fetch("/api/arag-bdp/auth/session");
      const bdpData = await bdpRes.json();
      if (bdpData.authenticated) {
        setUser(bdpData.user);
        setLoading(false);
        return;
      }

      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        const isArag = meData.workspaceSlug === "arag";
        if (isArag) {
          setUser({
            id: meData.id,
            code: meData.name || meData.email.split("@")[0],
            role: meData.roles?.[0] || "USER",
            isAdmin: meData.roles?.includes("ADMIN") || meData.roles?.includes("WORKSPACE_ADMIN") || false,
            environment: "demo",
            viewMode: "mobile",
            uiPreset: "whatsapp_spiegel",
          });
          setLoading(false);
          return;
        }
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/arag-bdp/login");
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    const handleTourRestart = () => setTourRunning(true);
    window.addEventListener("bdp-tour-restart", handleTourRestart);
    return () => window.removeEventListener("bdp-tour-restart", handleTourRestart);
  }, []);

  useEffect(() => {
    if (!loading && user && !tourAutoChecked && user.environment === "demo") {
      setTourAutoChecked(true);
      try {
        const key = `arag_bdp_tourSeen_${user.environment}_${user.code}`;
        if (localStorage.getItem(key) !== "true") {
          localStorage.setItem(key, "true");
          setTimeout(() => setTourRunning(true), 600);
        }
      } catch {}
    } else if (!loading && user) {
      setTourAutoChecked(true);
    }
  }, [loading, user, tourAutoChecked]);

  const handleLogout = async () => {
    if (user?.environment === "demo") {
      try {
        await fetch("/api/arag-bdp/admin/demo-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoReset: true }),
        });
      } catch {}
    }
    await fetch("/api/arag-bdp/auth/session", { method: "DELETE" });
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/arag-bdp/login");
  };

  const startTour = () => {
    setMenuOpen(false);
    setTourRunning(true);
  };

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isPublicPath) {
    return (
      <BdpContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
        <div className="min-h-screen bg-[#FFFBF0]">{children}</div>
      </BdpContext.Provider>
    );
  }

  if (!user) return null;

  const tourSteps = getTourSteps({ role: user.role, isAdmin: user.isAdmin, environment: user.environment });

  const mobileTabs = [
    { href: "/arag-bdp", label: "Home", testId: "bdp-tab-home", Icon: LayoutGrid, disabled: false },
    { href: "/arag-bdp/sessions", label: "Sessions", testId: "bdp-tab-sessions", Icon: Calendar, disabled: false },
    { href: "/arag-bdp/bewertung", label: "Bewertung", testId: "bdp-tab-bewertung", Icon: Scale, disabled: false },
  ];

  const sidebarMain = [
    { href: "/arag-bdp", label: "Dashboard", testId: "bdp-side-dashboard", Icon: LayoutGrid },
    { href: "/arag-bdp/sessions", label: "Sessions", testId: "bdp-side-sessions", Icon: Calendar },
    { href: "/arag-bdp/bewertung", label: "Bewertung", testId: "bdp-side-bewertung", Icon: Scale },
  ];

  const sidebarAdmin = [
    { href: "/arag-bdp/admin", label: "Admin Konsole", testId: "bdp-side-admin", Icon: Shield },
    { href: "/arag-bdp/admin/qa", label: "QA", testId: "bdp-side-qa", Icon: FlaskConical },
    { href: "/arag-bdp/admin?tab=export", label: "Exporte", testId: "bdp-side-exports", Icon: Download },
    { href: "/arag-bdp/admin/invitations", label: "Einladungen", testId: "bdp-side-invitations", Icon: Mail },
    { href: "/arag-bdp/admin/demo", label: "Demo-Raum", testId: "bdp-side-demo", Icon: Play },
  ];

  const isActive = (href: string) => {
    if (href === "/arag-bdp") return pathname === "/arag-bdp";
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath === "/arag-bdp/admin" && hrefQuery) {
      const params = new URLSearchParams(hrefQuery);
      const tabValue = params.get("tab");
      return pathname === "/arag-bdp/admin" && searchParams.get("tab") === tabValue;
    }
    if (hrefPath === "/arag-bdp/admin" && !hrefQuery) {
      return pathname === "/arag-bdp/admin" && !searchParams.get("tab");
    }
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  };

  return (
    <BdpContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
      {tourRunning && (
        <TourOverlay
          steps={tourSteps}
          onClose={() => setTourRunning(false)}
          isDemoEnv={user.environment === "demo"}
          userCode={user.code}
          environment={user.environment}
        />
      )}

      {/* ═══════════════════════════════════════════════
          DESKTOP SHELL (lg: breakpoint and above)
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen bg-[#FFFBF0] text-black">
        <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#0b0b0b] text-[#FFFBF0] flex flex-col z-50">
          <div className="h-14 flex items-center px-6 border-b border-white/5">
            <span className="text-sm font-semibold tracking-wide text-[#FFFBF0]/80">ARAG BDP</span>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {sidebarMain.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.testId}
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                    active
                      ? "text-[#FFD700] bg-white/5"
                      : "text-[#FFFBF0]/60 hover:text-[#FFFBF0] hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FFD700] rounded-r-full" />
                  )}
                  <item.Icon size={18} strokeWidth={1.75} className={active ? "text-[#FFD700]" : ""} />
                  {item.label}
                </Link>
              );
            })}

            {user.isAdmin && (
              <>
                <div className="my-3 mx-3 border-t border-white/10" />
                {sidebarAdmin.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.testId}
                      href={item.href}
                      data-testid={item.testId}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                        active
                          ? "text-[#FFD700] bg-white/5"
                          : "text-[#FFFBF0]/60 hover:text-[#FFFBF0] hover:bg-white/5"
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FFD700] rounded-r-full" />
                      )}
                      <item.Icon size={18} strokeWidth={1.75} className={active ? "text-[#FFD700]" : ""} />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}

            <div className="my-3 mx-3 border-t border-white/10" />
            <button
              onClick={startTour}
              data-testid="bdp-side-tour"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-[#FFFBF0]/60 hover:text-[#FFFBF0] hover:bg-white/5 w-full"
            >
              <Compass size={18} strokeWidth={1.75} />
              Tour starten
            </button>
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <AvatarCircle avatarUrl={user.photoUrl} code={user.code} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#FFFBF0] truncate">{user.code}</div>
                <div className="text-[10px] text-[#FFFBF0]/40">{user.role}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
          {user.environment === "demo" && (
            <div data-testid="demo-lock-banner" className="bg-[#FFD700] text-black text-center py-1.5 text-xs font-bold tracking-wide">
              DEMO-MODUS – Sie dürfen mit den Daten experimentieren. Änderungen werden beim Abmelden zurückgesetzt.
            </div>
          )}
          <header className="sticky top-0 z-40 h-14 bg-[#FFFBF0] border-b border-black/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {user.environment === "demo" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFD700] text-black px-2 py-0.5 rounded">
                  Demo
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-black/50">{user.code}</span>
              <NotificationBell variant="desktop" />
              <Link
                href="/arag-bdp/profile"
                data-testid="link-profile"
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <User size={14} strokeWidth={1.75} className="text-black/50" />
              </Link>
              <button
                onClick={handleLogout}
                data-testid="bdp-desktop-logout"
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors text-black/50"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <main className="flex-1 px-8 py-6">
            <div className="max-w-[1140px] mx-auto">
              {children}
            </div>
          </main>

          <footer className="text-center py-2 text-xs text-gray-400 border-t border-gray-100">
            Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </footer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE SHELL (below lg: breakpoint)
          ═══════════════════════════════════════════════ */}
      <div className="lg:hidden fixed inset-0 bg-[#FFFBF0] text-black flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
        {user.environment === "demo" && (
          <div data-testid="demo-banner" className="bg-[#FFD700] text-black text-center py-1 text-[11px] font-bold tracking-wide shrink-0 px-2">
            DEMO – Experimentieren erlaubt! Änderungen werden beim Abmelden zurückgesetzt.
          </div>
        )}

        <header className="bg-black text-white px-4 py-3 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">ARAG BDP</span>
            <span className="text-[#FFD700] text-sm font-mono">{user.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell variant="mobile" />
            <Link href="/arag-bdp/profile" data-testid="link-profile">
              <AvatarCircle avatarUrl={user.photoUrl} code={user.code} size="sm" />
            </Link>
            <button data-testid="bdp-menu-hamburger" onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-xl">✕</button>
              <nav className="mt-12 space-y-4">
                <Link href="/arag-bdp/profile" data-testid="bdp-menu-profile" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Profil</Link>
                {user.isAdmin && (
                  <>
                    <Link href="/arag-bdp/admin" data-testid="bdp-menu-admin" className="block py-2 px-4 rounded hover:bg-gray-100 font-bold" onClick={() => setMenuOpen(false)}>Admin</Link>
                    <Link href="/arag-bdp/admin/invitations" data-testid="bdp-menu-invitations" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Einladungen</Link>
                    <Link href="/arag-bdp/admin/demo" data-testid="bdp-menu-demo" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Demo-Raum</Link>
                  </>
                )}
                <button data-testid="bdp-menu-tour" onClick={startTour} className="block py-2 px-4 rounded hover:bg-[#FFFBF0] text-black w-full text-left">
                  <span className="flex items-center gap-2">
                    <Compass size={16} strokeWidth={1.75} className="text-[#FFD700]" />
                    Tour starten
                  </span>
                </button>
                <button data-testid="bdp-menu-logout" onClick={handleLogout} className="block py-2 px-4 rounded hover:bg-red-50 text-red-600 w-full text-left">Abmelden</button>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overscroll-none max-w-md mx-auto w-full px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
          {children}
        </main>

        <nav className="shrink-0 bg-[#FFFBF0] border-t border-black/10 z-50" role="navigation" data-testid="bottom-nav">
          <div className="max-w-[480px] mx-auto flex justify-around items-center h-[70px]">
            {mobileTabs.map(tab => {
              const active = pathname === tab.href || (tab.href !== "/arag-bdp" && pathname.startsWith(tab.href));

              if (tab.disabled) {
                return (
                  <span
                    key={tab.href}
                    data-testid={tab.testId}
                    className="flex flex-col items-center justify-center gap-1 min-w-[60px] cursor-not-allowed opacity-30"
                  >
                    <tab.Icon size={22} strokeWidth={1.75} />
                    <span className="text-[11px] uppercase tracking-wide">
                      {tab.label}
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-testid={tab.testId}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-150 ease-in-out ${
                    active
                      ? "text-[#FFD700]"
                      : "text-black/70 hover:opacity-100 opacity-70"
                  }`}
                >
                  <tab.Icon
                    size={22}
                    strokeWidth={1.75}
                    className={`transition-transform duration-150 ease-in-out ${active ? "scale-105" : "scale-100"}`}
                  />
                  <span className="text-[11px] uppercase tracking-wide">
                    {tab.label}
                  </span>
                  {active && (
                    <div className="w-6 h-0.5 bg-[#FFD700] rounded-full mt-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </BdpContext.Provider>
  );
}

export default function BdpLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full" />
      </div>
    }>
      <BdpLayoutInner>{children}</BdpLayoutInner>
    </Suspense>
  );
}
