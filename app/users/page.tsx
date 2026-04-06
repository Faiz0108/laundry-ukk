"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaUserShield, FaUserTie, FaUser, FaTimes, FaUsers } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface UserData {
    id: number;
    auth_id: string | null;
    nama: string;
    username: string;
    id_outlet: number | null;
    role: string | null;
    created_at: string | null;
    tlp: string | null;
    tb_outlet?: { nama: string } | null;
}

export default function UsersPage() {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [outlets, setOutlets] = useState<{ id: number; nama: string }[]>([]);
    const [formData, setFormData] = useState({ nama: "", Pengguna: "", password: "", tlp: "", role: "", id_outlet: "" });
    const [saving, setSaving] = useState(false);
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState({ nama: "", Pengguna: "", tlp: "", role: "", id_outlet: "" });
    const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchOutlets();
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setLoggedInUserId(user.id);
            } catch (e) { }
        }
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("tb_user").select("*, tb_outlet(nama)").order("id", { ascending: true });
        if (!error && data) setUsers(data);
        setLoading(false);
    };

    const fetchOutlets = async () => {
        const { data } = await supabase.from("tb_outlet").select("id, nama");
        if (data) setOutlets(data);
    };

    const handleAdd = async () => {
        if (!formData.nama.trim() || !formData.Pengguna.trim() || !formData.role) {
            alert("Harap lengkapi nama, username, dan role");
            return;
        }
        if (!formData.password.trim() || formData.password.length < 6) {
            alert("Kata sandi minimal 6 karakter");
            return;
        }

        setSaving(true);
        const email = `${formData.Pengguna.trim()}@gmail.com`;

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: formData.password,
        });

        if (authError) {
            alert(authError.message.includes("already registered") ? "Username sudah terdaftar" : authError.message);
            setSaving(false);
            return;
        }

        // 2. Insert DB
        const roleLower = formData.role.toLowerCase();
        const isGlobalRole = roleLower === "admin" || roleLower === "owner";
        
        const { error } = await supabase.from("tb_user").insert({
            nama: formData.nama,
            username: formData.Pengguna,
            role: roleLower,
            id_outlet: isGlobalRole ? null : (formData.id_outlet ? parseInt(formData.id_outlet) : null),
            tlp: formData.tlp.trim() || null,
            auth_id: authData?.user?.id || null
        });

        if (!error) {
            setFormData({ nama: "", Pengguna: "", password: "", tlp: "", role: "", id_outlet: "" });
            setShowModal(false);
            fetchUsers();
        } else {
            alert("Error menyimpan pengguna: " + error.message);
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus user ini?")) return;
        const { error } = await supabase.from("tb_user").delete().eq("id", id);
        if (!error) fetchUsers();
    };

    const openEdit = (u: UserData) => {
        setEditUser(u);
        setEditForm({ nama: u.nama, Pengguna: u.username, tlp: u.tlp || "", role: u.role || "", id_outlet: u.id_outlet ? String(u.id_outlet) : "" });
    };

    const handleEdit = async () => {
        if (!editUser || !editForm.nama.trim() || !editForm.Pengguna.trim()) return;
        setSaving(true);
        const roleLower = editForm.role.toLowerCase();
        const isGlobalRole = roleLower === "admin" || roleLower === "owner";

        const { error } = await supabase.from("tb_user").update({
            nama: editForm.nama,
            username: editForm.Pengguna,
            tlp: editForm.tlp.trim() || null,
            role: roleLower,
            id_outlet: isGlobalRole ? null : (editForm.id_outlet ? parseInt(editForm.id_outlet) : null)
        }).eq("id", editUser.id);
        if (!error) { setEditUser(null); fetchUsers(); }
        setSaving(false);
    };

    const filteredUsers = users.filter(u => u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase()) || (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase())));
    const getRoleIcon = (role: string | null) => { switch (role) { case "admin": return <FaUserShield />; case "owner": return <FaUserTie />; default: return <FaUser />; } };
    const getRoleColor = (role: string | null) => { switch (role) { case "admin": return { bg: "#ede9fe", color: "#7c3aed" }; case "owner": return { bg: "#ffedd5", color: "#f97316" }; case "kasir": return { bg: "#ccfbf1", color: "#14b8a6" }; default: return { bg: "#e5e7eb", color: "#6b7280" }; } };

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    const renderAddModal = (onClose: () => void) => (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
            <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}>
                            <FaPlus />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Tambah Pengguna</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Lengkapi informasi pengguna</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}><FaTimes /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                        <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📧</span>
                        <input type="text" placeholder="Username" value={formData.Pengguna} onChange={(e) => setFormData({ ...formData, Pengguna: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🔑</span>
                        <input type="password" placeholder="Kata Sandi (Minimal 6 karakter)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📞</span>
                        <input type="text" placeholder="Nomor Telepon (Opsional)" value={formData.tlp} onChange={(e) => setFormData({ ...formData, tlp: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🛡️</span>
                            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                <option value="">Pilih Role</option><option value="kasir">Kasir</option>
                            </select>
                        </div>
                        {(formData.role === "kasir" || !formData.role) && (
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🏪</span>
                                <select value={formData.id_outlet} onChange={(e) => setFormData({ ...formData, id_outlet: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Outlet</option>
                                    {outlets.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                    <button onClick={onClose} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                    <button onClick={handleAdd} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                        onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; } }}
                        onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                </div>
            </div>
        </div>
    );

    const isEditRoleLocked = editUser ? (editUser.role === "admin" || editUser.role === "owner") : false;

    const renderEditModal = (onClose: () => void) => (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
            <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}>
                            <FaEdit />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Edit Pengguna</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Perbarui informasi pengguna</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}><FaTimes /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                        <input type="text" placeholder="Nama Lengkap" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📧</span>
                        <input type="text" placeholder="Username" value={editForm.Pengguna} onChange={(e) => setEditForm({ ...editForm, Pengguna: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📞</span>
                        <input type="text" placeholder="Nomor Telepon (Opsional)" value={editForm.tlp} onChange={(e) => setEditForm({ ...editForm, tlp: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🛡️</span>
                            {isEditRoleLocked ? (
                                <div style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", cursor: "not-allowed" }}>
                                    {editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1)}
                                </div>
                            ) : (
                                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Role</option><option value="kasir">Kasir</option>
                                </select>
                            )}
                        </div>
                        {(editForm.role === "kasir" || !editForm.role) && (
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>🏪</span>
                                <select value={editForm.id_outlet} onChange={(e) => setEditForm({ ...editForm, id_outlet: e.target.value })} style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", cursor: "pointer" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    <option value="">Pilih Outlet</option>
                                    {outlets.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                    <button onClick={onClose} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                    <button onClick={handleEdit} disabled={saving} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                        onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; } }}
                        onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; } }}>{saving ? "Menyimpan..." : "Simpan"}</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", position: "relative" }}>
            <Sidebar />
            <main style={{ flex: 1, margin: "20px 20px 20px 0", backgroundColor: "white", borderRadius: "32px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", padding: "28px 32px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)", backgroundSize: "200% 100%", animation: "gradientMove 3s ease infinite" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}>
                                <FaUsers />
                            </div>
                            <div>
                                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>Manajemen Pengguna</h1>
                                <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>Kelola akun pengguna sistem laundry</span>
                                    <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", color: "#475569" }}>Total {filteredUsers.length} pengguna</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowModal(true)} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                            <FaPlus /> Tambah Pengguna
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                            <input type="text" placeholder="Cari berdasarkan nama, username, atau role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", border: "1px solid #e2e8f0" }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", background: "white", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                            <div style={{ width: "56px", height: "56px", border: "3px solid #e2e8f0", borderTopColor: "#14b8a6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                            <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500" }}>Memuat data pengguna...</p>
                        </div>
                    ) : (
                        <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>No</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Peran</th>
                                        <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Toko</th>
                                        <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center" }}>
                                            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>👤</div>
                                            <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>{searchTerm ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}</p>
                                            <p style={{ color: "#94a3b8", fontSize: "14px" }}>{searchTerm ? "Coba kata kunci lain" : "Klik 'Tambah Pengguna' untuk memulai"}</p>
                                        </td></tr>
                                    ) : filteredUsers.map((u, idx) => {
                                        const roleStyle = getRoleColor(u.role);
                                        return (
                                            <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.03}s both` }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                                <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                                <td style={{ padding: "16px 20px", color: "#0f172a", fontWeight: "600" }}>{u.nama}</td>
                                                <td style={{ padding: "16px 20px", color: "#475569" }}>{u.username}</td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: roleStyle.bg, color: roleStyle.color, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ display: "flex" }}>{getRoleIcon(u.role)}</span>
                                                        {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "-"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "16px 20px", color: "#475569" }}>
                                                    {u.role === "admin" || u.role === "owner" ? "-" : (u.tb_outlet?.nama || "-")}
                                                </td>
                                                <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                        <button onClick={() => openEdit(u)} style={{ padding: "10px", background: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.background = "#bfdbfe"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1)"; }}><FaEdit /></button>
                                                        {u.role === "kasir" && u.id !== loggedInUserId ? (
                                                            <button onClick={() => handleDelete(u.id)} style={{ padding: "10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = "#fecaca"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1)"; }}><FaTrash /></button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                    <div>© 2024 User Management System</div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <span>Total {users.length} pengguna</span>
                        <span suppressHydrationWarning>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
                    </div>
                </div>
            </main>

            {showModal && renderAddModal(() => setShowModal(false))}
            {editUser && renderEditModal(() => setEditUser(null))}

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
