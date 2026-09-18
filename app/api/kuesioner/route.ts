import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - list all kuesioner
export async function GET() {
  try {
    const kuesioner = await prisma.kuesioner.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { pertanyaan: true } } },
    });
    return NextResponse.json(kuesioner);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST - create kuesioner
export async function POST(request: Request) {
  try {
    const { judul, deskripsi } = await request.json();

    if (!judul) {
      return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
    }

    const kuesioner = await prisma.kuesioner.create({
      data: { judul, deskripsi: deskripsi || null },
    });

    return NextResponse.json(kuesioner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
