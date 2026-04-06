"use client";

import { useState, useEffect } from "react";
import StatCard from "./statcard";
import { supabase } from "../lib/supabase";

interface Transaksi {
    id: number;
    kode_invoice: string;
    tgl: string | null;
    status: string | null;
    dibayar: string | null;
    biaya_tambahan?: number | null;
    diskon?: number | null;
    pajak?: number | null;
    tb_member?: { nama: string } | null;
    tb_detail_transaksi?: { qty: number; tb_paket?: { nama_paket: string; harga: number } | null }[];
}

export default function DashboardAdmin() {
    const [totalMembers, setTotalMembers] = useState(0);
    const [inProcess, setInProcess] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [recentTx, setRecentTx] = useState<Transaksi[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);

        // Total members
        const { count: memberCount } = await supabase.from("tb_member").select("*", { count: "exact", head: true });
        setTotalMembers(memberCount || 0);

        // In process
        const { count: processCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true }).in("status", ["baru", "proses"]);
        setInProcess(processCount || 0);

        // Revenue logic
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayIso = startOfDay.toISOString();

        const { data: allPaidTx } = await supabase
            .from("tb_transaksi")
            .select("*, tb_detail_transaksi(qty, tb_paket(harga))")
            .eq("dibayar", "dibayar");

        let revToday = 0;
        let revTotal = 0;

        allPaidTx?.forEach(tx => {
            let txTotal = 0;
            tx.tb_detail_transaksi?.forEach((d: any) => {
                txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0);
            });
            txTotal += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);

            revTotal += txTotal;
            if (tx.tgl && tx.tgl >= todayIso) {
                revToday += txTotal;
            }
        });

        setTodayRevenue(revToday);
        setTotalRevenue(revTotal);

        // Recent transactions
        const { data: recent } = await supabase
            .from("tb_transaksi")
            .select("*, tb_member(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))")
            .order("tgl", { ascending: false })
            .limit(5);
        if (recent) setRecentTx(recent);

        setLoading(false);
    };

    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-";
    const getTotal = (tx: Transaksi) => {
        let s = 0;
        tx.tb_detail_transaksi?.forEach(d => { s += (d.qty || 0) * (d.tb_paket?.harga || 0); });
        s += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
        return s;
    };
    const getStatusColor = (status: string | null) => {
        switch (status) { case "baru": return { bg: "#dbeafe", color: "#2563eb" }; case "proses": return { bg: "#fef3c7", color: "#d97706" }; case "selesai": return { bg: "#dcfce7", color: "#16a34a" }; case "diambil": return { bg: "#e5e7eb", color: "#6b7280" }; default: return { bg: "#e5e7eb", color: "#6b7280" }; }
    };

    return (
        <main style={{ flex: 1, padding: "24px 32px", backgroundColor: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>Laundry Aplikasi Manajemen</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                <StatCard title="JUMLAH ANGGOTA:" value={String(totalMembers)} borderColor="#14b8a6" />
                <StatCard title="DALAM PROSES:" value={String(inProcess)} borderColor="#f97316" />
                <StatCard title="PENDAPATAN HARI INI:" value={formatCurrency(todayRevenue)} borderColor="#3b82f6" />
                <StatCard title="TOTAL PENDAPATAN:" value={formatCurrency(totalRevenue)} borderColor="#eab308" />
            </div>

            <div>
                <h2 style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transaksi Terkini</h2>
                {loading ? (
                    <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>Memuat data...</p>
                ) : (
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>Invoice</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>Pelanggan</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>Tanggal</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>Status</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>Belum ada transaksi</td></tr>
                                ) : recentTx.map((tx) => {
                                    const sc = getStatusColor(tx.status);
                                    return (
                                        <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                            <td style={{ padding: "14px 16px", color: "#14b8a6", fontWeight: "500" }}>{tx.kode_invoice}</td>
                                            <td style={{ padding: "14px 16px", color: "#374151" }}>{tx.tb_member?.nama || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#6b7280" }}>{formatDate(tx.tgl)}</td>
                                            <td style={{ padding: "14px 16px" }}><span style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: "500", backgroundColor: sc.bg, color: sc.color }}>{tx.status}</span></td>
                                            <td style={{ padding: "14px 16px", color: "#374151", fontWeight: "500" }}>{formatCurrency(getTotal(tx))}</td>
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
