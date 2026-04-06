"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaCheck, FaTimes, FaExchangeAlt, FaFilter, FaEdit } from "react-icons/fa";
import { supabase } from "../lib/supabase";

interface Transaksi {
    [x: string]: any;
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

interface Outlet {
    id: number;
    nama: string;
}

interface Paket {
    id: number;
    nama_paket: string;
    harga: number;
    jenis: string | null;
}

export default function TransactionsKasir() {
    const [transactions, setTransactions] = useState<Transaksi[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [members, setMembers] = useState<Member[]>([]);
    const [pakets, setPakets] = useState<Paket[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [detailTx, setDetailTx] = useState<Transaksi | null>(null);
    const [formData, setFormData] = useState({
        id_member: "", id_paket: "", qty: "1", keterangan: "",
        biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar",
        tgl: "", batas_waktu: ""
    });
    const [isEditingDeadline, setIsEditingDeadline] = useState(false);
    const [newDeadline, setNewDeadline] = useState("");

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
        setFormData({ id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar", tgl: t, batas_waktu: bw });
        setShowModal(true);
    };

    useEffect(() => {
        fetchTransactions();
        fetchMembers();
        fetchPakets();
        fetchOutlets();
    }, []);

    const fetchOutlets = async () => {
        const { data } = await supabase.from("tb_outlet").select("id, nama").order("nama");
        if (data) setOutlets(data);
    };

    // Compute subtotal, tax and total based on selected paket and qty
    const getSelectedPaket = () => pakets.find(p => p.id === parseInt(formData.id_paket));
    const computeSubtotal = () => {
        const paket = getSelectedPaket();
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

    const getSubtotalForTx = (tx: Transaksi) => {
        let s = 0;
        tx.tb_detail_transaksi?.forEach(d => { s += (d.qty || 0) * (d.tb_paket?.harga || 0); });
        return s;
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

            // Cumulative discount: Add to existing discount (if any)
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
        setDetailTx(tx); // Open immediately first
        const updatedTx = await applyToSingleTx(tx);
        if (updatedTx.id) {
            setDetailTx(updatedTx);
            fetchTransactions(); // Refresh list background
        }
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
        setLoading(false);
    };

    const fetchMembers = async () => {
        const { data } = await supabase.from("tb_member").select("id, nama");
        if (data) setMembers(data);
    };

    const fetchPakets = async () => {
        const { data } = await supabase.from("tb_paket").select("id, nama_paket, harga, jenis");
        if (data) setPakets(data);
    };

    const handleCreateTransaction = async () => {
        if (!formData.id_member || !formData.id_paket || !formData.qty) return;

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
        let id_outlet = null;
        let id_user = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            id_outlet = user.id_outlet;
            id_user = user.id;
        }

        const kode_invoice = `INV-${Date.now()}`;
        const { data: txData, error: txError } = await supabase
            .from("tb_transaksi")
            .insert({
                id_outlet,
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
            setSaving(false);
            return;
        }

        const { error: detailError } = await supabase.from("tb_detail_transaksi").insert({
            id_transaksi: txData.id,
            id_paket: parseInt(formData.id_paket),
            qty: parseFloat(formData.qty),
            keterangan: formData.keterangan,
        });

        if (detailError) {
            console.error("Gagal menyimpan detail transaksi:", detailError);
            await supabase.from("tb_transaksi").delete().eq("id", txData.id);
            alert("Gagal menyimpan detail transaksi: " + detailError.message);
            setSaving(false);
            return;
        }

        setFormData({ id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", status: "baru", dibayar: "belum_dibayar", tgl: "", batas_waktu: "" });
        setShowModal(false);
        fetchTransactions();
        setSaving(false);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        // Block status change to 'diambil' if not yet paid
        if (newStatus === "diambil") {
            const tx = transactions.find(t => t.id === id) || detailTx;
            if (tx && tx.dibayar !== "dibayar") {
                alert("⚠️ Laundry tidak bisa diambil sebelum melakukan pembayaran!\n\nSilakan lakukan pembayaran terlebih dahulu.");
                return;
            }
        }
        await supabase.from("tb_transaksi").update({ status: newStatus }).eq("id", id);
        if (detailTx && detailTx.id === id) setDetailTx({ ...detailTx, status: newStatus });
        fetchTransactions();
    };

    const handleUpdatePayment = async (id: number) => {
        const now = new Date().toISOString();
        await supabase.from("tb_transaksi").update({ dibayar: "dibayar", tgl_bayar: now }).eq("id", id);
        if (detailTx && detailTx.id === id) setDetailTx({ ...detailTx, dibayar: "dibayar", tgl_bayar: now });
        fetchTransactions();
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
            fetchTransactions();
        }
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

    const formatDate = (d: string | null) => {
        if (!d) return "-";
        const date = new Date(d);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
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
    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);
    const getTotal = (tx: Transaksi) => {
        let s = 0;
        tx.tb_detail_transaksi?.forEach(d => { s += (d.qty || 0) * (d.tb_paket?.harga || 0); });
        s += (tx.biaya_tambahan || 0) - getDiskonNominal(tx) + (tx.pajak || 0);
        return s;
    };

    const getStatusColor = (status: string | null) => {
        switch (status) { case "baru": return { bg: "#dbeafe", color: "#2563eb" }; case "proses": return { bg: "#fef3c7", color: "#d97706" }; case "selesai": return { bg: "#dcfce7", color: "#16a34a" }; case "diambil": return { bg: "#e5e7eb", color: "#6b7280" }; default: return { bg: "#e5e7eb", color: "#6b7280" }; }
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

    const outletFiltered = selectedOutlet
        ? transactions.filter(tx => tx.id_outlet === parseInt(selectedOutlet))
        : transactions;
    const statusFiltered = selectedStatus === "lunas"
        ? outletFiltered.filter(tx => tx.dibayar === "dibayar")
        : selectedStatus
            ? outletFiltered.filter(tx => tx.status === selectedStatus)
            : outletFiltered;
    const filtered = statusFiltered.filter(t => t.kode_invoice.toLowerCase().includes(searchTerm.toLowerCase()) || t.tb_member?.nama?.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusTabs = [
        { key: "", label: "Semua", icon: "📋", count: outletFiltered.length },
        { key: "baru", label: "Baru", icon: "🆕", count: outletFiltered.filter(t => t.status === "baru").length, color: "#2563eb", bg: "#dbeafe" },
        { key: "proses", label: "Proses", icon: "⏳", count: outletFiltered.filter(t => t.status === "proses").length, color: "#d97706", bg: "#fef3c7" },
        { key: "selesai", label: "Selesai", icon: "✅", count: outletFiltered.filter(t => t.status === "selesai").length, color: "#16a34a", bg: "#dcfce7" },
        { key: "diambil", label: "Diambil", icon: "📤", count: outletFiltered.filter(t => t.status === "diambil").length, color: "#6b7280", bg: "#e5e7eb" },
        { key: "lunas", label: "Lunas", icon: "💰", count: outletFiltered.filter(t => t.dibayar === "dibayar").length, color: "#059669", bg: "#d1fae5" },
    ];

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    const thStyle = { padding: "14px 12px", textAlign: "left" as const, fontSize: "12px", color: "#64748b", fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

    return (
        <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaExchangeAlt /></div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Transaksi Kasir</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>Kelola transaksi laundry</span>
                                <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>{filtered.length} transaksi</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={openCreateModal} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                        <FaPlus /> Buat Transaksi
                    </button>
                </div>
                {/* Outlet Filter + Search */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                        <FaFilter />
                    </div>
                    <select
                        value={selectedOutlet}
                        onChange={(e) => setSelectedOutlet(e.target.value)}
                        style={{
                            padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
                            fontSize: "14px", color: "#0f172a", backgroundColor: "white", cursor: "pointer",
                            outline: "none", transition: "all 0.2s ease", minWidth: "180px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
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
                    <div style={{ flex: 1, position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                        <input type="text" placeholder="Cari invoice atau pelanggan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white" }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                    </div>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ padding: "16px 32px 0 32px", display: "flex", gap: "8px", flexWrap: "wrap", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {statusTabs.map(tab => {
                    const isActive = selectedStatus === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedStatus(tab.key)}
                            style={{
                                padding: "10px 18px",
                                border: isActive ? "2px solid " + (tab.color || "#14b8a6") : "1px solid #e2e8f0",
                                borderRadius: "14px",
                                fontSize: "13px",
                                fontWeight: isActive ? "600" : "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: isActive ? (tab.bg || "#f0fdfa") : "white",
                                color: isActive ? (tab.color || "#14b8a6") : "#64748b",
                                boxShadow: isActive ? `0 4px 12px ${(tab.color || "#14b8a6")}20` : "0 1px 3px rgba(0,0,0,0.04)",
                                transform: isActive ? "translateY(-1px)" : "none"
                            }}
                            onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; } }}
                            onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; } }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "700",
                                backgroundColor: isActive ? (tab.color || "#14b8a6") : "#e2e8f0",
                                color: isActive ? "white" : "#64748b",
                                minWidth: "20px",
                                textAlign: "center" as const
                            }}>{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#14b8a6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                        <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data transaksi...</p>
                    </div>
                ) : (
                    <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "950px" }}>
                                <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={thStyle}>Invoice</th>
                                            <th style={thStyle}>Pelanggan</th>
                                            <th style={thStyle}>Toko</th>
                                            <th style={thStyle}>Tanggal</th>
                                            <th style={thStyle}>Batas Waktu</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Diskon</th>
                                            <th style={thStyle}>Bayar</th>
                                            <th style={thStyle}>Total</th>
                                            <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                                        </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={10} style={{ padding: "60px", textAlign: "center" }}>
                                            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📦</div>
                                            <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500" }}>{searchTerm ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</p>
                                        </td></tr>
                                    ) : filtered.map((tx, idx) => {
                                        const sColor = getStatusColor(tx.status);
                                        const overdue = isOverdue(tx);
                                        return (
                                            <tr key={tx.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: overdue ? "#fff5f5" : "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.03}s both` }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overdue ? "#fee2e2" : "#f8fafc"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overdue ? "#fff5f5" : "white"; }}>
                                                <td style={{ padding: "14px 12px", color: "#14b8a6", fontWeight: "600", fontSize: "12px" }}>{tx.kode_invoice}</td>
                                                <td style={{ padding: "14px 12px", color: "#0f172a", fontWeight: "500" }}>{tx.tb_member?.nama || "-"}</td>
                                                <td style={{ padding: "14px 12px", color: "#475569" }}>{tx.tb_outlet?.nama || "-"}</td>
                                                <td style={{ padding: "14px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(tx.tgl)}</td>
                                                <td style={{ padding: "14px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>
                                                    <span style={{ color: overdue ? "#dc2626" : "#475569" }}>{formatDateIndo(tx.batas_waktu)}</span>
                                                    {overdue && <span style={{ display: "inline-block", marginLeft: "6px", padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", animation: "pulse 2s infinite" }}>⚠️ Terlambat</span>}
                                                </td>
                                                <td style={{ padding: "14px 12px" }}><span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: sColor.bg, color: sColor.color, whiteSpace: "nowrap" }}>{tx.status}</span></td>
                                                <td style={{ padding: "14px 12px" }}>
                                                    {Number(tx.diskon) > 0 ? (
                                                        <span style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d" }}>🏷️ {Number(tx.diskon)}%</span>
                                                    ) : "-"}
                                                </td>
                                                <td style={{ padding: "14px 12px" }}><span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: tx.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: tx.dibayar === "dibayar" ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>{tx.dibayar === "dibayar" ? "Lunas" : "Belum"}</span></td>
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

            {/* Footer */}
            <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <div>Transaksi Kasir</div>
                <div style={{ display: "flex", gap: "16px" }}>
                    <span>{transactions.length} transaksi</span>
                    <span suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
            </div>

            {/* Create Transaction Modal */}
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
                            {/* Pelanggan */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                                <select value={formData.id_member} onChange={(e) => setFormData({ ...formData, id_member: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Pelanggan</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                                </select></div>
                            {/* Paket */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📦</span>
                                <select value={formData.id_paket} onChange={(e) => setFormData({ ...formData, id_paket: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Paket</option>
                                    {pakets.map(p => <option key={p.id} value={p.id}>{p.nama_paket} - {formatCurrency(p.harga)}</option>)}
                                </select></div>
                            {/* Qty */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>⚖️</span>
                                <input type="number" placeholder="Qty (kg/pcs)" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>

                            {/* Tanggal Transaksi & Batas Waktu */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>📅 Tanggal Transaksi</label>
                                    <input type="datetime-local" value={formData.tgl} onChange={(e) => setFormData({ ...formData, tgl: e.target.value })} style={{ ...inputStyle, padding: "10px 12px" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>⏰ Batas Waktu</label>
                                    <input type="datetime-local" value={formData.batas_waktu} min={getMinDateTime()} onChange={(e) => {
                                        const minDT = getMinDateTime();
                                        if (e.target.value < minDT) {
                                            alert("Peringatan: Tidak bisa memilih batas waktu melewati jam/tanggal saat ini!");
                                            setFormData({ ...formData, batas_waktu: minDT });
                                        } else {
                                            setFormData({ ...formData, batas_waktu: e.target.value });
                                        }
                                    }} style={{ ...inputStyle, padding: "10px 12px" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                                </div>
                            </div>


                            {/* Biaya Tambahan */}
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>💰 Biaya Tambahan</label>
                                <input type="number" placeholder="0" value={formData.biaya_tambahan} onChange={(e) => setFormData({ ...formData, biaya_tambahan: e.target.value })} style={{ ...inputStyle, padding: "10px 12px" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                            </div>

                            {/* Pajak 10% (Read-only) */}
                            <div style={{ background: "linear-gradient(135deg, #fef3c7, #fffbeb)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #fcd34d" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", display: "flex", alignItems: "center", gap: "6px" }}>📊 Pajak (10% dari subtotal)</label>
                                    <span style={{ padding: "3px 10px", backgroundColor: "#f59e0b", color: "white", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>10%</span>
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: "700", color: "#92400e" }}>
                                    {formatCurrency(computeTax())}
                                </div>
                                <p style={{ fontSize: "11px", color: "#b45309", margin: "6px 0 0 0" }}>Pajak dihitung otomatis 10% dari subtotal dan tidak dapat diubah</p>
                            </div>

                            {/* Summary */}
                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #86efac" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "13px", color: "#166534" }}>Subtotal</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(computeSubtotal())}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "13px", color: "#166534" }}>Pajak (10%)</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(computeTax())}</span>
                                </div>
                                {(parseInt(formData.biaya_tambahan) || 0) > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "13px", color: "#166534" }}>Biaya Tambahan</span>
                                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>+{formatCurrency(parseInt(formData.biaya_tambahan) || 0)}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: "1px solid #86efac", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>Total</span>
                                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>{formatCurrency(computeFormTotal())}</span>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "14px", color: "#94a3b8", zIndex: 1 }}>📝</span>
                                <textarea placeholder="Keterangan (opsional)" value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", height: "60px", resize: "none" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                            <button onClick={handleCreateTransaction} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Transaction Modal */}
            {detailTx && (() => {
                const subtotal = getSubtotalForTx(detailTx);
                const pajak = detailTx.pajak || 0;
                const biaya = detailTx.biaya_tambahan || 0;
                const diskonPersenOrNominal = Number(detailTx.diskon) || 0;
                const diskonNominal = getDiskonNominal(detailTx);
                const total = subtotal + pajak + biaya - diskonNominal;
                const sColor = getStatusColor(detailTx.status);
                const overdue = isOverdue(detailTx);
                const nextStatus = detailTx.status === "baru" ? "proses" : detailTx.status === "proses" ? "selesai" : detailTx.status === "selesai" ? "diambil" : null;
                const nextLabel = detailTx.status === "baru" ? "Proses" : detailTx.status === "proses" ? "Selesai" : detailTx.status === "selesai" ? "Diambil" : null;
                return (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
                        <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "600px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>📋</div>
                                    <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Detail Transaksi</h3><p style={{ fontSize: "13px", color: "#14b8a6", margin: "2px 0 0 0", fontWeight: "600" }}>{detailTx.kode_invoice}</p></div>
                                </div>
                                <button onClick={() => setDetailTx(null)} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569" }}><FaTimes /></button>
                            </div>
                            {/* Status Badges */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: sColor.bg, color: sColor.color }}>📦 {detailTx.status}</span>
                                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: detailTx.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: detailTx.dibayar === "dibayar" ? "#16a34a" : "#dc2626" }}>{detailTx.dibayar === "dibayar" ? "💰 Lunas" : "⏰ Belum Bayar"}</span>
                                {overdue && <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#fee2e2", color: "#dc2626", animation: "pulse 2s infinite" }}>⚠️ Terlambat</span>}
                                {diskonPersenOrNominal > 0 && <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#fef3c7", color: "#d97706" }}>🏷️ Diskon {diskonPersenOrNominal}%</span>}
                            </div>
                            {/* Payment Warning */}
                            {detailTx.dibayar !== "dibayar" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", backgroundColor: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "14px", marginBottom: "20px" }}>
                                    <span style={{ fontSize: "24px", flexShrink: 0 }}>⚠️</span>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: "700", color: "#92400e", margin: "0 0 2px 0" }}>Pembayaran Diperlukan</p>
                                        <p style={{ fontSize: "12px", color: "#b45309", margin: 0 }}>Pelanggan harus melakukan pembayaran terlebih dahulu. Laundry tidak dapat diambil sebelum pembayaran dilakukan.</p>
                                    </div>
                                </div>
                            )}
                            {/* Info Grid */}
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
                                <div style={{ padding: "12px 16px", backgroundColor: overdue ? "#fff5f5" : "#f8fafc", borderRadius: "12px", border: overdue ? "1px solid #fca5a5" : "none", position: "relative" }}>
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
                                {detailTx.tgl_bayar && (
                                    <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", borderRadius: "12px", gridColumn: "span 2" }}>
                                        <p style={{ fontSize: "11px", color: "#16a34a", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: "600" }}>Tanggal Bayar</p>
                                        <p style={{ fontSize: "14px", color: "#166534", margin: 0, fontWeight: "500" }}>{formatDateIndo(detailTx.tgl_bayar)}</p>
                                    </div>
                                )}
                            </div>
                            {/* Detail Paket */}
                            <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Detail Paket</h4>
                                <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                        <thead><tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Paket</th>
                                            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Qty</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Harga</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Subtotal</th>
                                        </tr></thead>
                                        <tbody>{detailTx.tb_detail_transaksi?.map((d, i) => (
                                            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: "500" }}>{d.tb_paket?.nama_paket || "-"}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", color: "#475569" }}>{d.qty}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569" }}>{formatCurrency(d.tb_paket?.harga || 0)}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "right", color: "#0f172a", fontWeight: "500" }}>{formatCurrency((d.qty || 0) * (d.tb_paket?.harga || 0))}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Financial Summary */}
                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "16px", padding: "16px 20px", border: "1px solid #86efac", marginBottom: "24px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "13px", color: "#166534" }}>Subtotal</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(subtotal)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "13px", color: "#166534" }}>Pajak (10%)</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{formatCurrency(pajak)}</span>
                                </div>
                                {biaya > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "13px", color: "#166534" }}>Biaya Tambahan</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>+{formatCurrency(biaya)}</span>
                                </div>}
                                {diskonNominal > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "13px", color: "#dc2626" }}>🏷️ Diskon ({diskonPersenOrNominal}%)</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626" }}>-{formatCurrency(diskonNominal)}</span>
                                </div>}
                                <div style={{ borderTop: "2px solid #86efac", paddingTop: "10px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>Total Tagihan</span>
                                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>{formatCurrency(total)}</span>
                                </div>
                            </div>
                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                {nextStatus && <button onClick={() => handleUpdateStatus(detailTx.id, nextStatus)}
                                    style={{ padding: "12px 20px", backgroundColor: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "8px" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#bfdbfe"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#dbeafe"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <FaCheck /> Majukan ke {nextLabel}
                                </button>}
                                {detailTx.dibayar !== "dibayar" && <button onClick={() => handleUpdatePayment(detailTx.id)}
                                    style={{ padding: "12px 20px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                                    💰 Tandai Dibayar
                                </button>}
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
