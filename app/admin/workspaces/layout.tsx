import { redirect } from "next/navigation";
import { hasMasterAuth } from "@/lib/session";

export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  if (!hasMasterAuth()) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
