"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBdp } from "./bdp-context";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpHomePage() {
  const { user } = useBdp();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) {
      router.replace("/abcd-bdp/admin");
    } else if (user.role === "BOARD" || user.role === "EXPERT" || user.role === "MANAGEMENT_DIAGNOSTICS") {
      router.replace("/abcd-bdp/sessions");
    } else if (user.role === "PARTICIPANT") {
      router.replace("/abcd-bdp/portal");
    } else {
      router.replace("/abcd-bdp/sessions");
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-gray-400">{t("redirecting")}</div>
    </div>
  );
}
