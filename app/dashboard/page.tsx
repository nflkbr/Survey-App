import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [totalResponden, sudahIsi, terkirim, belumDikirim, totalKuesioner, totalReward] =
    await Promise.all([
      prisma.responden.count(),
      prisma.responden.count({ where: { status: "Sudah Isi" } }),
      prisma.responden.count({ where: { status: "Terkirim" } }),
      prisma.responden.count({ where: { status: "Belum Dikirim" } }),
      prisma.kuesioner.count(),
      prisma.reward.count(),
    ]);
  return { totalResponden, sudahIsi, terkirim, belumDikirim, totalKuesioner, totalReward };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const pctIsi =
    stats.totalResponden > 0
      ? Math.round((stats.sudahIsi / stats.totalResponden) * 100)
      : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan sistem survey kelayakan</p>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🕐{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-value" style={{ color: "var(--primary-light)" }}>
            {stats.totalResponden}
          </div>
          <div className="stat-label">Total Responden</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "#34d399" }}>
            {stats.sudahIsi}
          </div>
          <div className="stat-label">Sudah Mengisi</div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📨</div>
          <div className="stat-value" style={{ color: "#fbbf24" }}>
            {stats.terkirim}
          </div>
          <div className="stat-label">Email Terkirim</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🏆</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {stats.totalReward}
          </div>
          <div className="stat-label">Total Pemenang</div>
        </div>
      </div>

      {/* Progress & Info */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            📈 Progress Survey
          </h3>

          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 8,
              }}
            >
              <span>Tingkat Pengisian</span>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                {pctIsi}%
              </span>
            </div>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 8,
                height: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pctIsi}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                  borderRadius: 8,
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Sudah Isi", value: stats.sudahIsi, color: "#34d399" },
              { label: "Terkirim (belum isi)", value: stats.terkirim, color: "#fbbf24" },
              { label: "Belum Dikirim", value: stats.belumDikirim, color: "#64748b" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: item.color,
                    }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            ⚡ Aksi Cepat
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href="/responden" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              👥 Kelola Responden
            </a>
            <a href="/kuesioner" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              📝 Buat / Edit Kuesioner
            </a>
            <a href="/hasil" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              ✅ Lihat Hasil & Spin
            </a>
            <a href="/reward" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              🏆 Histori Pemenang
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
