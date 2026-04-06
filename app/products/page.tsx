"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaBox, FaTshirt, FaTimes, FaStore, FaTag, FaMoneyBillWave } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface Paket {
    id: number;
    id_outlet: number | null;
    jenis: string | null;
    nama_paket: string;
    harga: number;
    created_at: string | null;
    tb_outlet?: { nama: string } | null;
}

export default function ProductsPage() {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Paket[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ nama_paket: "", jenis: "kiloan", harga: "", id_outlet: "" });
    const [outlets, setOutlets] = useState<{ id: number; nama: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [editProduct, setEditProduct] = useState<Paket | null>(null);
    const [editForm, setEditForm] = useState({ nama_paket: "", jenis: "kiloan", harga: "", id_outlet: "" });
    const [jenisFilter, setJenisFilter] = useState<string>("");
    const [userOutletId, setUserOutletId] = useState<number | null>(null);
    const [userOutletNama, setUserOutletNama] = useState<string>("");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.id_outlet) {
                    setUserOutletId(user.id_outlet);
                    setUserOutletNama(user.outlet_nama || "");
                    setFormData(prev => ({ ...prev, id_outlet: String(user.id_outlet) }));
                }
            } catch (e) {}
        }
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [userOutletId]);

    const fetchProducts = async () => {
        setLoading(true);
        let query = supabase.from("tb_paket").select("*, tb_outlet(nama)").order("id", { ascending: true });
        if (userOutletId) {
            query = query.eq("id_outlet", userOutletId);
        }
        const { data, error } = await query;
        if (!error && data) setProducts(data);
        setLoading(false);
    };

    const fetchOutlets = async () => {
        const { data } = await supabase.from("tb_outlet").select("id, nama");
        if (data) setOutlets(data);
    };

    const handleAdd = async () => {
        if (!formData.nama_paket.trim() || !formData.harga) return;

        const isDuplicate = products.some(
            (p) => p.nama_paket.toLowerCase() === formData.nama_paket.trim().toLowerCase()
        );
        if (isDuplicate) {
            alert("Paket dengan nama tersebut sudah ada!");
            return;
        }

        setSaving(true);
        const outletId = formData.id_outlet ? parseInt(formData.id_outlet) : null;
        const { error } = await supabase.from("tb_paket").insert({ nama_paket: formData.nama_paket, jenis: formData.jenis, harga: parseInt(formData.harga), id_outlet: outletId });
        if (!error) { setFormData({ nama_paket: "", jenis: "kiloan", harga: "", id_outlet: userOutletId ? String(userOutletId) : "" }); setShowModal(false); fetchProducts(); }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus paket ini?")) return;
        const { error } = await supabase.from("tb_paket").delete().eq("id", id);
        if (!error) fetchProducts();
    };

    const openEdit = (p: Paket) => {
        setEditProduct(p);
        setEditForm({ nama_paket: p.nama_paket, jenis: p.jenis || "kiloan", harga: String(p.harga), id_outlet: p.id_outlet ? String(p.id_outlet) : "" });
    };

    const handleEdit = async () => {
        if (!editProduct || !editForm.nama_paket.trim() || !editForm.harga) return;

        const isDuplicate = products.some(
            (p) => p.id !== editProduct.id && p.nama_paket.toLowerCase() === editForm.nama_paket.trim().toLowerCase()
        );
        if (isDuplicate) {
            alert("Paket dengan nama tersebut sudah ada!");
            return;
        }

        setSaving(true);
        const outletId = editForm.id_outlet ? parseInt(editForm.id_outlet) : null;
        const { error } = await supabase.from("tb_paket").update({ nama_paket: editForm.nama_paket, jenis: editForm.jenis, harga: parseInt(editForm.harga), id_outlet: outletId }).eq("id", editProduct.id);
        if (!error) { setEditProduct(null); fetchProducts(); }
        setSaving(false);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nama_paket.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.jenis && p.jenis.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesJenis = jenisFilter ? p.jenis === jenisFilter : true;
        return matchesSearch && matchesJenis;
    });

    const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    const getJenisLabel = (jenis: string | null) => {
        const l: Record<string, { label: string; color: string; icon: any }> = {
            kiloan: { label: "Kiloan", color: "#10b981", icon: <FaTshirt /> },
            selimut: { label: "Selimut", color: "#8b5cf6", icon: <FaBox /> },
            bed_cover: { label: "Bed Cover", color: "#f59e0b", icon: <FaBox /> },
            kaos: { label: "Kaos", color: "#3b82f6", icon: <FaTshirt /> },
            lain: { label: "Lainnya", color: "#6b7280", icon: <FaBox /> }
        };
        return l[jenis || ""] || { label: jenis || "-", color: "#6b7280", icon: <FaBox /> };
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        fontSize: "14px",
        boxSizing: "border-box" as const,
        transition: "all 0.2s ease",
        outline: "none",
        backgroundColor: "#f8fafc"
    };

    const renderFormModal = (title: string, data: typeof formData, setData: (d: typeof formData) => void, onSave: () => void, onClose: () => void) => (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease"
        }}>
            <div style={{
                backgroundColor: "white",
                borderRadius: "24px",
                padding: "32px",
                width: "550px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                animation: "scaleIn 0.3s ease",
                transform: "scale(1)"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "28px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "20px",
                            boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)"
                        }}>
                            {title.includes("Tambah") ? <FaPlus /> : <FaEdit />}
                        </div>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
                                {title}
                            </h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                                Lengkapi informasi produk di bawah ini
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px",
                            backgroundColor: "#f1f5f9",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "flex",
                            color: "#475569",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e2e8f0";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}>
                        <FaTimes />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                            zIndex: 1
                        }}>📦</span>
                        <input
                            type="text"
                            placeholder="Nama Paket"
                            value={data.nama_paket}
                            onChange={(e) => setData({ ...data, nama_paket: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                        />
                    </div>

                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                            zIndex: 1
                        }}>🏷️</span>
                        <select
                            value={data.jenis}
                            onChange={(e) => setData({ ...data, jenis: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                            <option value="kiloan">Kiloan</option>
                            <option value="selimut">Selimut</option>
                            <option value="bed_cover">Bed Cover</option>
                            <option value="kaos">Kaos</option>
                            <option value="lain">Lainnya</option>
                        </select>
                    </div>

                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                            zIndex: 1
                        }}>💰</span>
                        <input
                            type="number"
                            placeholder="Harga"
                            value={data.harga}
                            onChange={(e) => setData({ ...data, harga: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                        />
                    </div>

                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                            zIndex: 1
                        }}>🏪</span>
                        <select
                            value={data.id_outlet}
                            onChange={(e) => setData({ ...data, id_outlet: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                            <option value="">Pilih Toko</option>
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    marginTop: "32px"
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e2e8f0";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}>
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        style={{
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.7 : 1,
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)"
                        }}
                        onMouseEnter={(e) => {
                            if (!saving) {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!saving) {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)";
                            }
                        }}>
                        {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            background: "#f8fafc",
            position: "relative"
        }}>
            <Sidebar />

            <main style={{
                flex: 1,
                margin: "20px 20px 20px 0",
                backgroundColor: "white",
                borderRadius: "32px",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Header */}
                <div style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    padding: "28px 32px",
                    borderBottom: "1px solid #e2e8f0",
                    position: "relative"
                }}>
                    {/* Decorative header line */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)",
                        backgroundSize: "200% 100%",
                        animation: "gradientMove 3s ease infinite"
                    }} />

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{
                                width: "56px",
                                height: "56px",
                                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                borderRadius: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "28px",
                                boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)"
                            }}>
                                <FaBox />
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: "28px",
                                    fontWeight: "700",
                                    color: "#0f172a",
                                    margin: 0,
                                    letterSpacing: "-0.01em"
                                }}>
                                    Manajemen Produk
                                </h1>
                                <p style={{
                                    fontSize: "14px",
                                    color: "#475569",
                                    margin: "4px 0 0 0",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    <span>Kelola produk dan paket layanan laundry</span>
                                    <span style={{
                                        background: "#e2e8f0",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "12px",
                                        color: "#475569"
                                    }}>
                                        Total {filteredProducts.length} produk
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                padding: "14px 28px",
                                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                color: "white",
                                border: "none",
                                borderRadius: "16px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)";
                            }}>
                            <FaPlus />
                            Tambah Produk Baru
                        </button>
                    </div>

                    {/* Search and Filter Section */}
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center"
                    }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <span style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#94a3b8",
                                fontSize: "16px",
                                zIndex: 1
                            }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama produk atau kategori..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    paddingLeft: "48px",
                                    paddingRight: "48px",
                                    backgroundColor: "white",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "14px"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#14b8a6";
                                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#94a3b8",
                                        fontSize: "14px"
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            value={jenisFilter}
                            onChange={(e) => setJenisFilter(e.target.value)}
                            style={{
                                ...inputStyle,
                                width: "200px",
                                backgroundColor: "white",
                                cursor: "pointer"
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                            <option value="">Semua Kategori</option>
                            <option value="kiloan">Kiloan</option>
                            <option value="selimut">Selimut</option>
                            <option value="bed_cover">Bed Cover</option>
                            <option value="kaos">Kaos</option>
                            <option value="lain">Lainnya</option>
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "28px 32px",
                    background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)"
                }}>
                    {loading ? (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px",
                            background: "white",
                            borderRadius: "24px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}>
                            <div style={{
                                width: "56px",
                                height: "56px",
                                border: "3px solid #e2e8f0",
                                borderTopColor: "#14b8a6",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                marginBottom: "20px"
                            }} />
                            <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data produk...</p>
                        </div>
                    ) : (
                        <div style={{
                            background: "white",
                            borderRadius: "24px",
                            overflow: "hidden",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)",
                            animation: "fadeIn 0.5s ease"
                        }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{
                                        background: "#f8fafc",
                                        borderBottom: "1px solid #e2e8f0"
                                    }}>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>No</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama Paket</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kategori</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Harga</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Toko</th>
                                        <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: "60px", textAlign: "center" }}>
                                                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📦</div>
                                                <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>
                                                    {searchTerm || jenisFilter ? "Produk tidak ditemukan" : "Belum ada produk"}
                                                </p>
                                                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                                                    {searchTerm || jenisFilter ? "Coba gunakan kata kunci lain" : "Klik tombol 'Tambah Produk Baru' untuk memulai"}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.map((p, idx) => {
                                        const jenisInfo = getJenisLabel(p.jenis);
                                        return (
                                            <tr
                                                key={p.id}
                                                style={{
                                                    borderBottom: "1px solid #e2e8f0",
                                                    backgroundColor: "white",
                                                    transition: "background-color 0.2s ease",
                                                    animation: `slideInUp 0.3s ease ${idx * 0.03}s both`
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                }}
                                            >
                                                <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                                <td style={{ padding: "16px 20px", color: "#0f172a", fontWeight: "600" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <span style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            background: "#f1f5f9",
                                                            borderRadius: "10px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: jenisInfo.color,
                                                            fontSize: "16px"
                                                        }}>
                                                            {jenisInfo.icon}
                                                        </span>
                                                        <span>{p.nama_paket}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <span style={{
                                                        background: `${jenisInfo.color}15`,
                                                        color: jenisInfo.color,
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "500",
                                                        display: "inline-block"
                                                    }}>
                                                        {jenisInfo.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0f172a" }}>
                                                    {formatPrice(p.harga)}
                                                </td>
                                                <td style={{ padding: "16px 20px", color: "#475569" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <FaStore size={12} color="#94a3b8" />
                                                        {p.tb_outlet?.nama || "-"}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                        <button
                                                            onClick={() => openEdit(p)}
                                                            style={{
                                                                padding: "10px",
                                                                background: "#dbeafe",
                                                                color: "#2563eb",
                                                                border: "none",
                                                                borderRadius: "10px",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "15px",
                                                                transition: "all 0.2s ease"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = "#bfdbfe";
                                                                e.currentTarget.style.transform = "scale(1.05)";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = "#dbeafe";
                                                                e.currentTarget.style.transform = "scale(1)";
                                                            }}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            style={{
                                                                padding: "10px",
                                                                background: "#fee2e2",
                                                                color: "#dc2626",
                                                                border: "none",
                                                                borderRadius: "10px",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "15px",
                                                                transition: "all 0.2s ease"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = "#fecaca";
                                                                e.currentTarget.style.transform = "scale(1.05)";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = "#fee2e2";
                                                                e.currentTarget.style.transform = "scale(1)";
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Table Footer */}
                            {filteredProducts.length > 0 && (
                                <div style={{
                                    padding: "16px 20px",
                                    background: "#f8fafc",
                                    borderTop: "1px solid #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "13px",
                                    color: "#64748b"
                                }}>
                                    <div>Menampilkan {filteredProducts.length} dari {products.length} produk</div>
                                    <div style={{ display: "flex", gap: "16px" }}>
                                        <span>Harga termurah: {formatPrice(Math.min(...filteredProducts.map(p => p.harga)))}</span>
                                        <span>Harga termahal: {formatPrice(Math.max(...filteredProducts.map(p => p.harga)))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 32px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#64748b"
                }}>
                    <div>© 2024 Produk Management System</div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <span style={{ cursor: "default" }}>Total {products.length} produk</span>
                        <span style={{ cursor: "default" }} suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showModal && renderFormModal("Tambah Produk Baru", formData, setFormData, handleAdd, () => setShowModal(false))}
            {editProduct && renderFormModal("Edit Produk", editForm, setEditForm, handleEdit, () => setEditProduct(null))}

            {/* Animations */}
            <style jsx>{`
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}