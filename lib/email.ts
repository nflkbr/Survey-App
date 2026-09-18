import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  await transporter.sendMail({
    from: `"Survey Kelayakan" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export function buildUndanganEmail(params: {
  nama: string;
  linkSurvey: string;
  template?: string;
}): string {
  const { nama, linkSurvey, template } = params;

  if (template) {
    return template
      .replace(/{{nama}}/g, nama)
      .replace(/{{link_survey}}/g, linkSurvey);
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📋 Undangan Survey Kelayakan</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px; color: #333;">Halo, <strong>${nama}</strong>!</p>
        <p style="color: #555; line-height: 1.6;">
          Anda diundang untuk mengisi <strong>Survey Kelayakan</strong>. 
          Survei ini membutuhkan waktu sekitar 5-10 menit.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkSurvey}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 14px 32px; border-radius: 50px; 
                    text-decoration: none; font-size: 16px; font-weight: bold;
                    display: inline-block;">
            Isi Survey Sekarang →
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Atau salin link ini ke browser Anda:<br/>
          <a href="${linkSurvey}" style="color: #667eea;">${linkSurvey}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          Link ini hanya berlaku untuk Anda. Jangan bagikan ke orang lain.
        </p>
      </div>
    </div>
  `;
}

export function buildPemenangEmail(params: {
  nama: string;
  nomorUrut: number;
  template?: string;
}): string {
  const { nama, nomorUrut, template } = params;

  if (template) {
    return template
      .replace(/{{nama}}/g, nama)
      .replace(/{{nomor_urut}}/g, String(nomorUrut));
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Selamat, Anda Menang!</h1>
      </div>
      <div style="background: #fff8e1; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #ffe082;">
        <p style="font-size: 18px; color: #333; text-align: center;">
          Halo, <strong>${nama}</strong>! 🏆
        </p>
        <p style="color: #555; line-height: 1.6; text-align: center;">
          Anda terpilih sebagai <strong>pemenang undian</strong> Survey Kelayakan!
        </p>
        <div style="background: white; border: 2px solid #ffd700; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; color: #888; font-size: 14px;">Nomor Urut Anda</p>
          <p style="margin: 5px 0 0; font-size: 48px; font-weight: bold; color: #f5576c;">
            #${String(nomorUrut).padStart(3, "0")}
          </p>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">
          Tim kami akan segera menghubungi Anda untuk informasi hadiah lebih lanjut.
        </p>
      </div>
    </div>
  `;
}
