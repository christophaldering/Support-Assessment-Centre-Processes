"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TourStep } from "@/lib/arag-bdp-tour";
import { useLanguage } from "@/app/providers/LanguageProvider";

interface TourOverlayProps {
  steps: TourStep[];
  onClose: () => void;
  isDemoEnv: boolean;
  userCode: string;
  environment: string;
}

export default function TourOverlay({ steps, onClose, isDemoEnv, userCode, environment }: TourOverlayProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const findTarget = useCallback(() => {
    if (!step?.targetTestId) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-testid="${step.targetTestId}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    setVisible(false);
    setNavigating(false);
    const timer = setTimeout(() => {
      findTarget();
      setVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, findTarget]);

  useEffect(() => {
    const handleResize = () => findTarget();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [findTarget]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  const handleDontShowAgain = useCallback(() => {
    try {
      localStorage.setItem(`abcd_bdp_tourSeen_${environment}_${userCode}`, "true");
    } catch {}
    handleClose();
  }, [environment, userCode, handleClose]);

  const goNext = useCallback(() => {
    if (isLast) {
      handleClose();
      return;
    }
    const nextStep = steps[currentStep + 1];
    if (nextStep?.route && nextStep.route !== pathname) {
      setNavigating(true);
      router.push(nextStep.route);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 350);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, currentStep, steps, pathname, router, handleClose]);

  const goPrev = useCallback(() => {
    if (!isFirst) {
      const prevStep = steps[currentStep - 1];
      if (prevStep?.route && prevStep.route !== pathname) {
        setNavigating(true);
        router.push(prevStep.route);
        setTimeout(() => {
          setCurrentStep(prev => prev - 1);
        }, 350);
      } else {
        setCurrentStep(prev => prev - 1);
      }
    }
  }, [isFirst, currentStep, steps, pathname, router]);

  const getPopoverPosition = (): React.CSSProperties => {
    if (!targetRect || step?.placement === "center" || !step?.targetTestId) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const placement = step.placement || "bottom";
    const gap = 12;
    const popoverWidth = 340;
    const popoverHeight = 220;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
      case "top":
        top = targetRect.top - popoverHeight - gap;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.left - popoverWidth - gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.right + gap;
        break;
    }

    left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - popoverHeight - 12));

    return { position: "fixed", top: `${top}px`, left: `${left}px` };
  };

  const targetNotFound = step?.targetTestId && !targetRect;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 150ms ease" }}
      data-testid="tour-overlay"
    >
      {targetRect && step?.targetTestId ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 9999 }}>
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)" />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9999 }} />
      )}

      {targetRect && step?.targetTestId && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 10000,
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: "2px solid #FFD700",
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(255,215,0,0.3)",
          }}
        />
      )}

      <div
        ref={popoverRef}
        style={{ ...getPopoverPosition(), zIndex: 10001, width: "340px", maxWidth: "calc(100vw - 24px)" }}
        className="bg-[#FFFBF0] rounded-xl shadow-2xl border border-[#FFD700]/30"
        data-testid="tour-popover"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-black text-base leading-snug pr-4">{step?.title}</h3>
            <button
              onClick={handleClose}
              className="text-black/40 hover:text-black text-lg leading-none shrink-0"
              data-testid="tour-close"
              aria-label={t("tourEndLabel")}
            >
              ✕
            </button>
          </div>

          <div className="h-0.5 w-8 bg-[#FFD700] rounded-full mb-3" />

          <p className="text-sm text-black/70 leading-relaxed mb-4">{step?.body}</p>

          {targetNotFound && (
            <p className="text-xs text-black/40 italic mb-3">
              {t("tourHint")}
            </p>
          )}

          {navigating && (
            <p className="text-xs text-[#FFD700] font-medium mb-3">{t("tourPageLoading")}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-black/40 font-mono">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={goPrev}
                  disabled={navigating}
                  className="px-3 py-1.5 text-sm rounded-lg border border-black/10 text-black/60 hover:bg-black/5 disabled:opacity-50 transition-colors"
                  data-testid="tour-prev"
                >
                  {t("tourPrev")}
                </button>
              )}
              <button
                onClick={goNext}
                disabled={navigating}
                className="px-4 py-1.5 text-sm rounded-lg bg-[#FFD700] text-black font-semibold hover:bg-[#e6c200] disabled:opacity-50 transition-colors"
                data-testid="tour-next"
              >
                {isLast ? t("tourFinish") : t("tourNext")}
              </button>
            </div>
          </div>

          {isDemoEnv && isLast && (
            <button
              onClick={handleDontShowAgain}
              className="w-full mt-3 text-xs text-black/40 hover:text-black/60 transition-colors"
              data-testid="tour-dont-show"
            >
              {t("tourDontShowAgain")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
