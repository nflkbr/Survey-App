"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type HasilResponden = {
  id: string;
  nama: string;
  email: string;
  divisi: string;
  nomorUrut: number;
  submittedAt: string;
};

type DetailJawaban = {
  id: string;
  nilaiTeks: string | null;
  nilaiJson: unknown;
  pertanyaan: {
    teks: string;
    tipe: string;
    options: unknown;
  };
};

type Pemenang = {
  id: string;
  nama: string;
  email: string;
  divisi: string;
  nomorUrut: number;
};

type Toast = { id: number; type: "success" | "error" | "info"; message: string };

export default function HasilPage() {
  const [data, setData] = useState<HasilResponden[]>([]);
  const [minSpin, setMinSpin] = useState(5);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showSpinAnimation, setShowSpinAnimation] = useState(false);
  const [pemenang, setPemenang] = useState<Pemenang | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<DetailJawaban[]>([]);
  const [detailName, setDetailName] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editMinSpin, setEditMinSpin] = useState(false);
  const [tempMinSpin, setTempMinSpin] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/hasil");
      const json = await res.json();
      setData(json.hasil || []);
      setMinSpin(json.minSpin || 5);
      setTempMinSpin(json.minSpin || 5);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Draw spin wheel
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = center - 8;
    const segments = data.length;
    const arc = (2 * Math.PI) / segments;

    const colors = [
      "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
      "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#3b82f6",
      "#a855f7", "#22d3ee",
    ];

    for (let i = 0; i < segments; i++) {
      const startAngle = i * arc - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + arc);
      ctx.lineTo(center, center);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw number
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.fillStyle = "white";
      ctx.font = `bold ${segments > 20 ? 10 : 14}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textX = radius * 0.65;
      ctx.fillText(String(data[i].nomorUrut).padStart(3, "0"), textX, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  }, [data]);

  const handleSpin = async () => {
    if (data.length < minSpin) return;
    setSpinning(true);
    setShowSpinAnimation(true);

    // Animate the wheel
    const canvas = canvasRef.current;
    if (canvas) {
      let rotation = 0;
      const totalRotation = 1800 + Math.random() * 720;
      const duration = 4000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        rotation = eased * totalRotation;
        canvas.style.transform = `rotate(${rotation}deg)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }

    // Call API after animation
    setTimeout(async () => {
      try {
        const res = await fetch("/api/spin", { method: "POST" });
        const json = await res.json();
        if (res.ok) {
          setPemenang(json.pemenang);
        } else {
          addToast("error", json.error);
          setShowSpinAnimation(false);
        }
      } catch {
        addToast("error", "Gagal melakukan spin");
        setShowSpinAnimation(false);
      } finally {
        setSpinning(false);
      }
    }, 4200);
  };

  const handleSendWinnerEmail = async (rewardId: string) => {
    try {
      const res = await fetch(`/api/reward/${rewardId}/kirim-email`, { method: "POST" });
      if (res.ok) {
        addToast("success", "Email selamat berhasil dikirim!");
      } else {
        addToast("error", "Gagal kirim email");
      }
    } catch {
      addToast("error", "Gagal kirim email");
    }
  };

  const viewDetail = async (id: string, nama: string) => {
    try {
      const res = await fetch(`/api/hasil/${id}`);
      const json = await res.json();
      setDetailData(json.jawaban || []);
      setDetailName(nama);
      setShowDetailModal(true);
    } catch {
      addToast("error", "Gagal memuat detail");
    }
  };

  const saveMinSpin = async () => {
    await fetch("/api/spin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minSpin: tempMinSpin }),
    });
    setMinSpin(tempMinSpin);
    setEditMinSpin(false);
    addToast("success", `Batas minimum spin diubah ke ${tempMinSpin}`);
  };

  const renderJawaban = (j: DetailJawaban) => {
    if (j.nilaiTeks) return j.nilaiTeks;
    if (j.nilaiJson) {
      if (Array.isArray(j.nilaiJson)) return (j.nilaiJson as string[]).join(", ");
      return JSON.stringify(j.nilaiJson);
    }
    return "-";
  };

  const canSpin = data.length >= minSpin;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">✅ Hasil Responden</h1>
          <p className="page-subtitle">
            {data.length} responden sudah mengisi survey
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {editMinSpin ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Min spin:</span>
              <input
                type="number"
                className="form-input"
                value={tempMinSpin}
                onChange={(e) => setTempMinSpin(parseInt(e.target.value) || 1)}
                style={{ width: 70 }}
                min={1}
              />
              <button className="btn btn-primary btn-sm" onClick={saveMinSpin}>✓</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMinSpin(false)}>✕</button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditMinSpin(true)}
            >
              ⚙️ Min Spin: {minSpin}
            </button>
          )}
        </div>
      </div>

      {/* Spin Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="spin-section">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>🎰 Spin Undian</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            {canSpin
              ? `${data.length} responden sudah mengisi. Spin siap dilakukan!`
              : `Belum cukup responden. Butuh ${minSpin}, saat ini ${data.length}.`}
          </p>

          {data.length > 0 && (
            <div className="spin-wheel-wrapper" style={{ marginBottom: 24 }}>
              <div className="spin-pointer" />
              <canvas ref={canvasRef} className="spin-canvas" width={280} height={280} />
            </div>
          )}

          <button
            className="btn btn-spin"
            onClick={handleSpin}
            disabled={!canSpin || spinning}
          >
            {spinning ? "🎰 Spinning..." : "🎰 SPIN SEKARANG!"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>📋 Daftar Responden (Sudah Submit)</h3>
        </div>
        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
          {loading ? (
            <div className="empty-state"><p>Memuat...</p></div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Belum ada yang mengisi</h3>
              <p>Kirim email undangan terlebih dahulu dari menu Master Responden</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>No. Urut</th>
                  <th>Nama</th>
                  <th>Divisi</th>
                  <th>Waktu Submit</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span
                        style={{
                          background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        #{String(r.nomorUrut).padStart(3, "0")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.nama}</td>
                    <td>{r.email}</td>
                    <td>
                      <span style={{ background: "rgba(99,102,241,0.1)", color: "var(--primary-light)", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        {r.divisi}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(r.submittedAt).toLocaleString("id-ID")}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewDetail(r.id, r.nama)}
                      >
                        👁️ Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Winner Animation Modal */}
      {showSpinAnimation && pemenang && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: "center", maxWidth: 440 }}>
            <div className="winner-animation">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉🏆🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Pemenang Terpilih!</h2>
              <div className="winner-number">
                #{String(pemenang.nomorUrut).padStart(3, "0")}
              </div>
              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{pemenang.nama}</p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{pemenang.email}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{pemenang.divisi}</p>
              </div>

              <div className="divider" />

              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                Kirim email selamat ke pemenang sekarang?
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    setShowSpinAnimation(false);
                    setPemenang(null);
                    addToast("info", "Anda bisa kirim email dari menu Reward nanti");
                  }}
                >
                  Nanti
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    handleSendWinnerEmail(pemenang.id);
                    setShowSpinAnimation(false);
                    setPemenang(null);
                  }}
                >
                  ✉️ Kirim Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📋 Jawaban - {detailName}</h2>
            {detailData.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Tidak ada jawaban</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {detailData.map((j, i) => (
                  <div key={j.id} className="question-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                      Pertanyaan {i + 1} ({j.pertanyaan.tipe})
                    </div>
                    <div className="question-text" style={{ marginBottom: 8 }}>{j.pertanyaan.teks}</div>
                    <div style={{ fontSize: 14, color: "var(--primary-light)", fontWeight: 600 }}>
                      → {renderJawaban(j)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-secondary"
              style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
              onClick={() => setShowDetailModal(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
