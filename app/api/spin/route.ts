// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST() {
//   try {
//     // Get minimum setting
//     const setting = await prisma.setting.findUnique({
//       where: { key: "min_spin_count" },
//     });
//     const minSpin = parseInt(setting?.value || "5");

//     // Get all submitted responden
//     const submitted = await prisma.responden.findMany({
//       where: { submittedAt: { not: null } },
//       select: { id: true, nomorUrut: true, nama: true, email: true, divisi: true },
//     });

//     if (submitted.length < minSpin) {
//       return NextResponse.json(
//         {
//           error: `Minimum ${minSpin} responden harus mengisi sebelum spin dilakukan. Saat ini: ${submitted.length}`,
//         },
//         { status: 400 }
//       );
//     }

//     // Random pick
//     const randomIndex = Math.floor(Math.random() * submitted.length);
//     const pemenang = submitted[randomIndex];

//     // Save to reward
//     const reward = await prisma.reward.create({
//       data: {
//         respondenId: pemenang.id,
//         statusEmail: "Belum",
//       },
//       include: { responden: true },
//     });

//     return NextResponse.json({
//       success: true,
//       pemenang: {
//         id: reward.id,
//         respondenId: pemenang.id,
//         nama: pemenang.nama,
//         email: pemenang.email,
//         divisi: pemenang.divisi,
//         nomorUrut: pemenang.nomorUrut,
//       },
//     });
//   } catch {
//     return NextResponse.json({ error: "Failed to spin" }, { status: 500 });
//   }
// }

// export async function PUT(request: Request) {
//   // Update min spin count
//   try {
//     const { minSpin } = await request.json();
//     await prisma.setting.upsert({
//       where: { key: "min_spin_count" },
//       update: { value: String(minSpin) },
//       create: { key: "min_spin_count", value: String(minSpin) },
//     });
//     return NextResponse.json({ success: true });
//   } catch {
//     return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Get minimum setting
    const setting = await prisma.setting.findUnique({
      where: { key: "min_spin_count" },
    });
    const minSpin = parseInt(setting?.value || "5");

    // Ambil id responden yang sudah pernah menang
    const existingWinners = await prisma.reward.findMany({
      select: { respondenId: true },
    });
    const winnerIds = existingWinners.map((w) => w.respondenId);

    // Get all submitted responden, exclude yang sudah pernah menang
    const submitted = await prisma.responden.findMany({
      where: {
        submittedAt: { not: null },
        id: { notIn: winnerIds },
      },
      select: { id: true, nomorUrut: true, nama: true, email: true, divisi: true },
    });

    if (submitted.length < minSpin) {
      return NextResponse.json(
        {
          error: `Minimum ${minSpin} responden (yang belum pernah menang) harus tersedia sebelum spin dilakukan. Saat ini: ${submitted.length}`,
        },
        { status: 400 }
      );
    }

    // Random pick
    const randomIndex = Math.floor(Math.random() * submitted.length);
    const pemenang = submitted[randomIndex];

    // Save to reward
    const reward = await prisma.reward.create({
      data: {
        respondenId: pemenang.id,
        statusEmail: "Belum",
      },
      include: { responden: true },
    });

    return NextResponse.json({
      success: true,
      pemenang: {
        id: reward.id,
        respondenId: pemenang.id,
        nama: pemenang.nama,
        //email: pemenang.email,
        divisi: pemenang.divisi,
        nomorUrut: pemenang.nomorUrut,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to spin" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Update min spin count
  try {
    const { minSpin } = await request.json();
    await prisma.setting.upsert({
      where: { key: "min_spin_count" },
      update: { value: String(minSpin) },
      create: { key: "min_spin_count", value: String(minSpin) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}