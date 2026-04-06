"use client";

import { useState, useEffect } from "react";
import CustomerForm from "./customerform";
import { FaEdit, FaTrash, FaTimes, FaUserFriends } from "react-icons/fa";
import { supabase } from "../lib/supabase";

interface Member {
    id: number;
    nama: string;
    tlp: string | null;
    alamat: string | null;
    jenis_kelamin: string | null;
    id_outlet: number | null;
    created_at: string | null;
    tb_outlet?: { nama: string } | null;
}

export default function CustomersAdmin() {
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [editCustomer, setEditCustomer] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState({ nama: "", tlp: "", alamat: "", jenis_kelamin: "L" });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("tb_member").select("*, tb_outlet(nama)").order("id", { ascending: true });
        if (!error && data) setCustomers(data);
        setLoading(false);
    };

    const handleFormSubmit = async (data: { name: string; phone: string; address: string; province: string; gender: string }) => {
        const isDuplicatePhone = data.phone && customers.some(c => c.tlp && c.tlp === data.phone);
        if (isDuplicatePhone) {
            alert("Pelanggan dengan nomor telepon tersebut sudah ada!");
            return;
        }
        const userStr = localStorage.getItem("user");
        let id_outlet = null;
        if (userStr) { const user = JSON.parse(userStr); id_outlet = user.id_outlet; }
        const { error } = await supabase.from("tb_member").insert({ nama: data.name, tlp: data.phone, alamat: data.address, jenis_kelamin: data.gender, id_outlet });
        if (!error) { setShowForm(false); fetchCustomers(); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus member ini?")) return;
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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
    };

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    return (
        <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaUserFriends /></div>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Registrasi Pelanggan</h1>
                            <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0" }}>Kelola data member dan pelanggan</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                        + Tambahkan Pelanggan Baru
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                {showForm ? (
                    <CustomerForm onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />
                ) : loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#14b8a6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                        <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data member...</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                        <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Daftar Member / Pelanggan</h2>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Telepon</th>
                                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alamat</th>
                                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Toko</th>
                                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tgl Daftar</th>
                                        <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Belum ada member</td></tr>
                                    ) : customers.map((customer, idx) => (
                                        <tr key={customer.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.03}s both` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "500" }}>{customer.nama}</td>
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{customer.tlp || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{customer.alamat || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{customer.tb_outlet?.nama || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{formatDate(customer.created_at)}</td>
                                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                    <button onClick={() => openEdit(customer)} style={{ padding: "10px", backgroundColor: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "10px", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#bfdbfe"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1)"; }}><FaEdit /></button>
                                                    <button onClick={() => handleDelete(customer.id)} style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "10px", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fecaca"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1)"; }}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease 0.2s both" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>📊</span> Ringkasan
                            </h3>
                            <div style={{ textAlign: "center", marginBottom: "24px", background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)", borderRadius: "16px", padding: "24px" }}>
                                <p style={{ fontSize: "42px", fontWeight: "700", color: "#14b8a6", margin: "0 0 4px 0" }}>{customers.length}</p>
                                <p style={{ fontSize: "14px", color: "#0d9488", fontWeight: "500" }}>Total Member</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px" }}>
                                    <span style={{ fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>👨 Laki-laki</span>
                                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#2563eb" }}>{customers.filter(c => c.jenis_kelamin === "L").length}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px" }}>
                                    <span style={{ fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>👩 Perempuan</span>
                                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#db2777" }}>{customers.filter(c => c.jenis_kelamin === "P").length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <div>Customer Admin</div>
                <div style={{ display: "flex", gap: "16px" }}>
                    <span>Total {customers.length} member</span>
                    <span suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
            </div>

            {/* Edit Modal */}
            {editCustomer && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
                    <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaEdit /></div>
                                <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Edit Pelanggan</h3><p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Perbarui informasi pelanggan</p></div>
                            </div>
                            <button onClick={() => setEditCustomer(null)} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569", transition: "all 0.2s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}><FaTimes /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                                <input type="text" placeholder="Nama" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📞</span>
                                <input type="text" placeholder="No. Telepon" value={editForm.tlp} onChange={(e) => setEditForm({ ...editForm, tlp: e.target.value.replace(/\D/g, "") })} style={{ ...inputStyle, paddingLeft: "44px" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "14px", color: "#94a3b8", zIndex: 1 }}>📍</span>
                                <textarea placeholder="Alamat" value={editForm.alamat} onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", height: "80px", resize: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                            <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>⚧</span>
                                <select value={editForm.jenis_kelamin} onChange={(e) => setEditForm({ ...editForm, jenis_kelamin: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                                </select></div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                            <button onClick={() => setEditCustomer(null)} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                            <button onClick={handleEdit} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; } }}
                                onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                        </div>
                    </div>
                </div>
            )}

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
