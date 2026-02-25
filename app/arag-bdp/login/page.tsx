"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BdpLoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/w/arag"); }, [router]);
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
      <div className="text-gray-400">Weiterleitung...</div>
    </div>
  );
}
