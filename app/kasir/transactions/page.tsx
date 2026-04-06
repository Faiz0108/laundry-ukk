"use client";

import { useState, useEffect } from "react";
import SidebarKasir from "../../../components/sidebar-kasir";
import { FaPlus, FaCheck, FaTimes, FaExchangeAlt } from "react-icons/fa";
import { supabase } from "../../../lib/supabase";

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

interface Member { id: number; nama: string; }
interface Paket { id: number; nama_paket: string; harga: number; jenis: string | null; }

export default function KasirTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaksi[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [members, setMembers] = useState<Member[]>([]);
    const [pakets, setPakets] = useState<Paket[]>([]);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id_member: "", id_paket: "", qty: "1", keterangan: "",
        biaya_tambahan: "0", diskon: "0", pajak: "0",
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
        setFormData({ id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", diskon: "0", pajak: "0", tgl: t, batas_waktu: bw });
        setShowModal(true);
    };

    useEffect(() => {
        fetchTransactions();
        fetchMembers();
        fetchPakets();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("tb_transaksi")
            .select("*, tb_member(nama), tb_outlet(nama), tb_user(nama), tb_detail_transaksi(qty, tb_paket(nama_paket, harga))")
            .order("tgl", { ascending: false })
            .limit(50);
        if (!error && data) setTransactions(data);
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
                diskon: parseFloat(formData.diskon) || 0,
                pajak: parseInt(formData.pajak) || 0,
                status: "baru",
                dibayar: "belum_dibayar",
                id_user,
            })
            .select()
            .single();

        if (txError || !txData) {
            alert("Gagal membuat transaksi: " + (txError?.message || "Unknown error"));
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
            await supabase.from("tb_transaksi").delete().eq("id", txData.id);
            alert("Gagal menyimpan detail transaksi: " + detailError.message);
            setSaving(false);
            return;
        }

        setFormData({ id_member: "", id_paket: "", qty: "1", keterangan: "", biaya_tambahan: "0", diskon: "0", pajak: "0", tgl: "", batas_waktu: "" });
        setShowModal(false);
        fetchTransactions();
        setSaving(false);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        await supabase.from("tb_transaksi").update({ status: newStatus }).eq("id", id);
        fetchTransactions();
    };

    const handleUpdatePayment = async (id: number) => {
        await supabase.from("tb_transaksi").update({ dibayar: "dibayar", tgl_bayar: new Date().toISOString() }).eq("id", id);
        fetchTransactions();
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-";
    const formatCurrency = (a: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(a);

    const getTotal = (tx: Transaksi) => {
        let s = 0;
        tx.tb_detail_transaksi?.forEach(d => { s += (d.qty || 0) * (d.tb_paket?.harga || 0); });
        s += (tx.biaya_tambahan || 0) - (Number(tx.diskon) || 0) + (tx.pajak || 0);
        return s;
    };

    const getStatusColor = (s: string | null) => {
        switch (s) {
            case "baru": return { bg: "#dbeafe", c: "#2563eb" };
            case "proses": return { bg: "#fef3c7", c: "#d97706" };
            case "selesai": return { bg: "#dcfce7", c: "#16a34a" };
            case "diambil": return { bg: "#e5e7eb", c: "#6b7280" };
            default: return { bg: "#e5e7eb", c: "#6b7280" };
        }
    };

    const filtered = transactions.filter(t =>
        (t.kode_invoice.toLowerCase().includes(searchTerm.toLowerCase()) || t.tb_member?.nama?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterStatus === "all" || t.status === filterStatus)
    );

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    const thStyle = { padding: "16px 12px", textAlign: "left" as const, fontSize: "12px", color: "#64748b", fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
            <SidebarKasir />
            <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaExchangeAlt /></div>
                            <div>
                                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Entri Transaksi</h1>
                                <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>Kelola transaksi laundry</span>
                                    <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>{filtered.length} transaksi</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={openCreateModal} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                            <FaPlus /> Transaksi Baru
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                            <input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", width: "100%" }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "12px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", color: "#475569", cursor: "pointer", backgroundColor: "white", outline: "none", transition: "all 0.2s ease" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                            <option value="all">Semua Status</option>
                            <option value="baru">Baru</option>
                            <option value="proses">Proses</option>
                            <option value="selesai">Selesai</option>
                            <option value="diambil">Diambil</option>
                        </select>
                    </div>
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
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "1000px" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={thStyle}>Invoice</th>
                                            <th style={thStyle}>Pelanggan</th>
                                            <th style={thStyle}>Toko</th>
                                            <th style={thStyle}>Tanggal</th>
                                            <th style={thStyle}>Batas Waktu</th>
                                            <th style={thStyle}>Total</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Bayar</th>
                                            <th style={thStyle}>Tanggal Bayar</th>
                                            <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={10} style={{ padding: "60px", textAlign: "center" }}>
                                                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📦</div>
                                                <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500" }}>{searchTerm || filterStatus !== "all" ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</p>
                                            </td></tr>
                                        ) : filtered.map((t, i) => {
                                            const sc = getStatusColor(t.status);
                                            return (
                                                <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${i * 0.05}s both` }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                                    <td style={{ padding: "16px 12px", color: "#14b8a6", fontWeight: "600", fontSize: "12px" }}>{t.kode_invoice}</td>
                                                    <td style={{ padding: "16px 12px", color: "#0f172a", fontWeight: "500" }}>{t.tb_member?.nama || "-"}</td>
                                                    <td style={{ padding: "16px 12px", color: "#475569" }}>{t.tb_outlet?.nama || "-"}</td>
                                                    <td style={{ padding: "16px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(t.tgl)}</td>
                                                    <td style={{ padding: "16px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(t.batas_waktu)}</td>
                                                    <td style={{ padding: "16px 12px", color: "#14b8a6", fontWeight: "600", whiteSpace: "nowrap" }}>{formatCurrency(getTotal(t))}</td>
                                                    <td style={{ padding: "16px 12px" }}><span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: sc.bg, color: sc.c, whiteSpace: "nowrap" }}>{t.status}</span></td>
                                                    <td style={{ padding: "16px 12px" }}><span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: t.dibayar === "dibayar" ? "#dcfce7" : "#fee2e2", color: t.dibayar === "dibayar" ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>{t.dibayar === "dibayar" ? "Lunas" : "Belum"}</span></td>
                                                    <td style={{ padding: "16px 12px", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(t.tgl_bayar)}</td>
                                                    <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                                        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                                                            {t.status !== "diambil" && (
                                                                <button onClick={() => handleUpdateStatus(t.id, t.status === "baru" ? "proses" : t.status === "proses" ? "selesai" : "diambil")}
                                                                    style={{ padding: "8px 10px", backgroundColor: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s ease", display: "flex" }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}><FaCheck /></button>
                                                            )}
                                                            {t.dibayar !== "dibayar" && (
                                                                <button onClick={() => handleUpdatePayment(t.id)}
                                                                    style={{ padding: "7px 12px", backgroundColor: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "10px", fontSize: "12px", cursor: "pointer", transition: "all 0.2s ease", fontWeight: "500" }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                                                                    Bayar
                                                                </button>
                                                            )}
                                                        </div>
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
                    <div>Entri Transaksi</div>
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
                                    <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Transaksi Baru</h3><p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Isi detail transaksi</p></div>
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
                                {/* Layanan/Paket */}
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📦</span>
                                    <select value={formData.id_paket} onChange={(e) => setFormData({ ...formData, id_paket: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                        <option value="">Pilih Layanan</option>
                                        {pakets.map(p => <option key={p.id} value={p.id}>{p.nama_paket} - {formatCurrency(p.harga)}</option>)}
                                    </select></div>
                                {/* Berat/Qty */}
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>⚖️</span>
                                    <input type="number" placeholder="Berat (kg)/Qty" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
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

                                {/* Biaya Tambahan, Diskon, Pajak */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>💰 Biaya Tambahan</label>
                                        <input type="number" placeholder="0" value={formData.biaya_tambahan} onChange={(e) => setFormData({ ...formData, biaya_tambahan: e.target.value })} style={{ ...inputStyle, padding: "10px 12px" }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>🏷️ Diskon (Rp)</label>
                                        <input type="number" placeholder="0" value={formData.diskon} onChange={(e) => setFormData({ ...formData, diskon: e.target.value })} style={{ ...inputStyle, padding: "10px 12px" }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>📊 Pajak (Rp)</label>
                                        <input type="number" placeholder="0" value={formData.pajak} onChange={(e) => setFormData({ ...formData, pajak: e.target.value })} style={{ ...inputStyle, padding: "10px 12px" }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
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
                                    onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; } }}
                                    onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx>{`
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
