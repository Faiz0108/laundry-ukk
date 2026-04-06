"use client";

import { useState } from "react";
import SidebarKasir from "../../../components/sidebar-kasir";
import { FaFileDownload, FaCalendarAlt, FaMoneyBillWave, FaShoppingCart, FaUsers, FaChartLine } from "react-icons/fa";

export default function KasirReportsPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const stats = [
        { label: "Total Transaksi", value: "156", icon: FaShoppingCart, color: "#14b8a6", bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" },
        { label: "Total Pendapatan", value: "Rp 4.850.000", icon: FaMoneyBillWave, color: "#22c55e", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
        { label: "Pelanggan Dilayani", value: "89", icon: FaUsers, color: "#f97316", bg: "linear-gradient(135deg, #fff7ed, #ffedd5)" },
        { label: "Rata-rata/Hari", value: "Rp 692.857", icon: FaChartLine, color: "#3b82f6", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
    ];

    const dailyData = [
        { date: "27/01/2026", transactions: 24, revenue: "Rp 820.000", customers: 18 },
        { date: "26/01/2026", transactions: 28, revenue: "Rp 950.000", customers: 22 },
        { date: "25/01/2026", transactions: 19, revenue: "Rp 580.000", customers: 15 },
        { date: "24/01/2026", transactions: 32, revenue: "Rp 1.120.000", customers: 25 },
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
            <SidebarKasir />
            <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #22c55e, #14b8a6, #22c55e)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #22c55e, #16a34a)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(34, 197, 94, 0.3)" }}><FaChartLine /></div>
                            <div>
                                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Generate Laporan</h1>
                                <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Lihat dan unduh laporan transaksi</p>
                            </div>
                        </div>
                        <button style={{ padding: "14px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.3)", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(239, 68, 68, 0.4)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(239, 68, 68, 0.3)"; }}>
                            <FaFileDownload /> Unduh Laporan
                        </button>
                    </div>

                    {/* Date Filter */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", padding: "20px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dari Tanggal</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", backgroundColor: "#f8fafc", outline: "none", transition: "all 0.2s ease" }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sampai Tanggal</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", backgroundColor: "#f8fafc", outline: "none", transition: "all 0.2s ease" }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        <button style={{ padding: "12px 28px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer", boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>Tampilkan</button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                        {stats.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} style={{ background: s.bg, borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s ease", animation: `slideInUp 0.3s ease ${i * 0.1}s both` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <div style={{ width: "52px", height: "52px", borderRadius: "16px", backgroundColor: s.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 20px -5px ${s.color}40` }}>
                                        <span style={{ color: "white", fontSize: "22px", display: "flex" }}><Icon /></span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: "500" }}>{s.label}</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{s.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Daily Report Table */}
                    <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease 0.4s both" }}>
                        <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>📊 Laporan Per Hari</h2>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tanggal</th>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transaksi</th>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendapatan</th>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pelanggan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map((d, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${i * 0.05}s both` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                        <td style={{ padding: "14px 20px", color: "#0f172a", fontWeight: "500" }}><span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#14b8a6", fontSize: "12px", display: "flex" }}><FaCalendarAlt /></span>{d.date}</span></td>
                                        <td style={{ padding: "14px 20px", color: "#475569" }}>{d.transactions}</td>
                                        <td style={{ padding: "14px 20px", color: "#22c55e", fontWeight: "600" }}>{d.revenue}</td>
                                        <td style={{ padding: "14px 20px", color: "#475569" }}>{d.customers}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                    <div>Generate Laporan</div>
                    <div suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</div>
                </div>
            </main>

            <style jsx>{`
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
