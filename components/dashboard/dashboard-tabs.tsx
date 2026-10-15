"use client";
export function DashboardTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (value: string) => void }) {
  return <nav className="main-tabs">{[["overview", "ภาพรวม"], ["transactions", "รายการใช้จ่าย"], ["installments", "รายการผ่อน"], ["cards", "ตั้งค่าบัตร"]].map(([key, label]) => <button key={key} className={activeTab === key ? "selected" : ""} onClick={() => setActiveTab(key)}>{label}</button>)}</nav>;
}
