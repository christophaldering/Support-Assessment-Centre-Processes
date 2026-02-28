"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BdpGateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/w/comp");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full" />
    </div>
  );
}
