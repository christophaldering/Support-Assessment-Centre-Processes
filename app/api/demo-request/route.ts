import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name und E-Mail sind erforderlich." },
        { status: 400 }
      );
    }

    await prisma.demoRequest.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        company: company?.trim() || null,
        message: message?.trim() || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
