import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildPemenangEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const reward = await prisma.reward.findUnique({
      where: { id },
      include: { responden: true },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 });
    }

    const templateSetting = await prisma.setting.findUnique({
      where: { key: "email_pemenang_template" },
    });

    const html = buildPemenangEmail({
      nama: reward.responden.nama,
      nomorUrut: reward.responden.nomorUrut!,
      template: templateSetting?.value,
    });

    await sendEmail({
      to: reward.responden.email,
      subject: "🎉 Selamat! Anda Menang Undian Survey Kelayakan",
      html,
    });

    await prisma.reward.update({
      where: { id },
      data: { statusEmail: "Terkirim" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 });
  }
}
