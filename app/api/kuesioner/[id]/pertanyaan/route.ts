import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST - add pertanyaan to kuesioner
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: kuesionerId } = await params;
    const { teks, tipe, required, options } = await request.json();

    const kuesioner = await prisma.kuesioner.findUnique({
      where: { id: kuesionerId },
    });
    if (!kuesioner) {
      return NextResponse.json(
        { error: "Kuesioner tidak ditemukan" },
        { status: 404 }
      );
    }
    if (kuesioner.isLocked) {
      return NextResponse.json(
        { error: "Kuesioner terkunci" },
        { status: 403 }
      );
    }

    // Get next urutan
    const lastQuestion = await prisma.pertanyaan.findFirst({
      where: { kuesionerId },
      orderBy: { urutan: "desc" },
    });
    const urutan = (lastQuestion?.urutan ?? 0) + 1;

    const pertanyaan = await prisma.pertanyaan.create({
      data: {
        kuesionerId,
        teks,
        tipe,
        required: required ?? false,
        options: options ?? null,
        urutan,
      },
    });

    return NextResponse.json(pertanyaan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// DELETE all pertanyaan and re-bulk create (for reorder)
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id: kuesionerId } = await params;
    const { pertanyaan: list } = await request.json();

    const kuesioner = await prisma.kuesioner.findUnique({
      where: { id: kuesionerId },
    });
    if (!kuesioner || kuesioner.isLocked) {
      return NextResponse.json(
        { error: "Tidak diizinkan" },
        { status: 403 }
      );
    }

    // Update each question's urutan
    await Promise.all(
      list.map((q: { id: string; urutan: number; teks: string; tipe: string; required: boolean; options: unknown }) =>
        prisma.pertanyaan.update({
          where: { id: q.id },
          data: {
            urutan: q.urutan,
            teks: q.teks,
            tipe: q.tipe,
            required: q.required,
            options: (q.options as any) ?? null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
