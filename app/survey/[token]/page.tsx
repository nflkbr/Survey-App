"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

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
  pertanyaan: Pertanyaan[];
};

type Jawaban = {
  pertanyaanId: string;
  nilaiTeks?: string;
  nilaiJson?: unknown;
};

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [kuesioner, setKuesioner] = useState<Kuesioner | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nomorUrut, setNomorUrut] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/survey/${token}`);
      const json = await res.json();

      if (json.alreadySubmitted) {
        setAlreadySubmitted(true);
      } else if (json.error) {
        setErrorMsg(json.error);
      } else {
        setKuesioner(json.kuesioner);
      }
    } catch {
      setErrorMsg("Gagal memuat survey");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSurvey(); }, [fetchSurvey]);

  const setAnswer = (pertanyaanId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [pertanyaanId]: value }));
    // Clear validation error
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[pertanyaanId];
      return next;
    });
  };

  const toggleCheckbox = (pertanyaanId: string, option: string) => {
    const current = (answers[pertanyaanId] as string[]) || [];
    if (current.includes(option)) {
      setAnswer(pertanyaanId, current.filter((o) => o !== option));
    } else {
      setAnswer(pertanyaanId, [...current, option]);
    }
  };

  const validate = (): boolean => {
    if (!kuesioner) return false;
    const errors: Record<string, string> = {};

    for (const p of kuesioner.pertanyaan) {
      if (p.required) {
        const val = answers[p.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === "string" && !val.trim())) {
          errors[p.id] = "Pertanyaan ini wajib dijawab";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !kuesioner) return;
    setSubmitting(true);

    try {
      const jawaban: Jawaban[] = kuesioner.pertanyaan.map((p) => {
        const val = answers[p.id];
        if (p.tipe === "checkbox") {
          return { pertanyaanId: p.id, nilaiJson: val || [] };
        }
        return { pertanyaanId: p.id, nilaiTeks: (val as string) || "" };
      });

      const res = await fetch(`/api/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuesionerId: kuesioner.id, jawaban }),
      });

      const json = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setNomorUrut(json.nomorUrut);
      } else {
        setErrorMsg(json.error || "Gagal mengirim jawaban");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (p: Pertanyaan, index: number) => {
    const hasError = !!validationErrors[p.id];

    return (
      <div
        key={p.id}
        className="question-card"
        style={hasError ? { borderColor: "rgba(239,68,68,0.5)" } : {}}
      >
        <div className="question-text">
          {index + 1}. {p.teks}
          {p.required && <span className="question-required">*</span>}
        </div>

        {/* Skala */}
        {p.tipe === "skala" && (() => {
          const opts = p.options as { min: number; max: number; labelKiri: string; labelKanan: string };
          const items = [];
          for (let i = opts.min; i <= opts.max; i++) items.push(i);
          return (
            <div>
              <div className="scale-container">
                {items.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`scale-btn ${answers[p.id] === String(val) ? "selected" : ""}`}
                    onClick={() => setAnswer(p.id, String(val))}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="scale-labels">
                <span>{opts.labelKiri}</span>
                <span>{opts.labelKanan}</span>
              </div>
            </div>
          );
        })()}

        {/* Pilihan Ganda */}
        {p.tipe === "pilihan_ganda" && Array.isArray(p.options) && (
          <div>
            {(p.options as string[]).map((opt) => (
              <div
                key={opt}
                className={`choice-option ${answers[p.id] === opt ? "selected" : ""}`}
                onClick={() => setAnswer(p.id, opt)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${answers[p.id] === opt ? "var(--primary)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {answers[p.id] === opt && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
                  )}
                </div>
                {opt}
              </div>
            ))}
          </div>
        )}

        {/* Checkbox */}
        {p.tipe === "checkbox" && Array.isArray(p.options) && (
          <div>
            {(p.options as string[]).map((opt) => {
              const checked = ((answers[p.id] as string[]) || []).includes(opt);
              return (
                <div
                  key={opt}
                  className={`choice-option ${checked ? "selected" : ""}`}
                  onClick={() => toggleCheckbox(p.id, opt)}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${checked ? "var(--primary)" : "var(--border)"}`,
                      background: checked ? "var(--primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {checked && (
                      <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  {opt}
                </div>
              );
            })}
          </div>
        )}

        {/* Short Text */}
        {p.tipe === "short_text" && (
          <input
            type="text"
            className="form-input"
            placeholder="Ketik jawaban Anda..."
            value={(answers[p.id] as string) || ""}
            onChange={(e) => setAnswer(p.id, e.target.value)}
          />
        )}

        {/* Long Text */}
        {p.tipe === "long_text" && (
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Tulis jawaban Anda..."
            value={(answers[p.id] as string) || ""}
            onChange={(e) => setAnswer(p.id, e.target.value)}
          />
        )}

        {hasError && (
          <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>
            ⚠️ {validationErrors[p.id]}
          </p>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="survey-container">
        <div className="survey-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⟳</div>
          <p style={{ color: "var(--text-secondary)" }}>Memuat survey...</p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (alreadySubmitted) {
    return (
      <div className="survey-container">
        <div className="survey-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            Anda Sudah Mengisi Survey Ini
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Terima kasih! Jawaban Anda sudah kami terima sebelumnya.
            <br />Setiap responden hanya dapat mengisi survey satu kali.
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (errorMsg && !kuesioner) {
    return (
      <div className="survey-container">
        <div className="survey-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>
            Oops!
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <div className="survey-container">
        <div className="survey-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            Terima Kasih!
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
            Survey Anda berhasil dikirim.
          </p>
          {nomorUrut && (
            <div
              style={{
                background: "var(--bg)",
                border: "2px solid var(--primary)",
                borderRadius: 16,
                padding: "20px 30px",
                display: "inline-block",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Nomor Urut Anda</p>
              <p
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, var(--primary-light), var(--secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1,
                }}
              >
                #{String(nomorUrut).padStart(3, "0")}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                Simpan nomor ini untuk undian berhadiah! 🍀
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Survey Form
  return (
    <div className="survey-container">
      <div className="survey-card">
        <div className="survey-header">
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
            }}
          >
            📋
          </div>
          <h1>{kuesioner!.judul}</h1>
          {kuesioner!.deskripsi && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
              {kuesioner!.deskripsi}
            </p>
          )}
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
            Pertanyaan bertanda <span style={{ color: "#ef4444" }}>*</span> wajib diisi
          </p>
        </div>

        <div>
          {kuesioner!.pertanyaan.map((p, i) => renderQuestion(p, i))}
        </div>

        {errorMsg && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 14,
              color: "#ef4444",
              marginTop: 16,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: 24,
            padding: "14px 20px",
            fontSize: 16,
          }}
        >
          {submitting ? (
            <><span className="spinning">⟳</span> Mengirim jawaban...</>
          ) : (
            <>📨 Kirim Jawaban</>
          )}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
          Jawaban Anda bersifat anonim. Terima kasih atas partisipasinya.
        </p>
      </div>
    </div>
  );
}
