import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET - detail kuesioner with pertanyaan
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const kuesioner = await prisma.kuesioner.findUnique({
      where: { id },
      include: { pertanyaan: { orderBy: { urutan: "asc" } } },
    });

    if (!kuesioner) {
      return NextResponse.json(
        { error: "Kuesioner tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(kuesioner);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PUT - update kuesioner
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.kuesioner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kuesioner tidak ditemukan" },
        { status: 404 }
      );
    }

    // If locked, don't allow structural changes
    if (existing.isLocked && (data.pertanyaan !== undefined)) {
      return NextResponse.json(
        { error: "Kuesioner terkunci karena sudah ada responden yang mengisi" },
        { status: 403 }
      );
    }

    const updated = await prisma.kuesioner.update({
      where: { id },
      data: {
        judul: data.judul ?? existing.judul,
        deskripsi: data.deskripsi ?? existing.deskripsi,
        isPublished: data.isPublished ?? existing.isPublished,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE - delete kuesioner
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    // Check if any responden has submitted answers for this kuesioner
    const hasAnswers = await prisma.jawaban.findFirst({
      where: { pertanyaan: { kuesionerId: id } },
    });

    if (hasAnswers) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus kuesioner yang sudah memiliki jawaban" },
        { status: 403 }
      );
    }

    await prisma.kuesioner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
