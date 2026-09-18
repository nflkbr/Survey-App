import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

// GET - get survey form by token
export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params;

    const responden = await prisma.responden.findUnique({
      where: { shadowToken: token },
    });

    if (!responden) {
      return NextResponse.json(
        { error: "Link survey tidak valid" },
        { status: 404 }
      );
    }

    if (responden.submittedAt) {
      return NextResponse.json(
        { error: "Anda sudah mengisi survey ini", alreadySubmitted: true },
        { status: 200 }
      );
    }

    // Get the latest published kuesioner
    const kuesioner = await prisma.kuesioner.findFirst({
      where: { isPublished: true },
      include: { pertanyaan: { orderBy: { urutan: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    if (!kuesioner) {
      return NextResponse.json(
        { error: "Survey belum tersedia" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      kuesioner,
      // Don't expose personal info to the form
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST - submit survey answers
export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const { kuesionerId, jawaban } = await request.json();

    // Use a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx: any) => {
      // Lock the responden row for update
      const responden = await tx.responden.findUnique({
        where: { shadowToken: token },
      });

      if (!responden) {
        throw new Error("TOKEN_INVALID");
      }

      if (responden.submittedAt) {
        throw new Error("ALREADY_SUBMITTED");
      }

      // Count current submissions to get nomorUrut atomically
      const currentCount = await tx.responden.count({
        where: { submittedAt: { not: null } },
      });
      const nomorUrut = currentCount + 1;

      // Save all answers
      await tx.jawaban.createMany({
        data: jawaban.map((j: { pertanyaanId: string; nilaiTeks?: string; nilaiJson?: unknown }) => ({
          respondenId: responden.id,
          pertanyaanId: j.pertanyaanId,
          nilaiTeks: j.nilaiTeks || null,
          nilaiJson: (j.nilaiJson as any) || null,
        })),
      });

      // Mark as submitted
      const updated = await tx.responden.update({
        where: { id: responden.id },
        data: {
          submittedAt: new Date(),
          nomorUrut,
          status: "Sudah Isi",
        },
      });

      // Lock the kuesioner
      await tx.kuesioner.update({
        where: { id: kuesionerId },
        data: { isLocked: true },
      });

      return { nomorUrut: updated.nomorUrut };
    });

    return NextResponse.json({
      success: true,
      nomorUrut: result.nomorUrut,
      message: "Terima kasih! Survey Anda berhasil dikirim.",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_SUBMITTED") {
        return NextResponse.json(
          { error: "Anda sudah mengisi survey ini sebelumnya" },
          { status: 409 }
        );
      }
      if (error.message === "TOKEN_INVALID") {
        return NextResponse.json(
          { error: "Link survey tidak valid" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
