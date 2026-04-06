"use client";

import SidebarKasir from "../../components/sidebar-kasir";
import { FaUsers, FaShoppingCart, FaMoneyBillWave, FaClipboardList } from "react-icons/fa";

export default function KasirDashboard() {
    const stats = [
        { label: "Transaksi Hari Ini", value: "24", icon: FaShoppingCart, color: "#14b8a6", bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" },
        { label: "Pelanggan Baru", value: "8", icon: FaUsers, color: "#f97316", bg: "linear-gradient(135deg, #fff7ed, #ffedd5)" },
        { label: "Pendapatan Hari Ini", value: "Rp 1.250.000", icon: FaMoneyBillWave, color: "#22c55e", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
        { label: "Menunggu Orderan", value: "5", icon: FaClipboardList, color: "#3b82f6", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
    ];

    const recentTransactions = [
        { id: 1, customer: "Rina Melati", service: "Cuci Kering", weight: "3 kg", price: "Rp 45.000", status: "Proses" },
        { id: 2, customer: "Budi Santoso", service: "Cuci Setrika", weight: "5 kg", price: "Rp 75.000", status: "Selesai" },
        { id: 3, customer: "Citra Dewi", service: "Express", weight: "2 kg", price: "Rp 60.000", status: "Ambil" },
        { id: 4, customer: "Ahmad Rizki", service: "Reguler", weight: "4 kg", price: "Rp 40.000", status: "Proses" },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Proses": return { bg: "#fef3c7", text: "#d97706" };
            case "Selesai": return { bg: "#dcfce7", text: "#16a34a" };
            case "Ambil": return { bg: "#dbeafe", text: "#2563eb" };
            default: return { bg: "#f3f4f6", text: "#6b7280" };
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
            <SidebarKasir />
            <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #22c55e, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}>
                            <FaClipboardList />
                        </div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Beranda Kasir</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Selamat datang! Berikut ringkasan aktivitas hari ini.</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                        {stats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} style={{ background: stat.bg, borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.1}s both`, cursor: "default" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <div style={{ width: "52px", height: "52px", borderRadius: "16px", backgroundColor: stat.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 20px -5px ${stat.color}40` }}>
                                        <span style={{ color: "white", fontSize: "22px", display: "flex" }}><Icon /></span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: "500" }}>{stat.label}</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{stat.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ marginBottom: "32px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>⚡ Aksi Cepat</h2>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <button style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                                <FaShoppingCart /> Transaksi Baru
                            </button>
                            <button style={{ padding: "14px 28px", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(249, 115, 22, 0.4)", transition: "all 0.3s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(249, 115, 22, 0.5)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(249, 115, 22, 0.4)"; }}>
                                <FaUsers /> Daftar Pelanggan Baru
                            </button>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>📋 Transaksi Terbaru</h2>
                        <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>No</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pelanggan</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Layanan</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Berat</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Harga</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((tx, idx) => (
                                        <tr key={tx.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.05}s both` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                            <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                            <td style={{ padding: "16px 20px", color: "#0f172a", fontWeight: "600" }}>{tx.customer}</td>
                                            <td style={{ padding: "16px 20px", color: "#475569" }}>{tx.service}</td>
                                            <td style={{ padding: "16px 20px", color: "#475569" }}>{tx.weight}</td>
                                            <td style={{ padding: "16px 20px", color: "#14b8a6", fontWeight: "600" }}>{tx.price}</td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: getStatusColor(tx.status).bg, color: getStatusColor(tx.status).text }}>{tx.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                    <div>Beranda Kasir</div>
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
