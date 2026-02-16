import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setMasterAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const hash = process.env.MASTER_ADMIN_PASSWORD_HASH;

    if (!hash) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    setMasterAuth();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
