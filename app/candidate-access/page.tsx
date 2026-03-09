"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "login" | "set-password";

export default function CandidateAccessPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/candidate-portal/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          router.push("/candidate/home");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/candidate-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.needsPassword) {
        setUserName(data.userName || "");
        setStep("set-password");
      } else if (data.hasPassword) {
        setStep("login");
      } else if (data.error) {
        setError(data.error);
      } else {
        setStep("login");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/candidate-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/candidate/home");
      } else {
        setError(data.error || "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/candidate-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isSettingPassword: true }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/candidate/home");
      } else {
        setError(data.error || "Passwort konnte nicht gesetzt werden.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight" data-testid="text-portal-title">
            Candidate Portal
          </h1>
          <p className="text-[15px] text-[#86868b] mt-2" data-testid="text-portal-subtitle">
            {step === "email" && "Enter your email to access your assessment materials."}
            {step === "login" && "Welcome back. Enter your password to continue."}
            {step === "set-password" && `Welcome${userName ? `, ${userName}` : ""}. Please set your password.`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e7] p-8">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="your@email.com"
                  className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                  data-testid="input-candidate-email"
                />
              </div>

              {error && (
                <p className="text-[13px] text-red-500 text-center" data-testid="text-auth-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium py-3 rounded-xl transition-all text-[15px] disabled:opacity-50"
                data-testid="button-continue"
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 text-[15px] text-[#86868b] bg-[#f5f5f7]"
                  data-testid="input-candidate-email-display"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your password"
                    className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 pr-12 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                    data-testid="input-candidate-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-500 text-center" data-testid="text-auth-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium py-3 rounded-xl transition-all text-[15px] disabled:opacity-50"
                data-testid="button-login"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setPassword(""); setError(""); }}
                className="w-full text-[#0071e3] text-[13px] font-medium hover:underline"
                data-testid="button-back-email"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === "set-password" && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="bg-[#f0f7ff] border border-[#b3d7ff] rounded-xl p-4 text-[13px] text-[#0071e3]" data-testid="text-first-access-notice">
                This is your first time accessing the portal. Please create a password to secure your account.
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 text-[15px] text-[#86868b] bg-[#f5f5f7]"
                  data-testid="input-candidate-email-display"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Minimum 8 characters"
                  className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                  data-testid="input-candidate-new-password"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  className="w-full border border-[#d2d2d7] rounded-xl px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                  data-testid="input-candidate-confirm-password"
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-[#86868b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-show-password"
                />
                Show passwords
              </label>

              {error && (
                <p className="text-[13px] text-red-500 text-center" data-testid="text-auth-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium py-3 rounded-xl transition-all text-[15px] disabled:opacity-50"
                data-testid="button-set-password"
              >
                {loading ? "Setting password..." : "Set Password & Continue"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setPassword(""); setConfirmPassword(""); setError(""); }}
                className="w-full text-[#0071e3] text-[13px] font-medium hover:underline"
                data-testid="button-back-email"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-[#86868b] mt-8 tracking-wide">
          Executive Diagnostics Platform
        </p>
      </div>
    </div>
  );
}
