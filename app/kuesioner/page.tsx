"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Kuesioner = {
  id: string;
  judul: string;
  deskripsi: string | null;
  isPublished: boolean;
  isLocked: boolean;
  createdAt: string;
  _count: { pertanyaan: number };
};

type Toast = { id: number; type: "success" | "error"; message: string };

export default function KuesionerPage() {
  const [data, setData] = useState<Kuesioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ judul: "", deskripsi: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/kuesioner");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/kuesioner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        addToast("success", "Kuesioner berhasil dibuat");
        setShowModal(false);
        setForm({ judul: "", deskripsi: "" });
        fetchData();
      } else {
        const j = await res.json();
        addToast("error", j.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (k: Kuesioner) => {
    const res = await fetch(`/api/kuesioner/${k.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !k.isPublished }),
    });
    if (res.ok) {
      addToast("success", k.isPublished ? "Kuesioner di-unpublish" : "Kuesioner dipublish");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kuesioner ini?")) return;
    const res = await fetch(`/api/kuesioner/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (res.ok) {
      addToast("success", "Kuesioner dihapus");
      fetchData();
    } else {
      addToast("error", j.error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Kuesioner</h1>
          <p className="page-subtitle">Buat dan kelola pertanyaan survey</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Buat Kuesioner
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div style={{ fontSize: 32 }}>⟳</div><p>Memuat...</p></div>
      ) : data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>Belum ada kuesioner</h3>
            <p>Buat kuesioner pertama untuk survey Anda</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              + Buat Kuesioner
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((k) => (
            <div key={k.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{k.judul}</h3>
                  {k.isPublished && (
                    <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                      ● Live
                    </span>
                  )}
                  {k.isLocked && (
                    <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      🔒 Terkunci
                    </span>
                  )}
                </div>
                {k.deskripsi && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{k.deskripsi}</p>
                )}
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {k._count.pertanyaan} pertanyaan · Dibuat{" "}
                  {new Date(k.createdAt).toLocaleDateString("id-ID")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`/kuesioner/${k.id}`} className="btn btn-secondary btn-sm">
                  ✏️ Edit Pertanyaan
                </Link>
                <button
                  className={`btn btn-sm ${k.isPublished ? "btn-danger" : "btn-success"}`}
                  onClick={() => togglePublish(k)}
                  disabled={k._count.pertanyaan === 0}
                  title={k._count.pertanyaan === 0 ? "Tambah pertanyaan dulu" : ""}
                >
                  {k.isPublished ? "🔴 Unpublish" : "🟢 Publish"}
                </button>
                {!k.isLocked && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(k.id)}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📝 Buat Kuesioner Baru</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Judul *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Judul kuesioner..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat (opsional)..."
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: "center" }}>
                  {submitting ? "⟳ Menyimpan..." : "Buat Kuesioner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
