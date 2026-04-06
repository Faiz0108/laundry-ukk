"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaHome, FaUsers, FaShoppingCart, FaFileAlt, FaTshirt, FaSignOutAlt } from "react-icons/fa";

export default function SidebarKasir() {
    const pathname = usePathname();
    const router = useRouter();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuItems = [
        { name: "Dashboard", href: "/kasir", icon: FaHome },
        { name: "Pelanggan", href: "/kasir/customers", icon: FaUsers },
        { name: "Transaksi", href: "/kasir/transactions", icon: FaShoppingCart },
        { name: "Laporan", href: "/kasir/reports", icon: FaFileAlt },
    ];

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = () => {
        setShowLogoutConfirm(false);
        localStorage.removeItem("user");
        router.push("/login");
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    const isActive = (href: string) => pathname === href;

    return (
        <>
            <aside style={{ width: "200px", minHeight: "100vh", backgroundColor: "#1e293b", padding: "20px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: "20px", display: "flex" }}><FaTshirt /></span>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginBottom: "24px", padding: "8px 16px", backgroundColor: "#14b8a6", borderRadius: "8px" }}>
                    <span style={{ color: "white", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Kasir</span>
                </div>

                <nav style={{ flex: 1 }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link key={item.name} href={item.href} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", marginBottom: "4px", backgroundColor: active ? "#14b8a6" : "transparent", color: active ? "white" : "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: active ? "500" : "400" }}>
                                <span style={{ fontSize: "16px", display: "flex" }}><Icon /></span> {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <button onClick={handleLogoutClick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "14px", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: "16px", display: "flex" }}><FaSignOutAlt /></span> Keluar
                </button>
            </aside>

            {showLogoutConfirm && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px 32px", textAlign: "center" }}>
                        <span style={{ fontSize: "40px", color: "#ef4444", marginBottom: "16px", display: "flex", justifyContent: "center" }}><FaSignOutAlt /></span>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", margin: "0 0 8px 0" }}>Konfirmasi Keluar</h3>
                        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px 0" }}>Apakah Anda yakin ingin keluar?</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={handleLogoutCancel} style={{ padding: "10px 24px", backgroundColor: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Batal</button>
                            <button onClick={handleLogoutConfirm} style={{ padding: "10px 24px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
