"use client";

import { useState, useEffect } from "react";
import { FaChartLine, FaMoneyBillWave, FaStore, FaUsers } from "react-icons/fa";
import { supabase } from "../lib/supabase";

export default function DashboardOwner() {
    const [totalOutlets, setTotalOutlets] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        const { count: outletCount } = await supabase.from("tb_outlet").select("*", { count: "exact", head: true });
        setTotalOutlets(outletCount || 0);

        const { count: userCount } = await supabase.from("tb_user").select("*", { count: "exact", head: true });
        setTotalUsers(userCount || 0);

        const { count: memberCount } = await supabase.from("tb_member").select("*", { count: "exact", head: true });
        setTotalMembers(memberCount || 0);

        const { count: txCount } = await supabase.from("tb_transaksi").select("*", { count: "exact", head: true });
        setTotalTransactions(txCount || 0);

        const { data: paidTx } = await supabase.from("tb_transaksi").select("*, tb_detail_transaksi(qty, tb_paket(harga))").eq("dibayar", "dibayar");
        let rev = 0;
        paidTx?.forEach(tx => { 
            let txTotal = 0;
            tx.tb_detail_transaksi?.forEach((d: any) => { txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0); });
            txTotal += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
            rev += txTotal; 
        });
        setTotalRevenue(rev);

        setLoading(false);
    };

    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);

    const stats = [
        { label: "Total Toko", value: String(totalOutlets), icon: FaStore, color: "#14b8a6" },
        { label: "Total Karyawan", value: String(totalUsers), icon: FaUsers, color: "#f97316" },
        { label: "Total Pelanggan", value: String(totalMembers), icon: FaUsers, color: "#3b82f6" },
        { label: "Total Transaksi", value: String(totalTransactions), icon: FaChartLine, color: "#8b5cf6" },
    ];

    return (
        <main style={{ flex: 1, padding: "24px 32px", backgroundColor: "white" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>Beranda Owner</h1>
                <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Ringkasan bisnis laundry Anda</p>
            </div>

            {loading ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Memuat data...</p>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
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

                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "white", fontSize: "20px", display: "flex" }}><FaMoneyBillWave /></span>
                            </div>
                            <div>
                                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Total Pendapatan (Lunas)</p>
                                <p style={{ fontSize: "28px", fontWeight: "700", color: "#22c55e", margin: 0 }}>{formatCurrency(totalRevenue)}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Distribusi</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Toko Aktif</span>
                                    <span style={{ fontSize: "18px", fontWeight: "600", color: "#14b8a6" }}>{totalOutlets}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Karyawan</span>
                                    <span style={{ fontSize: "18px", fontWeight: "600", color: "#f97316" }}>{totalUsers}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Member</span>
                                    <span style={{ fontSize: "18px", fontWeight: "600", color: "#3b82f6" }}>{totalMembers}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Performa</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Total Transaksi</span>
                                    <span style={{ fontSize: "18px", fontWeight: "600", color: "#8b5cf6" }}>{totalTransactions}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Rata-rata / Transaksi</span>
                                    <span style={{ fontSize: "18px", fontWeight: "600", color: "#22c55e" }}>{totalTransactions > 0 ? formatCurrency(totalRevenue / totalTransactions) : "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
