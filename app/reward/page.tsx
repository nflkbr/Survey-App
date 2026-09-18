"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Reward = {
  id: string;
  respondenId: string;
  tanggalSpin: string;
  statusEmail: string;
  responden: {
    nama: string;
    email: string;
    divisi: string;
    nomorUrut: number;
  };
};

type Toast = { id: number; type: "success" | "error"; message: string };

export default function RewardPage() {
  const [data, setData] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/reward");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendEmail = async (rewardId: string) => {
    setSendingId(rewardId);
    try {
      const res = await fetch(`/api/reward/${rewardId}/kirim-email`, { method: "POST" });
      if (res.ok) {
        addToast("success", "Email selamat berhasil dikirim!");
        fetchData();
      } else {
        const j = await res.json();
        addToast("error", j.error || "Gagal kirim email");
      }
    } catch {
      addToast("error", "Gagal kirim email");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Reward & Pemenang</h1>
          <p className="page-subtitle">Histori seluruh pemenang spin undian</p>
        </div>
        <div
          style={{
            background: "rgba(245,87,108,0.1)",
            border: "1px solid rgba(245,87,108,0.2)",
            borderRadius: 10,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 700,
            color: "#f5576c",
          }}
        >
          🏆 {data.length} Pemenang
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary-light)" }}>
            {data.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Total Spin
          </div>
        </div>
        <div className="card" style={{ padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399" }}>
            {data.filter((r) => r.statusEmail === "Terkirim").length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Email Terkirim
          </div>
        </div>
        <div className="card" style={{ padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>
            {data.filter((r) => r.statusEmail === "Belum").length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Belum Dikirim
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: "none" }}>
          {loading ? (
            <div className="empty-state"><p>Memuat...</p></div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎰</div>
              <h3>Belum ada pemenang</h3>
              <p>Lakukan spin dari menu Hasil Responden setelah cukup responden mengisi</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>No. Urut</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Divisi</th>
                  <th>Tanggal Spin</th>
                  <th>Status Email</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                    <td>
                      <span
                        style={{
                          background: "linear-gradient(135deg, #f093fb, #f5576c)",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        #{String(r.responden.nomorUrut).padStart(3, "0")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {r.responden.nama}
                    </td>
                    <td>{r.responden.email}</td>
                    <td>
                      <span
                        style={{
                          background: "rgba(99,102,241,0.1)",
                          color: "var(--primary-light)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {r.responden.divisi}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(r.tanggalSpin).toLocaleString("id-ID")}
                    </td>
                    <td>
                      {r.statusEmail === "Terkirim" ? (
                        <span className="badge badge-sudah">Terkirim</span>
                      ) : (
                        <span className="badge badge-belum">Belum</span>
                      )}
                    </td>
                    <td>
                      {r.statusEmail !== "Terkirim" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSendEmail(r.id)}
                          disabled={sendingId === r.id}
                        >
                          {sendingId === r.id ? "⟳ Mengirim..." : "✉️ Kirim Email"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "✅" : "❌"} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
