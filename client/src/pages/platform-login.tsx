import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, AlertCircle, ArrowLeft, Mail, KeyRound, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  workspaceId: number;
  workspaceSlug?: string;
  mustChangePassword?: boolean;
}

function getRedirectPath(user: UserData): string {
  const roles = user.roles || [];
  const slug = user.workspaceSlug || "aestimamus";
  if (roles.includes("ADMIN")) return `/workspace/${slug}`;
  if (roles.includes("MODERATOR")) return `/workspace/${slug}`;
  if (roles.includes("HR_CLIENT")) return `/workspace/${slug}`;
  if (roles.includes("OBSERVER")) return "/observer";
  if (roles.includes("CANDIDATE")) return "/candidate";
  return `/workspace/${slug}`;
}

export default function PlatformLogin() {
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/platform/auth/login", { email, password });
      const json = await res.json();
      const user: UserData = json.user;

      if (json.mustChangePassword) {
        setUserData(user);
        setMustChangePassword(true);
      } else {
        sessionStorage.setItem("platform_user", JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          workspaceId: user.workspaceId,
          workspaceSlug: user.workspaceSlug,
        }));
        setLocation(getRedirectPath(user));
      }
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");

    if (newPassword !== confirmPassword) {
      setChangeError(t("login.password_mismatch"));
      return;
    }

    setChangeLoading(true);
    try {
      await apiRequest("POST", "/api/platform/auth/change-password", {
        userId: userData!.id,
        newPassword,
      });
      sessionStorage.setItem("platform_user", JSON.stringify({
        id: userData!.id,
        email: userData!.email,
        firstName: userData!.firstName,
        lastName: userData!.lastName,
        roles: userData!.roles,
        workspaceId: userData!.workspaceId,
        workspaceSlug: userData!.workspaceSlug,
      }));
      setLocation(getRedirectPath(userData!));
    } catch {
      setChangeError(t("login.error"));
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <span
            className="text-white font-serif text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="text-platform-name"
          >
            {t("platform.title")}
          </span>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40"
            data-testid="button-lang-toggle"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "de" ? "EN" : "DE"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {!mustChangePassword ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1
                    className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight"
                    data-testid="text-login-title"
                  >
                    {t("login.title")}
                  </h1>
                  <p className="text-slate-500 text-sm" data-testid="text-login-subtitle">
                    {t("login.subtitle")}
                  </p>
                  <div className="h-1 w-12 bg-[#3b82f6] mx-auto rounded-full mt-4" />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm" data-testid="card-login">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        {t("login.email")}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("login.email")}
                          className="w-full pl-10 bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                          data-testid="input-email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        {t("login.password")}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("login.password")}
                          className="w-full pl-10 bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                          data-testid="input-password"
                          required
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-sm text-red-500 overflow-hidden"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span data-testid="text-login-error">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={loading || !email.trim() || !password.trim()}
                      className="w-full gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-12 text-sm shadow-lg shadow-[#3b82f6]/25 hover:shadow-xl hover:shadow-[#3b82f6]/30 transition-all"
                      data-testid="button-login-submit"
                    >
                      {loading ? "..." : t("login.submit")}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="change-password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1
                    className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight"
                    data-testid="text-change-password-title"
                  >
                    {t("login.change_password_title")}
                  </h1>
                  <p className="text-slate-500 text-sm" data-testid="text-change-password-subtitle">
                    {t("login.change_password_subtitle")}
                  </p>
                  <div className="h-1 w-12 bg-[#3b82f6] mx-auto rounded-full mt-4" />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm" data-testid="card-change-password">
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        {t("login.new_password")}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t("login.new_password")}
                          className="w-full pl-10 bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                          data-testid="input-new-password"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        {t("login.confirm_password")}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t("login.confirm_password")}
                          className="w-full pl-10 bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                          data-testid="input-confirm-password"
                          required
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {changeError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-sm text-red-500 overflow-hidden"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span data-testid="text-change-password-error">{changeError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={changeLoading || !newPassword.trim() || !confirmPassword.trim()}
                      className="w-full gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-12 text-sm shadow-lg shadow-[#3b82f6]/25 hover:shadow-xl hover:shadow-[#3b82f6]/30 transition-all"
                      data-testid="button-change-password-submit"
                    >
                      {changeLoading ? "..." : t("login.change_submit")}
                      {!changeLoading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mt-6">
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3b82f6] transition-colors"
              data-testid="link-back-platform"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("login.back")}
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="bg-[#0f172a] py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <span
            className="text-white/80 font-serif text-sm font-medium tracking-tight block mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("platform.title")}
          </span>
          <p className="text-slate-500 text-xs" data-testid="text-footer-credit">
            {t("platform.footer_credit")}
          </p>
        </div>
      </footer>
    </div>
  );
}
