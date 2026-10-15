"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [remember, setRemember] = useState(false); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/v1/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, ...(mode === "register" ? { name } : {}) }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message ?? "ไม่สามารถเข้าสู่ระบบได้");
      const storage = remember ? localStorage : sessionStorage; storage.setItem("access_token", data.access_token); storage.setItem("user", JSON.stringify(data.user)); window.location.href = "/";
    } catch (err) { setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด"); } finally { setLoading(false); }
  }
  return <main className="login-page"><section className="login-shell"><div className="brand-mark">฿</div><p className="eyebrow">CARD BOOK</p><h1>สมุดบัตรเครดิต</h1><p className="lede">จดรายการใช้จ่ายและรายการผ่อน แยกรายบัตร</p><div className="auth-tabs">{(["login", "register"] as const).map((item) => <button key={item} type="button" aria-selected={mode === item} onClick={() => { setMode(item); setMessage(""); }}>{item === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button>)}</div><form onSubmit={submit} className="login-form">{mode === "register" && <label>ชื่อที่แสดง<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required /></label>}<label>อีเมล<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>รหัสผ่าน<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "register" ? 8 : undefined} required /></label>{mode === "register" && <p className="hint">รหัสผ่านอย่างน้อย 8 ตัวอักษร</p>}{mode === "login" && <label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> จำการเข้าสู่ระบบในเครื่องนี้</label>}<button className="primary-button" disabled={loading}>{loading ? "กำลังตรวจสอบ…" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</button><p className="form-message">{message}</p></form></section></main>;
}
