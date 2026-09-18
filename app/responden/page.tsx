"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DIVISI_LIST = [
  "Business Analyst",
  "IT Infra",
  "IT Dev",
  "Data Visualization",
  "Data Engineering",
  "Human Resource",
  "Finance",
];

type Responden = {
  id: string;
  nama: string;
  email: string;
  noTelp: string | null;
  divisi: string;
  status: string;
  createdAt: string;
};

type Toast = { id: number; type: "success" | "error" | "info"; message: string };

export default function RespondenPage() {
  const [data, setData] = useState<Responden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", noTelp: "", divisi: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [emailTemplate, setEmailTemplate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  let toastId = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/responden");
      const json = await res.json();
      setData(json);
    } catch {
      addToast("error", "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(
    (r) =>
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.divisi.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/responden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast("error", json.error);
      } else {
        addToast("success", `Responden "${form.nama}" berhasil ditambahkan`);
        setShowModal(false);
        setForm({ nama: "", email: "", noTelp: "", divisi: "" });
        fetchData();
      }
    } catch {
      addToast("error", "Gagal menambah responden");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/responden/import", { method: "POST", body: formData });
      const json = await res.json();
      addToast(res.ok ? "success" : "error", json.message || json.error);
      if (res.ok) fetchData();
    } catch {
      addToast("error", "Gagal import Excel");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKirimEmail = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/responden/${id}/kirim-email`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        addToast("success", "Email berhasil dikirim");
        fetchData();
      } else {
        addToast("error", json.error);
      }
    } catch {
      addToast("error", "Gagal kirim email");
    } finally {
      setSendingId(null);
    }
  };

  const handleBroadcast = async () => {
    if (!confirm("Kirim email ke semua responden yang belum mengisi?")) return;
    setBroadcasting(true);
    try {
      const res = await fetch("/api/responden/broadcast", { method: "POST" });
      const json = await res.json();
      addToast(res.ok ? "success" : "error", json.message || json.error);
      if (res.ok) fetchData();
    } catch {
      addToast("error", "Gagal broadcast email");
    } finally {
      setBroadcasting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Sudah Isi") return <span className="badge badge-sudah">Sudah Isi</span>;
    if (status === "Terkirim") return <span className="badge badge-terkirim">Terkirim</span>;
    return <span className="badge badge-belum">Belum Dikirim</span>;
  };

  const counts = {
    total: data.length,
    sudahIsi: data.filter((r) => r.status === "Sudah Isi").length,
    terkirim: data.filter((r) => r.status === "Terkirim").length,
    belum: data.filter((r) => r.status === "Belum Dikirim").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Master Data Responden</h1>
          <p className="page-subtitle">
            {counts.total} terdaftar · {counts.sudahIsi} sudah isi · {counts.terkirim} terkirim
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTemplateModal(true)}>
            ✉️ Template Email
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            📥 Import Excel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleBroadcast}
            disabled={broadcasting}
          >
            {broadcasting ? "⟳ Mengirim..." : "📨 Broadcast Email"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Tambah Responden
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", value: counts.total, color: "var(--primary-light)" },
          { label: "Sudah Isi", value: counts.sudahIsi, color: "#34d399" },
          { label: "Terkirim", value: counts.terkirim, color: "#fbbf24" },
          { label: "Belum Dikirim", value: counts.belum, color: "#64748b" },
        ].map((s) => (
          <div className="card" key={s.label} style={{ padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="search-input" style={{ marginBottom: 16 }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="form-input"
          placeholder="Cari nama, email, divisi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div style={{ fontSize: 32 }}>⟳</div>
              <p>Memuat data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>Belum ada responden</h3>
              <p>Tambah responden manual atau import dari Excel</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>No. Telp</th>
                  <th>Divisi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.nama}</td>
                    <td>{r.email}</td>
                    <td>{r.noTelp || "-"}</td>
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
                        {r.divisi}
                      </span>
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>
                      {r.status !== "Sudah Isi" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleKirimEmail(r.id)}
                          disabled={sendingId === r.id}
                        >
                          {sendingId === r.id ? "⟳" : "📧"} Kirim
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

      {/* Template email info */}
      <div
        style={{
          marginTop: 16,
          background: "rgba(99,102,241,0.05)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        📌 Template Excel: kolom <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>nama</code>,{" "}
        <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>email</code>,{" "}
        <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>no_telp</code> (opsional),{" "}
        <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>divisi</code>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">➕ Tambah Responden</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nama *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">No. Telepon</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.noTelp}
                  onChange={(e) => setForm({ ...form, noTelp: e.target.value })}
                  placeholder="08xx-xxxx-xxxx (opsional)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Divisi *</label>
                <select
                  className="form-select"
                  required
                  value={form.divisi}
                  onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                >
                  <option value="">Pilih divisi...</option>
                  {DIVISI_LIST.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: "center" }}>
                  {submitting ? "⟳ Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✉️ Template Email Undangan</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Kosongkan untuk menggunakan template default. Placeholder:{" "}
              <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>{"{{nama}}"}</code> dan{" "}
              <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>{"{{link_survey}}"}</code>
            </p>
            <textarea
              className="form-textarea"
              rows={8}
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              placeholder="Masukkan template HTML email (opsional)..."
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowTemplateModal(false)} style={{ flex: 1, justifyContent: "center" }}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={async () => {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "email_undangan_template", value: emailTemplate }),
                  });
                  addToast("success", "Template disimpan");
                  setShowTemplateModal(false);
                }}
              >
                Simpan Template
              </button>
            </div>
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
