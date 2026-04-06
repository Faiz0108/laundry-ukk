import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Laundry Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex"> 
      {/* Gunakan <div>, bukan <html> <body> lagi jika ini adalah nested layout */}
      {children}
    </div>
  );
}