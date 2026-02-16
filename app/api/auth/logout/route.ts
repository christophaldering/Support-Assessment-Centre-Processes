import { NextResponse } from "next/server";
import { clearUserSession, clearMasterAuth, clearWorkspaceAuth } from "@/lib/session";

export async function POST() {
  clearUserSession();
  clearMasterAuth();
  clearWorkspaceAuth();
  return NextResponse.json({ success: true });
}
