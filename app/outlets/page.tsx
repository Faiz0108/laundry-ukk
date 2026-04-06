"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import OutletCard from "../../components/outletcard";
import { FaEdit, FaTrash, FaTimes, FaStore, FaPhone, FaMapMarkerAlt, FaPlus } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface Outlet {
    id: number;
    nama: string;
    alamat: string | null;
    tlp: string | null;
    created_at: string | null;
}

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newOutlet, setNewOutlet] = useState({ nama: "", alamat: "", tlp: "" });
    const [saving, setSaving] = useState(false);
    const [editOutlet, setEditOutlet] = useState<Outlet | null>(null);
    const [editForm, setEditForm] = useState({ nama: "", alamat: "", tlp: "" });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => { fetchOutlets(); }, []);

    const fetchOutlets = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("tb_outlet").select("*").order("id", { ascending: true });
        if (!error && data) setOutlets(data);
        setLoading(false);
    };

    const handleAddOutlet = async () => {
        if (!newOutlet.nama.trim()) return;

        const isDuplicate = outlets.some(
            (o) => o.nama.toLowerCase() === newOutlet.nama.trim().toLowerCase() || (o.tlp && newOutlet.tlp && o.tlp === newOutlet.tlp)
        );
        if (isDuplicate) {
            alert("Toko dengan nama atau nomor telepon tersebut sudah ada!");
            return;
        }

        setSaving(true);
        const { error } = await supabase.from("tb_outlet").insert({ nama: newOutlet.nama, alamat: newOutlet.alamat, tlp: newOutlet.tlp });
        if (!error) { setNewOutlet({ nama: "", alamat: "", tlp: "" }); setShowForm(false); fetchOutlets(); }
        setSaving(false);
    };

    const handleDeleteOutlet = async (id: number) => {
        if (!confirm("Yakin ingin menghapus Toko ini?")) return;
        const { error } = await supabase.from("tb_outlet").delete().eq("id", id);
        if (!error) fetchOutlets();
    };

    const openEdit = (outlet: Outlet) => {
        setEditOutlet(outlet);
        setEditForm({ nama: outlet.nama, alamat: outlet.alamat || "", tlp: outlet.tlp || "" });
    };

    const handleEditOutlet = async () => {
        if (!editOutlet || !editForm.nama.trim()) return;

        const isDuplicate = outlets.some(
            (o) => o.id !== editOutlet.id && (o.nama.toLowerCase() === editForm.nama.trim().toLowerCase() || (o.tlp && editForm.tlp && o.tlp === editForm.tlp))
        );
        if (isDuplicate) {
            alert("Toko dengan nama atau nomor telepon tersebut sudah ada!");
            return;
        }

        setSaving(true);
        const { error } = await supabase.from("tb_outlet").update({ nama: editForm.nama, alamat: editForm.alamat, tlp: editForm.tlp }).eq("id", editOutlet.id);
        if (!error) { setEditOutlet(null); fetchOutlets(); }
        setSaving(false);
    };

    // Filter outlets berdasarkan pencarian
    const filteredOutlets = outlets.filter(outlet =>
        outlet.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (outlet.alamat && outlet.alamat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (outlet.tlp && outlet.tlp.includes(searchTerm))
    );

    const inputStyle = {
        padding: "12px 16px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box" as const,
        transition: "all 0.2s ease",
        outline: "none",
        backgroundColor: "#f8fafc"
    };

    const inputFocusStyle = {
        borderColor: "#14b8a6",
        boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.1)"
    };

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
                flexDirection: "column",
                position: "relative",
                zIndex: 1
            }}>
                {/* Header dengan gradient */}
                <div style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    padding: "24px 32px",
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
                        marginBottom: "20px"
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
                                fontSize: "24px",
                                boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)"
                            }}>
                                <FaStore />
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#0f172a",
                                    margin: 0,
                                    letterSpacing: "-0.01em"
                                }}>
                                    Manajemen Toko
                                </h1>
                                <p style={{
                                    fontSize: "14px",
                                    color: "#475569",
                                    margin: "4px 0 0 0"
                                }}>
                                    Kelola semua Toko Anda dengan mudah
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{
                                padding: "12px 24px",
                                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                color: "white",
                                border: "none",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.02)";
                                e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)";
                            }}>
                            <FaPlus />
                            Tambah Toko Baru
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center"
                    }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Cari Toko berdasarkan nama, alamat, atau telepon..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    paddingLeft: "44px",
                                    backgroundColor: "white",
                                    border: "1px solid #e2e8f0"
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
                            <span style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#94a3b8",
                                fontSize: "16px"
                            }}>🔍</span>
                        </div>
                        <div style={{
                            background: "#f1f5f9",
                            padding: "8px 16px",
                            borderRadius: "12px",
                            color: "#475569",
                            fontSize: "14px",
                            fontWeight: "500"
                        }}>
                            Total: {filteredOutlets.length} Toko
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "32px",
                    background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)"
                }}>
                    {showForm && (
                        <div style={{
                            background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                            borderRadius: "24px",
                            padding: "28px",
                            marginBottom: "32px",
                            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(20, 184, 166, 0.1) inset",
                            border: "1px solid rgba(20, 184, 166, 0.2)",
                            animation: "slideDown 0.3s ease"
                        }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#0f172a",
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "16px"
                                }}>+</span>
                                Tambah Toko Baru
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ position: "relative" }}>
                                    <span style={{
                                        position: "absolute",
                                        left: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#94a3b8",
                                        zIndex: 1
                                    }}>🏪</span>
                                    <input
                                        type="text"
                                        placeholder="Nama Toko"
                                        value={newOutlet.nama}
                                        onChange={(e) => setNewOutlet({ ...newOutlet, nama: e.target.value })}
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
                                    }}>📍</span>
                                    <input
                                        type="text"
                                        placeholder="Alamat"
                                        value={newOutlet.alamat}
                                        onChange={(e) => setNewOutlet({ ...newOutlet, alamat: e.target.value })}
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
                                    }}>📞</span>
                                    <input
                                        type="text"
                                        placeholder="Telepon"
                                        value={newOutlet.tlp}
                                        onChange={(e) => setNewOutlet({ ...newOutlet, tlp: e.target.value.replace(/\D/g, "") })}
                                        style={{ ...inputStyle, paddingLeft: "44px" }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                    <button
                                        onClick={handleAddOutlet}
                                        disabled={saving}
                                        style={{
                                            padding: "12px 28px",
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
                                        {saving ? "Menyimpan..." : "Simpan Toko"}
                                    </button>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        style={{
                                            padding: "12px 28px",
                                            backgroundColor: "#f1f5f9",
                                            color: "#475569",
                                            border: "none",
                                            borderRadius: "12px",
                                            fontSize: "14px",
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
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "60px",
                            background: "white",
                            borderRadius: "24px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                border: "3px solid #e2e8f0",
                                borderTopColor: "#14b8a6",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                marginBottom: "16px"
                            }} />
                            <p style={{ color: "#475569", fontSize: "14px" }}>Memuat data Toko...</p>
                        </div>
                    ) : filteredOutlets.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "60px",
                            background: "white",
                            borderRadius: "24px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}>
                            <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🏪</span>
                            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
                                {searchTerm ? "Toko tidak ditemukan" : "Belum ada Toko"}
                            </h3>
                            <p style={{ color: "#64748b", fontSize: "14px" }}>
                                {searchTerm ? "Coba gunakan kata kunci lain" : "Klik tombol 'Tambah Toko Baru' untuk memulai"}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                            gap: "24px",
                            animation: "fadeIn 0.5s ease"
                        }}>
                            {filteredOutlets.map((outlet, index) => (
                                <div
                                    key={outlet.id}
                                    style={{
                                        animation: `slideInUp 0.3s ease ${index * 0.05}s both`
                                    }}
                                >
                                    <OutletCard
                                        name={outlet.nama}
                                        address={outlet.alamat || "-"}
                                        phone={outlet.tlp || "-"}
                                        status="Active"
                                        onEdit={() => openEdit(outlet)}
                                        onDelete={() => handleDeleteOutlet(outlet.id)}
                                    />
                                </div>
                            ))}
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
                    <div>© 2024 Toko Management System</div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <span style={{ cursor: "default" }}>Total {filteredOutlets.length} Toko</span>
                        <span style={{ cursor: "default" }} suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            {editOutlet && (
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
                        width: "500px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        animation: "scaleIn 0.3s ease",
                        transform: "scale(1)"
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px"
                        }}>
                            <h3 style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#0f172a",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "16px"
                                }}>✎</span>
                                Edit Toko
                            </h3>
                            <button
                                onClick={() => setEditOutlet(null)}
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    zIndex: 1
                                }}>🏪</span>
                                <input
                                    type="text"
                                    placeholder="Nama Outlet"
                                    value={editForm.nama}
                                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
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
                                }}>📍</span>
                                <input
                                    type="text"
                                    placeholder="Alamat"
                                    value={editForm.alamat}
                                    onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
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
                                }}>📞</span>
                                <input
                                    type="text"
                                    placeholder="Telepon"
                                    value={editForm.tlp}
                                    onChange={(e) => setEditForm({ ...editForm, tlp: e.target.value.replace(/\D/g, "") })}
                                    style={{ ...inputStyle, paddingLeft: "44px" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                                />
                            </div>
                        </div>
                        <div style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                            marginTop: "28px"
                        }}>
                            <button
                                onClick={() => setEditOutlet(null)}
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#475569",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "14px",
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
                                onClick={handleEditOutlet}
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
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animations */}
            <style jsx>{`
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
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