"use client";

import { useState, useEffect } from "react";
import { FaUsers, FaShoppingCart, FaMoneyBillWave, FaClipboardList } from "react-icons/fa";
import { supabase } from "../lib/supabase";

interface Transaksi {
    id: number;
    kode_invoice: string;
    status: string | null;
    tb_member?: { nama: string } | null;
    tb_detail_transaksi?: { qty: number; tb_paket?: { nama_paket: string; harga: number } | null }[];
}

export default function DashboardKasir() {
    const [todayCount, setTodayCount] = useState(0);
    const [newCustomers, setNewCustomers] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [recentTx, setRecentTx] = useState<Transaksi[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayIso = startOfDay.toISOString();

        const { count: txCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).gte("tgl", todayIso);
        setTodayCount(txCount || 0);

        const { count: custCount } = await supabase.from("tb_member").select("*", { count: "exact", head: true }).gte("created_at", todayIso);
        setNewCustomers(custCount || 0);

        const { count: pending } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).in("status", ["baru", "proses"]);
        setPendingOrders(pending || 0);

        const { data: paidTx } = await supabase.from("tb_transaksi").select("*, tb_detail_transaksi(qty, tb_paket(harga))").eq("dibayar", "dibayar");
        let revToday = 0;
        let revTotal = 0;
        paidTx?.forEach(tx => { 
            let txTotal = 0;
            tx.tb_detail_transaksi?.forEach((d: any) => { txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0); });
            txTotal += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
            
            revTotal += txTotal;
            if (tx.tgl && tx.tgl >= todayIso) {
                revToday += txTotal;
            }
        });
        setTodayRevenue(revToday);
        setTotalRevenue(revTotal);

        const { data: recent } = await supabase.from("tb_transaksi").select("*, tb_member(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))").order("tgl", { ascending: false }).limit(5);
        if (recent) setRecentTx(recent);

        setLoading(false);
    };

    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);
    const getStatusColor = (status: string | null) => {
        switch (status) { case "baru": return { bg: "#dbeafe", text: "#2563eb" }; case "proses": return { bg: "#fef3c7", text: "#d97706" }; case "selesai": return { bg: "#dcfce7", text: "#16a34a" }; case "diambil": return { bg: "#e5e7eb", text: "#6b7280" }; default: return { bg: "#f3f4f6", text: "#6b7280" }; }
    };

    const stats = [
        { label: "Transaksi Hari Ini", value: String(todayCount), icon: FaShoppingCart, color: "#14b8a6" },
        { label: "Pelanggan Baru", value: String(newCustomers), icon: FaUsers, color: "#f97316" },
        { label: "Pendapatan Hari Ini", value: formatCurrency(todayRevenue), icon: FaMoneyBillWave, color: "#22c55e" },
        { label: "Total Pendapatan", value: formatCurrency(totalRevenue), icon: FaMoneyBillWave, color: "#eab308" },
        { label: "Menunggu Orderan", value: String(pendingOrders), icon: FaClipboardList, color: "#3b82f6" },
    ];

    return (
        <main style={{ flex: 1, padding: "24px 32px", backgroundColor: "white" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>Beranda Kasir</h1>
                <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Selamat datang! Berikut ringkasan aktivitas hari ini.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px", marginBottom: "32px" }}>
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "white", fontSize: "20px", display: "flex" }}><Icon /></span>
                            </div>
                            <div>
                                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>{stat.label}</p>
                                <p style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Transaksi Terbaru</h2>
                {loading ? (
                    <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>Memuat data...</p>
                ) : (
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>No</th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Pelanggan</th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Paket</th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Harga</th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>Belum ada transaksi</td></tr>
                                ) : recentTx.map((tx, idx) => {
                                    const sc = getStatusColor(tx.status);
                                    let total = 0;
                                    const paketName = tx.tb_detail_transaksi?.[0]?.tb_paket?.nama_paket || "-";
                                    tx.tb_detail_transaksi?.forEach(d => { total += (d.qty || 0) * (d.tb_paket?.harga || 0); });
                                    return (
                                        <tr key={tx.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: idx % 2 === 0 ? "white" : "#f8fafc" }}>
                                            <td style={{ padding: "14px 16px", color: "#374151" }}>{idx + 1}</td>
                                            <td style={{ padding: "14px 16px", color: "#374151", fontWeight: "500" }}>{tx.tb_member?.nama || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#6b7280" }}>{paketName}</td>
                                            <td style={{ padding: "14px 16px", color: "#111827", fontWeight: "500" }}>{formatCurrency(total)}</td>
                                            <td style={{ padding: "14px 16px" }}><span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "500", backgroundColor: sc.bg, color: sc.text }}>{tx.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
