"use client";

import { useState, useEffect } from "react";
import { FaMoneyBillWave, FaStore, FaUsers, FaChartLine, FaFilePdf, FaPrint } from "react-icons/fa";
import { supabase } from "../lib/supabase";

export default function ReportsOwner() {
    const [totalOutlets, setTotalOutlets] = useState(0);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalTx, setTotalTx] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [unpaid, setUnpaid] = useState(0);
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

        const { count: oCount } = await supabase.from("tb_outlet").select("*", { count: "exact", head: true });
        setTotalOutlets(oCount || 0);

        const { count: mCount } = await supabase.from("tb_member").select("*", { count: "exact", head: true }).gte("created_at", startDate).lte("created_at", endDate);
        setTotalMembers(mCount || 0);

        const { count: tCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).gte("tgl", startDate).lte("tgl", endDate);
        setTotalTx(tCount || 0);

        const { count: uCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).neq("dibayar", "dibayar").gte("tgl", startDate).lte("tgl", endDate);
        setUnpaid(uCount || 0);

        const { data: allTx } = await supabase.from("tb_transaksi").select("id, kode_invoice, tgl, status, dibayar, tb_member(nama), tb_outlet(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))").gte("tgl", startDate).lte("tgl", endDate);
        let rev = 0;
        allTx?.forEach(tx => {
            let txTotal = 0;
            tx.tb_detail_transaksi?.forEach((d: any) => { txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0); });
            if (tx.dibayar === "dibayar") rev += txTotal;
            (tx as any)._total = txTotal;
        });
        setTotalRevenue(rev);
        setTransactions(allTx || []);
        setLoading(false);
    };

    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);

    const getHTMLString = () => {
        const now = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const monthName = months.find(m => m.value === selectedMonth)?.label;
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Owner</title>
        <style>
            body{font-family:Arial,sans-serif;padding:40px;color:#333}
            h1{font-size:22px;margin-bottom:4px}
            .subtitle{font-size:13px;color:#666;margin-bottom:24px}
            .stats{display:flex;gap:16px;margin-bottom:24px}
            .stat-card{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
            .stat-value{font-size:18px;font-weight:700;margin:0}
            .stat-label{font-size:12px;color:#666;margin:4px 0 0 0}
            .revenue-box{border:2px solid #22c55e;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;background:#f0fdf4}
            .rev-value{font-size:28px;font-weight:700;color:#16a34a;margin:0}
            .rev-label{font-size:13px;color:#16a34a;margin:4px 0 0 0}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
            th{background:#f3f4f6;padding:10px 8px;text-align:left;border-bottom:2px solid #e5e7eb;font-weight:600}
            td{padding:8px;border-bottom:1px solid #e5e7eb}
            .text-right{text-align:right}
        </style></head><body>
        <h1>📊 Laporan Owner - Periode ${monthName} ${selectedYear}</h1>
        <p class="subtitle">Tanggal cetak: ${now}</p>
        
        <div class="stats">
            <div class="stat-card"><p class="stat-value">${totalOutlets}</p><p class="stat-label">Total Toko</p></div>
            <div class="stat-card"><p class="stat-value">${totalMembers}</p><p class="stat-label">Total Pelanggan</p></div>
            <div class="stat-card"><p class="stat-value">${totalTx}</p><p class="stat-label">Total Transaksi</p></div>
            <div class="stat-card"><p class="stat-value" style="color:#dc2626">${unpaid}</p><p class="stat-label">Belum Bayar</p></div>
        </div>

        <div class="revenue-box">
            <p class="rev-label">Total Pendapatan (Lunas)</p>
            <p class="rev-value">${formatCurrency(totalRevenue)}</p>
        </div>

        <h3 style="font-size:14px;margin-bottom:4px">Detail Transaksi</h3>
        <table>
            <thead><tr><th>No</th><th>Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Toko</th><th>Status</th><th>Bayar</th><th class="text-right">Total</th></tr></thead>
            <tbody>${transactions.map((tx, i) => `<tr>
                <td>${i + 1}</td>
                <td>${tx.kode_invoice || "-"}</td>
                <td>${tx.tgl ? new Date(tx.tgl).toLocaleDateString("id-ID") : "-"}</td>
                <td>${(tx.tb_member as any)?.nama || "-"}</td>
                <td>${(tx.tb_outlet as any)?.nama || "-"}</td>
                <td>${tx.status || "-"}</td>
                <td>${tx.dibayar || "-"}</td>
                <td class="text-right">${formatCurrency(tx._total || 0)}</td>
            </tr>`).join("")}</tbody>
        </table>
        </body></html>`;
    };

    const printDoc = () => {
        const w = window.open("", "_blank");
        if (w) { w.document.write(getHTMLString()); w.document.close(); w.print(); }
    };

    const exportPDF = async () => {
        let html2pdfModule;
        try {
            html2pdfModule = (await import('html2pdf.js')).default;
        } catch {
            alert('Gagal mendownload pustaka PDF');
            return;
        }
        const monthName = months.find(m => m.value === selectedMonth)?.label;
        const element = document.createElement('div');
        element.innerHTML = getHTMLString();
        const opt = {
            margin: 0.5,
            filename: `Laporan_Owner_${monthName}_${selectedYear}.pdf`,
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
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #f97316, #14b8a6, #f97316)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(249, 115, 22, 0.3)" }}><FaChartLine /></div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Laporan Owner</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Ringkasan bisnis keseluruhan</p>
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
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={printDoc} style={{ padding: "14px 24px", background: "white", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                    <FaPrint color="#94a3b8" /> Cetak
                                </button>
                                <button onClick={exportPDF} style={{ padding: "14px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.3)", transition: "all 0.3s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(239, 68, 68, 0.4)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(239, 68, 68, 0.3)"; }}>
                                    <FaFilePdf /> Ekspor PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                        <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat laporan...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                            {[
                                { label: "Total Toko", value: String(totalOutlets), icon: FaStore, color: "#14b8a6", bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" },
                                { label: "Pelanggan Baru", value: String(totalMembers), icon: FaUsers, color: "#f97316", bg: "linear-gradient(135deg, #fff7ed, #ffedd5)" },
                                { label: "Total Transaksi", value: String(totalTx), icon: FaChartLine, color: "#3b82f6", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
                                { label: "Belum Bayar", value: String(unpaid), icon: FaMoneyBillWave, color: "#dc2626", bg: "linear-gradient(135deg, #fef2f2, #fee2e2)" },
                            ].map((s, i) => {
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

                        <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "24px", padding: "32px", marginBottom: "24px", animation: "fadeIn 0.5s ease 0.4s both" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(34, 197, 94, 0.4)" }}>
                                    <span style={{ color: "white", fontSize: "28px", display: "flex" }}><FaMoneyBillWave /></span>
                                </div>
                                <div>
                                    <p style={{ fontSize: "15px", color: "#16a34a", margin: 0, fontWeight: "500" }}>Total Pendapatan (Lunas)</p>
                                    <p style={{ fontSize: "36px", fontWeight: "700", color: "#16a34a", margin: 0 }}>{formatCurrency(totalRevenue)}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease 0.5s both" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>Daftar Transaksi</h3>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                            <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>No</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Invoice</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Tanggal</th>
                                            <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Toko</th>
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
                                                <td style={{ padding: "12px 16px" }}>{(tx.tb_outlet as any)?.nama || "-"}</td>
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
                                                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Tidak ada transaksi pada periode ini</td>
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
                <div>Laporan Owner</div>
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
