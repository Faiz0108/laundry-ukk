"use client";

import { useState } from "react";
import SidebarKasir from "../../../components/sidebar-kasir";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaPhone, FaEnvelope, FaTimes, FaUserFriends } from "react-icons/fa";

export default function KasirCustomersPage() {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const customers = [
        { id: 1, name: "Rina Melati", phone: "081234567890", email: "rina@email.com", address: "Jl. Merdeka No. 10", totalOrders: 15 },
        { id: 2, name: "Budi Santoso", phone: "082345678901", email: "budi@email.com", address: "Jl. Sudirman No. 25", totalOrders: 8 },
        { id: 3, name: "Citra Dewi", phone: "083456789012", email: "citra@email.com", address: "Jl. Gatot Subroto No. 5", totalOrders: 22 },
        { id: 4, name: "Ahmad Rizki", phone: "084567890123", email: "ahmad@email.com", address: "Jl. Diponegoro No. 15", totalOrders: 5 },
    ];

    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

    const inputStyle = {
        width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px",
        fontSize: "14px", boxSizing: "border-box" as const, transition: "all 0.2s ease",
        outline: "none", backgroundColor: "#f8fafc"
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
            <SidebarKasir />
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
                                    <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>{filteredCustomers.length} pelanggan</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowModal(true)} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.4)", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(20, 184, 166, 0.5)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(20, 184, 166, 0.4)"; }}>
                            <FaPlus /> Tambah Pelanggan
                        </button>
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
                        <input type="text" placeholder="Cari pelanggan berdasarkan nama atau telepon..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: "44px", backgroundColor: "white", width: "100%" }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }} />
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)" }}>
                    <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)", animation: "fadeIn 0.5s ease" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>No</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Telepon</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alamat</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white", transition: "background-color 0.2s ease", animation: `slideInUp 0.3s ease ${idx * 0.05}s both` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                                        <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                                        <td style={{ padding: "16px 20px", color: "#0f172a", fontWeight: "600" }}>{c.name}</td>
                                        <td style={{ padding: "16px 20px", color: "#475569" }}><span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#14b8a6", fontSize: "12px", display: "flex" }}><FaPhone /></span>{c.phone}</span></td>
                                        <td style={{ padding: "16px 20px", color: "#475569" }}><span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#f97316", fontSize: "12px", display: "flex" }}><FaEnvelope /></span>{c.email}</span></td>
                                        <td style={{ padding: "16px 20px", color: "#475569" }}>{c.address}</td>
                                        <td style={{ padding: "16px 20px" }}><span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", backgroundColor: "#dcfce7", color: "#16a34a" }}>{c.totalOrders}</span></td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                <button style={{ padding: "10px", background: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#bfdbfe"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1)"; }}><FaEdit /></button>
                                                <button style={{ padding: "10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", transition: "all 0.2s ease" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fecaca"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1)"; }}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                    <div>Data Pelanggan</div>
                    <div>{customers.length} pelanggan</div>
                </div>

                {showModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
                        <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", width: "550px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "scaleIn 0.3s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", boxShadow: "0 10px 20px -5px rgba(20, 184, 166, 0.3)" }}><FaPlus /></div>
                                    <div><h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Tambah Pelanggan</h3><p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Lengkapi informasi pelanggan</p></div>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", color: "#475569" }}><FaTimes /></button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>👤</span>
                                    <input type="text" placeholder="Nama Lengkap" style={{ ...inputStyle, paddingLeft: "44px" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📞</span>
                                    <input type="text" placeholder="No. Telepon" onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "")} style={{ ...inputStyle, paddingLeft: "44px" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 1 }}>📧</span>
                                    <input type="email" placeholder="Email" style={{ ...inputStyle, paddingLeft: "44px" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                                <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "16px", top: "14px", color: "#94a3b8", zIndex: 1 }}>📍</span>
                                    <textarea placeholder="Alamat" style={{ ...inputStyle, paddingLeft: "44px", height: "80px", resize: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#14b8a6"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} /></div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
                                <button onClick={() => setShowModal(false)} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}>Batal</button>
                                <button style={{ padding: "12px 24px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.2)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 15px rgba(20, 184, 166, 0.3)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(20, 184, 166, 0.2)"; }}>Simpan</button>
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
            `}</style>
        </div>
    );
}
