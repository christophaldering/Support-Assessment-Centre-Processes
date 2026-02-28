"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers/LanguageProvider";

export default function BdpLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  useEffect(() => { router.replace("/w/comp"); }, [router]);
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
      <div className="text-gray-400">{t("redirecting")}</div>
    </div>
  );
}
