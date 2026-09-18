import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pertanyaanId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { pertanyaanId } = await params;
    await prisma.pertanyaan.delete({ where: { id: pertanyaanId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
