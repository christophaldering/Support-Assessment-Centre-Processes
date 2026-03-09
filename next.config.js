const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isDev ? {} : { output: "standalone" }),
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pdfkit");
    }
    return config;
  },
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "50mb",
    },
    outputFileTracingIncludes: {
      "/api/w/\\[workspaceSlug\\]/case-studies/upload": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
      "/api/w/\\[workspaceSlug\\]/requirements-analysis/extract": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
      "/api/w/\\[workspaceSlug\\]/case-studies/\\[caseStudyId\\]/export-pdf": ["./node_modules/pdfkit/js/data/**/*"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PORT: "5000",
    HOSTNAME: "0.0.0.0",
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
