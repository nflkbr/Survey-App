import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const responden = await prisma.responden.findUnique({
      where: { id },
      include: {
        jawaban: {
          include: { pertanyaan: true },
          orderBy: { pertanyaan: { urutan: "asc" } },
        },
      },
    });

    if (!responden || !responden.submittedAt) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(responden);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
