import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Executive Diagnostics Platform",
  description:
    "Enterprise-grade, multi-tenant platform for hosting executive assessment centers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
