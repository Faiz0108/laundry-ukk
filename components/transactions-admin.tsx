"use client";

import { useState, useEffect } from "react";
import { FaChartBar, FaExchangeAlt, FaFilter, FaEdit, FaCheck, FaTimes, FaPlus } from "react-icons/fa";
import { supabase } from "../lib/supabase";

interface Outlet {
    id: number;
    nama: string;
}

interface Transaksi {
    id: number;
    kode_invoice: string;
    tgl: string | null;
    batas_waktu: string | null;
    tgl_bayar: string | null;
    status: string | null;
    dibayar: string | null;
    biaya_tambahan: number | null;
    diskon: number | null;
    pajak: number | null;
    id_outlet: number | null;
    id_member: number | null;
    id_user: number | null;
    tb_member?: { nama: string } | null;
    tb_outlet?: { nama: string } | null;
    tb_user?: { nama: string } | null;
    tb_detail_transaksi?: { qty: number; tb_paket?: { nama_paket: string; harga: number } | null }[];
}

interface Member {
    id: number;
    nama: string;
}

interface Paket {
    id: number;
    nama_paket: string;
    harga: number;
}

interface DailyData {
    day: number;
    revenue: number;
    orders: number;
}

export default function TransactionsAdmin() {
    const [transactions, setTransactions] = useState<Transaksi[]>([]);
    const [loading, setLoading] = useState(true);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>("");
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [chartMode, setChartMode] = useState<"revenue" | "orders">("orders");
    const [detailTx, setDetailTx] = useState<Transaksi | null>(null);
    const [isEditingDeadline, setIsEditingDeadline] = useState(false);
    const [newDeadline, setNewDeadline] = useState("");
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [pakets, setPakets] = useState<Paket[]>([]);
    const [formData, setFormData] = useState({
        id_outlet: "", id_member: "", id_paket: "", qty: "1", keterangan: "",
        biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar",
        tgl: "", batas_waktu: ""
    });

    const getMinDateTime = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const openCreateModal = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const t = now.toISOString().slice(0, 16);
        const b = new Date(now);
        b.setDate(b.getDate() + 3);
        const bw = b.toISOString().slice(0, 16);
        setFormData({ id_outlet: selectedOutlet, id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar", tgl: t, batas_waktu: bw });
        setShowModal(true);
    };

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    useEffect(() => {
        fetchTransactions();
        fetchOutlets();
        fetchMembers();
        fetchPakets();
    }, []);

    const fetchMembers = async () => {
        const { data } = await supabase.from("tb_member").select("id, nama");
        if (data) setMembers(data);
    };

    const fetchPakets = async () => {
        const { data } = await supabase.from("tb_paket").select("id, nama_paket, harga");
        if (data) setPakets(data);
    };

    const fetchOutlets = async () => {
        const { data } = await supabase.from("tb_outlet").select("id, nama").order("nama");
        if (data) setOutlets(data);
    };

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("tb_transaksi")
            .select("*, tb_member(nama), tb_outlet(nama), tb_user(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))")
            .order("tgl", { ascending: false })
            .limit(20);

        if (!error && data) {
            const needsRefresh = await applyLateDiscounts(data);
            if (needsRefresh) {
                const { data: r } = await supabase.from("tb_transaksi")
                    .select("*, tb_member(nama), tb_outlet(nama), tb_user(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))")
                    .order("tgl", { ascending: false }).limit(20);
                if (r) setTransactions(r);
            } else { setTransactions(data); }
        }

        // Fetch ALL transactions in current month for chart
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthIso = startOfMonth.toISOString();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyMap: Record<number, { revenue: number; orders: number }> = {};
        for (let i = 1; i <= daysInMonth; i++) {
            dailyMap[i] = { revenue: 0, orders: 0 };
        }

        const { data: monthTx } = await supabase
            .from("tb_transaksi")
            .select("*, tb_detail_transaksi(qty, tb_paket(harga))")
            .gte("tgl", startOfMonthIso);

        monthTx?.forEach(tx => {
            if (tx.tgl) {
                const txDate = new Date(tx.tgl);
                if (txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) {
                    const day = txDate.getDate();
                    dailyMap[day].orders += 1;
                    // Calculate revenue
                    let txTotal = 0;
                    tx.tb_detail_transaksi?.forEach((d: any) => {
                        txTotal += (d.qty || 0) * (d.tb_paket?.harga || 0);
                    });
                    txTotal += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
                    dailyMap[day].revenue += txTotal;
                }
            }
        });

        setDailyData(Object.entries(dailyMap).map(([day, d]) => ({ day: Number(day), ...d })));
        setLoading(false);
    };

    const applyToSingleTx = async (tx: Transaksi) => {
        if (tx.status === "diambil" || !tx.batas_waktu) return tx;
        
        // Ensure we have details for subtotal calculation
        let currentTx = tx;
        if (!currentTx.tb_detail_transaksi || currentTx.tb_detail_transaksi.length === 0) {
            const { data } = await supabase.from("tb_transaksi")
                .select("*, tb_detail_transaksi(qty, tb_paket(harga))")
                .eq("id", tx.id).single();
            if (data) currentTx = data;
        }

        const batasDate = new Date(currentTx.batas_waktu || "");
        const nowDate = new Date();
        const delay24h = 24 * 60 * 60 * 1000;
        
        if (nowDate.getTime() >= (batasDate.getTime() + delay24h)) {
            const lateDiskonPct = 5;

            const newDiskonTotal = (Number(currentTx.diskon) || 0) + lateDiskonPct;

            const newBW = new Date(currentTx.batas_waktu || "");
            newBW.setDate(newBW.getDate() + 3);
            if (currentTx.tgl) { const t = new Date(currentTx.tgl); newBW.setHours(t.getHours(), t.getMinutes(), t.getSeconds()); }
            
            const { error } = await supabase.from("tb_transaksi")
                .update({ diskon: newDiskonTotal, batas_waktu: newBW.toISOString() })
                .eq("id", currentTx.id);
                
            if (!error) {
                const { data: full } = await supabase.from("tb_transaksi")
                    .select("*, tb_member(nama), tb_outlet(nama), tb_user(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))")
                    .eq("id", currentTx.id).single();
                return full || currentTx;
            }
        }
        return currentTx;
    };

    const applyLateDiscounts = async (txList: Transaksi[]) => {
        let updated = false;
        for (const tx of txList) {
            if (tx.status === "diambil" || !tx.batas_waktu) continue;
            const batasDate = new Date(tx.batas_waktu);
            const nowDate = new Date();
            const delay24h = 24 * 60 * 60 * 1000;
            if (nowDate.getTime() >= (batasDate.getTime() + delay24h)) {
                const lateDiskonPct = 5;

                const newDiskonTotal = (Number(tx.diskon) || 0) + lateDiskonPct;
                const newBW = new Date(tx.batas_waktu);
                newBW.setDate(newBW.getDate() + 3);
                if (tx.tgl) { const t = new Date(tx.tgl); newBW.setHours(t.getHours(), t.getMinutes(), t.getSeconds()); }
                await supabase.from("tb_transaksi").update({ diskon: newDiskonTotal, batas_waktu: newBW.toISOString() }).eq("id", tx.id);
                updated = true;
            }
        }
        return updated;
    };

    const handleOpenDetail = async (tx: Transaksi) => {
        setDetailTx(tx);
        const updatedTx = await applyToSingleTx(tx);
        if (updatedTx.id) {
            setDetailTx(updatedTx);
            fetchTransactions();
        }
    };

    const handleUpdateDeadline = async () => {
        if (!detailTx || !newDeadline) return;
        setSaving(true);
        const { error } = await supabase.from("tb_transaksi").update({ 
            batas_waktu: new Date(newDeadline).toISOString() 
        }).eq("id", detailTx.id);
        
        if (!error) {
            setIsEditingDeadline(false);
            const updatedTx = await applyToSingleTx({ ...detailTx, batas_waktu: new Date(newDeadline).toISOString() });
            setDetailTx(updatedTx);
            await fetchTransactions();
        }
        setSaving(false);
    };

    const computeSubtotal = () => {
        const paket = pakets.find(p => p.id === parseInt(formData.id_paket));
        if (!paket) return 0;
        return paket.harga * (parseFloat(formData.qty) || 0);
    };
    const computeTax = () => Math.round(computeSubtotal() * 0.10);
    const computeFormTotal = () => {
        const subtotal = computeSubtotal();
        const tax = computeTax();
        const biaya = parseInt(formData.biaya_tambahan) || 0;
        return subtotal + tax + biaya;
    };

    const handleCreateTransaction = async () => {
        if (!formData.id_outlet || !formData.id_member || !formData.id_paket || !formData.qty) {
             alert("Mohon isi semua field (Toko, Pelanggan, Paket, Qty)!");
             return;
        }

        const isDuplicate = transactions.some(t => {
            const isSameMember = t.id_member === parseInt(formData.id_member);
            const isSameDate = new Date(t.tgl || "").toDateString() === new Date(formData.tgl).toDateString();
            const hasSamePackage = t.tb_detail_transaksi?.some((d: any) => d.tb_paket?.nama_paket === pakets.find(p => p.id === parseInt(formData.id_paket))?.nama_paket);
            return isSameMember && isSameDate && hasSamePackage;
        });

        if (isDuplicate) {
            alert("Transaksi untuk pelanggan dengan paket ini sudah ada di hari yang sama!");
            return;
        }

        setSaving(true);

        const userStr = localStorage.getItem("user");
        let id_user = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            id_user = user.id;
        }

        const kode_invoice = `INV-${Date.now()}`;
        const { data: txData, error: txError } = await supabase
            .from("tb_transaksi")
            .insert({
                id_outlet: parseInt(formData.id_outlet),
                kode_invoice,
                id_member: parseInt(formData.id_member),
                tgl: new Date(formData.tgl).toISOString(),
                batas_waktu: new Date(formData.batas_waktu).toISOString(),
                biaya_tambahan: parseInt(formData.biaya_tambahan) || 0,
                diskon: 0,
                pajak: computeTax(),
                status: "baru",
                dibayar: "belum_dibayar",
                tgl_bayar: null,
                id_user,
            })
            .select()
            .single();

        if (txError || !txData) {
            alert("Gagal membuat transaksi: " + txError?.message);
            setSaving(false);
            return;
        }

        const { error: detailError } = await supabase.from("tb_detail_transaksi").insert({
            id_transaksi: txData.id,
            id_paket: parseInt(formData.id_paket),
            qty: parseFloat(formData.qty),
            keterangan: formData.keterangan || "",
        });

        if (detailError) {
            await supabase.from("tb_transaksi").delete().eq("id", txData.id);
            alert("Gagal menyimpan detail transaksi: " + detailError.message);
            setSaving(false);
            return;
        }

        setFormData({ id_outlet: "", id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar", tgl: "", batas_waktu: "" });
        setShowModal(false);
        fetchTransactions();
        setSaving(false);
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan!")) return;
        setSaving(true);
        // Delete details first
        await supabase.from("tb_detail_transaksi").delete().eq("id_transaksi", id);
        const { error } = await supabase.from("tb_transaksi").delete().eq("id", id);
        if (!error) {
            setDetailTx(null);
            fetchTransactions();
        } else {
            alert("Gagal menghapus: " + error.message);
        }
        setSaving(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    const formatDateIndo = (d: string | null) => {
        if (!d) return "-";
        const date = new Date(d);
        const day = date.getDate().toString().padStart(2, '0');
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        return `${day} ${month} ${year}, ${time} WIB`;
    };

    const isOverdue = (tx: Transaksi) => {
        if (!tx.batas_waktu || tx.status === "diambil") return false;
        // Only trigger overdue warning and discount after 24 hours overdue
        const delay24h = 24 * 60 * 60 * 1000;
        return new Date().getTime() >= (new Date(tx.batas_waktu).getTime() + delay24h);
    };

    const getDiskonNominal = (tx: Transaksi) => {
        const diskonVal = Number(tx.diskon) || 0;
        if (diskonVal <= 0) return 0;
        if (diskonVal <= 100) { // treat as percentage
             let baseForDiskon = 0;
             tx.tb_detail_transaksi?.forEach(d => {
                 baseForDiskon += (d.qty || 0) * (d.tb_paket?.harga || 0);
             });
             return Math.round((baseForDiskon * diskonVal) / 100);
        }
        return diskonVal; // default to nominal if > 100
    };

    const formatShortCurrency = (a: number) => {
        if (a >= 1000000) return `${(a / 1000000).toFixed(1)}jt`;
        if (a >= 1000) return `${(a / 1000).toFixed(0)}rb`;
        return String(a);
    };

    const getTotal = (tx: Transaksi) => {
        let subtotal = 0;
        if (tx.tb_detail_transaksi) {
            tx.tb_detail_transaksi.forEach(d => {
                subtotal += (d.qty || 0) * (d.tb_paket?.harga || 0);
            });
        }
        subtotal += (tx.biaya_tambahan || 0);
        subtotal -= getDiskonNominal(tx);
        subtotal += (tx.pajak || 0);
        return subtotal;
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "baru": return { bg: "#dbeafe", color: "#2563eb" };
            case "proses": return { bg: "#fef3c7", color: "#d97706" };
            case "selesai": return { bg: "#dcfce7", color: "#16a34a" };
            case "diambil": return { bg: "#e5e7eb", color: "#6b7280" };
            default: return { bg: "#e5e7eb", color: "#6b7280" };
        }
    };

    const now = new Date();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const filteredTransactions = selectedOutlet
        ? transactions.filter(tx => tx.id_outlet === parseInt(selectedOutlet))
        : transactions;

    const renderChart = () => {
        if (dailyData.length === 0) return null;
        const values = dailyData.map(d => chartMode === "revenue" ? d.revenue : d.orders);
        const maxVal = Math.max(...values, 1);
        const chartHeight = 180;
        const todayDay = now.getDate();

        const ySteps = 4;
        const yLabels = [];
        for (let i = 0; i <= ySteps; i++) {
            const val = (maxVal / ySteps) * i;
            yLabels.push(chartMode === "revenue" ? formatShortCurrency(val) : String(Math.round(val)));
        }

        const monthTotal = dailyData.reduce((s, d) => s + d.revenue, 0);
        const monthOrders = dailyData.reduce((s, d) => s + d.orders, 0);

        return (
            <div style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ display: "flex", color: "#3b82f6" }}><FaChartBar /></span>
                            Grafik Transaksi - {currentMonthLabel}
                        </h2>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                            {chartMode === "orders"
                                ? `Total ${monthOrders} transaksi bulan ini`
                                : `Total pendapatan: ${formatCurrency(monthTotal)}`
                            }
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={() => setChartMode("orders")}
                            style={{
                                padding: "7px 14px",
                                borderRadius: "10px",
                                border: "none",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                background: chartMode === "orders" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#e2e8f0",
                                color: chartMode === "orders" ? "white" : "#64748b",
                                boxShadow: chartMode === "orders" ? "0 4px 12px rgba(59,130,246,0.3)" : "none"
                            }}
                        >
                            📦 Orderan
                        </button>
                        <button
                            onClick={() => setChartMode("revenue")}
                            style={{
                                padding: "7px 14px",
                                borderRadius: "10px",
                                border: "none",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                background: chartMode === "revenue" ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "#e2e8f0",
                                color: chartMode === "revenue" ? "white" : "#64748b",
                                boxShadow: chartMode === "revenue" ? "0 4px 12px rgba(20,184,166,0.3)" : "none"
                            }}
                        >
                            💰 Pendapatan
                        </button>
                    </div>
                </div>

                <div style={{ position: "relative", overflowX: "auto" }}>
                    <svg width="100%" viewBox={`0 0 ${dailyData.length * 26 + 60} ${chartHeight + 40}`} style={{ display: "block" }}>
                        {/* Y-axis grid */}
                        {yLabels.map((label, i) => {
                            const y = chartHeight - (chartHeight / ySteps) * i + 10;
                            return (
                                <g key={i}>
                                    <line x1="50" y1={y} x2={dailyData.length * 26 + 55} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4,4"} />
                                    <text x="46" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{label}</text>
                                </g>
                            );
                        })}

                        {/* Bars */}
                        {dailyData.map((d: any, i: number) => {
                            const val = chartMode === "revenue" ? d.revenue : d.orders;
                            const barHeight = maxVal > 0 ? (val / maxVal) * (chartHeight - 10) : 0;
                            const barWidth = 18;
                            const x = 55 + i * 26;
                            const y = chartHeight + 10 - barHeight;
                            const isToday = d.day === todayDay;
                            const isHovered = hoveredBar === i;
                            const hasValue = val > 0;
                            const barColor = chartMode === "orders"
                                ? (isToday ? "#2563eb" : isHovered ? "#3b82f6" : hasValue ? "#93c5fd" : "#e2e8f0")
                                : (isToday ? "#0d9488" : isHovered ? "#14b8a6" : hasValue ? "#5eead4" : "#e2e8f0");

                            return (
                                <g key={i}
                                    onMouseEnter={() => setHoveredBar(i)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx={4} fill={barColor} style={{ transition: "all 0.2s ease" }} />
                                    {(d.day % 2 === 1 || dailyData.length <= 15) && (
                                        <text x={x + barWidth / 2} y={chartHeight + 26} textAnchor="middle" fontSize="9" fill={isToday ? "#2563eb" : "#94a3b8"} fontWeight={isToday ? "700" : "400"}>{d.day}</text>
                                    )}
                                    {isToday && <circle cx={x + barWidth / 2} cy={chartHeight + 33} r={2.5} fill="#2563eb" />}
                                    {isHovered && (
                                        <g>
                                            <rect x={Math.max(0, Math.min(x - 35, dailyData.length * 26 - 50))} y={Math.max(0, y - 48)} width={chartMode === "revenue" ? 110 : 90} height={36} rx={8} fill="#0f172a" opacity={0.92} />
                                            <text x={Math.max(0, Math.min(x - 35, dailyData.length * 26 - 50)) + (chartMode === "revenue" ? 55 : 45)} y={Math.max(0, y - 48) + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">Tgl {d.day}</text>
                                            <text x={Math.max(0, Math.min(x - 35, dailyData.length * 26 - 50)) + (chartMode === "revenue" ? 55 : 45)} y={Math.max(0, y - 48) + 28} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">
                                                {chartMode === "revenue" ? formatShortCurrency(d.revenue) : `${d.orders} order`}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: chartMode === "orders" ? "#2563eb" : "#0d9488" }} />
                        Hari Ini
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: chartMode === "orders" ? "#93c5fd" : "#5eead4" }} />
                        {chartMode === "orders" ? "Ada Transaksi" : "Ada Pendapatan"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#e2e8f0" }} />
                        Belum Ada
                    </div>
                </div>
            </div>
        );
    };

    const thStyle = { padding: "14px 12px", textAlign: "left" as const, fontSize: "12px", color: "#64748b", fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

    return (
        <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #3b82f6, #14b8a6, #3b82f6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(59, 130, 246, 0.3)" }}>
                        <FaExchangeAlt />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Transaksi</h1>
                        <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Ringkasan dan daftar transaksi laundry</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                        <button onClick={openCreateModal} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                            <FaPlus /> Buat Transaksi
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {/* Charts Section */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
                    {renderChart()}

                    <div style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease 0.2s both" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>Status Transaksi</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {[
                                { color: "#2563eb", bg: "#dbeafe", label: "Baru", count: filteredTransactions.filter(t => t.status === "baru").length },
                                { color: "#d97706", bg: "#fef3c7", label: "Proses", count: filteredTransactions.filter(t => t.status === "proses").length },
                                { color: "#16a34a", bg: "#dcfce7", label: "Selesai", count: filteredTransactions.filter(t => t.status === "selesai").length },
                                { color: "#6b7280", bg: "#e5e7eb", label: "Diambil", count: filteredTransactions.filter(t => t.status === "diambil").length },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", backgroundColor: item.bg, borderRadius: "14px", transition: "transform 0.2s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}>
                                    <div style={{ width: "14px", height: "14px", backgroundColor: item.color, borderRadius: "50%", boxShadow: `0 0 8px ${item.color}40` }} />
                                    <span style={{ fontSize: "14px", color: item.color, flex: 1, fontWeight: "500" }}>{item.label}</span>
                                    <span style={{ fontSize: "18px", fontWeight: "700", color: item.color }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transaction Table */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>📋 Daftar Transaksi</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                                <span style={{ fontSize: "13px", display: "flex" }}><FaFilter /></span>
                                <span>Filter Toko:</span>
                            </div>
                            <select
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                                style={{
                                    padding: "10px 16px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    fontSize: "14px",
                                    color: "#0f172a",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    minWidth: "200px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
                            >
                                <option value="">🏪 Semua Toko</option>
                                {outlets.map(o => <option key={o.id} value={o.id}>🏪 {o.nama}</option>)}
                            </select>
                            {selectedOutlet && (
                                <button
                                    onClick={() => setSelectedOutlet("")}
                                    style={{ padding: "8px 14px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "10px", fontSize: "12px", cursor: "pointer", fontWeight: "500", transition: "all 0.2s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fecaca"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; }}
                                >
                                    ✕ Reset
                                </button>
                            )}
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                            <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                            <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data transaksi...</p>
                        </div>
                    ) : (
                        <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "1000px" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={thStyle}>No</th>
                                            <th style={thStyle}>Invoice</th>
                                            <th style={thStyle}>Pelanggan</th>
                                            <th style={thStyle}>Toko</th>
                                            <th style={thStyle}>Kasir</th>
                                            <th style={thStyle}>Tgl</th>
                                            <th style={thStyle}>Batas Waktu</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Diskon</th>
                                            <th style={thStyle}>Bayar</th>
                                            <th style={thStyle}>Tgl Bayar</th>
                                            <th style={thStyle}>Total</th>
                                            <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.length === 0 ? (
                                            <tr><td colSpan={13} style={{ padding: "60px", textAlign: "center" }}>
                                                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📦</div>
                                                <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500" }}>{selectedOutlet ? "Tidak ada transaksi di Toko ini" : "Belum ada transaksi"}</p>
                                            </td></tr>
                                        ) : filteredTransactions.map((tx, idx) => {
                                            const statusStyle = getStatusColor(tx.status);
                                            return (
                                                <tr key={tx.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.03}s both` }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                                    <td style={{ padding: "14px 12px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                                    <td style={{ padding: "14px 12px", color: "#14b8a6", fontWeight: "600", fontSize: "12px" }}>{tx.kode_invoice}</td>
                                                    <td style={{ padding: "14px 12px", color: "#0f172a", fontWeight: "500" }}>{tx.tb_member?.nama || "-"}</td>
                                                    <td style={{ padding: "14px 12px", color: "#475569" }}>{tx.tb_outlet?.nama || "-"}</td>
                                                    <td style={{ padding: "14px 12px", color: "#475569" }}>{tx.tb_user?.nama || "-"}</td>
                                                    <td style={{ padding: "14px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(tx.tgl)}</td>
                                                    <td style={{ padding: "14px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(tx.batas_waktu)}</td>
                                                    <td style={{ padding: "14px 12px" }}>
                                                        <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: statusStyle.bg, color: statusStyle.color, whiteSpace: "nowrap" }}>{tx.status}</span>
                                                    </td>
                                                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                                                        {Number(tx.diskon) > 0 ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d", whiteSpace: "nowrap" }}>🏷️ {Number(tx.diskon)}%</span>
                                                        ) : <span style={{ color: "#94a3b8" }}>-</span>}
                                                    </td>
                                                    <td style={{ padding: "14px 12px" }}>
                                                        <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: tx.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: tx.dibayar === "dibayar" ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>
                                                            {tx.dibayar === "dibayar" ? "Lunas" : "Belum"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(tx.tgl_bayar)}</td>
                                                    <td style={{ padding: "14px 12px", color: "#0f172a", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                            <span>{formatCurrency(getTotal(tx))}</span>
                                                            {Number(tx.diskon) > 0 && <span style={{ fontSize: "10px", color: "#d97706", fontWeight: "700" }}>(-{formatCurrency(getDiskonNominal(tx))})</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                                                        <button onClick={() => handleOpenDetail(tx)}
                                                            style={{ padding: "7px 14px", backgroundColor: "#f0fdfa", color: "#14b8a6", border: "1px solid #99f6e4", borderRadius: "10px", fontSize: "12px", cursor: "pointer", transition: "all 0.2s ease", fontWeight: "600" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.backgroundColor = "#ccfbf1"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.backgroundColor = "#f0fdfa"; }}>
                                                            📋 Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <div>Transaksi Admin</div>
                <div style={{ display: "flex", gap: "16px" }}>
                    <span>Total {filteredTransactions.length} transaksi{selectedOutlet ? ` (filtered)` : ""}</span>
                    <span suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
                    <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaPlus /></div>
                                <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Buat Transaksi Baru</h3><p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Isi detail transaksi</p></div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569" }}><FaTimes /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Outlet Selection (Admin only) */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🏪</span>
                                <select value={formData.id_outlet} onChange={(e) => setFormData({ ...formData, id_outlet: e.target.value })} 
                                    style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Toko/Outlet</option>
                                    {outlets.map(o => <option key={o.id} value={o.id}>🏪 {o.nama}</option>)}
                                </select></div>
                            {/* Pelanggan */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                                <select value={formData.id_member} onChange={(e) => setFormData({ ...formData, id_member: e.target.value })} 
                                    style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Pelanggan</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                                </select></div>
                            {/* Paket */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📦</span>
                                <select value={formData.id_paket} onChange={(e) => setFormData({ ...formData, id_paket: e.target.value })} 
                                    style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Paket</option>
                                    {pakets.map(p => <option key={p.id} value={p.id}>{p.nama_paket} - {formatCurrency(p.harga)}</option>)}
                                </select></div>
                            {/* Qty */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>⚖️</span>
                                <input type="number" placeholder="Qty (kg/pcs)" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} 
                                    style={{ ...inputStyle, paddingLeft: "44px" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>

                            {/* Dates */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>📅 Tgl Masuk</label>
                                    <input type="datetime-local" value={formData.tgl} onChange={(e) => setFormData({ ...formData, tgl: e.target.value })} 
                                        style={{ ...inputStyle, padding: "10px 12px" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                                <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>⏰ Batas Waktu</label>
                                    <input type="datetime-local" value={formData.batas_waktu} min={getMinDateTime()} onChange={(e) => setFormData({ ...formData, batas_waktu: e.target.value })} 
                                        style={{ ...inputStyle, padding: "10px 12px" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                            </div>

                            {/* Biaya Tambahan */}
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>💰 Biaya Tambahan</label>
                                <input type="number" placeholder="0" value={formData.biaya_tambahan} onChange={(e) => setFormData({ ...formData, biaya_tambahan: e.target.value })} 
                                    style={{ ...inputStyle, padding: "10px 12px" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                            </div>

                            {/* Pajak 10% */}
                            <div style={{ background: "linear-gradient(135deg, #fef3c7, #fffbeb)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #fcd34d" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", display: "flex", alignItems: "center", gap: "6px" }}>📊 Pajak (10% dari subtotal)</label>
                                    <span style={{ padding: "3px 10px", backgroundColor: "#f59e0b", color: "white", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>10%</span>
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: "700", color: "#92400e" }}>{formatCurrency(computeTax())}</div>
                                <p style={{ fontSize: "11px", color: "#b45309", margin: "6px 0 0 0" }}>Pajak dihitung otomatis 10% dari subtotal</p>
                            </div>

                            {/* Summary */}
                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #86efac" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ fontSize: "13px", color: "#166534" }}>Subtotal</span><span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(computeSubtotal())}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ fontSize: "13px", color: "#166534" }}>Pajak (10%)</span><span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(computeTax())}</span></div>
                                {(parseInt(formData.biaya_tambahan) || 0) > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ fontSize: "13px", color: "#166534" }}>Biaya Tambahan</span><span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>+{formatCurrency(parseInt(formData.biaya_tambahan) || 0)}</span></div>
                                )}
                                <div style={{ borderTop: "1px solid #86efac", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>Total</span><span style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>{formatCurrency(computeFormTotal())}</span></div>
                            </div>

                            {/* Keterangan */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "14px", color: "#94a3b8", zIndex: 1 }}>📝</span>
                                <textarea placeholder="Keterangan (opsional)" value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} 
                                    style={{ ...inputStyle, paddingLeft: "44px", height: "60px", resize: "none" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}>Batal</button>
                            <button onClick={handleCreateTransaction} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}>{saving ? "Menyimpan..." : "Simpan Transaksi"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Transaction Modal */}
            {detailTx && (() => {
                const subtotal = (tx: Transaksi) => {
                    let s = 0;
                    tx.tb_detail_transaksi?.forEach(d => { s += (d.qty || 0) * (d.tb_paket?.harga || 0); });
                    return s;
                };
                const sub = subtotal(detailTx);
                const pajak = detailTx.pajak || 0;
                const biaya = detailTx.biaya_tambahan || 0;
                const diskonPersenOrNominal = Number(detailTx.diskon) || 0;
                const diskonNominal = getDiskonNominal(detailTx);
                const total = sub + pajak + biaya - diskonNominal;
                const sColor = getStatusColor(detailTx.status);
                const overdue = isOverdue(detailTx);
                
                return (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
                        <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "600px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>📋</div>
                                    <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Detail Transaksi</h3><p style={{ fontSize: "13px", color: "#14b8a6", margin: "2px 0 0 0", fontWeight: "600" }}>{detailTx.kode_invoice}</p></div>
                                </div>
                                <button onClick={() => setDetailTx(null)} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569" }}><FaTimes /></button>
                            </div>
                            
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: sColor.bg, color: sColor.color }}>📦 {detailTx.status}</span>
                                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: detailTx.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: detailTx.dibayar === "dibayar" ? "#16a34a" : "#dc2626" }}>{detailTx.dibayar === "dibayar" ? "💰 Lunas" : "⏰ Belum Bayar"}</span>
                                {overdue && <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#fee2e2", color: "#dc2626", animation: "pulse 2s infinite" }}>⚠️ Terlambat</span>}
                                {diskonPersenOrNominal > 0 && <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#fef3c7", color: "#d97706" }}>🏷️ Diskon {diskonPersenOrNominal <= 100 ? `${diskonPersenOrNominal}%` : formatCurrency(diskonPersenOrNominal)}</span>}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
                                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: "600" }}>Pelanggan</p>
                                    <p style={{ fontSize: "14px", color: "#0f172a", margin: 0, fontWeight: "500" }}>{detailTx.tb_member?.nama || "-"}</p>
                                </div>
                                <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
                                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: "600" }}>Toko</p>
                                    <p style={{ fontSize: "14px", color: "#0f172a", margin: 0, fontWeight: "500" }}>{detailTx.tb_outlet?.nama || "-"}</p>
                                </div>
                                <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
                                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: "600" }}>Tanggal Masuk</p>
                                    <p style={{ fontSize: "14px", color: "#0f172a", margin: 0, fontWeight: "500" }}>{formatDateIndo(detailTx.tgl)}</p>
                                </div>
                                <div style={{ padding: "12px 16px", backgroundColor: overdue ? "#fff5f5" : "#f8fafc", borderRadius: "12px", border: overdue ? "1px solid #fca5a5" : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <p style={{ fontSize: "11px", color: overdue ? "#dc2626" : "#94a3b8", margin: 0, textTransform: "uppercase", fontWeight: "600" }}>Batas Waktu</p>
                                        {!isEditingDeadline ? (
                                            <button onClick={() => { 
                                                setIsEditingDeadline(true); 
                                                setNewDeadline(detailTx.batas_waktu ? new Date(detailTx.batas_waktu).toISOString().slice(0, 16) : "");
                                            }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <FaEdit /> Edit
                                            </button>
                                        ) : (
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button onClick={handleUpdateDeadline} disabled={saving} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", fontWeight: "600" }}>
                                                    <FaCheck /> Simpan
                                                </button>
                                                <button onClick={() => setIsEditingDeadline(false)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", fontWeight: "600" }}>
                                                    <FaTimes /> Batal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isEditingDeadline ? (
                                        <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: "12px", height: "auto" }} />
                                    ) : (
                                        <p style={{ fontSize: "14px", color: overdue ? "#dc2626" : "#0f172a", margin: 0, fontWeight: "500" }}>{formatDateIndo(detailTx.batas_waktu)}</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "10px", textTransform: "uppercase" }}>Detail Paket</h4>
                                <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                        <thead><tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", color: "#64748b" }}>Paket</th>
                                            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>Qty</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", color: "#64748b" }}>Harga</th>
                                        </tr></thead>
                                        <tbody>{detailTx.tb_detail_transaksi?.map((d: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <td style={{ padding: "10px 14px", color: "#0f172a" }}>{d.tb_paket?.nama_paket || "-"}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", color: "#475569" }}>{d.qty}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569" }}>{formatCurrency(d.tb_paket?.harga || 0)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #86efac" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: "#166534" }}>Subtotal</span><span style={{ fontWeight: "600" }}>{formatCurrency(sub)}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: "#166534" }}>Pajak (10%)</span><span style={{ fontWeight: "600" }}>{formatCurrency(pajak)}</span></div>
                                {biaya > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: "#166534" }}>Biaya Tambahan</span><span style={{ fontWeight: "600" }}>+{formatCurrency(biaya)}</span></div>}
                                {diskonNominal > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: "#dc2626" }}>Diskon</span><span style={{ fontWeight: "600", color: "#dc2626" }}>-{formatCurrency(diskonNominal)}</span></div>}
                                <div style={{ borderTop: "2px solid #86efac", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>Total</span><span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>{formatCurrency(total)}</span></div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                                <button onClick={() => handleDeleteTransaction(detailTx.id)}
                                    style={{ padding: "12px 20px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "8px" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fecaca"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <FaTimes /> Hapus Transaksi
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style jsx>{`
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            `}</style>
        </main>
    );
}
