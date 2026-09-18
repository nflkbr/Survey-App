import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const DIVISI_LIST = [
  "Business Analyst",
  "IT Infra",
  "IT Dev",
  "Data Visualization",
  "Data Engineering",
  "Human Resource",
  "Finance",
];

// GET - list all responden
export async function GET() {
  try {
    const responden = await prisma.responden.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(responden);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST - add single responden
export async function POST(request: Request) {
  try {
    const { nama, email, noTelp, divisi } = await request.json();

    if (!nama || !email || !divisi) {
      return NextResponse.json(
        { error: "Nama, email, dan divisi wajib diisi" },
        { status: 400 }
      );
    }

    if (!DIVISI_LIST.includes(divisi)) {
      return NextResponse.json({ error: "Divisi tidak valid" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.responden.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: `Email ${email} sudah terdaftar` },
        { status: 409 }
      );
    }

    const shadowToken = nanoid(16);

    const responden = await prisma.responden.create({
      data: {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        noTelp: noTelp?.trim() || null,
        divisi,
        shadowToken,
        status: "Belum Dikirim",
      },
    });

    return NextResponse.json(responden, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
