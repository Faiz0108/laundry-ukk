"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import DashboardAdmin from "../../components/dashboard-admin";
import DashboardKasir from "../../components/dashboard-kasir";
import DashboardOwner from "../../components/dashboard-owner";

export default function Dashboard() {
    const [userRole, setUserRole] = useState<string>("Admin");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "Admin");
            } catch {
                setUserRole("Admin");
            }
        }
    }, []);

    const renderDashboard = () => {
        switch (userRole) {
            case "Kasir":
                return <DashboardKasir />;
            case "Owner":
                return <DashboardOwner />;
            default:
                return <DashboardAdmin />;
        }
    };

    // Mendapatkan gradient dan ikon berdasarkan role
    const getRoleStyle = () => {
        switch (userRole) {
            case "Kasir":
                return {
                    gradient: "linear-gradient(145deg, #10b981, #059669)",
                    shadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)",
                    lightBg: "#ecfdf5",
                    icon: "💰"
                };
            case "Pemilik":
                return {
                    gradient: "linear-gradient(145deg, #8b5cf6, #7c3aed)",
                    shadow: "0 10px 25px -5px rgba(139, 92, 246, 0.3)",
                    lightBg: "#f5f3ff",
                    icon: "👑"
                };
            default:
                return {
                    gradient: "linear-gradient(145deg, #3b82f6, #2563eb)",
                    shadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                    lightBg: "#eff6ff",
                    icon: "⚙️"
                };
        }
    };

    const roleStyle = getRoleStyle();

    return (
        <div style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
            overflow: "hidden",
            position: "relative"
        }}>
            {/* Pola dekoratif background */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.03) 2px, transparent 2px), 
                                 radial-gradient(circle at 75px 75px, rgba(16, 185, 129, 0.03) 2px, transparent 2px)`,
                backgroundSize: "50px 50px, 100px 100px",
                pointerEvents: "none"
            }} />

            <Sidebar />

            {/* Container utama dengan efek card */}
            <div style={{
                flex: 1,
                margin: "20px 20px 20px 0",
                background: "white",
                borderRadius: "32px",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02) inset",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 1,
                backdropFilter: "blur(10px)"
            }}>
                {/* Header dengan gradient */}
                <div style={{
                    background: "white",
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    {/* Welcome Section dengan desain lebih menarik */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            background: roleStyle.lightBg,
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            boxShadow: roleStyle.shadow
                        }}>
                            {roleStyle.icon}
                        </div>
                        <div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px"
                            }}>
                                <h1 style={{
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    margin: 0,
                                    letterSpacing: "-0.01em"
                                }}>
                                    Selamat datang kembali
                                </h1>
                                <span style={{
                                    background: roleStyle.gradient,
                                    color: "white",
                                    padding: "4px 10px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    boxShadow: roleStyle.shadow
                                }}>
                                    {userRole}
                                </span>
                            </div>
                            <p style={{
                                fontSize: "14px",
                                color: "#475569",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                <span>📅</span>
                                {new Date().toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Statistik cepat */}
                    <div style={{
                        display: "flex",
                        gap: "16px"
                    }}>
                        <div style={{
                            background: "#f8fafc",
                            borderRadius: "20px",
                            padding: "8px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "1px solid #e2e8f0"
                        }}>
                            <span style={{ fontSize: "18px" }}>⏰</span>
                            <span suppressHydrationWarning style={{
                                fontWeight: "600",
                                color: "#0f172a",
                                fontFamily: "monospace"
                            }}>
                                {new Date().toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <span style={{
                                fontSize: "12px",
                                color: "#64748b",
                                background: "#e2e8f0",
                                padding: "2px 6px",
                                borderRadius: "12px"
                            }}>
                                WIB
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Content dengan efek fade in */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "24px",
                    background: "linear-gradient(145deg, #ffffff 0%, #fafcff 100%)",
                    animation: "fadeIn 0.5s ease-out"
                }}>
                    {renderDashboard()}
                </div>

                {/* Footer dekoratif */}
                <div style={{
                    padding: "12px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#64748b"
                }}>
                    <div>© 2024 Beranda Aplikasi. Semua hak dilindungi undang-undang.</div>
                    <div style={{
                        display: "flex",
                        gap: "16px"
                    }}>
                        <span style={{ cursor: "default" }}>🚀 Version 2.0</span>
                        <span style={{ cursor: "default" }}>✨ Premium</span>
                    </div>
                </div>
            </div>

            {/* Animasi CSS */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}