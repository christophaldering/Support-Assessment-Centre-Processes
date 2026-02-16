import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const record = await prisma.healthCheck.create({
      data: { status: "ok" },
    });
    return NextResponse.json({ status: "ok", id: record.id, checkedAt: record.checkedAt });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
