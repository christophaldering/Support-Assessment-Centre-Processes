import type { Metadata } from "next";
import Script from "next/script";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body suppressHydrationWarning>
        <Script src="/chunk-recovery.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
