import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Executive Diagnostics Suite – Intelligent by Design",
  description:
    "The secure, multi-tenant platform for Top-Executive Assessment Centers. Competency-based evaluation, structured observation, AI-augmented analysis, and enterprise-grade reporting — seamlessly connected in one secure ecosystem.",
  openGraph: {
    title: "Executive Diagnostics Suite – Intelligent by Design",
    description:
      "The secure, multi-tenant platform for Top-Executive Assessment Centers. Competency-based evaluation, structured observation, AI-augmented analysis, and enterprise-grade reporting.",
  },
  twitter: {
    title: "Executive Diagnostics Suite – Intelligent by Design",
    description:
      "The secure, multi-tenant platform for Top-Executive Assessment Centers. Competency-based evaluation, structured observation, AI-augmented analysis, and enterprise-grade reporting.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head suppressHydrationWarning>
      </head>
      <body suppressHydrationWarning className="overscroll-none">{children}</body>
    </html>
  );
}
