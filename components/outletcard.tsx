import { FaEdit, FaTrash } from "react-icons/fa";

interface OutletCardProps {
    name: string;
    address: string;
    phone: string;
    status: "Active" | "Inactive";
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function OutletCard({ name, address, phone, status, onEdit, onDelete }: OutletCardProps) {
    return (
        <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            borderLeft: "4px solid #14b8a6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#374151", margin: 0 }}>{name}</h3>
                <span style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "500",
                    borderRadius: "12px",
                    backgroundColor: status === "Active" ? "#dcfce7" : "#fee2e2",
                    color: status === "Active" ? "#16a34a" : "#dc2626"
                }}>
                    {status}
                </span>
            </div>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", lineHeight: "1.4" }}>{address}</p>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "16px" }}>{phone}</p>
            <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={onEdit} style={{
                    padding: "10px",
                    fontSize: "15px",
                    backgroundColor: "#dbeafe",
                    color: "#2563eb",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                }}>
                    <FaEdit />
                </button>
                <button onClick={onDelete} style={{
                    padding: "10px",
                    fontSize: "15px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                }}>
                    <FaTrash />
                </button>
            </div>
        </div>
    );
}
