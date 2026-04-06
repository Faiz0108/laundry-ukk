import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Laundry Management",
};

export default function BerandaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex"> 
      {children}
    </div>
  );
}
