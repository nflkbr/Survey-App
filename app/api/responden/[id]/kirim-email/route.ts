import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildUndanganEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responden = await prisma.responden.findUnique({ where: { id } });

    if (!responden) {
      return NextResponse.json(
        { error: "Responden tidak ditemukan" },
        { status: 404 }
      );
    }

    if (responden.status === "Sudah Isi") {
      return NextResponse.json(
        { error: "Responden sudah mengisi survey" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const linkSurvey = `${baseUrl}/survey/${responden.shadowToken}`;

    // Get custom template from settings if exists
    const templateSetting = await prisma.setting.findUnique({
      where: { key: "email_undangan_template" },
    });

    const html = buildUndanganEmail({
      nama: responden.nama,
      linkSurvey,
      template: templateSetting?.value,
    });

    await sendEmail({
      to: responden.email,
      subject: "Undangan Mengisi Survey Kelayakan",
      html,
    });

    await prisma.responden.update({
      where: { id },
      data: { status: "Terkirim" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengirim email" },
      { status: 500 }
    );
  }
}
