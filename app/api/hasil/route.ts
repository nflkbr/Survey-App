// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET() {
//   try {
//     const hasil = await prisma.responden.findMany({
//       where: { submittedAt: { not: null } },
//       orderBy: { nomorUrut: "asc" },
//       select: {
//         id: true,
//         nama: true,
//         email: true,
//         divisi: true,
//         nomorUrut: true,
//         submittedAt: true,
//       },
//     });

//     // Get minimum spin setting
//     const setting = await prisma.setting.findUnique({
//       where: { key: "min_spin_count" },
//     });
//     const minSpin = parseInt(setting?.value || "5");

//     return NextResponse.json({ hasil, minSpin, total: hasil.length });
//   } catch {
//     return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ambil id responden yang sudah pernah menang, supaya di-exclude
    const existingWinners = await prisma.reward.findMany({
      select: { respondenId: true },
    });
    const winnerIds = existingWinners.map((w: { respondenId: string }) => w.respondenId);

    const hasil = await prisma.responden.findMany({
      where: {
        submittedAt: { not: null },
        id: { notIn: winnerIds },
      },
      orderBy: { nomorUrut: "asc" },
      select: {
        id: true,
        nama: true,
        //email: true,
        divisi: true,
        nomorUrut: true,
        submittedAt: true,
      },
    });

    // Get minimum spin setting
    const setting = await prisma.setting.findUnique({
      where: { key: "min_spin_count" },
    });
    const minSpin = parseInt(setting?.value || "5");

    return NextResponse.json({ hasil, minSpin, total: hasil.length });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}