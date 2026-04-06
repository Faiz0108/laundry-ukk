"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import TransactionsAdmin from "../../components/transactions-admin";
import TransactionsKasir from "../../components/transactions-kasir";

export default function TransactionsPage() {
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
            {userRole === "Kasir" ? <TransactionsKasir /> : <TransactionsAdmin />}
        </div>
    );
}
