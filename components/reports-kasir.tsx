"use client";

import { useState, useEffect } from "react";
import { FaMoneyBillWave, FaShoppingCart, FaChartLine, FaFilePdf } from "react-icons/fa";
import { supabase } from "../lib/supabase";

export default function ReportsKasir() {
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalTx, setTotalTx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

    const months = [
        { value: "01", label: "Januari" }, { value: "02", label: "Februari" }, { value: "03", label: "Maret" },
        { value: "04", label: "April" }, { value: "05", label: "Mei" }, { value: "06", label: "Juni" },
        { value: "07", label: "Juli" }, { value: "08", label: "Agustus" }, { value: "09", label: "September" },
        { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" }
    ];
    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth) - 1;
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        const { count: allCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).gte("tgl", startDate).lte("tgl", endDate);
        setTotalTx(allCount || 0);

        const { data: allTx } = await supabase.from("tb_transaksi").select("id, kode_invoice, tgl, status, dibayar, biaya_tambahan, diskon, pajak, tb_member(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))").gte("tgl", startDate).lte("tgl", endDate);
        let revTotal = 0;
        allTx?.forEach(tx => {
            let txTotal = 0;
            tx.tb_detail_transaksi?.forEach((d: any) => { txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0); });
            txTotal += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
            (tx as any)._total = txTotal;
            if (tx.dibayar === "dibayar") {
                revTotal += txTotal;
            }
        });
        setTotalRevenue(revTotal);
        setTransactions(allTx || []);
        setLoading(false);
    };

    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);

    const exportPDF = async () => {
        let html2pdfModule;
        try {
            html2pdfModule = (await import('html2pdf.js')).default;
        } catch {
            alert('Gagal mendownload pustaka PDF');
            return;
        }
        const now = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const monthName = months.find(m => m.value === selectedMonth)?.label;
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Kasir</title>
        <style>
            body{font-family:Arial,sans-serif;padding:40px;color:#333}
            h1{font-size:22px;margin-bottom:4px}
            .subtitle{font-size:13px;color:#666;margin-bottom:24px}
            .stats{display:flex;gap:16px;margin-bottom:24px}
            .stat-card{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
            .stat-value{font-size:20px;font-weight:700;margin:0}
            .stat-label{font-size:12px;color:#666;margin:4px 0 0 0}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
            th{background:#f3f4f6;padding:10px 8px;text-align:left;border-bottom:2px solid #e5e7eb;font-weight:600}
            td{padding:8px;border-bottom:1px solid #e5e7eb}
            .text-right{text-align:right}
        </style></head><body>
        <h1>📊 Laporan Kasir - Periode ${monthName} ${selectedYear}</h1>
        <p class="subtitle">Tanggal cetak: ${now}</p>
        
        <div class="stats">
            <div class="stat-card"><p class="stat-value">${totalTx}</p><p class="stat-label">Total Transaksi</p></div>
            <div class="stat-card"><p class="stat-value">${formatCurrency(totalRevenue)}</p><p class="stat-label">Total Pendapatan</p></div>
        </div>

        <h3 style="font-size:14px;margin-bottom:4px">Detail Transaksi</h3>
        <table>
            <thead><tr><th>No</th><th>Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Status</th><th>Bayar</th><th class="text-right">Total</th></tr></thead>
            <tbody>${transactions.map((tx, i) => `<tr>
                <td>${i + 1}</td>
                <td>${tx.kode_invoice || "-"}</td>
                <td>${tx.tgl ? new Date(tx.tgl).toLocaleDateString("id-ID") : "-"}</td>
                <td>${(tx.tb_member as any)?.nama || "-"}</td>
                <td>${tx.status || "-"}</td>
                <td>${tx.dibayar || "-"}</td>
                <td class="text-right">${formatCurrency(tx._total || 0)}</td>
            </tr>`).join("")}</tbody>
        </table>
        </body></html>`;

        const element = document.createElement('div');
        element.innerHTML = html;
        const opt = {
            margin: 0.5,
            filename: `Laporan_Kasir_${monthName}_${selectedYear}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };
        html2pdfModule().from(element).set(opt).save();
    };

    return (
        <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #22c55e, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaChartLine /></div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Laporan Kasir</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Ringkasan aktivitas kasir</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "white", outline: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "white", outline: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {!loading && (
                            <button onClick={exportPDF} style={{ padding: "14px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.3)", transition: "all 0.3s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(239, 68, 68, 0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(239, 68, 68, 0.3)"; }}>
                                <FaFilePdf /> Ekspor PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#14b8a6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                        <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat laporan...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                            {[
                            { label: "Total Transaksi", value: String(totalTx), icon: FaChartLine, color: "#3b82f6", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
                            { label: "Total Pendapatan", value: formatCurrency(totalRevenue), icon: FaMoneyBillWave, color: "#22c55e", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} style={{ background: s.bg, borderRadius: "20px", padding: "28px", display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s ease", animation: `slideInUp 0.3s ease ${i * 0.1}s both` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: s.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 20px -5px ${s.color}40` }}>
                                        <span style={{ color: "white", fontSize: "24px", display: "flex" }}><Icon /></span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: "500" }}>{s.label}</p>
                                        <p style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{s.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease 0.4s both", marginTop: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>Daftar Transaksi</h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>No</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Invoice</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Tanggal</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Pelanggan</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Status</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Pembayaran</th>
                                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, i) => (
                                        <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px 16px" }}>{i + 1}</td>
                                            <td style={{ padding: "12px 16px", fontWeight: "500", color: "#0f172a" }}>{tx.kode_invoice || "-"}</td>
                                            <td style={{ padding: "12px 16px" }}>{tx.tgl ? new Date(tx.tgl).toLocaleDateString("id-ID") : "-"}</td>
                                            <td style={{ padding: "12px 16px" }}>{(tx.tb_member as any)?.nama || "-"}</td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", backgroundColor: tx.status === "selesai" || tx.status === "diambil" ? "#dcfce7" : "#fef3c7", color: tx.status === "selesai" || tx.status === "diambil" ? "#16a34a" : "#d97706" }}>
                                                    {tx.status || "-"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", backgroundColor: tx.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: tx.dibayar === "dibayar" ? "#16a34a" : "#dc2626" }}>
                                                    {tx.dibayar || "-"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>
                                                {formatCurrency(tx._total || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Tidak ada transaksi pada periode ini</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <div>Laporan Kasir</div>
                <div suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</div>
            </div>

            <style jsx>{`
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
