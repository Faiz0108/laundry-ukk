interface StatCardProps {
    title: string;
    value: string;
    borderColor: string;
}

export default function StatCard({ title, value, borderColor }: StatCardProps) {
    return (
        <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px 24px",
            border: "1px solid #e5e7eb",
            borderLeftWidth: "4px",
            borderLeftColor: borderColor,
            borderLeftStyle: "solid"
        }}>
            <p style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 8px 0"
            }}>
                {title}
            </p>
            <p style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#111827",
                margin: 0,
                lineHeight: 1
            }}>
                {value}
            </p>
        </div>
    );
}
