"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Pertanyaan = {
  id: string;
  teks: string;
  tipe: string;
  required: boolean;
  urutan: number;
  options: unknown;
};

type Kuesioner = {
  id: string;
  judul: string;
  deskripsi: string | null;
  isLocked: boolean;
  pertanyaan: Pertanyaan[];
};

const TIPE_LIST = [
  { value: "skala", label: "📊 Skala / Linear Scale", desc: "Contoh: 1–4 Sangat Tidak Puas hingga Sangat Puas" },
  { value: "pilihan_ganda", label: "🔘 Pilihan Ganda (Single)", desc: "Satu pilihan dari beberapa opsi" },
  { value: "checkbox", label: "☑️ Checkbox (Multiple)", desc: "Bisa pilih lebih dari satu opsi" },
  { value: "long_text", label: "📄 Essay / Long Text", desc: "Jawaban panjang" },
  { value: "short_text", label: "📝 Short Text", desc: "Jawaban singkat" },
];

const TYPE_LABELS: Record<string, string> = {
  skala: "📊 Skala",
  pilihan_ganda: "🔘 Pilihan Ganda",
  checkbox: "☑️ Checkbox",
  long_text: "📄 Essay",
  short_text: "📝 Short Text",
};

export default function KuesionerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [kuesioner, setKuesioner] = useState<Kuesioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [newQ, setNewQ] = useState({
    teks: "",
    tipe: "skala",
    required: true,
    skalaMin: 1,
    skalaMax: 4,
    skalaLabelKiri: "Sangat Tidak Puas",
    skalaLabelKanan: "Sangat Puas",
    pilihanOptions: ["", ""],
  });

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/kuesioner/${id}`);
    if (res.ok) {
      setKuesioner(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildOptions = () => {
    if (newQ.tipe === "skala") {
      return {
        min: newQ.skalaMin,
        max: newQ.skalaMax,
        labelKiri: newQ.skalaLabelKiri,
        labelKanan: newQ.skalaLabelKanan,
      };
    }
    if (newQ.tipe === "pilihan_ganda" || newQ.tipe === "checkbox") {
      return newQ.pilihanOptions.filter((o) => o.trim());
    }
    return null;
  };

  const handleAddQuestion = async () => {
    if (!newQ.teks.trim()) { showToast("error", "Teks pertanyaan tidak boleh kosong"); return; }
    const res = await fetch(`/api/kuesioner/${id}/pertanyaan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teks: newQ.teks, tipe: newQ.tipe, required: newQ.required, options: buildOptions() }),
    });
    if (res.ok) {
      showToast("success", "Pertanyaan berhasil ditambahkan");
      setShowAddModal(false);
      setNewQ({ teks: "", tipe: "skala", required: true, skalaMin: 1, skalaMax: 4, skalaLabelKiri: "Sangat Tidak Puas", skalaLabelKanan: "Sangat Puas", pilihanOptions: ["", ""] });
      fetchData();
    } else {
      const j = await res.json();
      showToast("error", j.error);
    }
  };

  const handleDelete = async (pertanyaanId: string) => {
    if (!confirm("Hapus pertanyaan ini?")) return;
    await fetch(`/api/kuesioner/${id}/pertanyaan/${pertanyaanId}`, { method: "DELETE" });
    showToast("success", "Pertanyaan dihapus");
    fetchData();
  };

  const getOptionsDisplay = (p: Pertanyaan) => {
    if (!p.options) return null;
    if (p.tipe === "skala") {
      const o = p.options as { min: number; max: number; labelKiri: string; labelKanan: string };
      return (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          Skala {o.min}–{o.max} · "{o.labelKiri}" → "{o.labelKanan}"
        </div>
      );
    }
    if (Array.isArray(p.options)) {
      return (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          Opsi: {(p.options as string[]).join(" · ")}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="empty-state"><div style={{ fontSize: 32 }}>⟳</div><p>Memuat...</p></div>;
  if (!kuesioner) return <div className="empty-state"><h3>Kuesioner tidak ditemukan</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            onClick={() => router.push("/kuesioner")}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, marginBottom: 8, padding: 0 }}
          >
            ← Kembali ke Kuesioner
          </button>
          <h1 className="page-title">✏️ {kuesioner.judul}</h1>
          {kuesioner.deskripsi && (
            <p className="page-subtitle">{kuesioner.deskripsi}</p>
          )}
          {kuesioner.isLocked && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ef4444" }}>
              🔒 Kuesioner terkunci — sudah ada yang mengisi, pertanyaan tidak bisa diubah
            </div>
          )}
        </div>
        {!kuesioner.isLocked && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Tambah Pertanyaan
          </button>
        )}
      </div>

      {/* Questions */}
      {kuesioner.pertanyaan.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <h3>Belum ada pertanyaan</h3>
            <p>Tambah pertanyaan untuk memulai</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAddModal(true)}>
              + Tambah Pertanyaan
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {kuesioner.pertanyaan.map((p, i) => (
            <div key={p.id} className="question-builder-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 13 }}>
                      {i + 1}.
                    </span>
                    <span className="question-type-badge">{TYPE_LABELS[p.tipe] || p.tipe}</span>
                    {p.required && (
                      <span style={{ color: "#ef4444", fontSize: 12 }}>* Wajib</span>
                    )}
                  </div>
                  <div className="question-text">{p.teks}</div>
                  {getOptionsDisplay(p)}
                </div>
                {!kuesioner.isLocked && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                    style={{ marginLeft: 12, flexShrink: 0 }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">➕ Tambah Pertanyaan</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Tipe Pertanyaan</label>
                <select
                  className="form-select"
                  value={newQ.tipe}
                  onChange={(e) => setNewQ({ ...newQ, tipe: e.target.value })}
                >
                  {TIPE_LIST.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  {TIPE_LIST.find((t) => t.value === newQ.tipe)?.desc}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Teks Pertanyaan *</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={newQ.teks}
                  onChange={(e) => setNewQ({ ...newQ, teks: e.target.value })}
                  placeholder="Tulis pertanyaan di sini..."
                />
              </div>

              {newQ.tipe === "skala" && (
                <>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Min</label>
                      <input type="number" className="form-input" value={newQ.skalaMin}
                        onChange={(e) => setNewQ({ ...newQ, skalaMin: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max</label>
                      <input type="number" className="form-input" value={newQ.skalaMax}
                        onChange={(e) => setNewQ({ ...newQ, skalaMax: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Label Kiri</label>
                      <input type="text" className="form-input" value={newQ.skalaLabelKiri}
                        onChange={(e) => setNewQ({ ...newQ, skalaLabelKiri: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Label Kanan</label>
                      <input type="text" className="form-input" value={newQ.skalaLabelKanan}
                        onChange={(e) => setNewQ({ ...newQ, skalaLabelKanan: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {(newQ.tipe === "pilihan_ganda" || newQ.tipe === "checkbox") && (
                <div className="form-group">
                  <label className="form-label">Pilihan Jawaban</label>
                  {newQ.pilihanOptions.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={opt}
                        onChange={(e) => {
                          const arr = [...newQ.pilihanOptions];
                          arr[i] = e.target.value;
                          setNewQ({ ...newQ, pilihanOptions: arr });
                        }}
                        placeholder={`Opsi ${i + 1}...`}
                      />
                      {newQ.pilihanOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setNewQ({ ...newQ, pilihanOptions: newQ.pilihanOptions.filter((_, j) => j !== i) })}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setNewQ({ ...newQ, pilihanOptions: [...newQ.pilihanOptions, ""] })}
                  >
                    + Tambah Opsi
                  </button>
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newQ.required}
                  onChange={(e) => setNewQ({ ...newQ, required: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Wajib diisi</span>
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1, justifyContent: "center" }}>Batal</button>
                <button type="button" className="btn btn-primary" onClick={handleAddQuestion} style={{ flex: 1, justifyContent: "center" }}>
                  Tambah Pertanyaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type === "success" ? "success" : "error"}`}>
            {toast.type === "success" ? "✅" : "❌"} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
