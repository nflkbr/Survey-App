import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildUndanganEmail } from "@/lib/email";

export async function POST() {
  try {
    // Get all who haven't filled the survey
    const responden = await prisma.responden.findMany({
      where: { status: { not: "Sudah Isi" } },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const templateSetting = await prisma.setting.findUnique({
      where: { key: "email_undangan_template" },
    });

    let sent = 0;
    const failed: string[] = [];

    for (const r of responden) {
      try {
        const linkSurvey = `${baseUrl}/survey/${r.shadowToken}`;
        const html = buildUndanganEmail({
          nama: r.nama,
          linkSurvey,
          template: templateSetting?.value,
        });

        await sendEmail({
          to: r.email,
          subject: "Undangan Mengisi Survey Kelayakan",
          html,
        });

        await prisma.responden.update({
          where: { id: r.id },
          data: { status: "Terkirim" },
        });

        sent++;
      } catch {
        failed.push(r.email);
      }
    }

    return NextResponse.json({
      sent,
      failed,
      message: `${sent} email terkirim, ${failed.length} gagal`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to broadcast" }, { status: 500 });
  }
}
