"use client";

import { useState } from "react";

interface CustomerFormProps {
    onClose: () => void;
    onSubmit: (data: CustomerData) => void;
}

interface CustomerData {
    name: string;
    phone: string;
    address: string;
    province: string;
    gender: string;
}

export default function CustomerForm({ onClose, onSubmit }: CustomerFormProps) {
    const [formData, setFormData] = useState<CustomerData>({
        name: "",
        phone: "",
        address: "",
        province: "",
        gender: "L"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const handleChange = (field: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box" as const,
        backgroundColor: "white"
    };

    const labelStyle = {
        display: "block",
        fontSize: "13px",
        fontWeight: "500" as const,
        color: "#374151",
        marginBottom: "6px"
    };

    return (
        <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
                Konten/Data Diri
            </h3>

            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                        <label style={labelStyle}>Nama</label>
                        <input
                            type="text"
                            placeholder="Nama"
                            value={formData.name}
                            onChange={handleChange("name")}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Telepon</label>
                        <input
                            type="tel"
                            placeholder="Nomor Telepon"
                            value={formData.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                setFormData(prev => ({ ...prev, phone: value }));
                            }}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                        <label style={labelStyle}>Alamat</label>
                        <input
                            type="text"
                            placeholder="Alamat"
                            value={formData.address}
                            onChange={handleChange("address")}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Jenis Kelamin</label>
                        <select
                            value={formData.gender}
                            onChange={handleChange("gender")}
                            style={{ ...inputStyle, cursor: "pointer" }}
                        >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    style={{
                        padding: "12px 32px",
                        backgroundColor: "#14b8a6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Registration
                </button>
            </form>

            {/* Donut Chart Preview */}
            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="12"
                        strokeDasharray="188.5 251.3"
                        transform="rotate(-90 50 50)"
                    />
                </svg>
            </div>
        </div>
    );
}
