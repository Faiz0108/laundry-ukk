"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaPhone, FaTimes, FaUserFriends } from "react-icons/fa";
import { supabase } from "../lib/supabase";

interface Member {
    id: number;
    nama: string;
    tlp: string | null;
    alamat: string | null;
    jenis_kelamin: string | null;
    id_outlet: number | null;
    created_at: string | null;
}

export default function CustomersKasir() {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ nama: "", tlp: "", alamat: "", jenis_kelamin: "L" });
    const [saving, setSaving] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState({ nama: "", tlp: "", alamat: "", jenis_kelamin: "L" });

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("tb_member").select("*").order("id", { ascending: true });
        if (!error && data) setCustomers(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!formData.nama.trim()) return;
        const isDuplicatePhone = formData.tlp && customers.some(c => c.tlp && c.tlp === formData.tlp);
        if (isDuplicatePhone) {
            alert("Pelanggan dengan nomor telepon tersebut sudah ada!");
            return;
        }
        setSaving(true);
        const userStr = localStorage.getItem("user");
        let id_outlet = null;
        if (userStr) { const user = JSON.parse(userStr); id_outlet = user.id_outlet; }
        const { error } = await supabase.from("tb_member").insert({ nama: formData.nama, tlp: formData.tlp, alamat: formData.alamat, jenis_kelamin: formData.jenis_kelamin, id_outlet });
        if (!error) { setFormData({ nama: "", tlp: "", alamat: "", jenis_kelamin: "L" }); setShowModal(false); fetchCustomers(); }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus pelanggan ini?")) return;
        const { error } = await supabase.from("tb_member").delete().eq("id", id);
        if (!error) fetchCustomers();
    };

    const openEdit = (c: Member) => {
        setEditCustomer(c);
        setEditForm({ nama: c.nama, tlp: c.tlp || "", alamat: c.alamat || "", jenis_kelamin: c.jenis_kelamin || "L" });
    };

    const handleEdit = async () => {
        if (!editCustomer || !editForm.nama.trim()) return;
        const isDuplicatePhone = editForm.tlp && customers.some(c => c.id !== editCustomer.id && c.tlp && c.tlp === editForm.tlp);
        if (isDuplicatePhone) {
            alert("Pelanggan dengan nomor telepon tersebut sudah ada!");
            return;
        }
        setSaving(true);
        const { error } = await supabase.from("tb_member").update({ nama: editForm.nama, tlp: editForm.tlp, alamat: editForm.alamat, jenis_kelamin: editForm.jenis_kelamin }).eq("id", editCustomer.id);
        if (!error) { setEditCustomer(null); fetchCustomers(); }
        setSaving(false);
    };

    const filteredCustomers = customers.filter(c => c.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (c.tlp && c.tlp.includes(searchTerm)));

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    const renderModal = (title: string, data: typeof formData, setData: (d: typeof formData) => void, onSave: () => void, onClose: () => void) => (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
            <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}>
                            {title.includes("Tambah") ? <FaPlus /> : <FaEdit />}
                        </div>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>{title}</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Lengkapi informasi pelanggan</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}><FaTimes /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                        <input type="text" placeholder="Nama Lengkap" value={data.nama} onChange={(e) => setData({ ...data, nama: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📞</span>
                        <input type="text" placeholder="No. Telepon" value={data.tlp} onChange={(e) => setData({ ...data, tlp: e.target.value.replace(/\D/g, "") })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "14px", color: "#94a3b8", zIndex: 1 }}>📍</span>
                        <textarea placeholder="Alamat" value={data.alamat} onChange={(e) => setData({ ...data, alamat: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", height: "80px", resize: "none" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>⚧</span>
                        <select value={data.jenis_kelamin} onChange={(e) => setData({ ...data, jenis_kelamin: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                            <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                    <button onClick={onClose} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                    <button onClick={onSave} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                        onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; } }}
                        onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                </div>
            </div>
        </div>
    );

    return (
        <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaUserFriends /></div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Data Pelanggan</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>Kelola data pelanggan laundry</span>
                                <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Total {filteredCustomers.length} pelanggan</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                        <FaPlus /> Tambah Pelanggan
                    </button>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                    <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                    <input type="text" placeholder="Cari pelanggan berdasarkan nama atau telepon..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", border: "1px solid #e2e8f0", width: "100%" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#14b8a6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                        <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data pelanggan...</p>
                    </div>
                ) : (
                    <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>No</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Telepon</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alamat</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jenis Kelamin</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center" }}>
                                        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>👥</div>
                                        <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>{searchTerm ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}</p>
                                        <p style={{ color: "#94a3b8", fontSize: "14px" }}>{searchTerm ? "Coba kata kunci lain" : "Klik 'Tambah Pelanggan' untuk memulai"}</p>
                                    </td></tr>
                                ) : filteredCustomers.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.03}s both` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                        <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                        <td style={{ padding: "16px 20px", color: "#0f172a", fontWeight: "600" }}>{c.nama}</td>
                                        <td style={{ padding: "16px 20px", color: "#475569" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ color: "#14b8a6", fontSize: "12px", display: "flex" }}><FaPhone /></span>{c.tlp || "-"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", color: "#475569" }}>{c.alamat || "-"}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: c.jenis_kelamin === "L" ? "#dbeafe" : "#fce7f3", color: c.jenis_kelamin === "L" ? "#2563eb" : "#db2777" }}>
                                                {c.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                <button onClick={() => openEdit(c)} style={{ padding: "10px", background: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#bfdbfe"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1)"; }}><FaEdit /></button>
                                                <button onClick={() => handleDelete(c.id)} style={{ padding: "10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fecaca"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1)"; }}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <div>Pelanggan Kasir</div>
                <div style={{ display: "flex", gap: "16px" }}>
                    <span>Total {customers.length} pelanggan</span>
                    <span suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
            </div>

            {showModal && renderModal("Tambah Pelanggan", formData, setFormData, handleAdd, () => setShowModal(false))}
            {editCustomer && renderModal("Edit Pelanggan", editForm, setEditForm, handleEdit, () => setEditCustomer(null))}

            <style jsx>{`
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
