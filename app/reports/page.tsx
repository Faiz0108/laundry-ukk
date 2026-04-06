"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import ReportsAdmin from "../../components/reports-admin";
import ReportsKasir from "../../components/reports-kasir";
import ReportsOwner from "../../components/reports-owner";

export default function ReportsPage() {
    const [userRole, setUserRole] = useState<string>("Admin");

    useEffect(() => {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const role = user.role || "Admin";
                setUserRole(role);
            } catch (e) {
                console.error("Failed to parse user role", e);
                setUserRole("Admin");
            }
        }
    }, []);

    const renderReports = () => {
        if (!userRole) return <div style={{ padding: "40px", textAlign: "center" }}>Memuat halaman...</div>;
        
        const role = userRole.toLowerCase();
        if (role === "kasir") return <ReportsKasir />;
        if (role === "pemilik" || role === "owner") return <ReportsOwner />;
        return <ReportsAdmin />;
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#f8fafc" }}>
            <Sidebar />
            {renderReports()}
        </div>
    );
}
