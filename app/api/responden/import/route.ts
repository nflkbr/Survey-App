import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import * as XLSX from "xlsx";

const DIVISI_LIST = [
  "Business Analyst",
  "IT Infra",
  "IT Dev",
  "Data Visualization",
  "Data Engineering",
  "Human Resource",
  "Finance",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<{
      nama?: string;
      email?: string;
      no_telp?: string;
      divisi?: string;
    }>(sheet, { defval: "" });

    let imported = 0;
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const nama = String(row.nama || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      const noTelp = String(row.no_telp || "").trim();
      const divisi = String(row.divisi || "").trim();

      if (!nama || !email || !divisi) {
        errors.push(`Baris tidak lengkap: nama="${nama}", email="${email}"`);
        continue;
      }

      if (!DIVISI_LIST.includes(divisi)) {
        errors.push(`Divisi tidak valid untuk ${email}: "${divisi}"`);
        continue;
      }

      const existing = await prisma.responden.findUnique({ where: { email } });
      if (existing) {
        skipped.push(email);
        continue;
      }

      await prisma.responden.create({
        data: {
          nama,
          email,
          noTelp: noTelp || null,
          divisi,
          shadowToken: nanoid(16),
          status: "Belum Dikirim",
        },
      });
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      message: `${imported} responden berhasil diimport, ${skipped.length} dilewati (duplikat)`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
