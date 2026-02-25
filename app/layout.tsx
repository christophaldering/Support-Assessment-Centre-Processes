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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var origError = window.onerror;
                window.onerror = function(msg) {
                  if (typeof msg === 'string' && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1)) {
                    setTimeout(function() { window.location.reload(); }, 500);
                    return true;
                  }
                  if (origError) return origError.apply(this, arguments);
                };
                window.addEventListener('unhandledrejection', function(e) {
                  var msg = e && e.reason && e.reason.message ? e.reason.message : '';
                  if (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1) {
                    setTimeout(function() { window.location.reload(); }, 500);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
