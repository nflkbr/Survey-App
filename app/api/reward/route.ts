import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        responden: {
          select: {
            nama: true,
            email: true,
            divisi: true,
            nomorUrut: true,
          },
        },
      },
    });
    return NextResponse.json(rewards);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
