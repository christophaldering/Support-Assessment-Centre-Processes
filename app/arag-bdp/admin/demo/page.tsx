"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoAdminPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/arag-bdp/admin"); }, [router]);
  return null;
}
