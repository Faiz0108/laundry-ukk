"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaHome, FaUsers, FaShoppingCart, FaFileAlt, FaTshirt, FaStore, FaSignOutAlt, FaBox } from "react-icons/fa";

// Definisi menu berdasarkan role
const menuByRole: Record<string, { name: string; href: string; icon: typeof FaHome }[]> = {
  Admin: [
    { name: "Beranda", href: "/beranda", icon: FaHome },
    { name: "Toko", href: "/outlets", icon: FaStore },
    { name: "Produk/Paket", href: "/products", icon: FaBox },
    { name: "Pengguna", href: "/users", icon: FaUsers },
    { name: "Pelanggan", href: "/customers", icon: FaUsers },
    { name: "Transaksi", href: "/transactions", icon: FaShoppingCart },
    { name: "Laporan", href: "/reports", icon: FaFileAlt },
  ],
  Kasir: [
    { name: "Beranda", href: "/beranda", icon: FaHome },
    { name: "Pelanggan", href: "/customers", icon: FaUsers },
    { name: "Transaksi", href: "/transactions", icon: FaShoppingCart },
    { name: "Laporan", href: "/reports", icon: FaFileAlt },
  ],
  Pemilik: [
    { name: "Beranda", href: "/beranda", icon: FaHome },
    { name: "Laporan", href: "/reports", icon: FaFileAlt },
  ],
};

const roleColors: Record<string, string> = {
  Admin: "#7c3aed",
  Kasir: "#14b8a6",
  Pemilik: "#f97316",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userRole, setUserRole] = useState<string>("Admin");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    // Ambil info user dari localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "Admin");
        setUsername(user.username || "");
      } catch {
        setUserRole("Admin");
      }
    }
  }, []);

  const menuItems = menuByRole[userRole] || menuByRole.Admin;

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

  const isActive = (href: string, idx: number) => {
    if (pathname === href) return true;
    if (pathname === "/dashboard" && idx === 0) return true;
    return false;
  };

  return (
    <>
      <aside style={{
        width: "200px",
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: roleColors[userRole] || "#7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ color: "white", fontSize: "20px", display: "flex" }}><FaTshirt /></span>
          </div>
        </div>

        {/* Role Badge */}
        <div style={{
          textAlign: "center",
          marginBottom: "24px",
          padding: "8px 16px",
          backgroundColor: roleColors[userRole] || "#7c3aed",
          borderRadius: "8px"
        }}>
          <span style={{ color: "white", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
            {userRole}
          </span>
          {username && (
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", margin: "4px 0 0 0" }}>
              {username}
            </p>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1 }}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.href, idx);
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  backgroundColor: active ? "#14b8a6" : "transparent",
                  color: active ? "white" : "#94a3b8",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: active ? "500" : "400"
                }}
              >
                <span style={{ fontSize: "16px", display: "flex" }}><Icon /></span> {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "transparent",
            color: "#ef4444",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%",
            textAlign: "left"
          }}
        >
          <span style={{ fontSize: "16px", display: "flex" }}><FaSignOutAlt /></span> Keluar
        </button>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px 32px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <span style={{ fontSize: "40px", color: "#ef4444", marginBottom: "16px", display: "flex", justifyContent: "center" }}><FaSignOutAlt /></span>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", margin: "0 0 8px 0" }}>
              Konfirmasi Keluar
            </h3>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px 0" }}>
              Apakah Anda yakin ingin keluar dari sistem?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleLogoutCancel}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Batal
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}