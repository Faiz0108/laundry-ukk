import { FaCheck, FaExclamationTriangle } from "react-icons/fa";

export default function TransactionTable() {
  const transactions = [
    { id: 1, customer: "1805859", service: "Now", status: "Process", payment: "Paid" },
    { id: 2, customer: "1956008", service: "Pracs08", status: "Finished", payment: "Paid" },
    { id: 3, customer: "1395399", service: "FS595988", status: "Finished", payment: "Pending" },
  ];

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
          <th style={{ padding: "12px 8px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Order ID</th>
          <th style={{ padding: "12px 8px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Customer</th>
          <th style={{ padding: "12px 8px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Service Type</th>
          <th style={{ padding: "12px 8px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Status</th>
          <th style={{ padding: "12px 8px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: "500", textTransform: "uppercase" }}>Payment</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "14px 8px", color: "#374151" }}>{tx.id}</td>
            <td style={{ padding: "14px 8px", color: "#6b7280" }}>{tx.customer}</td>
            <td style={{ padding: "14px 8px" }}>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: tx.service === "Now" ? "#f97316" : "#f3f4f6",
                color: tx.service === "Now" ? "white" : "#374151"
              }}>
                {tx.service}
              </span>
            </td>
            <td style={{ padding: "14px 8px" }}>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: tx.status === "Process" ? "#dbeafe" : "#dcfce7",
                color: tx.status === "Process" ? "#1d4ed8" : "#16a34a"
              }}>
                {tx.status}
              </span>
            </td>
            <td style={{ padding: "14px 8px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: tx.payment === "Paid" ? "#16a34a" : "#ef4444",
                fontWeight: "500"
              }}>
                {tx.payment === "Paid" ? <span style={{ fontSize: "12px", display: "flex" }}><FaCheck /></span> : <span style={{ fontSize: "12px", display: "flex" }}><FaExclamationTriangle /></span>}
                {tx.payment}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}