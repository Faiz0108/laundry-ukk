"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import CustomersAdmin from "../../components/customers-admin";
import CustomersKasir from "../../components/customers-kasir";

export default function CustomersPage() {
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

    return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#f8fafc" }}>
            <Sidebar />
            {userRole === "Kasir" ? <CustomersKasir /> : <CustomersAdmin />}
        </div>
    );
}
